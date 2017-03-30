'use strict';

const express = require('express');
const exec = require('child_process').execSync;
const bodyParser = require('body-parser');

const PORT = 8080;

function runLH(url, format = 'json', res) {
  if (!url) {
    res.status(400).send('Please provide a URL.');
    return;
  }
  const file = `report.${format}`;
  try {
    exec(`lighthouse --output-path=${file} --output=${format} ${url}`);
    res.sendFile(`/${file}`);
  } catch (e) {
    res.status(400).send(e);
  }
}

const app = express();
app.use(bodyParser.json());

app.get('/ci', (req, res) => {
  runLH(req.query.url, req.query.format, res);
});

app.post('/ci', (req, res) => {
  runLH(req.query.url, req.query.format, res);
});

app.listen(PORT);
console.log(`Running on http://localhost:${PORT}`);
