const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
// This is required to handle urlencoded data
app.use(express.json()); 

const db = require('../../config/db')


const checkRequiredFields = require('../../utils/validator')

//create policies
const createPolicy = async (req, res) => {
    console.log(req.body)
    const query = `
  INSERT INTO policies(
      policyName,
      policyDescription,
      policyViolation
  )
  VALUES
  ('${req.body.policyName}','${req.body.policyDescription}','${req.body.policyViolation}')
  `
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ err: 'Internal Server Error', err: err });
            return;
        }
        else {
            res.status(200).json({ status: 200, message: 'Policy created sucessfully', data: results });
        }
    })
}
const getAllPolicies = async (req, res) => {
    db.query(`SELECT * FROM policies WHERE 1`, (err, results) => {
        if (err) {
            res.status(500).json({ err: 'Internal Server Error', err: err });
            return;
        }
        else {
            res.status(200).json({ status: 200, message: 'got all policies', data: results });
        }
    })
}
const updatePolicy = async (req, res) => {
    console.log(req.body)
    checkRequiredFields([req.body.policyId]);
    const query = `UPDATE \`policies\` 
    SET 
    \`policyName\`='${req.body?.policyName}',
    \`policyDescription\`='${req.body?.policyDescription}',
    \`policyViolation\`='${req.body?.policyViolation}'
    WHERE
    \`policyId\`=${req.body.policyId}`;

    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ err: 'Internal Server Error', err: err });
            return;
        }
        else {
            res.status(200).json({ status: 200, message: 'Policy updates sucessfully', data: results });
        }
    })
}
const deletePolicy = async (req, res) => {
    db.query(`DELETE FROM policies WHERE policyId=${req.params.id} `, (err, results) => {
        if (err) {
            res.status(500).json({ err: 'Internal Server Error', err: err });
            return;
        }
        else {
            res.status(200).json({ status: 200, message: 'policy deleted scucessfully', data: results });
        }
    })
}

module.exports = { createPolicy, getAllPolicies, updatePolicy,deletePolicy }