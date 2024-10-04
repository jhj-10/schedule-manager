const express = require("express");
const bodyParser = require("body-parser");
const mariadb = require("mariadb");
const cors = require("cors");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5000;

const app = express();
app.use(bodyParser.json());
app.use(express.json());
// app.use(cors());
app.use(
  cors({
    origin: [
      "https://port-0-node-express-m1u0hx1t4ea25b62.sel4.cloudtype.app",
      "https://web-schedule-manager-m1u0hx1t4ea25b62.sel4.cloudtype.app",
      "http://localhost:8080",
    ], // 허용할 도메인
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // 허용할 메서드
    credentials: true, // 자격 증명 허용 (필요한 경우)
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true, // 자격 증명 허용 (필요한 경우)
    allowedHeaders: ["Content-Type", "Authorization"], // 허용할 헤더 설정
  })
);

const pool = mariadb.createPool({
  // host: "localhost",
  // port: 3306,
  host: "svc.sel4.cloudtype.app",
  port: 31849,
  user: "root",
  password: "1234",
  database: "schedule_manager",
});

// User login route
app.post("/api/login", async (req, res) => {
  console.log("user login!!!");
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
  const auth = req.query.auth ? req.query.auth.toLowerCase() : "";

  console.log("getusers: ", search, userId);
  let conn;

  try {
    conn = await pool.getConnection();
    let query = "";

    if (search) {
      query =
        "SELECT * FROM users WHERE (LOWER(name) LIKE ? OR LOWER(email) LIKE ?) AND status <> '퇴사'";
    }
    if (userId) {
      query = `SELECT u.id, u.email, u.name, u.phone, u.department,
                      u.position, u.authority, 
                      u.email_sub , c.color_user_id, c.color_cd,
                      u.join_dt, u.quit_dt
                FROM users u 
                LEFT JOIN (SELECT * FROM colorset WHERE user_id = ${userId}) c 
                ON u.id = c.color_user_id
                WHERE u.status <> '퇴사'`;
    }
    if (auth) {
      query = "SELECT * FROM users";
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

// get userInfo
app.get("/api/user/:userId", async (req, res) => {
  const { userId } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM users WHERE id = ?", [userId]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching userInfo:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching userInfo" });
  } finally {
    if (conn) conn.end();
  }
});

// create user
app.post("/api/user", async (req, res) => {
  const {
    authority,
    email,
    email_sub,
    name,
    password,
    phone,
    position,
    department,
    status,
    joinDt,
    quitDt,
  } = req.body;

  let conn;

  try {
    conn = await pool.getConnection();
    const query =
      "INSERT INTO users (authority, email, email_sub, name, password, phone, position, department, status, join_dt, quit_dt ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    const rows = await conn.query(query, [
      authority,
      email,
      email_sub,
      name,
      password,
      phone,
      position,
      department,
      status,
      joinDt,
      quitDt,
    ]);
    res.status(200).json({
      success: true,
      insertId: result.insertId.toString(),
      message: "User created successfully",
    });
  } catch (err) {
    console.error("Error saving user:", err.message);
    res.status(500).json({ success: false, message: "Error saving User" });
  } finally {
    if (conn) conn.end();
  }
});

// update userInfo
app.put("/api/user", async (req, res) => {
  const {
    authority,
    email_sub,
    id,
    name,
    password,
    phone,
    position,
    department,
    status,
    joinDt,
    quitDt,
  } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      "UPDATE users SET authority = ?, password = ?, name = ?, phone = ?, position = ?, department =?, email_sub = ?, status = ?, join_dt = ?, quit_dt = ? WHERE id = ?",
      [
        authority,
        password,
        name,
        phone,
        position,
        department,
        email_sub,
        status,
        joinDt,
        quitDt,
        id,
      ]
    );
    if (result.affectedRows > 0) {
      res
        .status(200)
        .json({ success: true, message: "Userinfo updated successfully" });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("Error updating userInfo:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error updating userInfo" });
  } finally {
    if (conn) conn.end();
  }
});

