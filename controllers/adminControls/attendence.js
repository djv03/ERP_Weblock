const db = require('../../config/db')

const presentToday = async (req, res) => {
    try {
        const employeestoday = await new Promise((resolve, reject) => {
            const query = `SELECT employeeId FROM attendence WHERE Date="${req.body.date}"`
            db.query(query, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });

        // Map over the results and fetch project details for each project
        const employewithDetails = await Promise.all(employeestoday.map(async (row) => {
            try {
                const employee = await new Promise((resolve, reject) => {
                    db.query(`SELECT name from employee WHERE employeeId = ${row.employeeId}`, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result[0]);
                        }
                    });
                });

                // Combine project details with the row
                return { ...row, employee };
            } catch (error) {
                console.log("Error fetching project details:", error);
                // If project details fetching fails, return row without details
                return row;
            }
        }));
        res.json({ status: 200, message: "todays present employee", data: employewithDetails });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }

}

module.exports = { presentToday }