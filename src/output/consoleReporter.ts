import type { AuditReport, SizeViolation, DuplicateGroup, MissingAlt, UnreferencedCandidate, SymlinkWarning, ImageMeta } from '../types';
import { relative } from 'node:path';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function formatFile(filePath: string, maxLen: number = 80): string {
  if (filePath.length <= maxLen) return filePath;
  const parts = filePath.split('/');
  if (parts.length <= 3) return filePath.slice(0, maxLen - 3) + '...';
  const head = parts[0];
  const tail = parts.slice(-2).join('/');
  const mid = '...';
  return `${head}/${mid}/${tail}`;
}

export function formatDimensions(img: ImageMeta): string {
  if (img.width === 0 && img.height === 0) return '未知';
  return `${img.width}×${img.height}`;
}

interface Colorizer {
  red: (s: string) => string;
  green: (s: string) => string;
  yellow: (s: string) => string;
  blue: (s: string) => string;
  cyan: (s: string) => string;
  gray: (s: string) => string;
  bold: (s: string) => string;
  dim: (s: string) => string;
}

function createColorizer(useColor: boolean): Colorizer {
  const wrap = (code: string) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
  return {
    red: wrap('31'),
    green: wrap('32'),
    yellow: wrap('33'),
    blue: wrap('34'),
    cyan: wrap('36'),
    gray: wrap('90'),
    bold: wrap('1'),
    dim: wrap('2'),
  };
}

