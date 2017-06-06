'use strict';

const fs = require('fs');
const express = require('express');
const spawn = require('child_process').spawn;
const bodyParser = require('body-parser');

const API_KEY_HEADER = 'X-API-KEY';
const PORT = 8080;

function runLH(url, format = 'domhtml', res, next) {
  if (!url) {
    res.status(400).send('Please provide a URL.');
    return;
  }

  const extension = format === 'domhtml' ? 'html' : format;
  const file = `report.${Date.now()}.${extension}`;

  const args = [`--output-path=${file}`, `--output=${format}`, '--port=9222'];
  const child = spawn('lighthouse', [...args, url]);

  child.stderr.on('data', data => {
    console.log(data.toString());
  });

  child.on('close', statusCode => {
    res.sendFile(`/${file}`, {}, err => {
      if (err) {
        next(err);
      }
      fs.unlink(file);
    });
  });
}

function runLighthouseAsEventStream(req, res, next) {
  const url = req.query.url;
  const format = req.query.format || 'domhtml';

  if (!url) {
    res.status(400).send('Please provide a URL.');
    return;
  }

  // Send headers for event-stream connection.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const extension = format === 'domhtml' ? 'html' : format;
  const file = `report.${Date.now()}.${extension}`;
  const fileSavePath = './reports/';

  const args = [`--output-path=${fileSavePath + file}`, `--output=${format}`, '--port=9222'];
  const child = spawn('lighthouse', [...args, url]);

  let log = '';

  child.stderr.on('data', data => {
    const str = data.toString();
    console.log(str);
    res.write(`data: ${str}\n\n`);
    log += str;
  });

  child.on('close', statusCode => {
    const serverOrigin = `${req.protocol}://${req.host}/`;
    res.write(`data: done ${serverOrigin + file}\n\n`);
    res.status(410).end();
    log = '';
  });
}

const app = express();
app.use(bodyParser.json());
app.use(express.static('reports'));

// app.get('/ci', (req, res, next) => {
//   runLH(req.query.url, req.query.format, res, next);
// });

app.post('/ci', (req, res, next) => {
  // // Require an API key from users.
  // if (!req.get(API_KEY_HEADER)) {
  //   const msg = `${API_KEY_HEADER} is missing`;
  //   const err = new Error(msg);
  //   res.status(403).json(err.message);
  //   return;
  // }

  runLH(req.body.url, req.body.format, res, next);
});

app.get('/stream', (req, res, next) => {
  runLighthouseAsEventStream(req, res, next);
});

app.listen(PORT);
console.log(`Running on http://localhost:${PORT}`);
