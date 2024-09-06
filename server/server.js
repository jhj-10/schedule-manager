const express = require("express");
const bodyParser = require("body-parser");
const mariadb = require("mariadb");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  password: "111111",
  database: "schedule_manager",
  port: 3306,
});

// User login route
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password]
    );
    if (rows.length > 0) {
      res.json({ success: true, user: rows[0] });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// Get users
app.get("/api/users", async (req, res) => {
  const search = req.query.search ? req.query.search.toLowerCase() : "";
  const userId = req.query.userId ? req.query.userId.toLowerCase() : "";

  console.log("getusers: ", search, userId);
  let conn;

  try {
    conn = await pool.getConnection();
    let query = "";

    if (search) {
      query +=
        "SELECT * FROM users WHERE LOWER(name) LIKE ? OR LOWER(email) LIKE ?";
    }
    if (userId) {
      query = `SELECT u.id, u.email, u.name, u.phone, u.position, u.authority, 
                      u.email_sub , c.color_user_id, c.color_cd 
                FROM users u 
                LEFT JOIN (SELECT * FROM colorset WHERE user_id = ${userId}) c 
                ON u.id = c.color_user_id`;
    }
    console.log("getusers query:", query);
    const rows = await conn.query(query, [
      `%${search}%`,
      `%${search}%`,
      { userId },
    ]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Error fetching users" });
  } finally {
    if (conn) conn.end();
  }
});

// Create colorset
app.post("/api/users/colorset", async (req, res) => {
  const { userId, colorUserId, colorCd } = req.body;
  let conn;

  try {
    conn = await pool.getConnection();
    let query =
      "INSERT INTO colorset (user_id, color_user_id, color_cd) VALUES (?, ?, ?)";
    const rows = await conn.query(query, [userId, colorUserId, colorCd]);
    res.status(200).json({
      success: true,
      message: "Colorset created successfully",
    });
  } catch (err) {
    console.error("Error saving colorset:", err.message);
    res.status(500).json({ success: false, message: "Error saving colorset" });
  } finally {
    if (conn) conn.end();
  }
});

// Update colorset
app.put("/api/users/colorset", async (req, res) => {
  const { userId, colorUserId, colorCd } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      "UPDATE colorset SET color_cd = ? WHERE user_id = ?, color_user_id = ?",
      [colorCd, userId, colorUserId]
    );
    if (result.affectedRows > 0) {
      res
        .status(200)
        .json({ success: true, message: "Colorset updated successfully" });
    } else {
      res.status(404).json({ success: false, message: "Colorset not found" });
    }
  } catch (err) {
    console.error("Error updating colorset:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error updating colorset" });
  } finally {
    if (conn) conn.end();
  }
});

