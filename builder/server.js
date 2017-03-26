'use strict';

const express = require('express');
const exec = require('child_process').execSync;

const PORT = 8080;

const app = express();
app.get('/ci', (req, res) => {
  const url = req.query.url;
  const format = req.query.format;
  const file = `report.${format}`;
  exec(`lighthouse --output-path=${file} --output=${format} ${url}`);
  res.sendFile(`/${file}`);
});

app.listen(PORT);
console.log(`Running on http://localhost:${PORT}`);
