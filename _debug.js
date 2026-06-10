const { buildConfig } = require('/Volumes/TraeProjects/trae-solo-generated-projects/question-404/src/core/config');
const cliOptions = {
  configFile: '/Volumes/TraeProjects/trae-solo-generated-projects/question-404/examples/.mdlinkcheckerrc.json',
  root: '/Volumes/TraeProjects/trae-solo-generated-projects/question-404/fixtures',
  format: 'json',
  logLevel: 'silent',
  timeout: 1,
};
const cfg = buildConfig({ cliOptions });
console.log('checkExternal:', cfg.checkExternal, '(预期: false)');
console.log('checkAnchors:', cfg.checkAnchors);
console.log('checkImages:', cfg.checkImages);
console.log('timeout:', cfg.timeout);
console.log('_configSources:', cfg._configSources);
