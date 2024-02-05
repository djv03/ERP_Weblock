// Inside your Node.js server file (e.g., app.js or server.js)
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'))

// sql db credentials
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'erp_weblock'
});

//sql connection goes here
db.connect((err) => {
  if (err) {
    console.error('MySQL connection failed: ' + err.stack);
    return;
  }
  console.log(`Connected to MySQL sql database erp_weblock`);
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


//------------------------ your API goes here--------------------------

// 1. admin login 
app.post('/adminlogin', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM admin WHERE email = ? AND password = ?';

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    if (results && results.length > 0) {
      res.status(200).json({ status: 200, message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  });
});


//employee APIs
// 2. create employee data

//2.1 making file upload functionality for the salaryslip,experienceletter and profilepic
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./public/images")
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}_${file.originalname}`)
  }
})
const upload = multer({ storage })

const employee_pics = upload.fields([{ name: 'salarySlip', maxCount: 1 }, { name: 'experienceLetter', maxCount: 1 }, { name: 'profilePic', maxCount: 1 }])

//2.2 query for inserting into the db
app.post('/createemployee', employee_pics, (req, res) => {
  if (req.files) {
    console.log(req.files.salarySlip[0].filename);
    // console.log(req.body)
  }
  else {
    console.log('no files detected')
  }
  const values = [
    req.body.name,
    req.body.email,
    req.body.companyEmail,
    req.body.password,
    req.body.gender,
    req.body.marital_status,
    req.body.mobileNumber,
    req.body.altmobileNumber,
    req.body.address,
    req.body.date_of_birth,
    req.body.date_of_joining,
    req.body.designation,
    req.files.salarySlip[0].filename,
    req.files.experienceLetter[0].filename,
    req.files.profilePic[0].filename,
    req.body.salary
  ];

  //query of employee db entry of 16 fields and two default
  const query = `INSERT INTO employee ( 
    name,
    email,
    companyEmail,
    password,
    gender,
    marital_status,
    mobileNumber,
    altmobileNumber,
    address,
    date_of_birth,
    date_of_joining,
    designation,
    salarySlip,
    experienceLetter,
    profilePic,
    salary) 
    VALUES
     (?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ? )`;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).send('Error inserting data into MySQL');
      return;
    }
    console.log('Data inserted into employee:', result);
    res.status(200).send({ status: 200, message: 'Login successful' });
  });
});

// 3. add education details of employee

//taking its documents from frontend post req. 
//2.1 making file upload functionality for the degreeCertificate
const employee_educationD = upload.fields([{ name: 'degreeCertificate', maxCount: 1 }])

app.post('/addeducation', employee_educationD, (req, res) => {
  if (req.files) {
    console.log('file detected')
  }
  else {
    console.log('no files detected')
  }
  const values = [
    req.body.employeeId,
    req.body.degreeName,
    req.body.passingYear,
    req.body.percentage,
    req.files.degreeCertificate[0].filename,
  ];
  console.log(req.body)
  console.log(req.files)
  //query of employee db entry of 16 fields and two default
  const query = `INSERT INTO employee_education ( 
    employeeId,
    degreeName,
    passingYear,
    percentage,
    degreeCertificate
    ) 
    VALUES
     (?, ?, ?, ?,?)`;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into employee_education:', err);
      res.status(500).send({ message: "erro in inserting education docs", error: err });
      return;
    }
    console.log('Data inserted into employee_education:', result);
    res.status(200).send({ status: 200, message: 'Login successful' });
  });
});

// 4. add legal documents of employee (aadhar and others)

//taking its documents from frontend post req. 
//2.1 making file upload functionality for the degreeCertificate
const employee_legalD = upload.fields([
  { name: 'passbook', maxCount: 1 },
  { name: 'aadharcard', maxCount: 1 },
  { name: 'pancard', maxCount: 1 },
  { name: 'voterId', maxCount: 1 },
  { name: 'drivingLiscence', maxCount: 1 }
])

app.post('/adddocumets', employee_legalD, (req, res) => {
  if (req.files) {
    console.log('file detected')
  }
  else {
    console.log('no files detected')
  }
  const values = [
    req.body.employeeId,
    req.files.passbook[0].filename,
    req.files.aadharcard[0].filename,
    req.files.pancard[0].filename,
    req.files.voterId[0].filename,
    req.files.drivingLiscence[0].filename
  ];
  console.log(req.body)
  console.log(req.files)
  //query of employee db entry of 16 fields and two default
  const query = `INSERT INTO employee_document ( 
    employeeId,
    passbook,
    aadharcard,
    pancard,
    voterId,
    drivingLiscence
    ) 
    VALUES
     (?, ?, ?, ?,?,?)`;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into employee_document:', err);
      res.status(500).send({ message: "erro in inserting education docs", error: err });
      return;
    }
    console.log('Data inserted into employee_document:', result);
    res.status(200).send({ status: 200, message: 'insertion sucess in employee_document' });
  });
});



// 3. employee login 
app.post('/employeelogin', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM employee WHERE email = ? AND password = ?';

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    if (results && results.length > 0) {
      res.status(200).json({ status: 200, message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  });
});

// 4. get all employees
app.get('/getusers', (req, res) => {
  db.query('SELECT * FROM epmloyee', (err, results) => {
    if (err) {
      res.status(500).send('Error fetching in data from my sql: ', err);
    } else {
      res.status(200).json(results);
    }
  });

})

//---------------------------- projects apis starts from here-------------------------

// 5. add projects api

//taking its documents from frontend post req
//        NOTE: here seperate folder is assigned for the storage for project docs  
const project_docs_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/project_docs');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});
const project_docs_upload = multer({ storage: project_docs_storage })

app.post('/addproject', project_docs_upload.array('projectDocs'), (req, res) => {
  
  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }
  const values = [
    req.body.ProjectName,
    req.body.projectDescription,
    req.body.startDate,
    req.body.endDate,
    req.body.participants,
    req.body.totalTasks,
    req.body.completedTasks,
    JSON.stringify(req.files.map(file => file.filename))
  ];
  
  // console.log("values is here--->", values)
  
  const query = `INSERT INTO projects ( 
    ProjectName,
    projectDescription,
    startDate,
    endDate,
    participants,
    totalTasks,
    completedTasks,
    projectDocs
    ) 
    VALUES
    (?,?,?,?,
      ?,?,?,?)`;
      
      db.query(query, values, (err, result) => {
        if (err) {
      console.error('Error inserting data into projects:', err);
      res.status(500).send({ message: "erro in inserting education docs", error: err });
      return;
    }
    console.log('Data inserted into projects:', result);
    res.status(200).send({ status: 200, message: 'insertion sucess in employee_document' });
  });
});

// 6. get all projects
app.get('/getprojects', (req, res) => {
  //sql query to reteive all the documents of table
  const query="SELECT * FROM `projects` WHERE 1";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching in data from my sql: ', err);
    } else {
      res.status(200).json(results);
    }
  });
  
})

//---------------------------- Tasks apis starts from here-------------------------

// 5. add projects api

//taking its documents from frontend post req
//        NOTE: here seperate folder is assigned for the storage for project docs  
const task_docs_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/task_docs');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});
const task_docs_upload = multer({ storage: task_docs_storage })

app.post('/addtask', task_docs_upload.array('taskDocs'), (req, res) => {
  
  if (!req.files) {
    return res.status(400).send('No files were uploaded.');
  }
  const values = [
    req.body.taskDescription,
    req.body.projectId,
    req.body.priority,
    req.body.startDate,
    req.body.endDate,
    req.body.assignedTo,
    req.body.reportTo,
    JSON.stringify(req.files.map(file => file.filename))
  ];
  
  // console.log("values is here--->", values)
  
  const query = `INSERT INTO tasks ( 
    taskDescription,
    projectId,
    priority,
    startDate,
    endDate,
    assignedTo,
    reportTo,
    taskDocs
    ) 
    VALUES
    (?,?,?,?,
      ?,?,?,?)`;
      
      db.query(query, values, (err, result) => {
        if (err) {
      console.error('Error inserting data into tasks table:', err);
      res.status(500).send({ message: "erro in inserting education docs", error: err });
      return;
    }
    console.log('Data inserted into tasks table:', result);
    res.status(200).send({ status: 200, message: 'insertion sucess in tasks table' });
  });
});

// 6. get all projects
app.get('/getprojects', (req, res) => {
  //sql query to reteive all the documents of table
  const query="SELECT * FROM `tasks` WHERE 1";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching in data from task table: ', err);
    } else {
      res.status(200).json(results);
    }
  });
  
})


//listening app
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
