'use strict';

const path = require('path');

class IgnoreEngine {
  constructor({ ignore = [], ignorePatterns = [], ignoreFiles = [], root = process.cwd() } = {}) {
    this.root = path.resolve(root);
    this.exactIgnores = [];
    this.regexIgnores = [];
    this.fileExactIgnores = [];
    this.fileRegexIgnores = [];

    for (const entry of ignore || []) {
      this._addEntry(entry, this.exactIgnores, this.regexIgnores);
    }
    for (const entry of ignoreFiles || []) {
      this._addEntry(entry, this.fileExactIgnores, this.fileRegexIgnores);
    }
    for (const pattern of ignorePatterns || []) {
      try {
        this.regexIgnores.push(new RegExp(pattern));
      } catch (e) {
        throw new Error(`无效的 ignorePatterns 正则: ${pattern}: ${e.message}`);
      }
    }
  }

  _addEntry(entry, exactArr, regexArr) {
    if (typeof entry !== 'string' || !entry.trim()) return;
    const trimmed = entry.trim();

    if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
      const normalized = path.resolve(this.root, trimmed.replace(/^\.\//, ''));
      exactArr.push(normalized);
      return;
    }

    const hasGlob = trimmed.includes('*') || trimmed.includes('?') || trimmed.includes('[');
    if (hasGlob) {
      regexArr.push(this._globToRegExp(trimmed));
      return;
    }

    exactArr.push(trimmed);
    exactArr.push(path.resolve(this.root, trimmed));
  }

  _globToRegExp(glob) {
    let pattern = '';
    let i = 0;
    while (i < glob.length) {
      const ch = glob[i];
      if (ch === '*') {
        if (glob[i+1] === '*') {
          pattern += '.*';
          i += 2;
        } else {
          pattern += '[^/\\\\]*';
          i++;
        }
      } else if (ch === '?') {
        pattern += '[^/\\\\]';
        i++;
      } else if (ch === '[') {
        const end = glob.indexOf(']', i);
        if (end === -1) {
          pattern += '\\[';
          i++;
        } else {
          pattern += glob.slice(i, end + 1);
          i = end + 1;
        }
      } else if ('.+^${}()|\\/'.includes(ch)) {
        pattern += '\\' + ch;
        i++;
      } else {
        pattern += ch;
        i++;
      }
    }
    return new RegExp('^' + pattern + '$');
  }

  isLinkIgnored(rawLink, sourceFile) {
    if (!rawLink) return false;
    if (rawLink.startsWith('mailto:') || rawLink.startsWith('#')) return false;

    const candidates = [rawLink];
    if (sourceFile) {
      candidates.push(path.resolve(path.dirname(sourceFile), rawLink));
    }
    const absRoot = this.root;
    if (rawLink.startsWith('/')) {
      candidates.push(path.join(absRoot, rawLink));
    }

    for (const cand of candidates) {
      for (const exact of this.exactIgnores) {
        if (cand === exact) return true;
        if (cand.startsWith(exact + path.sep)) return true;
      }
      for (const re of this.regexIgnores) {
        if (re.test(cand)) return true;
        if (re.test(rawLink)) return true;
      }
    }

    return false;
  }

  isFileIgnored(filePath) {
    if (!filePath) return false;
    const abs = path.resolve(filePath);
    const rel = path.relative(this.root, abs);

    for (const exact of this.fileExactIgnores) {
      if (abs === exact) return true;
      if (abs.startsWith(exact + path.sep)) return true;
    }
    for (const re of this.fileRegexIgnores) {
      if (re.test(abs)) return true;
      if (rel && re.test(rel)) return true;
    }

    return false;
  }

  shouldSkip(filePath, rawLink) {
    return this.isFileIgnored(filePath) || this.isLinkIgnored(rawLink, filePath);
  }
}

module.exports = { IgnoreEngine };
