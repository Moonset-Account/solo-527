'use strict';

const chalk = require('chalk');
const { LOG_LEVELS } = require('./constants');

const LEVEL_COLORS = {
  debug: chalk.gray,
  info: chalk.blue,
  warn: chalk.yellow,
  error: chalk.red,
  silent: null
};

const LEVEL_ICONS = {
  debug: '·',
  info: 'ℹ',
  warn: '⚠',
  error: '✖',
  silent: ''
};

function timestamp() {
  const d = new Date();
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function createStructuredLogger({ level = 'info', json = false, quiet = false, verbose = false } = {}) {
  let currentLevel = level;
  if (verbose) currentLevel = 'debug';
  if (quiet) currentLevel = 'error';

  const state = {
    level: currentLevel,
    json,
    quiet,
    fields: {}
  };

  function shouldLog(lvl) {
    return LOG_LEVELS[lvl] >= LOG_LEVELS[state.level];
  }

  function withFields(fields) {
    const next = createStructuredLogger({
      level: state.level,
      json: state.json,
      quiet: state.quiet
    });
    next._state.fields = { ...state.fields, ...fields };
    return next;
  }

  function output(lvl, message, extraFields = null, writeTo = 'stderr') {
    if (!shouldLog(lvl)) return;
    if (lvl === 'silent') return;

    const fields = { ...state.fields };
    if (extraFields && typeof extraFields === 'object') {
      Object.assign(fields, extraFields);
    }

    if (state.json) {
      const payload = {
        time: timestamp(),
        level: lvl,
        msg: message,
        ...fields
      };
      const line = JSON.stringify(payload);
      process[writeTo].write(line + '\n');
    } else {
      const color = LEVEL_COLORS[lvl] || chalk.white;
      const icon = LEVEL_ICONS[lvl] || '';
      const prefix = color(`${icon} [${lvl.toUpperCase()}]`);
      const ts = chalk.gray(timestamp());
      const extras = Object.keys(fields).length
        ? ' ' + chalk.gray('{' + Object.entries(fields).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join(', ') + '}')
        : '';
      process[writeTo].write(`${ts} ${prefix} ${message}${extras}\n`);
    }
  }

  function debug(message, fields) { output('debug', message, fields); }
  function info(message, fields)  { output('info',  message, fields); }
  function warn(message, fields)  { output('warn',  message, fields, 'stderr'); }
  function error(message, fields) { output('error', message, fields, 'stderr'); }

  function child(fields) { return withFields(fields); }

  function setLevel(lvl) {
    if (LOG_LEVELS[lvl] !== undefined) state.level = lvl;
  }
  function getLevel() { return state.level; }

  return {
    debug, info, warn, error,
    child, withFields,
    setLevel, getLevel,
    _state: state
  };
}

module.exports = {
  createStructuredLogger,
  LOG_LEVELS
};
