// database.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// database connection
const { Client } = require('pg')
const client = new Client({
    host:"localhost",
    user:"postgres",
    port:5432,
    password:'0123',
    database:"hiraeth"
})

client.connect();

// Get candidate
app.get('/candidate', async (req, res) => {
    const result = await client.query("SELECT c.* FROM candidate c JOIN candidate_qualifications cq ON c.candidateno = cq.candidateno WHERE c.englishlevel IN ('C1', 'C2') AND cq.candidate_qualifications = 'HRIS'");
    const result2 = await client.query('SELECT * FROM candidate WHERE englishlevel = $1', ['C1']);
    const result3 = await client.query("SELECT COUNT (*) FROM candidate c JOIN education e ON c.candidateno = e.candidateno WHERE e.education = 'METU NCC'");
    res.status(200).json({data1: result.rows, data2: result2.rows, data3: result3.rows});
});

// Update candidate
app.put('/candidate/:candidateno', async (req, res) => {
    const { candidateno } = req.params;
    const { englishlevel } = req.body;
    await client.query('UPDATE candidate SET englishlevel = $1 WHERE candidateno = $2', [englishlevel, candidateno]);
    res.status(200).json({ message: "Update successful" });
});
//JOBOFFER
app.get('/joboffer', async (req, res) => {
    const result = await client.query("SELECT COUNT (*) FROM joboffer WHERE salary < 30000 AND offerdate > '2023-01-01'");
    res.status(200).json(result.rows);
});
//HRBP İNT 2 QUESTİONS
app.get('/hrbp-int2-questions', async (req, res) => {
    const result = await client.query("SELECT * FROM hrbp_int2_questions hr JOIN hm_lm_int2_questions hm ON hr.interview2id = hm.interview2id WHERE hr.interview2id = 1");
    res.status(200).json(result.rows);
});
//HRBP
app.get('/hrbp', async (req, res) => {
    const result = await client.query("SELECT firstname, surname FROM hrbp JOIN interview1 i ON hrbp.hrbpauthorizationcode = i.hrbp_authorizationcode WHERE i.interviewdate < '2023-01-01' ORDER BY hrbp.firstname, hrbp.surname");
    res.status(200).json(result.rows);
});
//EDUCATION
app.delete('/education/:candidateno', async (req, res) => {
    const { candidateno } = req.params;
    await client.query('DELETE FROM education WHERE candidateno = $1', [candidateno]);
    res.status(200).json({ message: "Deletion successful" });
});
app.put('/education/:candidateno', async (req, res) => {
    const { candidateno } = req.params;
    await client.query('UPDATE education SET education = $1 WHERE candidateno = $2', ['METU NCC', candidateno]);
    res.status(200).json({ message: "Update successful" });
});
app.get('/education', async (req, res) => {
    const result = await client.query("SELECT * FROM education ");
    res.status(200).json(result.rows);
});
//Position qualifications
app.delete('/position-qualifications/:position_code', async (req, res) => {
    const { position_code } = req.params;
    await client.query('DELETE FROM position_qualifications WHERE position_code = $1', [position_code]);
    res.status(200).json({ message: "Deletion successful" });
});

app.get('/position-qualifications', async (req, res) => {
    const result = await client.query('SELECT * FROM position_qualifications');
    res.status(200).json(result.rows);
});
//HMLM
app.post('/hmlm', async (req, res) => {
    const { emp_no, firstname, surname } = req.body;
    await client.query('INSERT INTO hm_lm (emp_no, firstname, surname) VALUES ($1, $2, $3)', [emp_no, firstname, surname]);
    res.status(201).json({ message: "Insertion successful" });
});
//HRBP-int 1
app.get('/hrbp-int1-questions', async (req, res) => {
    const result = await client.query("SELECT * FROM hrbp_int1_questions");
    res.status(200).json(result.rows);
})
//HMLM-int 2
app.get('/hmlm-int2-questions', async (req, res) => {
    const result = await client.query("SELECT * FROM hm_lm_int2_questions");
    res.status(200).json(result.rows);
})
// Login endpoint
app.post('/login', async (req, res) => {
    const { role, authCode } = req.body;

    if (role === "HMLM") {
        client.query(`SELECT * FROM hm_lm WHERE emp_no = $1`, [authCode], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else if (result.rows.length === 0) {
                res.status(401).send('Unauthorized');
            } else {
                res.json({ role });
            }
        });
    } else if (role === "HRBP") {
        client.query(`SELECT * FROM hrbp WHERE hrbpauthorizationcode = $1`, [authCode], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else if (result.rows.length === 0) {
                res.status(401).send('Unauthorized');
            } else {
                res.json({ role });
            }
        });
    } else {
        res.status(400).send('Invalid role');
    }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
