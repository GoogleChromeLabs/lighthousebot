'use strict';

const fs = require('fs');
const express = require('express');
const spawn = require('child_process').spawn;
const bodyParser = require('body-parser');

const API_KEY_HEADER = 'X-API-KEY';
const PORT = 8080;

// Handler for CI.
function runLH(req, res, next) {
  const url = req.body.url;
  const format = req.body.format || 'html';

  if (!url) {
    res.status(400).send('Please provide a URL.');
    return;
  }

  const fileName = `${Date.now()}`;
  const fileSavePath = `reports/${fileName}`;

  const args = [
    `--output-path=${fileSavePath}`,
    `--output=${format}`,
    '--output=html',
    '--port=9222'
  ];
  const child = spawn('lighthouse', [...args, url]);

  child.stderr.on('data', data => {
    console.log(data.toString());
  });

  child.on('close', statusCode => {
    const serverOrigin = `https://${req.host}/`;

    const file = `${fileSavePath}.report.${format}`;
    let fileContent = require(`/${file}`);
    fileContent.reportUrl = `${serverOrigin + fileSavePath}.report.html`;
    fileContent = JSON.stringify(fileContent, null, 2);

    fs.writeFileSync(`${file}`, fileContent);

    res.sendFile(`/${file}`, {}, err => {
      if (err) {
        next(err);
      }
      fs.unlink(file);
    });
  });
}

// Serve sent event handler for https://lighthouse-ci.appspot.com/try.
function runLighthouseAsEventStream(req, res, next) {
  const url = req.query.url;
  const format = req.query.format || 'html';

  if (!url) {
    res.status(400).send('Please provide a URL.');
    return;
  }

  // Send headers for event-stream connection.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no' // Forces Flex App Engine to keep connection open for SSE.
  });

  const file = `report.${Date.now()}.${format}`;
  const fileSavePath = './reports/';

  const args = [`--output-path=${fileSavePath + file}`, `--output=${format}`, '--port=9222'];
  const child = spawn('lighthouse', [...args, url]);

  let log = '';

  child.stderr.on('data', data => {
    const str = data.toString();
    res.write(`data: ${str}\n\n`);
    log += str;
  });

  child.on('close', statusCode => {
    const serverOrigin = `https://${req.host}/`;
    res.write(`data: done ${serverOrigin + file}\n\n`);
    res.status(410).end();
    console.log(log);
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

  console.log(`${API_KEY_HEADER}: ${req.get(API_KEY_HEADER)}`);

  runLH(req, res, next);
});

app.get('/stream', (req, res, next) => {
  runLighthouseAsEventStream(req, res, next);
});

app.listen(PORT);
console.log(`Running on http://localhost:${PORT}`);
