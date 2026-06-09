const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const AlertService = require('../services/alertService');

class DocumentExtractorService {
  constructor() {
    this._loadParsers();
  }

  _loadParsers() {
    try {
      this.pdfParse = require('pdf-parse');
      logger.info('PDF parser loaded (pdf-parse)');
    } catch (e) {
      logger.warn('PDF parser not available, install pdf-parse for PDF support');
      this.pdfParse = null;
    }

    try {
      this.mammoth = require('mammoth');
      logger.info('DOCX parser loaded (mammoth)');
    } catch (e) {
      logger.warn('DOCX parser not available, install mammoth for DOCX support');
      this.mammoth = null;
    }

    try {
      this.xlsx = require('xlsx');
    } catch (e) {
      this.xlsx = null;
    }

    try {
      this.cheerio = require('cheerio');
    } catch (e) {
      this.cheerio = null;
    }
  }

  async extractFromBuffer(buffer, ext, originalFilename, contractId = null) {
    ext = ext.toLowerCase();
    logger.debug(`Extracting text from file: ${originalFilename}, ext=${ext}, size=${buffer.length}bytes`);

    let result = {
      text: '',
      metadata: {
        original_filename: originalFilename,
        extension: ext,
        parser_used: null,
        warnings: [],
        pages: [],
        page_count: 0,
      },
    };

    try {
      switch (ext) {
        case '.txt':
        case '.md':
        case '.markdown':
          result = this._extractTextPlain(buffer, result);
          break;

        case '.pdf':
          result = await this._extractPDF(buffer, result, contractId);
          break;

        case '.docx':
        case '.docm':
          result = await this._extractDOCX(buffer, result, contractId);
          break;

        case '.html':
        case '.htm':
          result = this._extractHTML(buffer, result);
          break;

        case '.json':
          result = this._extractJSON(buffer, result);
          break;

        case '.csv':
          result = this._extractCSV(buffer, result);
          break;

        default:
          result.metadata.warnings.push(`不支持的文件类型 ${ext}，尝试按文本读取`);
          try {
            result = this._extractTextPlain(buffer, result);
          } catch (e) {
            throw new Error(`无法提取文件内容，不支持的格式: ${ext}`);
          }
      }

      if (!result.text || result.text.trim().length < 20) {
        await AlertService.create({
          alert_type: 'data_missing',
          severity: 'error',
          title: '合同文本提取失败或内容过短',
          message: `文件 ${originalFilename} 提取出的内容长度仅 ${result.text?.length || 0} 字符，可能解析失败`,
          service_name: 'document_extractor',
          contract_id: contractId,
          missing_fields: ['content_text'],
          metadata: {
            filename: originalFilename,
            extension: ext,
            extracted_length: result.text?.length || 0,
          },
        }, { force: false });
        result.metadata.warnings.push('提取内容过短，可能解析失败');
      }

      logger.info(`Extracted ${result.text.length} chars from ${originalFilename} using ${result.metadata.parser_used}`);
      return result;

    } catch (error) {
      logger.error(`Document extraction failed for ${originalFilename}:`, error);

      await AlertService.create({
        alert_type: 'service_failure',
        severity: 'error',
        title: '合同文档解析失败',
        message: error.message,
        service_name: `document_extractor_${ext.substring(1)}`,
        error_code: error.code || 'PARSE_ERROR',
        error_stack: error.stack,
        contract_id: contractId,
        metadata: { filename: originalFilename, extension: ext },
      }, { force: true });

      throw new Error(`文档解析失败 (${ext}): ${error.message}`);
    }
  }

  async extractFromFile(filePath, originalFilename, contractId = null) {
    const ext = path.extname(originalFilename || filePath).toLowerCase();
    const buffer = fs.readFileSync(filePath);
    return this.extractFromBuffer(buffer, ext, originalFilename || path.basename(filePath), contractId);
  }

