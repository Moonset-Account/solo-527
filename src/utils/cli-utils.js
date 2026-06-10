'use strict';

const BOOL_FLAG_MAP = [
  { prop: 'checkAnchors',  pos: 'check-anchors',  neg: 'no-check-anchors'  },
  { prop: 'checkExternal', pos: 'check-external', neg: 'no-check-external' },
  { prop: 'checkImages',   pos: 'check-images',   neg: 'no-check-images'   },
  { prop: 'recursive',     pos: 'recursive',      neg: 'no-recursive'      }
];

function collectUserFlags(argv = process.argv) {
  const tokens = new Set();
  for (const a of argv.slice(2)) {
    if (!a.startsWith('-')) continue;
    const longFlag = a.startsWith('--') ? a.slice(2) : null;
    if (longFlag !== null) {
      const eqIdx = longFlag.indexOf('=');
      const flag = eqIdx === -1 ? longFlag : longFlag.slice(0, eqIdx);
      tokens.add(flag);
    }
  }
  return tokens;
}

function stripDefaultBools(opts, argv = process.argv) {
  const userFlags = collectUserFlags(argv);
  const result = { ...opts };

  for (const { prop, pos, neg } of BOOL_FLAG_MAP) {
    const userExplicitlySet = userFlags.has(pos) || userFlags.has(neg);
    if (!userExplicitlySet && typeof result[prop] === 'boolean') {
      result[prop] = undefined;
    }
  }

  return result;
}

function userExplicitlyPassed(flag, argv = process.argv) {
  return collectUserFlags(argv).has(flag);
}

module.exports = {
  BOOL_FLAG_MAP,
  collectUserFlags,
  stripDefaultBools,
  userExplicitlyPassed
};
