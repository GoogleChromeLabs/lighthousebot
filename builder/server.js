'use strict';

const fs = require('fs');
const express = require('express');
const exec = require('child_process').exec;
const bodyParser = require('body-parser');

const API_KEY_HEADER = 'X-API-KEY';
const PORT = 8080;

function runLH(url, format = 'json', res, next) {
  if (!url) {
    res.status(400).send('Please provide a URL.');
    return;
  }

  const file = `report.${Date.now()}.${format}`;

  exec(`lighthouse --output-path=${file} --output=${format} ${url}`, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
      return;
    }

    console.log(stdout);

    res.sendFile(`/${file}`, {}, err => {
      if (err) {
        next(err);
      }
      fs.unlink(file);
    });
  });
}

const app = express();
app.use(bodyParser.json());

// app.get('/ci', (req, res, next) => {
//   runLH(req.query.url, req.query.format, res, next);
// });

app.post('/ci', (req, res, next) => {
  // Require an API key from users.
  if (!req.get(API_KEY_HEADER)) {
    const msg = `${API_KEY_HEADER} is missing`;
    const err = new Error(msg);
    res.status(403).json(err.message);
    return;
  }

  runLH(req.body.url, req.body.format, res, next);
});

app.listen(PORT);
console.log(`Running on http://localhost:${PORT}`);
