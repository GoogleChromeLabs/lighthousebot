'use strict';

const express = require('express');
const exec = require('child_process').execSync;
const bodyParser = require('body-parser');

const PORT = 8080;

function runLH(url, format = 'json') {
  const file = `report.${format}`;
  exec(`lighthouse --output-path=${file} --output=${format} ${url}`);
  return `/${file}`;
}

const app = express();
app.use(bodyParser.json());

app.get('/ci', (req, res) => {
  res.sendFile(runLH(req.query.url, req.query.format));
});

app.post('/ci', (req, res) => {
  res.sendFile(runLH(req.body.url, req.body.format));
});

app.listen(PORT);
console.log(`Running on http://localhost:${PORT}`);