// Get attendees
app.get("/api/attendees", async (req, res) => {
  const { scheculeId } = req.query;
  let conn;

  try {
    conn = await pool.getConnection();
    const query = `
      SELECT ms.project_id, ms.user_id, u.email, u.name, ms.start_dt, ms.end_dt 
      FROM schedule_manager.manpower_status ms
      LEFT JOIN schedule_manager.users u 
      ON ms.user_id = u.id
      WHERE ms.project_id = ?
    `;
    const rows = await conn.query(query, [scheculeId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching attendees:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching attendees" });
  } finally {
    if (conn) conn.end();
  }
});

// Get schedules
app.get("/api/schedules", async (req, res) => {
  const userId = req.query.userId ? req.query.userId.split(",") : "";
  console.log("Get schedules selectedUsers:", req.query.userId);
  let query = !userId
    ? `SELECT s.id AS pid, s.title, s.start, s.end
            , json_arrayagg(ms.user_id) AS attendees, s.creator_id AS creatorId
        FROM schedule_manager.schedules s 
        INNER JOIN schedule_manager.manpower_status ms 
        ON s.id = ms.project_id 
        GROUP BY s.id`
    : `SELECT ms.user_id AS userId, ms.start_dt AS start , ms.end_dt AS end
            , s.pid, s.title, s.start AS pStartDt, s.end AS pEndDt, s.attendees, s.creator_id AS creatorId
        FROM schedule_manager.manpower_status ms 
        LEFT JOIN (
              SELECT s.id AS pid , s.title, s.start, s.end
                    , json_arrayagg(ms.user_id) AS attendees, s.creator_id
                FROM schedule_manager.schedules s 
                LEFT JOIN schedule_manager.manpower_status ms 
                ON s.id = ms.project_id 
                GROUP BY s.id
              ) s
        ON ms.project_id  = s.pid
        WHERE pid IS NOT NULL
        AND user_id IN (${[...userId]})
        `;
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("get schecule query:", query);
    const rows = await conn.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching schedules:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching schedules" });
  } finally {
    if (conn) conn.end();
  }
});

// Delete schedule
app.delete("/api/schedules/:id", async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query("DELETE FROM schedules WHERE id = ?", [id]);
    if (result.affectedRows > 0) {
      res
        .status(200)
        .json({ success: true, message: "Schedule deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Schedule not found" });
    }
  } catch (err) {
    console.error("Error deleting schedule:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error deleting schedule" });
  } finally {
    if (conn) conn.end();
  }
});

// Create schedule
app.post("/api/schedules", async (req, res) => {
  const { title, start, end, notes, creator_id } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      "INSERT INTO schedules (title, start, end, notes, creator_id) VALUES (?, ?, ?, ?, ?)",
      [title, start, end, notes, creator_id]
    );
    res.status(200).json({
      success: true,
      insertId: result.insertId.toString(), // Convert BigInt to string
      message: "Schedule created successfully",
    });
  } catch (err) {
    console.error("Error saving schedule:", err.message);
    res.status(500).json({ success: false, message: "Error saving schedule" });
  } finally {
    if (conn) conn.end();
  }
});

// Update schedule
app.put("/api/schedules/:id", async (req, res) => {
  const { id } = req.params;
  const { title, start, end, notes } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      "UPDATE schedules SET title = ?, start = ?, end = ?, notes = ? WHERE id = ?",
      [title, start, end, notes, id]
    );
    if (result.affectedRows > 0) {
      res
        .status(200)
        .json({ success: true, message: "Schedule updated successfully" });
    } else {
      res.status(404).json({ success: false, message: "Schedule not found" });
    }
  } catch (err) {
    console.error("Error updating schedule:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error updating schedule" });
  } finally {
    if (conn) conn.end();
  }
});

// Create manpower-status
app.post("/api/manpower-status", async (req, res) => {
  const { project_id, attendees } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    let query =
      "INSERT INTO manpower_status (project_id, user_id, start_dt, end_dt) VALUES ";
    let valuesArr = [];

    attendees.forEach((attendee, idx) => {
      const { user_id, start_dt, end_dt } = attendee;
      query += "(?, ?, ?, ?)" + (idx < attendees.length - 1 ? ", " : "");
      valuesArr.push(project_id, user_id, start_dt, end_dt);
    });

    await conn.query(query, valuesArr);
    res
      .status(200)
      .json({ success: true, message: "Manpower status created successfully" });
  } catch (err) {
    console.error("Error saving manpower status:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error saving manpower status" });
  } finally {
    if (conn) conn.end();
  }
});

// Delete manpower-status
app.delete("/api/manpower-status/:id", async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      "DELETE FROM manpower_status WHERE project_id = ?",
      [id]
    );
    if (result.affectedRows > 0) {
      res.status(200).json({
        success: true,
        message: "Manpower status deleted successfully",
      });
    } else {
      res.status(404).json({ success: false, message: "Project ID not found" });
    }
  } catch (err) {
    console.error("Error deleting manpower status:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error deleting manpower status" });
  } finally {
    if (conn) conn.end();
  }
});

// Start the server
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
