const { v4: uuidv4 } = require('uuid');

const now = () => new Date().toISOString();
const uuid = () => uuidv4();

function ok(res, data = {}, message = 'ok') {
  return res.json({ code: 0, message, data });
}

function fail(res, message = 'error', code = 1, status = 400, extra = {}) {
  return res.status(status).json({ code, message, ...extra });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function parseJsonSafe(str, def = null) {
  try { return JSON.parse(str); }
  catch { return def; }
}

function stringifyIfNeeded(obj) {
  if (obj === null || obj === undefined) return null;
  return typeof obj === 'string' ? obj : JSON.stringify(obj);
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

module.exports = { now, uuid, ok, fail, asyncHandler, parseJsonSafe, stringifyIfNeeded, pick };
