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
      res.status(401).json({ error: 'Unauthorized admin access' });
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
  if (!req.files) {
    res.status(200).send({ status: 200, message: 'please provide employee documets' });
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
      res.status(500).send('Error in creating employee');
      return;
    }
    res.status(200).send({ status: 200, message: 'employee created successfully' });
  });
});

// 3. add education details of employee

//taking its documents from frontend post req. 
//2.1 making file upload functionality for the degreeCertificate
const employee_educationD = upload.fields([{ name: 'degreeCertificate', maxCount: 1 }])

app.post('/addeducation', employee_educationD, (req, res) => {
  if (!req.files) {
    res.status(500).send({ status: 200, message: "no degree certificate detected" });
  }
  const values = [
    req.body.employeeId,
    req.body.degreeName,
    req.body.passingYear,
    req.body.percentage,
    req.files.degreeCertificate[0].filename,
  ];
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
      res.status(500).send({ message: "erro in inserting education docs", error: err });
      return;
    }
    console.log('Data inserted into employee_education:', result);
    res.status(200).send({ status: 200, message: 'Data inserted into employee_education' });
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
  if (!req.files) {
    res.status(500).send({ status: 200, message: "employee documnets not detected " });
  }
  const values = [
    req.body.employeeId,
    req.files.passbook[0].filename,
    req.files.aadharcard[0].filename,
    req.files.pancard[0].filename,
    req.files.voterId[0].filename,
    req.files.drivingLiscence[0].filename
  ];

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
      res.status(200).json({ status: 200, message: 'employee Login successful' });
    } else {
      res.status(401).json({ error: ' Unauthorized employee access' });
    }
  });
});

// 4. get all employees
app.get('/getusers', (req, res) => {
  db.query('SELECT * FROM employee', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results);
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
      res.status(500).send({ message: "erro in inserting projects.projectDocs", error: err });
      return;
    }
    res.status(200).send({ status: 200, message: 'insertion sucess in employee_document', documnet: req.body });
  });
});

// 6. get all projects
app.get('/getprojects', (req, res) => {
  //sql query to reteive all the documents of table
  const query = "SELECT * FROM `projects` WHERE 1";
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
      res.status(500).send({ message: "erro in inserting tasks.taskDocs", error: err });
      return;
    }
    console.log('Data inserted into tasks table:', result);
    res.status(200).send({ status: 200, message: 'task Docs inserted sucessfully', document: req.body });
  });
});

// 6. get all projects
app.get('/getprojects', (req, res) => {
  //sql query to reteive all the documents of table
  const query = "SELECT * FROM `tasks` WHERE 1";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching in data from task table: ', err);
    } else {
      res.status(200).json(results);
    }
  });

})

//---------------------> leaves apis starts here <----------------------
// 7. apply leave API

//taking its documents from frontend post req
//        NOTE: here seperate folder is assigned for the storage for leave docs  
const leave_docs_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/leave_docs');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});
const leave_docs_upload = multer({ storage: leave_docs_storage })

app.post('/addleave', leave_docs_upload.single('leave_doc'), (req, res) => {
  const values = [
    req.body.empId,
    "pending",
    req.body.leaveType,
    req.body.noOfDays,
    req.body.startDate,
    req.body.endDate,
    req.body.reason,
    req.file.filename
  ];

  const query = `INSERT INTO leaves ( 
    empId,
    status,
    leaveType,
    noOfDays,
    startDate,
    endDate,
    reason,
    leave_doc
    ) 
    VALUES
    (?,?,?,?,
    ?,?,?,?)`;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into leaves:', err);
      res.status(500).send({ message: "erro in inserting leave", error: err });
      return;
    }
    console.log('Data inserted into tasks table:', result);
    res.status(200).send({ status: 200, message: 'insertion success in leave table', document: req.body });
  });
});

// 8. update leave status
app.post('/approveleave', (req, res) => {
  const { update, empId } = req.body;
  const query = `UPDATE leaves SET status = ? WHERE empId = ?`

  db.query(query, [update, empId], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'error updating leave status' });
      return;
    }
    res.status(200).json({ status: 200, message: 'leave status updated', status: req.body.update });
  })
})