export function renderConsoleReport(report: AuditReport, baseDir?: string, useColor: boolean = true): string {
  const c = createColorizer(useColor);
  const lines: string[] = [];
  const base = baseDir ?? process.cwd();

  const rel = (p: string): string => {
    const r = relative(base, p);
    return r.startsWith('.') ? r : (r.length > 0 ? r : p);
  };

  lines.push('');
  lines.push(c.bold('══════════════════════════════════════════════════════════════'));
  lines.push(c.bold('                   🖼️  图片素材校验报告'));
  lines.push(c.bold('══════════════════════════════════════════════════════════════'));
  lines.push('');
  lines.push(`扫描时间:     ${c.cyan(report.summary.scannedAt)}`);
  lines.push(`图片总数:     ${c.bold(report.summary.totalImages.toString())}`);
  lines.push(`引用总数:     ${c.bold(report.summary.totalReferences.toString())}`);
  lines.push('');

  const sectionTitle = (emoji: string, title: string, count: number, color: keyof Colorizer = 'yellow') => {
    lines.push('');
    const hasItems = count > 0;
    const countStr = hasItems ? c[color](`(${count})`) : c.green(`(${count})`);
    lines.push(c.bold(`${emoji} ${title} ${countStr}`));
    lines.push(c.dim('─'.repeat(60)));
  };

  sectionTitle('📏', '尺寸不合规', report.sizeViolations.length, 'red');
  if (report.sizeViolations.length === 0) {
    lines.push(c.green('   ✓ 所有图片尺寸合规'));
  } else {
    for (let i = 0; i < report.sizeViolations.length; i++) {
      const v = report.sizeViolations[i];
      lines.push(`   ${c.red(`${i + 1}.`) + c.gray(' [' + v.image.format.toUpperCase() + '] ')}${rel(v.image.path)}`);
      lines.push(`      ${c.dim('尺寸: ')}${formatDimensions(v.image)}  ${c.dim('大小: ')}${formatBytes(v.image.fileSize)}`);
      for (const issue of v.issues) {
        lines.push(`      ${c.red('✗')} ${issue}`);
      }
    }
  }

  sectionTitle('🔁', '重复文件', report.duplicates.length, 'yellow');
  if (report.duplicates.length === 0) {
    lines.push(c.green('   ✓ 未发现重复文件'));
  } else {
    let totalWaste = 0;
    for (let i = 0; i < report.duplicates.length; i++) {
      const g = report.duplicates[i];
      lines.push(`   ${c.yellow(`${i + 1}.`)} MD5=${c.gray(g.md5.slice(0, 12) + '...')}  (${g.images.length} 份, 每份 ${formatBytes(g.images[0].fileSize)})`);
      for (let j = 0; j < g.images.length; j++) {
        const img = g.images[j];
        const marker = j === 0 ? c.green('保留') : c.red('可删');
        lines.push(`      [${marker}] ${rel(img.path)}`);
        if (j > 0) totalWaste += img.fileSize;
      }
    }
    if (totalWaste > 0) {
      lines.push('');
      lines.push(`   ${c.yellow('可释放空间:')} ${c.bold(formatBytes(totalWaste))}`);
    }
  }

  sectionTitle('🏷️', '缺失 alt 文案', report.missingAlts.length, 'yellow');
  if (report.missingAlts.length === 0) {
    lines.push(c.green('   ✓ 所有引用均有 alt 文案'));
  } else {
    const byImage = new Map<string, MissingAlt[]>();
    for (const m of report.missingAlts) {
      if (!byImage.has(m.image.path)) byImage.set(m.image.path, []);
      byImage.get(m.image.path)!.push(m);
    }
    let idx = 0;
    for (const [imgPath, items] of byImage) {
      idx++;
      lines.push(`   ${c.yellow(`${idx}.`) + c.gray(' [' + items[0].image.format.toUpperCase() + '] ')}${rel(imgPath)}`);
      for (const item of items) {
        const loc = item.reference.line ? `${item.reference.sourceFile}:${item.reference.line}` : item.reference.sourceFile;
        lines.push(`      ${c.gray('缺少 alt @')} ${rel(loc)}`);
      }
    }
  }

  sectionTitle('❓', '未引用素材（候选区）', report.unreferencedCandidates.length, 'red');
  if (report.unreferencedCandidates.length === 0) {
    lines.push(c.green('   ✓ 所有图片均被引用'));
  } else {
    lines.push(c.dim('   ⚠️  以下素材进入候选区，不代表一定可以删除，请人工确认'));
    const lowMatch = report.unreferencedCandidates.filter((c) => c.matchScore < 0.5);
    const highMatch = report.unreferencedCandidates.filter((c) => c.matchScore >= 0.5);

    if (lowMatch.length > 0) {
      lines.push('');
      lines.push(c.red(`   ── 低相似度候选 (${lowMatch.length})：可能真的可以删除 ──`));
      for (let i = 0; i < lowMatch.length; i++) {
        const u = lowMatch[i];
        const date = u.lastModified > 0 ? new Date(u.lastModified).toLocaleDateString() : '未知';
        lines.push(`      ${c.red(`${i + 1}.`)} ${rel(u.image.path)} ${c.gray('(' + formatDimensions(u.image) + ', ' + formatBytes(u.image.fileSize) + ', 修改于 ' + date + ')')}`);
      }
    }
    if (highMatch.length > 0) {
      lines.push('');
      lines.push(c.yellow(`   ── 高相似度候选 (${highMatch.length})：疑似引用路径不匹配，建议核对 ──`));
      for (let i = 0; i < highMatch.length; i++) {
        const u = highMatch[i];
        lines.push(`      ${c.yellow(`${i + 1}.`)} ${rel(u.image.path)} ${c.gray('(相似度: ' + Math.round(u.matchScore * 100) + '%)')}`);
        for (const pm of u.potentialMatches) {
          lines.push(`         ${c.dim('疑似对应:')} ${rel(pm)}`);
        }
      }
    }
  }

  sectionTitle('🔗', '软链接警告', report.symlinkWarnings.length, 'yellow');
  if (report.symlinkWarnings.length === 0) {
    lines.push(c.green('   ✓ 未发现软链接问题'));
  } else {
    for (let i = 0; i < report.symlinkWarnings.length; i++) {
      const w = report.symlinkWarnings[i];
      lines.push(`   ${c.yellow(`${i + 1}.`)} ${rel(w.path)}`);
      lines.push(`      ${c.yellow('⚠︎')} ${w.message}`);
      if (w.cycle.length > 0) {
        lines.push(`         ${c.gray('循环路径:')} ${w.cycle.map((p) => rel(p)).join(' → ')}`);
      }
    }
  }

  if (report.errors.length > 0) {
    sectionTitle('⛔', '处理错误', report.errors.length, 'red');
    for (let i = 0; i < report.errors.length; i++) {
      lines.push(`   ${c.red(`${i + 1}.`)} ${report.errors[i]}`);
    }
  }

  lines.push('');
  lines.push(c.bold('──────────────────────────────────────────────────────────────'));
  const issues =
    report.sizeViolations.length +
    report.duplicates.length +
    report.missingAlts.length +
    report.unreferencedCandidates.length +
    report.symlinkWarnings.length;
  if (issues === 0) {
    lines.push(c.green(c.bold('✅  完美！所有检查项通过')));
  } else {
    lines.push(c.yellow(c.bold(`⚠️  共发现 ${issues} 个需要关注的问题`)));
  }
  lines.push(c.bold('──────────────────────────────────────────────────────────────'));
  lines.push('');

  return lines.join('\n');
}

export function toJSONSerializableReport(report: AuditReport): object {
  return JSON.parse(JSON.stringify(report));
}