  _extractTextPlain(buffer, result) {
    let text = buffer.toString('utf-8');

    const testBuffer = buffer.slice(0, Math.min(buffer.length, 1024));
    let hasBinary = false;
    for (let i = 0; i < testBuffer.length; i++) {
      if (testBuffer[i] === 0) { hasBinary = true; break; }
    }
    if (hasBinary) {
      result.metadata.warnings.push('文件包含二进制字节，可能不是纯文本');
    }

    if (!this._isValidUTF8(text)) {
      result.metadata.warnings.push('UTF-8解码发现乱码，尝试GBK...');
      try {
        text = this._decodeGBK(buffer);
      } catch (e) {
        result.metadata.warnings.push('GBK解码也失败，使用UTF-8原样');
      }
    }

    text = this._cleanText(text);
    result.text = text;
    result.metadata.parser_used = 'plain_text';
    result.metadata.page_count = 1;
    result.metadata.pages = [{ page: 1, text, char_count: text.length }];
    return result;
  }

  async _extractPDF(buffer, result, contractId) {
    if (!this.pdfParse) {
      result.metadata.warnings.push('pdf-parse 未安装，PDF无法解析');
      throw new Error('PDF 解析依赖未安装，请联系管理员');
    }

    try {
      const pdfResult = await this.pdfParse(buffer, {
        max: 0,
        pagerender: null,
      });

      let fullText = pdfResult.text || '';
      fullText = this._cleanText(fullText);
      result.text = fullText;
      result.metadata.parser_used = 'pdf-parse';
      result.metadata.page_count = pdfResult.numpages || 0;
      result.metadata.pdf_info = {
        numpages: pdfResult.numpages,
        numrender: pdfResult.numrender,
        info: pdfResult.info,
        metadata: pdfResult.metadata,
      };

      if (result.metadata.page_count > 0) {
        const perPage = Math.ceil(fullText.length / Math.max(1, result.metadata.page_count));
        for (let p = 0; p < result.metadata.page_count; p++) {
          result.metadata.pages.push({
            page: p + 1,
            text: fullText.substring(p * perPage, (p + 1) * perPage),
          });
        }
      }

      return result;
    } catch (e) {
      result.metadata.warnings.push(`PDF解析错误: ${e.message}`);
      throw e;
    }
  }

  async _extractDOCX(buffer, result, contractId) {
    if (!this.mammoth) {
      result.metadata.warnings.push('mammoth 未安装，DOCX无法解析');
      throw new Error('DOCX 解析依赖未安装，请联系管理员');
    }

    try {
      const mammothResult = await this.mammoth.extractRawText({ buffer });
      let text = mammothResult.value || '';
      text = this._cleanText(text);
      result.text = text;
      result.metadata.parser_used = 'mammoth';
      result.metadata.page_count = 1;
      result.metadata.pages = [{ page: 1, text, char_count: text.length }];

      if (mammothResult.messages && mammothResult.messages.length > 0) {
        result.metadata.warnings = result.metadata.warnings.concat(
          mammothResult.messages.slice(0, 10).map(m => m.message || m.type)
        );
      }

      try {
        const htmlResult = await this.mammoth.convertToHtml({ buffer });
        const $ = this.cheerio?.load(htmlResult.value || '');
        if ($) {
          const tableTexts = [];
          $('table').each((i, tbl) => {
            tableTexts.push($(tbl).text().trim());
          });
          if (tableTexts.length > 0) {
            result.metadata.tables = tableTexts;
          }
        }
      } catch (e) {}

      return result;
    } catch (e) {
      result.metadata.warnings.push(`DOCX解析错误: ${e.message}`);
      throw e;
    }
  }

  _extractHTML(buffer, result) {
    let text = '';
    try {
      if (this.cheerio) {
        const $ = this.cheerio.load(buffer.toString('utf-8'));
        $('script, style, noscript').remove();
        text = $('body').text() || $.text();
      } else {
        text = buffer.toString('utf-8').replace(/<[^>]+>/g, ' ');
      }
    } catch (e) {
      text = buffer.toString('utf-8');
    }
    text = this._cleanText(text);
    result.text = text;
    result.metadata.parser_used = 'cheerio_html';
    result.metadata.page_count = 1;
    result.metadata.pages = [{ page: 1, text }];
    return result;
  }