// 9. get all leaves
app.get('/getleaves', (req, res) => {
  //sql query to reteive all the documents of table
  const query = "SELECT * FROM `leaves` WHERE 1";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'can not retrieve leaves' });
    } else {
      res.json(results);
    }
  });

})


//---------------------  all Clock APIs starts here-----------------------------


//10. -------->clock-in API
app.post('/clockin', (req, res) => {

  // Create a new Date object which will represent today's date
  var today = new Date();

  // Extract the year, month, and day components from the Date object
  var year = today.getFullYear();
  var month = today.getMonth() + 1; // Note: January is 0, so we add 1 to get the correct month
  var day = today.getDate();

  // Extract hours, minutes, and seconds from the Date object
  var hours = today.getHours();
  var minutes = today.getMinutes();
  var seconds = today.getSeconds();

  // Format the date as YYYY-MM-DD and time as HH:MM:SS
  var formattedDate = year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);
  var formattedTime = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds);
  console.log("here--------->", req.body);
  const values = [
    req.body.employeeId,
    formattedDate,
    formattedTime,
  ];
  const query = `INSERT INTO attendence
  (
    employeeId,
    Date,
    clockIn
  ) VALUES
  (
    ?,?,?
  )`

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'clock in error' });
      return;
    }
    res.status(200).json({ status: 200, message: 'employee clocked in' });
  })
})

//11. -------->clock-out API

app.post('/clockout', (req, res) => {
  if (req.body.employeeId == null) {
    res.status(200).json({ status: 200, message: 'employee has not clocked in ' })
  }
  // Create a new Date object which will represent today's date
  var today = new Date();
  // Extract hours, minutes, and seconds from the Date object
  var hours = today.getHours();
  var minutes = today.getMinutes();
  var seconds = today.getSeconds();

  var formattedTime = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds);

  const query = `UPDATE attendence 
                 SET clockOut = '${formattedTime}' 
                 WHERE employeeId = '${req.body.employeeId}'`;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'clock-out in error' });
      return;
    }
    res.status(200).json({ status: 200, message: 'employee clocked-out' });
  })
})


//12. -------->break start API
app.post('/breakstart', (req, res) => {

  // Create a new Date object which will represent today's date
  var today = new Date();

  // Extract the year, month, and day components from the Date object
  var year = today.getFullYear();
  var month = today.getMonth() + 1; // Note: January is 0, so we add 1 to get the correct month
  var day = today.getDate();

  // Extract hours, minutes, and seconds from the Date object
  var hours = today.getHours();
  var minutes = today.getMinutes();
  var seconds = today.getSeconds();

  // Format the date as YYYY-MM-DD and time as HH:MM:SS
  var formattedDate = year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);
  var formattedTime = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds);
  console.log("here--------->", req.body);
  const values = [
    req.body.employeeId,
    formattedDate,
    formattedTime,
  ];
  const query = `INSERT INTO breaks
  (
    employeeId,
    Date,
    breakStart
  ) VALUES
  (
    ?,?,?
  )`

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'break starts error' });
      return;
    }
    res.status(200).json({ status: 200, message: 'break starts' });
  })
})

//11. -------->ending the break API

app.post('/breakend', (req, res) => {
  if (req.body.employeeId == null) {
    res.status(200).json({ status: 200, message: 'employee has not started break ' })
  }
  // Create a new Date object which will represent today's date
  var today = new Date();
  // Extract hours, minutes, and seconds from the Date object
  var hours = today.getHours();
  var minutes = today.getMinutes();
  var seconds = today.getSeconds();

  var formattedTime = (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds);

  const query = `UPDATE breaks 
                 SET breakEnd = '${formattedTime}' 
                 WHERE 
                 employeeId = '${req.body.employeeId}'
                 AND breakEnd = '00:00:00'`;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'break ends error' });
      return;
    }
    res.status(200).json({ status: 200, message: 'breaks ends' });
  })
})

// --------------> requests generation api <------------------

