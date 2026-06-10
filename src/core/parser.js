'use strict';

const path = require('path');
const { LINK_TYPES } = require('../utils/constants');

function classifyLink(rawLink) {
  if (!rawLink) return LINK_TYPES.UNKNOWN;
  const link = rawLink.trim();
  if (!link) return LINK_TYPES.UNKNOWN;

  if (link.startsWith('mailto:')) return LINK_TYPES.MAILTO;
  if (/^(https?:)?\/\//i.test(link)) return LINK_TYPES.EXTERNAL_URL;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(link)) return LINK_TYPES.EXTERNAL_URL;

  const hashIdx = link.indexOf('#');
  const beforeHash = hashIdx === -1 ? link : link.slice(0, hashIdx);

  if (!beforeHash && hashIdx !== -1) return LINK_TYPES.INTERNAL_ANCHOR;

  const ext = path.extname(beforeHash).toLowerCase();
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico', '.apng', '.avif'];
  if (imageExts.includes(ext)) return LINK_TYPES.IMAGE;

  return LINK_TYPES.INTERNAL_FILE;
}

function extractInlineLinks(content, sourceFile) {
  const results = [];
  const imageRegex = /!\[([^\]]*)\]\(\s*<?([^\s>)]+?)(?:\s+"[^"]*")?\s*\)/g;
  const linkRegex = /(?<!\!)\[([^\]]*)\]\(\s*<?([^\s>)]+?)(?:\s+"[^"]*")?\s*\)/g;
  const autoLinkRegex = /<((?:https?:)?\/\/[^>\s]+|mailto:[^>\s]+)>/gi;
  const refDefRegex = /^\s{0,3}\[([^\]]+)\]:\s*<?([^\s>]+)(?:\s+"[^"]*")?\s*$/gm;

  let lineOffsets = [];
  {
    let idx = 0;
    content.split('\n').forEach(line => {
      lineOffsets.push(idx);
      idx += line.length + 1;
    });
  }
  function posToLine(offset) {
    let lo = 0, hi = lineOffsets.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineOffsets[mid] <= offset) lo = mid; else hi = mid - 1;
    }
    return lo + 1;
  }

  let m;
  imageRegex.lastIndex = 0;
  while ((m = imageRegex.exec(content)) !== null) {
    results.push({
      type: LINK_TYPES.IMAGE,
      raw: m[2],
      alt: m[1],
      line: posToLine(m.index),
      sourceFile
    });
  }

  linkRegex.lastIndex = 0;
  while ((m = linkRegex.exec(content)) !== null) {
    const raw = m[2];
    results.push({
      type: classifyLink(raw),
      raw,
      text: m[1],
      line: posToLine(m.index),
      sourceFile
    });
  }

  autoLinkRegex.lastIndex = 0;
  while ((m = autoLinkRegex.exec(content)) !== null) {
    const raw = m[1];
    results.push({
      type: classifyLink(raw),
      raw,
      text: raw,
      line: posToLine(m.index),
      sourceFile,
      autolink: true
    });
  }

  refDefRegex.lastIndex = 0;
  while ((m = refDefRegex.exec(content)) !== null) {
    const raw = m[2];
    results.push({
      type: classifyLink(raw),
      raw,
      text: `[${m[1]}]: reference`,
      line: posToLine(m.index),
      sourceFile,
      reference: true
    });
  }

  return results;
}

function extractHeadings(content) {
  const headings = [];
  const setextRegex = /^(.+)\n([=-]+)\s*$/gm;
  let m;
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const md = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (md) {
      headings.push({ text: md[1], level: line.match(/^#{1,6}/)[0].length, line: idx + 1 });
    }
  });

  setextRegex.lastIndex = 0;
  while ((m = setextRegex.exec(content)) !== null) {
    const level = m[2].startsWith('=') ? 1 : 2;
    const before = content.slice(0, m.index).split('\n').length;
    headings.push({ text: m[1].trim(), level, line: before });
  }

  return headings;
}

function slugify(text) {
  return text
    .toString()
    .trim()
    .normalize('NFC')
    .toLowerCase()
    .replace(/[!\"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractAnchorTargets(content) {
  const headings = extractHeadings(content);
  const slugCounts = {};
  const targets = new Set();
  const explicitAnchors = [];

  const htmlIdRegex = /<(?:a|h[1-6]|div|section|article)[^>]*\sid="([^"]+)"/gi;
  let ma;
  while ((ma = htmlIdRegex.exec(content)) !== null) {
    explicitAnchors.push(ma[1]);
  }
  const htmlNameRegex = /<a[^>]*\sname="([^"]+)"/gi;
  while ((ma = htmlNameRegex.exec(content)) !== null) {
    explicitAnchors.push(ma[1]);
  }

  for (const h of headings) {
    let slug = slugify(h.text);
    if (slugCounts[slug] === undefined) slugCounts[slug] = 0;
    const count = slugCounts[slug];
    slugCounts[slug]++;
    const final = count === 0 ? slug : `${slug}-${count}`;
    targets.add(final);
  }
  for (const a of explicitAnchors) targets.add(a);

  return targets;
}

function parseMarkdownFile(content, sourceFile) {
  const links = extractInlineLinks(content, sourceFile);
  const anchors = extractAnchorTargets(content);
  return { links, anchors, headings: extractHeadings(content) };
}

function splitLinkTarget(raw) {
  if (!raw) return { pathPart: '', anchor: '' };
  const hashIdx = raw.indexOf('#');
  if (hashIdx === -1) return { pathPart: raw, anchor: '' };
  return {
    pathPart: raw.slice(0, hashIdx),
    anchor: decodeURIComponent(raw.slice(hashIdx + 1))
  };
}

module.exports = {
  classifyLink,
  parseMarkdownFile,
  extractInlineLinks,
  extractHeadings,
  extractAnchorTargets,
  slugify,
  splitLinkTarget
};