  _extractJSON(buffer, result) {
    try {
      const obj = JSON.parse(buffer.toString('utf-8'));
      if (Array.isArray(obj)) {
        result.text = obj.map(o => this._flattenObject(o)).join('\n\n');
      } else if (typeof obj === 'object') {
        result.text = this._flattenObject(obj);
      }
    } catch (e) {
      result.text = buffer.toString('utf-8');
    }
    result.text = this._cleanText(result.text);
    result.metadata.parser_used = 'json_flatten';
    result.metadata.page_count = 1;
    result.metadata.pages = [{ page: 1, text: result.text }];
    return result;
  }

  _extractCSV(buffer, result) {
    try {
      const { parse } = require('csv-parse/sync');
      const records = parse(buffer.toString('utf-8'), {
        skip_empty_lines: true,
        trim: true,
      });
      result.text = records.map(row => row.join(' | ')).join('\n');
    } catch (e) {
      result.text = buffer.toString('utf-8');
    }
    result.text = this._cleanText(result.text);
    result.metadata.parser_used = 'csv-parse';
    result.metadata.page_count = 1;
    result.metadata.pages = [{ page: 1, text: result.text }];
    return result;
  }

  _flattenObject(obj, prefix = '') {
    if (obj === null || obj === undefined) return '';
    if (typeof obj !== 'object') return `${prefix}: ${obj}`;

    const parts = [];
    for (const [key, val] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof val === 'object' && val !== null) {
        parts.push(this._flattenObject(val, fullKey));
      } else {
        parts.push(`${fullKey}: ${val}`);
      }
    }
    return parts.join('\n');
  }

  _isValidUTF8(str) {
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code === 0xFFFD) return false;
    }
    return true;
  }

  _decodeGBK(buffer) {
    try {
      const { StringDecoder } = require('string_decoder');
      const decoder = new StringDecoder('utf8');
      return decoder.write(buffer);
    } catch (e) {
      return buffer.toString('utf-8');
    }
  }

  _cleanText(text) {
    if (!text) return '';

    text = text.replace(/\r\n/g, '\n');
    text = text.replace(/\u0000/g, '');
    text = text.replace(/\t+/g, '    ');
    text = text.replace(/[ \u00A0]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/^\s+|\s+$/g, '');
    text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

    const lines = text.split('\n').map(l => l.trim());
    return lines.filter(l => l.length > 0).join('\n');
  }

  parseClauseImport(data, format = 'json') {
    const clauses = [];

    try {
      if (format === 'json') {
        const arr = typeof data === 'string' ? JSON.parse(data) : data;
        if (!Array.isArray(arr)) throw new Error('导入数据必须是数组');

        for (const item of arr) {
          if (!item.content || !item.content.trim()) continue;

          clauses.push({
            clause_number: item.clause_number || item.number || '',
            clause_title: item.clause_title || item.title || '',
            clause_type: this._normalizeClauseType(item.clause_type || item.type),
            content: item.content.trim(),
            historical_notes: item.historical_notes || item.notes || '',
            manual_risk_type: item.risk_type || item.manual_risk_type || null,
            manual_risk_level: item.risk_level || item.manual_risk_level || null,
            manual_review_result: item.review_result || item.manual_review_result || null,
            manual_reviewer: item.reviewer || item.manual_reviewer || null,
            manual_review_notes: item.review_notes || item.manual_review_notes || null,
            page_number: item.page_number || item.page || null,
            is_amended: !!item.is_amended || !!item.amended,
          });
        }
      } else if (format === 'csv') {
        const { parse } = require('csv-parse/sync');
        const records = parse(data, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          bom: true,
        });
        return this.parseClauseImport(records, 'json');
      } else if (format === 'xlsx' || format === 'excel') {
        if (!this.xlsx) throw new Error('XLSX 解析依赖未安装');
        const wb = this.xlsx.read(data, { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const records = this.xlsx.utils.sheet_to_json(sheet, { defval: '' });
        return this.parseClauseImport(records, 'json');
      }
    } catch (e) {
      throw new Error(`导入数据解析失败: ${e.message}`);
    }

    const errors = [];
    clauses.forEach((c, i) => {
      if (!c.content) errors.push(`第${i + 1}条缺少内容`);
      if (c.manual_risk_type && !['payment', 'breach', 'confidentiality', 'auto_renewal'].includes(c.manual_risk_type)) {
        errors.push(`第${i + 1}条 risk_type 非法: ${c.manual_risk_type}`);
      }
    });

    if (errors.length > 0) {
      throw new Error('导入数据校验失败:\n' + errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n... 共${errors.length}个错误` : ''));
    }

    return clauses;
  }

  parseReviewImport(data, format = 'json') {
    const reviews = [];

    try {
      if (format === 'json') {
        const arr = typeof data === 'string' ? JSON.parse(data) : data;
        if (!Array.isArray(arr)) throw new Error('导入数据必须是数组');

        for (const item of arr) {
          if (!item.risk_id && !item.clause_number && !item.clause_title) continue;

          reviews.push({
            risk_id: item.risk_id || null,
            clause_number: item.clause_number || null,
            clause_title: item.clause_title || null,
            action: item.action || item.result || 'modify',
            final_risk_type: item.final_risk_type || item.risk_type || null,
            final_risk_level: item.final_risk_level || item.risk_level || null,
            notes: item.notes || item.review_notes || '',
            reviewer: item.reviewer || null,
            reviewed_at: item.reviewed_at ? new Date(item.reviewed_at) : null,
          });
        }
      } else if (format === 'csv') {
        const { parse } = require('csv-parse/sync');
        const records = parse(data, { columns: true, skip_empty_lines: true, trim: true, bom: true });
        return this.parseReviewImport(records, 'json');
      } else if (format === 'xlsx') {
        if (!this.xlsx) throw new Error('XLSX 解析依赖未安装');
        const wb = this.xlsx.read(data, { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const records = this.xlsx.utils.sheet_to_json(sheet, { defval: '' });
        return this.parseReviewImport(records, 'json');
      }
    } catch (e) {
      throw new Error(`复核结果解析失败: ${e.message}`);
    }

    if (reviews.length === 0) {
      throw new Error('未解析到有效的复核记录');
    }

    return reviews;
  }

  _normalizeClauseType(type) {
    if (!type) return 'other';
    const map = {
      '付款': 'payment', '付款条款': 'payment', 'payment': 'payment',
      '违约': 'breach', '违约条款': 'breach', 'breach': 'breach',
      '保密': 'confidentiality', '保密条款': 'confidentiality', 'confidentiality': 'confidentiality',
      '自动续约': 'auto_renewal', '续约': 'auto_renewal', 'auto_renewal': 'auto_renewal', 'renewal': 'auto_renewal',
      '定义': 'definition', '定义条款': 'definition', 'definition': 'definition',
      '义务': 'obligation', '义务条款': 'obligation', 'obligation': 'obligation',
      '终止': 'termination', '终止条款': 'termination', 'termination': 'termination', '解除': 'termination',
      '责任': 'liability', '责任条款': 'liability', 'liability': 'liability',
      '知识产权': 'ip', 'ip': 'ip', 'IP': 'ip', '专利': 'ip', '著作权': 'ip',
      '争议': 'dispute', '争议解决': 'dispute', 'dispute': 'dispute', '仲裁': 'dispute', '管辖': 'dispute',
      '不可抗力': 'force_majeure', 'force_majeure': 'force_majeure',
    };
    const t = String(type).trim();
    if (map[t]) return map[t];
    for (const [key, val] of Object.entries(map)) {
      if (t.includes(key)) return val;
    }
    return 'other';
  }
}

module.exports = new DocumentExtractorService();
