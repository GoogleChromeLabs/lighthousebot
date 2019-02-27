'use strict';

const fs = require('fs');
const express = require('express');
const spawn = require('child_process').spawn;
const bodyParser = require('body-parser');

const API_KEY_HEADER = 'X-API-KEY';
const PORT = 8080;
const REPORTS_DIR = './home/chrome/reports';

function validURL(url, res) {
  if (!url) {
    res.status(400).send('Please provide a URL.');
    return false;
  }

  if (!url.startsWith('http')) {
    res.status(400).send('URL must start with http.');
    return false;
  }

  return true;
}

function getDefaultArgs(outputPath, format) {
  return [
    `--output-path=${outputPath}`,
    `--output=${format}`,
    // Dicey to use port=0 to launch a new instance of Chrome per invocation
    // of LH. On Linux, eventually Chrome Launcher begins to fail.
    // Root is https://github.com/GoogleChrome/chrome-launcher/issues/6.
    // '--port=9222',
    '--port=0', // choose random port every time so we launch a new instance of Chrome.
    // Note: this is a noop when using Dockerfile.nonheadless b/c Chrome is already launched.
    '--chrome-flags="--headless"',
  ];
}

// Handler for CI.
function runLH(params, req, res, next) {
  const url = params.url;
  const format = params.output || params.format || 'html';
  const log = params.log || req.method === 'GET';

  if (!validURL(url, res)) {
    return;
  }

  const fileName = `report.${Date.now()}.${format}`;
  const outputPath = `${REPORTS_DIR}/${fileName}`;
  const args = getDefaultArgs(outputPath, format);

  const child = spawn('lighthouse', [...args, url]);
  child.stderr.pipe(process.stderr);
  child.stdout.pipe(process.stdout);

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
        // delete report
        fs.unlink(outputPath, err => {
          if (err) {
            next(err);
          }
        });
      });
    }
  });
}

// Serve sent event handler for https://lighthouse-ci.appspot.com/try.
function runLighthouseAsEventStream(req, res, next) {
  const url = req.query.url;
  const format = req.query.output || req.query.format || 'html';

  if (!validURL(url, res)) {
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

  const fileName = `report.${Date.now()}.${format}`;
  const outputPath = `./${REPORTS_DIR}/${fileName}`;
  const args = getDefaultArgs(outputPath, format);

  const child = spawn('lighthouse', [...args, url]);
  // console.log('pid', child.pid);

  child.stderr.pipe(process.stderr);
  child.stdout.pipe(process.stdout);

  let log = '';

  // child.on('exit', (statusCode, signal) => {
  //   console.log(statusCode, signal);
  // });

  child.stderr.on('data', data => {
    const str = data.toString();
    res.write(`data: ${str}\n\n`);
    log += str;
  });

  child.on('close', statusCode => {
    if (log.match(/Error: /gm)) {
      res.write(`data: ERROR\n\n`);
    } else {
      const serverOrigin = `https://${req.hostname}/`;
      res.write(`data: done ${serverOrigin + fileName}\n\n`);
    }

    res.status(410).end();
    log = '';
  });
}

const app = express();
app.use(bodyParser.json());

app.use(function enableCors(req, res, next) {
  res.set('Access-Control-Allow-Origin', '*');

  // Record GA hit.
  // const visitor = ua(GA_ACCOUNT, {https: true});
  // visitor.pageview(req.originalUrl).send();

  next();
});

app.use(express.static(REPORTS_DIR));

app.get('/ci', (req, res, next) => {
  const apiKey = req.query.key;
  // Require API for get requests.
  if (!apiKey) {
    res.status(403).send('Missing API key. Please include the key parameter');
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