// Get holidays
app.get("/api/holidays", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `SELECT hid, type, dt, name, lunar_yn, substitute_yn, substitute
                    FROM holiday`;
    const rows = await conn.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching holidays:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching holidays" });
  } finally {
    if (conn) conn.end();
  }
});

// Create holiday
app.post("/api/holiday", async (req, res) => {
  const { type, name, dt, lunarYn, substitute, substituteYn } = req.body;
  let conn;

  try {
    conn = await pool.getConnection();
    let query = `INSERT INTO holiday (type, dt, name, lunar_yn, substitute_yn, substitute)
              VALUES(?, ?, ?, ?, ?, ?)`;
    const rows = await conn.query(query, [
      type,
      dt,
      name,
      lunarYn,
      substituteYn,
      substituteYn === "Y" ? substitute : null,
    ]);
    res.status(200).json({
      success: true,
      message: "Holiday created successfully",
    });
  } catch (err) {
    console.error("Error saving holiday:", err.message);
    res.status(500).json({ success: false, message: "Error saving holiday" });
  } finally {
    if (conn) conn.end();
  }
});

// Update holiday
app.put("/api/holiday/", async (req, res) => {
  const { type, hid, name, dt, lunarYn, substituteYn, substitute } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      `UPDATE holiday
      SET type=?, dt=?, name=?, lunar_yn=?, substitute_yn=?, substitute=?
      WHERE hid=?`,
      [type, dt, name, lunarYn, substituteYn, substitute, hid]
    );
    if (result.affectedRows > 0) {
      res
        .status(200)
        .json({ success: true, message: "Holiday updated successfully" });
    } else {
      res.status(404).json({ success: false, message: "Holiday not found" });
    }
  } catch (err) {
    console.error("Error updating holiday:", err.message);
    res.status(500).json({ success: false, message: "Error updating holiday" });
  } finally {
    if (conn) conn.end();
  }
});

// Delete holiday
app.delete("/api/holiday/:hid", async (req, res) => {
  const { hid } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query("DELETE FROM holiday WHERE hid=?", [hid]);
    if (result.affectedRows > 0) {
      res
        .status(200)
        .json({ success: true, message: "Holiday deleted successfully" });
    } else {
      res.status(404).json({ success: false, message: "Holiday not found" });
    }
  } catch (err) {
    console.error("Error deleting holiday:", err.message);
    res.status(500).json({ success: false, message: "Error deleting holiday" });
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
      "UPDATE colorset SET color_cd = ? WHERE user_id = ? and color_user_id = ?",
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
  console.log("Create manpower-status req.body: ", req.body);
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
app.delete("/api/manpower-status/:projectId", async (req, res) => {
  const { projectId } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      "DELETE FROM manpower_status WHERE project_id = ?",
      [projectId]
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

// send email
const GMAIL_ID = "ojhjhjo@gmail.com";
const GMAIL_APP_PASSWORD = "uqdoizunhtxepgij"; // 지메일 보안 > 앱 비밀번호 16자리

// html 파일에서 name, email, password 변경
function getEmailTemplate(name, email, password) {
  const filePath = path.join(__dirname, "../src/pages/WelcomeEmail.html");
  let emailTemplate = fs.readFileSync(filePath, { encoding: "utf-8" });

  // Replace {{name}} and {{email}} in the template with actual data
  emailTemplate = emailTemplate.replace(/{{name}}/g, name);
  emailTemplate = emailTemplate.replace(/{{email}}/g, email);
  emailTemplate = emailTemplate.replace(/{{password}}/g, password);
  // emailTemplate = emailTemplate.replace(/{{password}}/g, password);

  return emailTemplate;
}

app.post("/api/send-email", async (req, res) => {
  console.log("send email!!!");
  const { toEmail, subject, fromEmail, name, email, password } = req.body;

  // Configure your SMTP transport
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_ID,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  // Set up email data
  let mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: subject,
    html: getEmailTemplate(name, email, password),
  };

  // Send email
  try {
    let info = await transporter.sendMail(mailOptions);
    res.status(200).send("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Failed to send email.");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log("Server is running on port 5000");
});
