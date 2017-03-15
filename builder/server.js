'use strict';

const express = require('express');
const exec = require('child_process').execSync;

// Constants
const PORT = 8080;

// App
const app = express();
app.get('/ci', function (req, res) {
  console.log(req, res);
  exec(
    `node lighthouse-cli --output-path=../report.${req.query.format}\
    --output=${req.query.format} ${req.query.url}`,
    { cwd: '/lighthouse' }
  );
  res.sendFile(`/report.${req.query.format}`);
});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);
