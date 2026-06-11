'use strict';

const path = require('path');
const { checkI18nDiff } = require('./src/index');
const { OUTPUT_FORMATS } = require('./lib/constants');
const fs = require('fs');
const os = require('os');

(async () => {
  const basePath = path.join(__dirname, 'examples', 'base.json');
  const localePath = path.join(__dirname, 'examples', 'zh-CN-perfect.json');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
  const outputPath = path.join(tmpDir, 'report.json');

  const result = await checkI18nDiff(basePath, localePath, {});
  console.log('=== Before Write ===');
  console.log('result.exitCode:', result.exitCode);
  console.log('result.summary.totalErrors:', result.summary.totalErrors);
  console.log('result.summary.errorCounts:', result.summary.errorCounts);
  
  const reportBeforeWrite = result.getReport(OUTPUT_FORMATS.JSON);
  const parsedBefore = JSON.parse(reportBeforeWrite);
  console.log('getReport JSON totalErrors:', parsedBefore.summary.totalErrors);
  
  const writeResult = result.writeReport(outputPath, OUTPUT_FORMATS.JSON);
  console.log('\n=== After Write ===');
  console.log('writeResult.success:', writeResult.success);
  console.log('writeResult.path:', writeResult.path);
  console.log('outputPath exists:', fs.existsSync(outputPath));
  
  if (fs.existsSync(outputPath)) {
    const contentRaw = fs.readFileSync(outputPath, 'utf8');
    console.log('\n=== Raw Content (first 500 chars) ===');
    console.log(contentRaw.substring(0, 500));
    
    const content = JSON.parse(contentRaw);
    console.log('\n=== Parsed Content ===');
    console.log('Written file totalErrors:', content.summary.totalErrors);
    console.log('Written file errors count:', content.errors.length);
    console.log('Written file warnings count:', content.warnings.length);
    if (content.errors.length > 0) {
      console.log('First 3 errors:');
      content.errors.slice(0, 3).forEach((e, i) => {
        console.log(`  ${i+1}. type=${e.type}, key=${e.key}, severity=${e.severity}`);
      });
    }
    console.log('Top-level keys in written file:', Object.keys(content));
  }
  
  console.log('\n=== Direct generateReport Test ===');
  const { generateReport } = require('./lib/report-generator');
  const directReport = generateReport(result.results, OUTPUT_FORMATS.JSON, {
    basePath, localePath, baseLocale: 'en', targetLocale: null, missingKeysData: null
  });
  const directParsed = JSON.parse(directReport);
  console.log('Direct generateReport totalErrors:', directParsed.summary.totalErrors);
  console.log('Direct generateReport errors count:', directParsed.errors.length);
})();
