'use strict';

const fs = require('fs');
const path = require('path');

function* walkDirectory(dir, { recursive = true, fileExtensions = ['.md', '.markdown'] } = {}) {
  const stack = [path.resolve(dir)];
  const extSet = new Set(fileExtensions.map(e => e.toLowerCase()));

  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (e) {
      continue;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      if (entry.name === 'node_modules') continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (recursive) stack.push(full);
      } else if (entry.isFile()) {
        if (extSet.has(path.extname(entry.name).toLowerCase())) {
          yield full;
        }
      }
    }
  }
}

function collectMarkdownFiles(root, opts = {}, ignoreEngine = null) {
  const files = [];
  for (const f of walkDirectory(root, opts)) {
    if (ignoreEngine && ignoreEngine.isFileIgnored(f)) continue;
    files.push(f);
  }
  return files.sort();
}

module.exports = {
  walkDirectory,
  collectMarkdownFiles
};
