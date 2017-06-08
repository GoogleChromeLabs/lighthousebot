(function() {
'use strict';

const input = document.querySelector('#url');
const logger = document.querySelector('#logger');
const scoreEl = document.querySelector('#lighthouse-score');
const reportLink = document.querySelector('#reportLink');
const background = document.querySelector('#background');
const logo = document.querySelector('.logo-section');
const searchArrow = document.querySelector('.search-arrow');
const startOver = document.querySelector('#startover');

// const params = new URLSearchParams(location.search);
// let setTimeoutId_;
const ENDPOINT_ORIGIN = location.hostname === 'localhost' ?
    'http://localhost:8080' : 'https://builder-dot-lighthouse-ci.appspot.com';

// /**
//  * @param {number} score
//  * @return {string}
//  */
// function calculateRating(score) {
//   let rating = 'poor';
//   if (score > 45) {
//     rating = 'average';
//   }
//   if (score > 75) {
//     rating = 'good';
//   }
//   return rating;
// }

// /**
//  * @param {(number|string)} score
//  */
// function setScore(score) {
//   score = Number(score);

//   const rating = calculateRating(score);

//   scoreEl.textContent = score;
//   scoreEl.classList.add(rating);
//   document.body.classList.add(rating, 'done');
//   document.body.classList.remove('running');
// }

function startNewRun() {
  resetUI(false);
  document.body.classList.add('running');
}

/**
 * @param {string} url
 */
function finalizeRun(url) {
  // const match = logger.value.match(/.*LIGHTHOUSE SCORE:\s+(.*)/);
  // if (match) {
    // let score = Number(match[1]);
    // score = score.toLocaleString(undefined, {maximumFractionDigits: 1});

    // setScore(score);
    startOver.tabIndex = 0;
    reportLink.tabIndex = 0;
    reportLink.href = url;
    // reportLink.setAttribute('href', url);
    reportLink.focus();

    ga('send', 'event', 'Lighthouse', 'finish run');
  // } else {
    // const split = logger.value.split('\n');
    // ga('send', 'event', 'Lighthouse', 'error', split[split.length - 2]);
  // }

  document.body.classList.remove('running');
  document.body.classList.add('done');
}

function updateLog(data) {
  logger.value += data.replace(/.*GMT\s/, '') + '\n';
  logger.scrollTop = logger.scrollHeight;
}

function resetUI(clearInput=true) {
  if (clearInput) {
    input.value = null;
  }
  logger.value = '';
  document.body.className = '';
  reportLink.tabIndex = -1;
  reportLink.href = '#';
  startOver.tabIndex = -1;
  scoreEl.textContent = '';
  scoreEl.className = '';
}

/**
 * @param {string} url URL to test in Lighthouse.
 */
function runLighthouse(url = '') {
  // If user inputs domain, make it a full URL.
  // if (!url.match(/^https?:\/\//)) {
  //   url = `http://${url}`;
  //   input.value = url;
  // }

  if (!url.length || !input.validity.valid) {
    alert('URL is not valid');
    return;
  }

  let endpoint = `${ENDPOINT_ORIGIN}/stream?url=${url}`;
  if (document.querySelector('#useheadless').checked) {
    endpoint += '&headless=true';
  }

  const source = new EventSource(endpoint);

  source.addEventListener('message', e => {
    if (e.data.startsWith('done')) {
      source.close();

      let url = e.data.split(' ')[1];
      if (url.includes('localhost')) {
        url = url.replace('https://localhost', ENDPOINT_ORIGIN);
      }
      finalizeRun(url);
      return;
    }

    updateLog(e.data);
  })

  source.addEventListener('open', e => {
    startNewRun();
    ga('send', 'event', 'Lighthouse', 'start run');
  });

  source.addEventListener('error', e => {
    if (e.readyState === EventSource.CLOSED) {
      source.close();
    }
  });
}

function attachEventListeners() {
  input.addEventListener('keydown', e => {
    if (e.keyCode === 13) { // Enter
      runLighthouse(e.target.value);
    }
  });

  document.addEventListener('click', e => input.focus());

  logo.addEventListener('click', e => {
    if (document.body.classList.contains('done')) {
      fetch('/reset');
      resetUI();
      document.querySelector('#useheadless').checked = false;
    }
  });

  searchArrow.addEventListener('click', e => {
    runLighthouse(input.value);
  });

  startOver.addEventListener('click', e => {
    e.preventDefault();
    resetUI();
    document.querySelector('#useheadless').checked = false;
  });

  reportLink.addEventListener('click', e => {
    ga('send', 'event', 'Lighthouse', 'open report');
  });
}

attachEventListeners();
input.focus();

})();
