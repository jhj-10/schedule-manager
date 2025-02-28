const express = require("express");
const bodyParser = require("body-parser");
const mariadb = require("mariadb");
const cors = require("cors");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const port = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || "";

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser()); // Needed to parse cookies
app.use(express.urlencoded({ extended: true })); // URL-encoded 파서 미들웨어

// app.use(cors());

const allowedOrigin = [
  "https://port-0-node-express-m1u0hx1t4ea25b62.sel4.cloudtype.app",
  "https://web-schedule-manager-m1u0hx1t4ea25b62.sel4.cloudtype.app",
  "http://localhost:8080",
  "http://localhost:5000",
  "http://localhost:3000",
  "http://node-express:3000",
];

app.use(
  cors({
    origin: allowedOrigin, // 허용할 도메인
    // methods: ["GET", "POST", "PUT", "DELETE"], // 허용할 메서드
    // preflightContinue: false,
    // optionsSuccessStatus: 204,
    credentials: true, // 자격 증명 허용 (필요한 경우)
    // allowedHeaders: ["Content-Type", "Authorization"], // 허용할 헤더 설정
  })
);

app.options(
  "*",
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// 데이터 베이스 연결
const pool = mariadb.createPool({
  // host: "localhost",
  // port: 3306,
  host: "svc.sel4.cloudtype.app",
  port: 31849,
  user: "root",
  password: "1234",
  database: "schedule_manager",
});

// Hashing the password
const hashPassword = async (plainPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds); // Fix: added await
    // console.log("Hashed Password:", hashedPassword);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
  }
};

// Verifying the password
const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    const match = await bcrypt.compare(plainPassword, hashedPassword); // Fix: added await
    if (match) {
      console.log("Password is valid");
    } else {
      console.log("Invalid password");
    }
    return match;
  } catch (error) {
    console.error("Error verifying password:", error);
  }
};

// 로그인
app.post("/api/login", async (req, res) => {
  console.log("user login!!!");
  const { email, password } = req.body;

  let conn;

  try {
    conn = await pool.getConnection();
    console.log("DB connected");

    const rows = await conn.query(
      `SELECT id, name, email, authority 
      FROM users WHERE email = ? AND password = ?`,
      [email, password]
    );

    if (rows.length > 0) {
      // Example: set a token cookie
      res.cookie("token", "valid-token", { httpOnly: true, secure: false });
      console.log("Login successful");
      res.json({ success: true, user: rows[0] });
    } else {
      console.log("Invalid credentials");
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.log("Error during login", err);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

app.get("/api/protected", (req, res) => {
  const token = req.cookies.token;

  // console.log("token:", token);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    // console.log("decoded:", decoded);
    res.status(200).json({ message: `Hello, ${decoded.username}` });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// 비밀번호 찾기
app.post("/api/password", async (req, res) => {
  // console.log("req.body:", req.body);
  const { altumEmail, gmailEmail } = req.body;

  let conn;

  try {
    conn = await pool.getConnection();
    console.log("find password");

    const rows = await conn.query(
      `SELECT name, email, email_sub  FROM users 
      WHERE email = ? AND email_sub = ?`,
      [altumEmail, gmailEmail]
    );

    // console.log(`Query result:`, rows);

    if (rows.length === 1) {
      res.json({ account: rows, success: true });
    } else {
      console.log("No matching account");
      res.json({ success: false, message: "No matching account" });
    }
  } catch (err) {
    console.log("Error matching account", err);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    if (conn) conn.end();
  }
});

// 임시비밀번호 발급
app.put("/api/tempPassword", async (req, res) => {
  // console.log("/api/tempPassword:", req.body);
  const { password, email, email_sub } = req.body;

  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      `UPDATE users SET password = ? WHERE email = ? AND email_sub = ?`,
      [password, email, email_sub]
    );
    // console.log("result:", result);
    if (result.affectedRows > 0) {
      res
        .status(200)
        .json({ success: true, message: "Userinfo updated successfully" });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("Error updating password:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error updating password" });
  } finally {
    if (conn) conn.end();
  }
});

// 로그인한 사용자를 기준으로 사용자 정보 가져오기
app.get("/api/users", async (req, res) => {
  // 이름, 이메일로 사용자 검색
  const search = req.query.search ? req.query.search.toLowerCase() : "";
  // 해당 아이디를 가진 사용자의 컬러셋 정보 가져오기
  const userId = req.query.userId ? req.query.userId.toLowerCase() : "";
  //  사용자 전체: amin 페이지 사원정보
  const auth = req.query.auth ? req.query.auth.toLowerCase() : "";

  // console.log("getusers: ", search, userId);
  let conn;

  try {
    conn = await pool.getConnection();
    let query = "SELECT email FROM users";

    if (search) {
      // console.log("search:", search);
      query = `SELECT id, name, email 
        FROM users 
        WHERE (LOWER(name) LIKE '%${search}%' OR LOWER(email) LIKE '%${search}%') AND status <> '퇴사'`;
    }
    if (userId) {
      query = `SELECT u.id, u.name, c.color_user_id, c.color_cd
                FROM users u 
                LEFT JOIN (SELECT * FROM colorset WHERE user_id = ${userId}) c 
                ON u.id = c.color_user_id
                WHERE u.status <> '퇴사'`;
    }
    if (auth) {
      query = "SELECT * FROM users";
    }

    const rows = await conn.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Error fetching users" });
  } finally {
    if (conn) conn.end();
  }
});

// 사용자 상세정보 가져오기
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

// 사용자 추가(사원등록)
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
      // insertId: result.insertId.toString(),
      message: "User created successfully",
    });
  } catch (err) {
    console.error("Error saving user:", err.message);
    res.status(500).json({ success: false, message: "Error saving User" });
  } finally {
    if (conn) conn.end();
  }
});