// 12. create general request API
// here is the API with regards to general structure of any request (late clockin, employee profile update or any future request type )

//  creating storage space for leave request 
const requests_docs_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/requests_docs');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});
const requests_docs_upload = multer({ storage: requests_docs_storage })

app.post('/createrequest', requests_docs_upload.single('value'), (req, res) => {

  const values = [
    req.body.employeeId,
    req.body.type,//can be clocktime,update_employee
    req.body.description,
    req.body.keyname,
    !req.file ? req.body.value : req.file.filename,
    "pending",
  ];
  const query = `INSERT INTO requests ( 
    employeeId,
    type,
    description,
    keyname,
    value,
    status
    ) 
    VALUES
    (?,?,?,?,
    ?,?)`;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into leaves:', err);
      res.status(500).send({ message: "erro in inserting request", error: err });
      return;
    }
    console.log('Data inserted into tasks table:', result);
    res.status(200).send({ status: 200, message: 'request created successfully', document: req.body });
  });
});

// 13. update request status
app.post('/updaterequest', (req, res) => {
  console.log("updaterequest body", req.body)
  //getting data first to get keyname and value for updation in destination folder
  const getemployee_query = `SELECT  employeeId,keyname, value FROM requests WHERE requestId=${req.body.requestId};`

  db.query(getemployee_query, (err, result) => {
    if (err && result.length == 0) {
      console.error('Error inserting data into leaves:', err);
      res.status(500).send({ message: "can not find request for given data", error: err });
      return;
    }
    console.log(result)
    if (req.body.type == "clocktime") {
      const query = `UPDATE requests SET status = "${req.body.update}" WHERE requestId = ${req.body.requestId}`
      const sub_query = `UPDATE attendence SET clockIn = "${result[0].value}" WHERE 	employeeId = ${result[0].employeeId}`

      Promise.all([
        executeQuery(query),
        executeQuery(sub_query)
      ])
        .then(results => {
          // Combine the results into a single object
          const combinedData = {
            request_updation: results[0],
            data_updation: results[1]
          };

          // Send the combined data as a response
          res.json({ status: 200, message: 'request updated successfully', data: combinedData });
        })
        .catch(error => {
          console.error('Error in updating request: ' + error);
          res.status(500).json({ error: 'Internal server error', message: error });
        });
    }
    else if (req.body.type == "update_employee") {
      const query = `UPDATE requests SET status = "${req.body.update}" WHERE requestId = ${req.body.requestId}`
      const sub_query = `UPDATE employee SET ${result[0].keyname} = "${result[0].value}" WHERE employeeId  = ${result[0].employeeId}`

      Promise.all([
        executeQuery(query),
        executeQuery(sub_query)
      ])
        .then(results => {
          // Combine the results into a single object
          const combinedData = {
            request_updation: results[0],
            data_updation: results[1]
          };

          // Send the combined data as a response
          res.json({ status: 200, message: 'request updated successfully', data: combinedData });
        })
        .catch(error => {
          console.error('Error in updating request: ' + error);
          res.status(500).json({ error: 'Internal server error', message: error });
        });
    }

    function executeQuery(query) {
      return new Promise((resolve, reject) => {
        db.query(query, (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      });
    }
  });
})

app.get('/getrequestdata', (req, res) => {

  console.log(req.body)
  const getemployee_query = `SELECT  keyname, value FROM requests WHERE employeeId=${req.body.employeeId} AND status="pending";`
  db.query(getemployee_query, async (err, result) => {
    if (err) {
      console.error('Error inserting data into leaves:', err);
      res.status(500).send({ message: "erro in inserting request", error: err });

      return;
    }
    // console.log('Data inserted into tasks table:', result);
    console.log(result[0].keyname)
    console.log(result[0].value)
    res.status(200).send({ status: 200, message: 'got data successfully', data: result });
  });
})

// 9. get all leaves
app.get('/getleaves', (req, res) => {
  //sql query to reteive all the documents of table
  const query = "SELECT * FROM `leaves` WHERE 1";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'can not retrieve leaves' });
    } else {
      res.json(results);
    }
  });

})

//listening app
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
