'use strict';

const parser = require('./parser');
const merger = require('./merger');
const sensitive = require('./sensitive');
const validator = require('./validator');
const formatter = require('./formatter');

class ConfigMerger {
  constructor(options = {}) {
    this.options = {
      mergeStrategy: merger.DEFAULT_MERGE_STRATEGY,
      arrayStrategy: merger.DEFAULT_ARRAY_STRATEGY,
      detectConflicts: true,
      maskSensitive: true,
      sensitiveKeys: [],
      maskType: 'default',
      ...options
    };
  }

  parseFiles(filePaths) {
    const results = [];
    for (const filePath of filePaths) {
      results.push(parser.parseFile(filePath));
    }
    return results;
  }

  merge(fileConfigs, options = {}) {
    const configs = fileConfigs.map(fc => fc.data);
    const mergeOptions = {
      mergeStrategy: options.mergeStrategy || this.options.mergeStrategy,
      arrayStrategy: options.arrayStrategy || this.options.arrayStrategy,
      detectConflicts: options.detectConflicts !== undefined ? options.detectConflicts : this.options.detectConflicts,
      sensitiveKeys: [],
      configMeta: fileConfigs
    };

    return merger.mergeConfigs(configs, mergeOptions);
  }

  processSensitive(data, options = {}) {
    const {
      maskSensitive = this.options.maskSensitive,
      explicitKeys = this.options.sensitiveKeys,
      maskType = this.options.maskType,
      autoDetect = true
    } = options;

    if (!maskSensitive) {
      return { data, maskedKeys: [] };
    }

    return sensitive.maskSensitiveData(data, {
      maskType,
      explicitKeys,
      autoDetect,
      inPlace: false
    });
  }

  validate(data, schema, options = {}) {
    return validator.validateWithSchema(data, schema, options);
  }

  findSensitive(data, options = {}) {
    return sensitive.findSensitiveKeys(data, '', options);
  }

  inferSchema(data, options = {}) {
    return validator.inferSchema(data, options);
  }

  serialize(data, format = 'json', pretty = true) {
    return parser.serialize(data, format, pretty);
  }

  run(inputFiles, options = {}) {
    const {
      outputFile = null,
      outputFormat = null,
      schemaFile = null,
      schema = null,
      pretty = true,
      dryRun = false,
      preview = false,
      ...mergeOptions
    } = options;

    const fileConfigs = this.parseFiles(inputFiles);

    const mergeResult = this.merge(fileConfigs, mergeOptions);

    const sensitiveResult = this.processSensitive(mergeResult.data, options);

    const finalData = sensitiveResult.data;
    const maskedKeys = sensitiveResult.maskedKeys;
    mergeResult.skippedCount = maskedKeys.length;

    let schemaResult = null;
    if (schemaFile || schema) {
      let schemaData = schema;
      if (schemaFile && !schemaData) {
        const parsedSchema = parser.parseFile(schemaFile);
        schemaData = parsedSchema.data;
      }
      if (schemaData) {
        schemaResult = this.validate(finalData, schemaData, options);
      }
    }

    const actualOutputFormat = outputFormat || this._detectOutputFormat(outputFile, fileConfigs[0]);

    const summary = formatter.buildSummary(mergeResult, {
      schemaResult,
      outputFile: dryRun ? null : outputFile,
      inputFiles: fileConfigs.map(f => f.path),
      maskedKeys
    });

    let output = null;
    if (!dryRun) {
      output = this.serialize(finalData, actualOutputFormat, pretty);
    }

    return {
      data: finalData,
      rawData: mergeResult.data,
      output,
      outputFormat: actualOutputFormat,
      summary,
      mergeResult,
      schemaResult,
      maskedKeys,
      fileConfigs,
      dryRun
    };
  }

  _detectOutputFormat(outputFile, firstFile) {
    if (outputFile) {
      try {
        return parser.detectFormat(outputFile);
      } catch (e) {
        // fall through
      }
    }
    if (firstFile) {
      return firstFile.format || 'json';
    }
    return 'json';
  }
}

module.exports = {
  ConfigMerger,
  parser,
  merger,
  sensitive,
  validator,
  formatter,
  ARRAY_STRATEGIES: merger.ARRAY_STRATEGIES,
  MERGE_STRATEGIES: merger.MERGE_STRATEGIES
};
