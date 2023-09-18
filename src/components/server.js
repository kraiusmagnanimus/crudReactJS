const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const cors = require("cors");
const https = require("https");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(express.json());
const port = 2900;

// Read SSL certificates
const privateKey = fs.readFileSync(
  "/home/admin/conf/web/ssl.lagueslo.com.key",
  "utf8"
);
const certificate = fs.readFileSync(
  "/home/admin/conf/web/ssl.lagueslo.com.crt",
  "utf8"
);
const ca = fs.readFileSync("/home/admin/conf/web/ssl.lagueslo.com.ca", "utf8");

// Enable CORS for specific origins
app.use(
  cors({
    origin: "https://lagueslo.com", // replace with your application's origin
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca,
};

// Replace these with your RDS credentials
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306, // default for MySQL
};

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// API Endpoint to read projects
app.get("/readProjects", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT ID, ProposedProject, DATE_FORMAT(DateAdded, '%b %d, %Y') as DateAdded, Author, Description, EstimatedTimeline FROM proposedProjects"
    );
    connection.end();
    res.json(rows);
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// API Endpoint to update a project
app.put("/updateProject", async (req, res) => {
  try {
    const { ProposedProject, Author, Description, EstimatedTimeline, ID } =
      req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "UPDATE proposedProjects SET ProposedProject = ?, Author = ?, Description = ?, EstimatedTimeline = ? WHERE ID = ?",
      [ProposedProject, Author, Description, EstimatedTimeline, ID]
    );
    connection.end();
    if (result.affectedRows > 0) {
      res.json({ message: "Project updated successfully" });
    } else {
      res.status(400).json({ message: "Failed to update project" });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//API Endpoint for deleteProject
app.delete("/deleteProject", async (req, res) => {
  try {
    const ID = req.query.id; // Get the ID from the query parameters
    if (!ID) {
      return res.status(400).json({ message: "ID is required" });
    }

    const connection = await mysql.createConnection(dbConfig);
    const sql = "DELETE FROM proposedProjects WHERE ID = ?";
    await connection.execute(sql, [ID]);
    connection.end();

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//API Endpoint for createProject
app.post("/createProjects", async (req, res) => {
  try {
    const data = req.body; // Assuming you're using body-parser middleware
    if (
      !data ||
      !data.ProposedProject ||
      !data.Author ||
      !data.Description ||
      !data.EstimatedTimeline
    ) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const connection = await mysql.createConnection(dbConfig);
    const sql =
      "INSERT INTO proposedProjects (ProposedProject, DateAdded, Author, Description, EstimatedTimeline) VALUES (?, NOW(), ?, ?, ?)";
    await connection.execute(sql, [
      data.ProposedProject,
      data.Author,
      data.Description,
      data.EstimatedTimeline,
    ]);
    connection.end();

    res.json({ message: "Project created successfully" });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// API Endpoint for bulkDeleteProjects
app.post("/bulkDeleteProjects", async (req, res) => {
  try {
    const ids = req.body.ids; // Assuming you have body-parser middleware to parse JSON bodies
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const connection = await mysql.createConnection(dbConfig);

    // Prepare the statement with placeholders for each ID
    const placeholders = Array(ids.length).fill("?").join(",");
    const sql = `DELETE FROM proposedProjects WHERE ID IN (${placeholders})`;

    await connection.execute(sql, ids);
    connection.end();

    res.json({ success: true, message: "Projects deleted successfully" });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Handle React routing, return all requests to React app
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Create HTTPS service
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`HTTPS Server running on https://lagueslo.com:${port}`);
});
