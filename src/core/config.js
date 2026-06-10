'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { DEFAULT_CONFIG, CONFIG_FILE_NAMES, EXIT_CODES } = require('../utils/constants');

function findConfigFile(startDir, explicitPath = null) {
  if (explicitPath) {
    const resolved = path.resolve(explicitPath);
    if (!fs.existsSync(resolved)) {
      const err = new Error(`指定的配置文件不存在: ${explicitPath}`);
      err.exitCode = EXIT_CODES.CONFIG_ERROR;
      throw err;
    }
    return resolved;
  }

  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (true) {
    for (const name of CONFIG_FILE_NAMES) {
      const candidate = path.join(currentDir, name);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    if (currentDir === root) break;
    currentDir = path.dirname(currentDir);
  }

  return null;
}

function loadConfigFromFile(filePath) {
  if (!filePath) return {};

  const ext = path.extname(filePath).toLowerCase();
  const content = fs.readFileSync(filePath, 'utf-8');

  try {
    let config;
    if (ext === '.js') {
      delete require.cache[require.resolve(filePath)];
      config = require(filePath);
      if (typeof config === 'function') {
        config = config();
      }
    } else if (ext === '.json' || filePath.endsWith('rc') && !content.startsWith('---')) {
      config = JSON.parse(content);
    } else if (ext === '.yaml' || ext === '.yml' || content.startsWith('---')) {
      config = yaml.load(content) || {};
    } else {
      try {
        config = JSON.parse(content);
      } catch {
        config = yaml.load(content) || {};
      }
    }

    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
      throw new Error('配置文件必须导出一个对象');
    }

    return config;
  } catch (err) {
    const wrapErr = new Error(`解析配置文件失败 ${filePath}: ${err.message}`);
    wrapErr.exitCode = EXIT_CODES.CONFIG_ERROR;
    wrapErr.cause = err;
    throw wrapErr;
  }
}

function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = output[key];
    if (sv !== null && typeof sv === 'object' && !Array.isArray(sv)
        && tv !== null && typeof tv === 'object' && !Array.isArray(tv)) {
      output[key] = deepMerge(tv, sv);
    } else if (sv !== undefined) {
      output[key] = sv;
    }
  }
  return output;
}

function removeUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function normalizeConfig(raw) {
  const cfg = { ...raw };

  if (cfg.root) cfg.root = path.resolve(cfg.root);
  if (typeof cfg.timeout === 'string') cfg.timeout = parseInt(cfg.timeout, 10);
  if (typeof cfg.concurrency === 'string') cfg.concurrency = parseInt(cfg.concurrency, 10);
  if (typeof cfg.recursive === 'string') cfg.recursive = cfg.recursive !== 'false' && cfg.recursive !== '0';
  if (typeof cfg.checkAnchors === 'string') cfg.checkAnchors = cfg.checkAnchors !== 'false' && cfg.checkAnchors !== '0';
  if (typeof cfg.checkExternal === 'string') cfg.checkExternal = cfg.checkExternal !== 'false' && cfg.checkExternal !== '0';
  if (typeof cfg.checkImages === 'string') cfg.checkImages = cfg.checkImages !== 'false' && cfg.checkImages !== '0';
  if (typeof cfg.verbose === 'string') cfg.verbose = cfg.verbose !== 'false' && cfg.verbose !== '0';
  if (typeof cfg.quiet === 'string') cfg.quiet = cfg.quiet !== 'false' && cfg.quiet !== '0';
  if (typeof cfg.dryRun === 'string') cfg.dryRun = cfg.dryRun !== 'false' && cfg.dryRun !== '0';
  if (typeof cfg.confirmDangerous === 'string') cfg.confirmDangerous = cfg.confirmDangerous !== 'false' && cfg.confirmDangerous !== '0';

  if (cfg.ignore && typeof cfg.ignore === 'string') {
    cfg.ignore = cfg.ignore.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (cfg.ignorePatterns && typeof cfg.ignorePatterns === 'string') {
    cfg.ignorePatterns = cfg.ignorePatterns.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (cfg.ignoreFiles && typeof cfg.ignoreFiles === 'string') {
    cfg.ignoreFiles = cfg.ignoreFiles.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (cfg.fileExtensions && typeof cfg.fileExtensions === 'string') {
    cfg.fileExtensions = cfg.fileExtensions.split(',').map(s => s.trim()).filter(Boolean);
  }

  return cfg;
}

function validateConfig(cfg, logger) {
  const errors = [];

  if (cfg.timeout !== undefined && (!Number.isFinite(cfg.timeout) || cfg.timeout <= 0)) {
    errors.push(`timeout 必须是正数毫秒，收到: ${cfg.timeout}`);
  }
  if (cfg.concurrency !== undefined && (!Number.isInteger(cfg.concurrency) || cfg.concurrency <= 0)) {
    errors.push(`concurrency 必须是正整数，收到: ${cfg.concurrency}`);
  }
  if (cfg.format !== undefined && !['text', 'json', 'markdown'].includes(cfg.format)) {
    errors.push(`format 只能是 text|json|markdown，收到: ${cfg.format}`);
  }
  if (cfg.logLevel !== undefined && !['debug', 'info', 'warn', 'error', 'silent'].includes(cfg.logLevel)) {
    errors.push(`logLevel 只能是 debug|info|warn|error|silent，收到: ${cfg.logLevel}`);
  }
  if (cfg.root && !fs.existsSync(cfg.root)) {
    errors.push(`root 目录不存在: ${cfg.root}`);
  }
  if (cfg.ignorePatterns) {
    for (const p of cfg.ignorePatterns) {
      try { new RegExp(p); } catch (e) {
        errors.push(`ignorePatterns 中包含无效正则: ${p} (${e.message})`);
      }
    }
  }

  if (errors.length) {
    const msg = '配置校验失败:\n  - ' + errors.join('\n  - ');
    const err = new Error(msg);
    err.exitCode = EXIT_CODES.CONFIG_ERROR;
    throw err;
  }
}

function buildConfig({ cliOptions = {}, logger = null } = {}) {
  const cliNormalized = normalizeConfig(removeUndefined(cliOptions));

  const configFile = cliNormalized.configFile || null;
  const rootForSearch = cliNormalized.root || process.cwd();
  const resolvedConfigFile = findConfigFile(rootForSearch, configFile);
  const fileConfig = loadConfigFromFile(resolvedConfigFile);
  const fileNormalized = normalizeConfig(fileConfig);

  const effective = deepMerge(deepMerge({}, DEFAULT_CONFIG), fileNormalized);
  Object.assign(effective, cliNormalized);

  effective._configFile = resolvedConfigFile;
  effective._configSources = {
    defaults: true,
    file: resolvedConfigFile || null,
    cli: Object.keys(cliNormalized).length > 0
  };

  validateConfig(effective, logger);

  return effective;
}

function describeConfigSources(config) {
  const parts = ['默认配置'];
  if (config._configSources.file) {
    parts.push(`文件配置 (${config._configSources.file})`);
  }
  if (config._configSources.cli) {
    parts.push('命令行参数 (最高优先级)');
  }
  return parts.join(' → ');
}

module.exports = {
  findConfigFile,
  loadConfigFromFile,
  buildConfig,
  deepMerge,
  normalizeConfig,
  validateConfig,
  describeConfigSources
};
