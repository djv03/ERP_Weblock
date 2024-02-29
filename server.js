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
app.use(bodyParser.urlencoded({ extended: true }));

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

const checkRequiredFields = require('./middleware/validator.js')
//------------------------ your API goes here--------------------------

// 1. admin login 
app.post('/adminlogin', checkRequiredFields([
  "email",
  "password"
]), (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM admin WHERE email = ? AND password = ?';

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    if (results && results.length > 0) {
      res.status(200).json({ status: 200, message: 'Login successful', data: results[0]?.id });
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
app.post('/createemployee', employee_pics, checkRequiredFields([
  "name",
  "email",
  "companyEmail",
  "password",
  "gender",
  "marital_status",
  "mobileNumber",
  "altmobileNumber",
  "address",
  "date_of_birth",
  "date_of_joining",
  "designation",
  "ExperienceType",
  "salary",
]), (req, res) => {
  console.log(req.files)
  if (!req.files.profilePic) {
    res.status(400).send({ status: 200, message: 'provide profile pic' });
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
    req.body.ExperienceType,
    !req.files.salarySlip ? "" : req.files.salarySlip[0].filename,
    !req.files.experienceLetter ? "" : req.files.experienceLetter[0].filename,
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
    ExperienceType,
    salarySlip,
    experienceLetter,
    profilePic,
    salary) 
    VALUES
     (?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ? )`;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into MySQL:', err);
      res.status(500).send('Error in creating employee');
      return;
    }
    res.status(200).send({ status: 200, message: 'employee created successfully' });
  });
});

//edit employee details

//editable: endDate,	participants,	totalTasks,completedTasks,projectDocs
app.post('/editemployee', employee_pics, (req, res) => {
  console.log(req.body)
  console.log(req.files)
  const query = `UPDATE employee 
    SET 
      name='${req.body?.name}',
      email='${req.body?.email}',
      companyEmail='${req.body?.companyEmail}',
      password='${req.body?.password}',
      gender='${req.body?.gender}',
      marital_status='${req.body?.marital_status}',
      mobileNumber='${req.body?.mobileNumber}',
      altmobileNumber='${req.body?.altmobileNumber}',
      address='${req.body?.address}',
      date_of_birth='${req.body?.date_of_birth}',
      date_of_joining='${req.body?.date_of_joining}',
      designation='${req.body?.designation}',
      ExperienceType='${req.body?.ExperienceType}',
      salarySlip='${req.files.salarySlip[0].filename != undefined ? req.files.salarySlip[0].filename : ''}',
      experienceLetter='${req.files.experienceLetter[0].filename != undefined ? req.files.experienceLetter[0].filename : ""}',
      profilePic= '${req.files.profilePic[0].filename != undefined ? req.files.profilePic[0].filename : ""}',
      salary='${req.body?.salary}'
  WHERE
     employeeId = ${req.body.employeeId}`

  db.query(query, (err, results) => {
    if (err) {
      console.log(err)
      res.json({ status: 500, message: "Error in updating employee Data ", err });
    } else {
      res.json({ status: 200, message: "employee details updated successfully", data: results });
    }
  });
});


// 3. add education details of employee

//taking its documents from frontend post req. 
//2.1 making file upload functionality for the degreeCertificate
const employee_educationD = upload.fields([{ name: 'degreeCertificate', maxCount: 1 }])

app.post('/addeducation', employee_educationD, checkRequiredFields([
  "employeeId",
  "degreeName",
  "passingYear",
  "percentage",
]), (req, res) => {
  if (!req.files.degreeCertificate) {
    res.status(400).send({ status: 400, message: "please provide degree certificate" });
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
//2.1 making file upload functionality for the employee documents
const employee_legalD = upload.fields([
  { name: 'passbook', maxCount: 1 },
  { name: 'aadharcard', maxCount: 1 },
  { name: 'pancard', maxCount: 1 },
  { name: 'voterId', maxCount: 1 },
  { name: 'drivingLiscence', maxCount: 1 }
])

app.post('/adddocumets', employee_legalD, checkRequiredFields([
  "employeeId",
]), (req, res) => {
  if (!req.files.passbook) {
    res.status(400).send({ status: 400, message: 'provide  passbook' });
  }
  else if (!req.files.aadharcard) {
    res.status(400).send({ status: 400, message: 'provide  aadharcard' });
  }
  else if (!req.files.pancard) {
    res.status(400).send({ status: 400, message: 'provide  pancard' });
  }

  const values = [
    req.body.employeeId,
    req.files.passbook[0].filename,
    req.files.aadharcard[0].filename,
    req.files.pancard[0].filename,
    !req.files.voterId ? "" : req.files.voterId[0].filename,
    !req.files.drivingLiscence ? "" : req.files.drivingLiscence[0].filename,
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
app.post('/employeelogin', checkRequiredFields([
  "email",
  "password"
]), (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM employee WHERE email = ? AND password = ?';

  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error('Error executing MySQL query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    if (results && results.length > 0) {
      res.status(200).json({ status: 200, message: 'employee Login successful', employeeId: results[0].employeeId, name: results[0].name });
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
      res.json({ status: 200, message: "got employees successfully", data: results });
    }
  });

})
//get employee by id
app.get('/getemployeebyid/:id', (req, res) => {
  if (isNaN(req.params.id)) {
    res.status(400).json({ message: "employee id is required" });
  }
  db.query(`SELECT * FROM employee WHERE 	employeeId =${req.params.id}`, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error', message: err });
    } else {
      res.json({ status: 200, message: "got employee successfully", data: results });
    }
  });

})

//---------------------------- projects apis starts from here-------------------------

// 5. add projects api

//taking its documents from frontend post req
//        NOTE: here seperate folder is assigned for the storage for project docs 

//api structure: this api is nested by 3 level means, another query is performed when project insertion query is performed sucessfully(from line 360).  
const project_docs_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/project_docs');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});
const project_docs_upload = multer({ storage: project_docs_storage })

app.post('/addproject', project_docs_upload.array('projectDocs'), checkRequiredFields([
  "ProjectName",
  "projectDescription",
  "startDate",
  "endDate",
  "participants",
  "totalTasks"
]), (req, res) => {

  const values = [
    req.body.ProjectName,
    req.body.projectDescription,
    req.body.startDate,
    req.body.endDate,
    req.body.participants,
    req.body.totalTasks,
    !req.files ? "" : JSON.stringify(req.files.map(file => file.filename))
  ];

  const query = `INSERT INTO projects ( 
    ProjectName,
    projectDescription,
    startDate,
    endDate,
    participants,
    totalTasks,
    projectDocs
    ) 
    VALUES
    (?,?,?,?,
      ?,?,?)`;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into projects:', err);
      res.status(500).send({ message: "erro in inserting projects", error: err });
      return;
    }
    //this is the query performed when project insertion qiery is done
    //this the query to get project id by special SQL query to get id of latest document inserted in the DB
    // CAUTION:  this query is returning id of the inserted document from the "WHOLE DATABASE", means if a inseriton has performed at seperate location then this will return that id, not our project id
    //            BUT since these two queries are performing within the one API call then noting to worry about much(may be)     
    db.query("SELECT LAST_INSERT_ID();", (err, result) => {
      if (err) {
        console.error('project has not inserted sucessfully', err);
        res.status(500).send({ message: "can not get id of project", error: err });
        return;
      }
      //if we get id of project sucessfully then following logic will triggered

      // s1- split incoming string of the participants (in form of 102,103,103..)  
      const arr = req.body.participants.split(",");

      // generate a pair of [employeeId, projectId] for the inserting multiple values in the employeeprojects table 
      const gen_val = () => {
        let ans = []
        for (let i = 0; i < arr.length; i++) {
          // beware: all the participants are in string formate so do we must have convert it into the int
          const element = parseInt(arr[i]);
          let pair = [element, result[0]['LAST_INSERT_ID()']];
          ans.push(pair);
        }
        return ans;
      }
      const employee_project_pairs = gen_val();
      console.log("formatted values are", employee_project_pairs);

      //upon sucessfull generation of pairs run our 3rd query, i.e. insert pairs into the employeeprojects table 
      const query = `INSERT into employeeprojects (	employeeId,projectId) VALUES ?`
      db.query(query, [employee_project_pairs], (err, result) => {
        if (err) {
          console.error('can not get id of project', err);
          res.status(500).send({ message: "can not insert into the employeeprojects but projects updated sucessfully", error: err });
          return;
        }
        res.status(200).send({ status: 200, message: 'insertion sucess in projects as well as employeeprojects', data: result });
      })
    });
  });
});

//edit projects

//editable: endDate,	participants,	totalTasks,completedTasks,projectDocs
app.post('/editproject', project_docs_upload.array('projectDocs'), (req, res) => {
  console.log(req.body)
  const query = `UPDATE projects 
  SET 
    ProjectName='${req.body?.ProjectName}',
    projectDescription='${req.body?.projectDescription}',
     endDate = '${req.body?.endDate}',
     participants = '${req.body?.participants}',
     totalTasks = ${req.body?.totalTasks},
     projectDocs = '${JSON.stringify(req?.files.map(file => file.filename))}'
  WHERE
     projectId = ${req.body.projectId}`

  db.query(query, (err, results) => {
    if (err) {
      console.log(err)
      res.json({ status: 500, message: "Error in updating project Data ", err });
    } else {
      res.json({ status: 200, message: "project updated successfully", data: results });
    }
  });
});

//get projects by project id


// 6. get all projects
app.get('/getprojects', (req, res) => {
  //sql query to reteive all the documents of table
  const query = "SELECT * FROM `projects` WHERE 1";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching in data from my sql: ', err);
    } else {
      res.json({ status: 200, message: "got employee successfully", data: results });
    }
  });

})

//get individual project by id
app.get('/getprojectbyid/:id', (req, res) => {
  if (isNaN(req.params.id)) {
    res.status(400).json({ message: "project id is required" });
  }
  db.query(`SELECT * FROM projects WHERE 	projectId =${req.params.id}`, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error', message: err });
    } else {
      res.json({ status: 200, message: "got project successfully", data: results });
    }
  });

})

//get all project corrospond to given employeeId, along with details of each project
// so first Query is fetxhing all project assign to employee from "employeeprojects" table 
// and second query is fetching project details of each projects  
app.get('/getprojectsbyempid/:id', async (req, res) => {
  if (isNaN(req.params.id)) {
    res.status(400).json({ message: "please provide appropriate id " });
    return; // Add return to exit the function if ID is not valid
  }

  //firstly we create promise to get all projectsIds from given employeeId (from employeeprojects table)
  try {
    const employeeProjects = await new Promise((resolve, reject) => {
      const query = `SELECT * FROM employeeprojects WHERE employeeId = ${req.params.id}`
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    // Map over the results and fetch project details for each project
    const projectsWithDetails = await Promise.all(employeeProjects.map(async (row) => {
      try {
        const projectDetails = await new Promise((resolve, reject) => {
          db.query(`SELECT * from projects WHERE projectId = ${row.projectId}`, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result[0]);
            }
          });
        });

        const employeeDetails = await new Promise((resolve, reject) => {
          db.query(`SELECT * FROM employee WHERE employeeId=${row.employeeId}`, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
        // Combine project details with the row
        return { ...row, projectDetails, employeeDetails };
      } catch (error) {
        console.log("Error fetching project details:", error);
        // If project details fetching fails, return row without details
        return row;
      }
    }));

    res.json({ status: 200, message: "projects for given employeeId", data: projectsWithDetails });
  }
  catch (error) {
    console.log("Error fetching employee projects:", error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// fetch particulor project by project id

app.get('/getprojectsbyprojectid/:id', async (req, res) => {
  if (isNaN(req.params.id)) {
    res.status(400).json({ message: "please provide appropriate project id " });
    return; // Add return to exit the function if ID is not valid
  }

  //firstly we create promise to get all projectsIds from given employeeId (from employeeprojects table)
  try {
    const employeeProjects = await new Promise((resolve, reject) => {
      const query = `SELECT * FROM employeeprojects WHERE projectId = ${req.params.id}`
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    // Map over the results and fetch project details for each project
    const employeesWithDetails = await Promise.all(employeeProjects.map(async (row) => {
      try {
        const employeeDetails = await new Promise((resolve, reject) => {
          db.query(`SELECT * from employee WHERE employeeId = ${row.employeeId}`, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result[0]);
            }
          });
        });
        // Combine project details with the row
        return { ...row, employeeDetails };
      } catch (error) {
        console.log("Error fetching project details:", error);
        // If employee details fetching fails, return row without details
        return row;
      }
    }));

    res.json({ status: 200, message: "projects along with employee details for given projectId", data: employeesWithDetails });
  }
  catch (error) {
    console.log("Error fetching employee projects:", error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// get projects by employeeId
app.get('/getemployeebyprojectid/:id', (req, res) => {
  if (isNaN(req.params.id)) {
    res.status(400).json({ message: "please provide appropriate id " });
  }
  db.query(`SELECT * FROM employeeprojects WHERE 	projectId =${req.params.id}`, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error', message: err });
    } else {
      res.json({ status: 200, message: "employee for given projectId", data: results });
    }
  });
})

//get active projects
app.get('/getactiveprojects', (req, res) => {
  var today = new Date();

  // Extract the year, month, and day components from the Date object
  var year = today.getFullYear();
  var month = today.getMonth() + 1; // Note: January is 0, so we add 1 to get the correct month
  var day = today.getDate();

  var formattedDate = year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);

  const query = `SELECT * from projects WHERE endDate> '${formattedDate}'`;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error', message: err });
    } else {
      res.json({ status: 200, message: "all active projects", data: results });
    }
  });
})

//get active projects
app.get('/getdueprojects', (req, res) => {
  var today = new Date();

  var year = today.getFullYear();
  var month = today.getMonth() + 1; // Note: January is 0, so we add 1 to get the correct month
  var day = today.getDate();
  var formattedDate = year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);

  const query = `SELECT * from projects WHERE endDate<'${formattedDate}'`;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error', message: err });
    } else {
      res.json({ status: 200, message: "all due projects", data: results });
    }
  });
})

//---------------------------- Tasks apis starts from here-------------------------

// 5. add tasks api

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

app.post('/addtask', task_docs_upload.array('taskDocs'), checkRequiredFields([
  "taskDescription",
  "projectId",
  "priority",
  "startDate",
  "endDate",
  "assignedTo",
  "reportTo"
]), (req, res) => {

  const values = [
    req.body.taskDescription,
    req.body.projectId,
    req.body.priority,
    req.body.startDate,
    req.body.endDate,
    req.body.assignedTo,
    req.body.reportTo,
    !req.files ? "" : JSON.stringify(req.files.map(file => file.filename))
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
    res.status(200).send({ status: 200, message: 'task created sucessfully' });
  });
});

app.post('/edittask', task_docs_upload.array('taskDocs'), (req, res) => {
  console.log(req.body)
  const query = `UPDATE tasks 
  SET 
  priority = '${req.body?.priority}',
  endDate = '${req.body?.endDate}',
  assignedTo = ${req.body?.assignedTo},
  reportTo = ${req.body?.reportTo},
  taskDocs = '${req.file ? req.file : JSON.stringify(req?.files.map(file => file.filename))}'
  WHERE
    taskId = ${req.body.taskId}`

  db.query(query, (err, results) => {
    if (err) {
      console.log(err)
      res.json({ status: 500, message: "Error in updating tasks ", err });
    } else {
      res.json({ status: 200, message: "task updated successfully", data: results });
    }
  });
});

// get tasks by employeeId along with its assgning details
app.get('/gettasksbyempid/:id', async (req, res) => {
  if (isNaN(req.params.id)) {
    res.status(400).json({ message: "please provide appropriate id " });
    return; // Add return to exit the function if ID is not valid
  }

  //firstly we create promise to get all projectsIds from given employeeId (from employeeprojects table)
  try {
    const employeeTask = await new Promise((resolve, reject) => {
      const query = `SELECT * FROM tasks WHERE assignedTo = ${req.params.id}`
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    // Map over the results and fetch project details for each project
    const projectsDetails = await Promise.all(employeeTask.map(async (row) => {
      try {
        const taskDetails = await new Promise((resolve, reject) => {
          db.query(`SELECT * from projects WHERE projectId = ${row.projectId}`, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result[0]);
            }
          });
        });

        const employeeDetails = await new Promise((resolve, reject) => {
          db.query(`SELECT * from employee WHERE employeeId = ${row.assignedTo}`, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
        const mentorDetails = await new Promise((resolve, reject) => {
          db.query(`SELECT * from employee WHERE employeeId = ${row.reportTo}`, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
        // Combine project details with the row
        return { ...row, taskDetails, employeeDetails, mentorDetails };
      } catch (error) {
        console.log("Error fetching project details:", error);
        // If project details fetching fails, return row without details
        return row;
      }
    }));

    res.json({ status: 200, message: "projects for given employeeId", data: projectsDetails });
  }
  catch (error) {
    console.log("Error fetching employee projects:", error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// 6. get all tasks
app.get('/gettasks', (req, res) => {
  //sql query to reteive all the documents of table
  const query = "SELECT * FROM `tasks` WHERE 1";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching in data from task table: ', err);
    } else {
      res.json({ status: 200, message: "got tasks successfully", data: results });
    }
  });
})

//get active projects
app.get('/getactivetasks', (req, res) => {
  var today = new Date();

  // Extract the year, month, and day components from the Date object
  var year = today.getFullYear();
  var month = today.getMonth() + 1; // Note: January is 0, so we add 1 to get the correct month
  var day = today.getDate();

  var formattedDate = year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);

  const query = `SELECT * from tasks WHERE endDate> '${formattedDate}'`;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error', message: err });
    } else {
      res.json({ status: 200, message: "all active tasks", data: results });
    }
  });
})

//get active projects
app.get('/getduetasks', (req, res) => {
  var today = new Date();

  var year = today.getFullYear();
  var month = today.getMonth() + 1; // Note: January is 0, so we add 1 to get the correct month
  var day = today.getDate();
  var formattedDate = year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);

  const query = `SELECT * from tasks WHERE endDate<'${formattedDate}'`;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error', message: err });
    } else {
      res.json({ status: 200, message: "all due tasks", data: results });
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

app.post('/addleave', leave_docs_upload.single('leave_doc'), checkRequiredFields([
  "empId",
  "leaveType",
  "noOfDays",
  "startDate",
  "endDate",
  "reason"
]), (req, res) => {
  const values = [
    req.body.empId,
    req.body.leaveType,
    req.body.noOfDays,
    req.body.startDate,
    req.body.endDate,
    req.body.reason,
    !req.file ? "" : req.file.filename
  ];

  const query = `INSERT INTO leaves ( 
    empId,
    leaveType,
    noOfDays,
    startDate,
    endDate,
    reason,
    leave_doc
    ) 
    VALUES
    (?,?,?,?,
    ?,?,?)`;

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
app.post('/approveleave', checkRequiredFields([
  "update",
  "leaveId"
]), (req, res) => {
  const { update, leaveId } = req.body;
  const query = `UPDATE leaves SET status = ? WHERE leaveId = ?`

  db.query(query, [update, leaveId], (err, results) => {
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
      res.json({ status: 200, message: "got all leaves successfully", data: results });
    }
  });

})

//leave on today

app.get('/getleavesoftoday', async (req, res) => {
  const today = new Date;
  var year = today.getFullYear();
  var month = today.getMonth() + 1; // Note: January is 0, so we add 1 to get the correct month
  var day = today.getDate();


  var todaydate = year + "-" + 0 + month + "-" + day;

  const todaysleaves = await new Promise((resolve, reject) => {
    const query = `SELECT * FROM leaves WHERE startDate>='${todaydate}'`
    db.query(query, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });

  const leavesWithDetails = await Promise.all(todaysleaves.map(async (row) => {

    try {
      const leavesDetail = await new Promise((resolve, reject) => {
        db.query(`SELECT * from employee WHERE employeeId = ${row.empId}`, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result[0]);
          }
        });
      });
      // Combine project details with the row
      return { ...row, leavesDetail };
    }

    catch (error) {
      console.log("Error fetching project details:", error);
      // If project details fetching fails, return row without details
      return row;
    }


  }));

  res.json({ status: 200, message: "projects for given employeeId", data: leavesWithDetails });
})

app.get('/getbirthdays', (req, res) => {
  const query = `SELECT name, date_of_birth, profilePic 
  FROM employee
  WHERE 
  (
    MONTH(date_of_birth) = MONTH(CURDATE())
          AND DAY(date_of_birth) >= DAY(CURDATE())
          )
          OR
      (
          MONTH(date_of_birth) = MONTH(DATE_ADD(CURDATE(), INTERVAL 1 MONTH))
          AND DAY(date_of_birth) < DAY(DATE_ADD(CURDATE(), INTERVAL 1 MONTH))
      );
      `
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'can not retrieve leaves of today' });
    }

    res.json({ status: 200, message: "got birthdays successfully", data: results });

  })
})
app.get('/getanniversaries', (req, res) => {
  const query = `SELECT name, date_of_joining,profilePic 
  FROM employee
  WHERE 
      (
          MONTH(date_of_joining) = MONTH(CURDATE())
          AND DAY(date_of_joining) >= DAY(CURDATE())
      )
      OR
      (
          MONTH(date_of_joining) = MONTH(DATE_ADD(CURDATE(), INTERVAL 1 MONTH))
          AND DAY(date_of_joining) < DAY(DATE_ADD(CURDATE(), INTERVAL 1 MONTH))
      );  
      `
  db.query(query, (err, results) => {

    if (err) {
      res.status(500).json({ error: 'can not retrieve leaves of today' });
    }

    res.json({ status: 200, message: "got birthdays successfully", data: results });

  })
})


//get leaves by employeeId
app.get('/getleavesbyempid/:id', (req, res) => {
  if (isNaN(req.params.id)) {
    res.status(400).json({ message: "please provide appropriate id " });
  }
  db.query(`SELECT * FROM leaves WHERE empId =${req.params.id}`, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error', message: err });
    } else {
      res.json({ status: 200, message: "got all leaves of employee sucessfully", data: results });
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

app.post('/clockout', checkRequiredFields(["employeeId"]), (req, res) => {

  db.query(`SELECT * from attendence WHERE employeeId=${req.body.employeeId} AND 	clockOut="00:00:00"`, (err, results) => {
    if (results.length == 0) {
      res.status(400).json({ message: 'employee has not clocked in' });
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
        res.status(500).json({ error: 'clock-out in error', err });
        return;
      }
      res.status(200).json({ status: 200, message: 'employee clocked-out' });
    })
  })

})
app.post('/clockinstatus', checkRequiredFields(["employeeId"]), (req, res) => {
  // Create a new Date object which will represent today's date
  var today = new Date();

  // Extract the year, month, and day components from the Date object
  var year = today.getFullYear();
  var month = today.getMonth() + 1; // Note: January is 0, so we add 1 to get the correct month
  var day = today.getDate();

  // Format the date as YYYY-MM-DD and time as HH:MM:SS
  var formattedDate = year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);

  db.query(`SELECT * from attendence WHERE employeeId=${req.body.employeeId} AND 	Date="${formattedDate}"`, (err, results) => {
    if (results.length == 0) {
      res.status(400).json({ status: 400, message: 'employee has not clocked in' });
    }
    else {
      res.status(200).json({ status: 200, message: 'employee has clocked in' });
    }
  })
})

// get attendence by employeeId
app.get('/getattendencebyemployeeId/:id', (req, res) => {
  if (isNaN(req.params.id)) {
    res.status(400).json({ message: "please provide appropriate id " });
  }
  db.query(`SELECT * FROM attendence WHERE 	employeeId =${req.params.id}`, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error', message: err });
    } else {
      res.json({ status: 200, message: "attendence for given employee", data: results });
    }
  });
})



//12. -------->break start API
app.post('/breakstart', checkRequiredFields(["employeeId"]), (req, res) => {
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

//13. -------->ending the break API

app.post('/breakend', checkRequiredFields(["employeeId"]), (req, res) => {

  db.query(`SELECT * from breaks WHERE employeeId=${req.body.employeeId} AND 	breakEnd="00:00:00"`, (err, results) => {
    if (results.length == 0) {
      res.status(400).json({ message: 'employee has not started break' });
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


})

// get breaks by employeeId
app.get('/getbreaksbyemployeeId/:id', (req, res) => {
  if (isNaN(req.params.id)) {
    res.status(400).json({ message: "please provide appropriate id " });
  }
  db.query(`SELECT * FROM breaks WHERE employeeId =${req.params.id}`, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error', message: err });
    } else {
      res.json({ status: 200, message: "breaks for given employee", data: results });
    }
  });
})


// --------------> requests generation api <------------------

// 14. create general request API
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

app.post('/createrequest', requests_docs_upload.single('value'), checkRequiredFields([
  "employeeId",
  "type",
  "description",
  "keyname"
]), (req, res) => {

  const values = [
    req.body.employeeId,
    req.body.type,//can be clocktime,update_employee
    req.body.description,
    req.body.keyname,
    !req.file ? req.body.value : req.file.filename
  ];
  console.log(req.file)
  const query = `INSERT INTO requests ( 
    employeeId,
    type,
    description,
    keyname,
    value
    ) 
    VALUES
    (?,?,?,?,
    ?)`;

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

// 15. update request status
app.post('/updaterequest', checkRequiredFields([
  "requestId",
  "update",
  "type"
]), (req, res) => {
  //getting data first to get keyname and value for updation in destination folder
  const getemployee_query = `SELECT  employeeId,keyname, value FROM requests WHERE requestId=${req.body.requestId};`

  db.query(getemployee_query, (err, result) => {
    if (err && result.length == 0) {
      console.error('Error inserting data into leaves:', err);
      res.status(500).send({ message: "can not find request for given data", error: err });
      return;
    }
    console.log(result)
    if (req.body.update === "reject") {
      if (req.body.type == "clocktime") {
        const query = `UPDATE requests SET status = "${req.body.update}" WHERE requestId = ${req.body.requestId}`

        Promise.all([
          executeQuery(query)
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

        Promise.all([
          executeQuery(query)
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

    }
    else {
      if (req.body.type == "clocktime") {
        const query = `UPDATE requests SET status = "${req.body.update}" WHERE requestId = ${req.body.requestId}`
        const sub_query = `UPDATE attendence SET ${result[0].keyname} = "${result[0].value}" WHERE 	employeeId = ${result[0].employeeId}`

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

    }

  });
})

// 16. get all request
app.get('/getrequests', (req, res) => {
  //sql query to reteive all the documents of table
  const query = "SELECT * FROM `requests` WHERE 1";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ status: 400, error: err });
    } else {
      res.json({ status: 200, message: "got the requests ", data: results });
    }
  });

})

// get request by id
app.get('/getrequestbyid/:id', (req, res) => {
  if (isNaN(req.params.id)) {
    res.status(400).json({ message: "request id is required" });
  }
  db.query(`SELECT * FROM requests WHERE 	requestId =${req.params.id}`, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal server error', message: err });
    } else {
      res.json({ status: 200, message: "got request successfully", data: results });
    }
  });

})

//get request by type
// app.post('/getrequestsbytype', (req, res) => {
//   console.log(req.body)
//   db.query(`SELECT * FROM requests WHERE 	type ='${req.body.type} AND status='pending'`, (err, results) => {

//     if (err) {
//       res.status(500).json({ error: 'Internal server error', message: err });
//     } else {
//       if (results.length==0) {
//         res.json({ status: 500, message: `no requests found for given type` });
//       }
//       else{
//         for (let index = 0; index < results.length; index++) {
//           const request = results[index];
//           db.query(`SELECT name FROM employee WHERE employeeId =${request.employeeId}`,(err,result)=>{
//             if (err) {
//               request.employeeName="name";
//             }
//             console.log(result[0].name)
//             request.employeeName=result[0].name; 
//           })
//         }
//         res.json({ status: 200, message: `got requests for ${req.body.type} successfully`, data: results });
//       }
//     }
//   });

// })
app.post('/getrequestsbytype', async (req, res) => {
  console.log(req.body);
  try {
    const results = await new Promise((resolve, reject) => {
      db.query(`SELECT * FROM requests WHERE type = '${req.body.type}' AND status = 'pending'`, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (results.length === 0) {
      res.json({ status: 500, message: `No requests found for the given type` });
      return;
    }

    for (let index = 0; index < results.length; index++) {
      const request = results[index];
      try {
        const employeeResult = await new Promise((resolve, reject) => {
          db.query(`SELECT name FROM employee WHERE employeeId = ${request.employeeId}`, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        request.employeeName = employeeResult[0].name;
      } catch (err) {
        console.error("Error fetching employee name:", err);
        request.employeeName = "Unknown";
      }
    }

    res.json({ status: 200, message: `Got requests for ${req.body.type} successfully`, data: results });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: 'Internal server error', message: err });
  }
});

//get all request
app.get('/getallrequests', (req, res) => {
  //sql query to reteive all the documents of table
  const query = "SELECT * FROM `requests` WHERE 1";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send('Error fetching in data from my sql: ', err);
    } else {
      res.json({ status: 200, message: "got requests successfully", data: results });
    }
  });
})


// ---------------------> announcements APIs starts here <-------------------

// 17. create announcements 
const announcements_docs_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/announcements_docs');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});
const announcements_docs_upload = multer({ storage: announcements_docs_storage })

app.post('/addannouncements', announcements_docs_upload.array('announcements_docs'), checkRequiredFields([
  "title",
  "message",
]), (req, res) => {
  const values = [
    !req.body.type ? "general" : req.body.type,
    req.body.title,
    req.body.message,
    req.body.announcement_date,
    !req.files ? "" : JSON.stringify(req.files.map(file => file.filename))
  ];

  const query = `INSERT INTO announcements ( 
    type,
    title,
    message,
    announcement_date,
    announcement_docs
    ) 
    VALUES
    (?,?,?,?,
      ?)`;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting data into announcements:', err);
      res.status(500).send({ message: "erro in inserting leave", error: err });
      return;
    }
    console.log('Data inserted into tasks table:', result);
    res.status(200).send({ status: 200, message: 'insertion success in announcements table', document: req.body });
  });
});
// 18. get all announcements
app.get('/getannouncements', (req, res) => {
  //sql query to reteive all the documents of table
  const query = "SELECT * FROM `announcements` WHERE 1";
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'can not retrieve announcements' });
    } else {
      res.json({ status: 200, message: "got all announcements successfully", data: results });
    }
  });

})
//19. get holidays
app.get('/getholidays', (req, res) => {
  //sql query to reteive all the documents of table
  const query = 'SELECT * FROM `announcements` WHERE type="holiday"'
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'can not retrieve holidays' });
    } else {
      res.json({ status: 200, message: "got all announcements successfully", data: results });
    }
  });
})

//get today's absent employees 
app.get('/getabsents', async (req, res) => {
  // Create a new Date object which will represent today's date
  var today = new Date();

  // Extract the year, month, and day components from the Date object
  var year = today.getFullYear();
  var month = today.getMonth() + 1; // Note: January is 0, so we add 1 to get the correct month
  var day = today.getDate();


  // Format the date as YYYY-MM-DD and time as HH:MM:SS
  var formattedDate = year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);


  const query = `
  SELECT employee.employeeId, employee.name 
  FROM employee 
  LEFT JOIN (
      SELECT employeeId
      FROM attendence
      WHERE Date = '${formattedDate}'
      UNION 
      SELECT empId
      FROM leaves
      WHERE status = 'approve' AND startDate = ' ${formattedDate} ' 
  ) AS union_result
  ON employee.employeeId = union_result.employeeId 
  WHERE union_result.employeeId IS NULL;
  
  `
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'can not retrieve absents employee' });
    } else {
      res.json({ status: 200, message: "got all absent employee sucessfull", data: results });
    }
  });
})


//listening app
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
