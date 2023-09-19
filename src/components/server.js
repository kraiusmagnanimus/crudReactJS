const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const cors = require('cors');
const https = require('https'); 
const fs = require('fs'); 

require('dotenv').config();

const app = express();
app.use(express.json());
const port = 3001; 

// Read SSL certificates
const privateKey = fs.readFileSync('/home/admin/conf/web/ssl.lagueslo.com.key', 'utf8');
const certificate = fs.readFileSync('/home/admin/conf/web/ssl.lagueslo.com.crt', 'utf8');
const ca = fs.readFileSync('/home/admin/conf/web/ssl.lagueslo.com.ca', 'utf8');

// Enable CORS for specific origins
app.use(cors({
  origin: 'https://lagueslo.com', // replace with your application's origin
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
}));


const credentials = {
  key: privateKey,  
  cert: certificate,
  ca: ca
};

// Replace these with your RDS credentials
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306 // default for MySQL
};



// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//File uploads
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const allowedFileTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/bmp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/vnd.adobe.photoshop'
];

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // 10 MB
  },
  fileFilter: (req, file, cb) => {
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
      cb(new Error('Invalid file type'));
    }
  }
});

//API Endpoint for FileUpload
app.post('/uploadFiles', upload.array('files', 10), async (req, res) => {
  try {
    const projectID = req.body.projectID; // Make sure to send projectID in the FormData from the client
    if (!projectID) {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    const connection = await mysql.createConnection(dbConfig);

    req.files.forEach(async file => {
      const sql = "INSERT INTO projectFiles (ProjectID, FilePath) VALUES (?, ?)";
      await connection.execute(sql, [projectID, file.path]);
    });

    connection.end();
    res.json({ success: true, message: 'Files uploaded and saved successfully' });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//API endpoint for File View
app.get('/getFiles/:projectId', async (req, res) => {
  const projectId = req.params.projectId;

  // Connect to database
  const connection = await mysql.createConnection(dbConfig);
  
  // Fetch file paths for the specific project from the database
  const [rows] = await connection.execute("SELECT * FROM projectFiles WHERE ProjectID = ?", [projectId]);
  connection.end();

  // Create an array of file objects with URLs
  const files = rows.map(row => ({
    name: path.basename(row.FilePath), // Extracting file name from the file path
    url: row.FilePath.replace('uploads', '/crudReactJS/uploads') // Creating URL by replacing the directory with the static file route
  }));
  console.log(rows);
  res.json(files);
});


// API Endpoint to read projects
app.get('/readProjects', async (req, res) => {
    try {
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute("SELECT ID, ProposedProject, DATE_FORMAT(DateAdded, '%b %d, %Y') as DateAdded, Author, Description, EstimatedTimeline FROM proposedProjects");
      connection.end();
      res.json(rows);
    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  

// API Endpoint to update a project
app.put('/updateProject', upload.array('files', 10), async (req, res) => {
  try {
    const data = req.body; // Text fields
    const files = req.files; // Files

    if (!data || !data.ProposedProject || !data.Author || !data.Description || !data.EstimatedTimeline || !data.ID) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    const connection = await mysql.createConnection(dbConfig);
    const sql = "UPDATE proposedProjects SET ProposedProject = ?, Author = ?, Description = ?, EstimatedTimeline = ? WHERE ID = ?";
    const [result] = await connection.execute(sql, [data.ProposedProject, data.Author, data.Description, data.EstimatedTimeline, data.ID]);

    if (result.affectedRows > 0) {
      // If there are new files, save them to projectFiles table
      if (files.length > 0) {
        for (const file of files) {
          const sql = "INSERT INTO projectFiles (ProjectID, FilePath) VALUES (?, ?)";
          await connection.execute(sql, [data.ID, file.path]);
        }
      }

      connection.end();
      res.json({ message: 'Project updated successfully' });
    } else {
      connection.end();
      res.status(400).json({ message: 'Failed to update project' });
    }
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


//API Endpoint for deleteProject
app.delete('/deleteProject', async (req, res) => {
    try {
      const ID = req.query.id;  // Get the ID from the query parameters
      if (!ID) {
        return res.status(400).json({ message: 'ID is required' });
      }
  
      const connection = await mysql.createConnection(dbConfig);
      const sql = "DELETE FROM proposedProjects WHERE ID = ?";
      await connection.execute(sql, [ID]);
      connection.end();
  
      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

//API Endpoint for createProject
app.post('/createProjects', upload.array('files', 10), async (req, res) => {
  try {
    const data = req.body; // Text fields
    const files = req.files; // Files
    if (!data || !data.ProposedProject || !data.Author || !data.Description || !data.EstimatedTimeline) {
      return res.status(400).json({ message: 'Invalid input' });
    }

    const connection = await mysql.createConnection(dbConfig);
    const sql = "INSERT INTO proposedProjects (ProposedProject, DateAdded, Author, Description, EstimatedTimeline) VALUES (?, NOW(), ?, ?, ?)";
    const [result] = await connection.execute(sql, [data.ProposedProject, data.Author, data.Description, data.EstimatedTimeline]);
    
    if (result.insertId) {
      // Save files to projectFiles table here, using result.insertId for the project ID
      for (const file of files) {
        const sql = "INSERT INTO projectFiles (ProjectID, FilePath) VALUES (?, ?)";
        await connection.execute(sql, [result.insertId, file.path]);
      }

      connection.end();
      res.json({ message: 'Project created successfully', projectID: result.insertId });
    } else {
      connection.end();
      res.status(400).json({ message: 'Project creation failed' });
    }
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// API Endpoint for bulkDeleteProjects
app.post('/bulkDeleteProjects', async (req, res) => {
    try {
      const ids = req.body.ids; // Assuming you have body-parser middleware to parse JSON bodies
      if (!Array.isArray(ids) || !ids.length) {
        return res.status(400).json({ message: 'Invalid input' });
      }
  
      const connection = await mysql.createConnection(dbConfig);
  
      // Prepare the statement with placeholders for each ID
      const placeholders = Array(ids.length).fill('?').join(',');
      const sql = `DELETE FROM proposedProjects WHERE ID IN (${placeholders})`;
  
      await connection.execute(sql, ids);
      connection.end();
  
      res.json({ success: true, message: 'Projects deleted successfully' });
    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });


// Handle React routing, return all requests to React app
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Create HTTPS service
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`HTTPS Server running on https://lagueslo.com:${port}`);
});