// 사용자 정보 수정
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

// 공휴일 정보 가져오기
app.get("/api/holidays", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const query = `SELECT hid, type, dt, name, lunar_yn, substitute_yn, substitute
                    FROM holiday`;
    const rows = await conn.query(query);
    // console.log(rows);
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

// 공휴일 추가
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

// 공휴일 정보 수정
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

// 공휴일 정보 삭제
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

// 컬러셋 생성
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

// 컬러셋 수정
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

// 일정 가져오기
app.get("/api/schedules", async (req, res) => {
  const userId = req.query.userId ? req.query.userId.split(",") : "";
  const projectId = req.query.projectId ? req.query.projectId : "";
  // console.log("Get schedules selectedUsers:", req.query.userId);
  let query = `SELECT s.type, s.id AS pid, s.title, s.start, s.end, s.notes
            , json_arrayagg(ms.user_id) AS attendees, s.creator_id AS creatorId
        FROM schedule_manager.schedules s 
        INNER JOIN schedule_manager.manpower_status ms 
        ON s.id = ms.project_id 
        GROUP BY s.id`;

  if (userId) {
    query = `SELECT s.type, ms.user_id AS userId, ms.start_dt AS start , ms.end_dt AS end
            , s.pid, s.title, s.start AS pStartDt, s.end AS pEndDt, s.attendees, s.creator_id AS creatorId, s.notes
        FROM schedule_manager.manpower_status ms 
        LEFT JOIN (
              SELECT s.type, s.id AS pid , s.title, s.start, s.end, s.notes
                    , json_arrayagg(ms.user_id) AS attendees, s.creator_id
                FROM schedule_manager.schedules s 
                LEFT JOIN schedule_manager.manpower_status ms 
                ON s.id = ms.project_id 
                GROUP BY s.id
              ) s
        ON ms.project_id  = s.pid
        WHERE pid IS NOT NULL
        AND user_id IN (${[...userId]})`;
  }

  if (projectId) {
    // query = `SELECT id AS pid, type, title, start AS pStartDt, end AS pEndDt, notes
    query = `SELECT id, type, title, start , end , notes  
            FROM schedule_manager.schedules
            WHERE id = ${projectId};`;
  }

  let conn;
  try {
    conn = await pool.getConnection();
    // console.log("get schecule query:", query);
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

// 일정 삭제
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

// 일정 생성
app.post("/api/schedules", async (req, res) => {
  const { type, title, start, end, notes, creator_id } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      "INSERT INTO schedules (type, title, start, end, notes, creator_id) VALUES (?, ?, ?, ?, ?, ?)",
      [type, title, start, end, notes, creator_id]
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

// 일정 수정
app.put("/api/schedules/:id", async (req, res) => {
  const { id } = req.params;
  const { type, title, start, end, notes } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      "UPDATE schedules SET type = ?, title = ?, start = ?, end = ?, notes = ? WHERE id = ?",
      [type, title, start, end, notes, id]
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

// 인력 배치 정보 가져오기
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

// 인력 배치 정보 생성
app.post("/api/manpower-status", async (req, res) => {
  // console.log("Create manpower-status req.body: ", req.body);
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

// 인력 배치 정보 삭제
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

// 이메일 발송 관련 정보(env파일 참고)
const gmail_id = process.env.GMAIL_ID;
const gmail_app_password = process.env.GMAIL_APP_PASSWORD; // 지메일 보안 > 앱 비밀번호 16자리

// html 파일에서 name, email, password 변경
function getEmailTemplate(file, name, email, password) {
  const filePath = path.join(__dirname, `../src/html/${file}.html`);
  // const filePath = path.join(__dirname, `../src/pages/WelcomeEmail.html`);
  let emailTemplate = fs.readFileSync(filePath, { encoding: "utf-8" });

  // Replace {{name}} and {{email}} in the template with actual data
  emailTemplate = emailTemplate.replace(/{{name}}/g, name);
  emailTemplate = emailTemplate.replace(/{{email}}/g, email);
  emailTemplate = emailTemplate.replace(/{{password}}/g, password);
  // emailTemplate = emailTemplate.replace(/{{password}}/g, password);

  return emailTemplate;
}

// 이메일 발송(알툼 계정 생성, 임시비밀번호 발급)
app.post("/api/send-email", async (req, res) => {
  // console.log("send email!!!");
  const { file, toEmail, subject, fromEmail, name, email, password } = req.body;

  // Gmail SMTP 전송 구성
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // Gmail SMTP 서버
    port: 465, // Gmail에서 사용하는 포트
    secure: true, // SSL 사용
    auth: {
      user: gmail_id,
      pass: gmail_app_password,
    },
  });

  // 이메일 데이터 설정
  let mailOptions = {
    from: gmail_id,
    to: toEmail,
    subject: subject,
    html: getEmailTemplate(file, name, email, password),
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    // console.log("Email sent successfully: ", info.response);
    res.status(200).send("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error.message);
    res.status(500).send("Failed to send email.");
  }
});

// 로그아웃
app.post("/api/logout", (req, res) => {
  // Clear the session or authentication token here
  res.clearCookie("token"); // Example of clearing a secure cookie
  return res.status(200).json({ message: "Logged out successfully" });
});

// 서버 시작
app.listen(port, () => {
  // console.log("Server is running on port 5000");
});
