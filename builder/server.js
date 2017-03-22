'use strict';

const express = require('express');
const exec = require('child_process').execSync;

const PORT = 8080;

const app = express();
app.get('/ci', (req, res) => {
  const url = req.query.url;
  const format = req.query.format;
  exec(`node lighthouse-cli --output-path=../report.${format}\
       --output=${format} ${url}`, {cwd: '/lighthouse'});
  res.sendFile(`/report.${format}`);
});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);
