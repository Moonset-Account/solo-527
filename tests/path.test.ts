import { PathUtils } from '../src/utils/path';
import * as os from 'os';
import * as path from 'path';

describe('PathUtils', () => {
  test('normalize 处理各种路径分隔符', () => {
    expect(PathUtils.normalize('a/b\\\\c')).toBe(path.normalize('a/b/c'));
    expect(PathUtils.normalize('a\\b/c')).toBe(path.normalize('a/b/c'));
  });

  test('toPosix 转换为POSIX格式', () => {
    expect(PathUtils.toPosix('a\\b\\c')).toBe('a/b/c');
    expect(PathUtils.toPosix('/usr/local/bin')).toBe('/usr/local/bin');
  });

  test('resolve 拼接绝对路径', () => {
    const result = PathUtils.resolve('/home', 'user', 'docs');
    expect(path.isAbsolute(result)).toBe(true);
    expect(result.endsWith(path.join('home', 'user', 'docs'))).toBe(true);
  });

  test('expandHome 波浪号展开', () => {
    const home = os.homedir();
    expect(PathUtils.expandHome('~')).toBe(home);
    expect(PathUtils.expandHome('~/docs')).toBe(path.join(home, 'docs'));
  });

  test('expandEnv 环境变量展开', () => {
    process.env.PATH_TEST_VAR = '/test/path';
    expect(PathUtils.expandEnv('$PATH_TEST_VAR/file.txt')).toBe('/test/path/file.txt');
    expect(PathUtils.expandEnv('%PATH_TEST_VAR%/file.txt')).toBe('/test/path/file.txt');
    delete process.env.PATH_TEST_VAR;
  });

  test('expandPath 完整展开', () => {
    process.env.EXPAND_TEST = 'test_dir';
    const result = PathUtils.expandPath('~/$EXPAND_TEST');
    expect(result).toContain(os.homedir());
    expect(result).toContain('test_dir');
    delete process.env.EXPAND_TEST;
  });

  test('makeAbsolute 转为绝对路径', () => {
    const abs = PathUtils.makeAbsolute('relative/path');
    expect(path.isAbsolute(abs)).toBe(true);

    const alreadyAbs = PathUtils.makeAbsolute('/absolute/path');
    expect(alreadyAbs).toBe(path.normalize('/absolute/path'));
  });

  test('safeFilename 清理特殊字符', () => {
    expect(PathUtils.safeFilename('my file name!@#.txt')).toBe('my_file_name___.txt');
    expect(PathUtils.safeFilename('normal-file.txt')).toBe('normal-file.txt');
  });

  test('ensureDir 确保目录存在', () => {
    const tempDir = PathUtils.tempFile('api_smoke_test');
    const nested = PathUtils.join(tempDir, 'a', 'b', 'c');
    const result = PathUtils.ensureDir(nested);
    expect(PathUtils.exists(result)).toBe(true);
  });

  test('extname 获取扩展名', () => {
    expect(PathUtils.extname('file.json')).toBe('.json');
    expect(PathUtils.extname('file.test.yaml')).toBe('.yaml');
    expect(PathUtils.extname('noext')).toBe('');
  });

  test('dirname/basename', () => {
    const p = '/home/user/docs/file.txt';
    expect(PathUtils.dirname(p)).toBe('/home/user/docs');
    expect(PathUtils.basename(p)).toBe('file.txt');
    expect(PathUtils.basename(p, '.txt')).toBe('file');
  });
});
