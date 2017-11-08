'use strict';

const fs = require('fs');
const express = require('express');
const spawn = require('child_process').spawn;
const bodyParser = require('body-parser');

const API_KEY_HEADER = 'X-API-KEY';
const PORT = 8080;

// Handler for CI.
function runLH(params, req, res, next) {
  const url = params.url;
  const format = params.format || 'html';
  const log = params.log || req.method === 'GET';

  if (!url) {
    res.status(400).send('Please provide a URL.');
    return;
  }

  const fileName = `report.${Date.now()}.${format}`;
  const outputPath = `./reports/${fileName}`;

  const args = [`--output-path=${outputPath}`, `--output=${format}`, '--port=9222'];
  const child = spawn('lighthouse', [...args, url]);

  if (log) {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Forces Flex App Engine to keep connection open for streaming.
    });

    res.write(`
      <style>
        textarea {
          font: inherit;
          width: 100vw;
          height: 100vh;
          border: none;
          outline: none;
        }
        </style>
        <textarea>
    `);
  }

  child.stderr.on('data', data => {
    const str = data.toString();
    if (log) {
      res.write(str);
    }
    console.log(str);
  });

  child.on('close', statusCode => {
    if (log) {
      res.write('</textarea>');
      res.write(`<meta http-equiv="refresh" content="0;URL='/${fileName}'">`);
      res.end();
    } else {
      res.sendFile(`/${outputPath}`, {}, err => {
        if (err) {
          next(err);
        }
        fs.unlink(outputPath); // delete report
      });
    }
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

app.get('/ci', (req, res, next) => {
  const apiKey = req.query.key;
  // Require API for get requests.
  if (!apiKey) {
    const msg = `Missing API key. Please include the key parameter`;
    res.status(403).send(`Missing API key. Please include the key parameter`);
    return;
  }
  console.log(`${API_KEY_HEADER}: ${apiKey}`);
  runLH(req.query, req, res, next);
});

app.post('/ci', (req, res, next) => {
  // // Require an API key from users.
  // if (!req.get(API_KEY_HEADER)) {
  //   const msg = `${API_KEY_HEADER} is missing`;
  //   const err = new Error(msg);
  //   res.status(403).json(err.message);
  //   return;
  // }

  console.log(`${API_KEY_HEADER}: ${req.get(API_KEY_HEADER)}`);

  runLH(req.body, req, res, next);
});

app.get('/stream', (req, res, next) => {
  runLighthouseAsEventStream(req, res, next);
});

app.listen(PORT);
console.log(`Running on http://localhost:${PORT}`);
