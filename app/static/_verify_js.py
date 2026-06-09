#!/usr/bin/env python3
from html.parser import HTMLParser
import sys
import os
import tempfile
import subprocess

class JSExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.in_script = False
        self.current = []

    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.in_script = True
            self.current = []

    def handle_endtag(self, tag):
        if tag == 'script' and self.in_script:
            self.in_script = False
            js = ''.join(self.current)
            if js.strip():
                self.scripts.append(js)

    def handle_data(self, data):
        if self.in_script:
            self.current.append(data)

def check_brackets(js):
    brackets = {'(': ')', '{': '}', '[': ']'}
    stack = []
    in_string = None
    escape = False
    in_comment_single = False
    in_comment_multi = False
    line = 1
    col = 0
    errors = []

    idx = 0
    while idx < len(js):
        ch = js[idx]
        nxt = js[idx + 1] if idx + 1 < len(js) else ''

        if ch == '\n':
            line += 1
            col = 0
            in_comment_single = False
        else:
            col += 1

        if in_comment_single:
            idx += 1
            continue

        if in_comment_multi:
            if ch == '*' and nxt == '/':
                in_comment_multi = False
                idx += 2
                col += 1
            else:
                idx += 1
            continue

        if escape:
            escape = False
            idx += 1
            continue

        if ch == '\\':
            escape = True
            idx += 1
            continue

        if in_string:
            if ch == in_string:
                in_string = None
            idx += 1
            continue

        if ch == '/' and nxt == '/':
            in_comment_single = True
            idx += 2
            col += 1
            continue

        if ch == '/' and nxt == '*':
            in_comment_multi = True
            idx += 2
            col += 1
            continue

        if ch in ('"', "'", '`'):
            in_string = ch
            idx += 1
            continue

        if ch in brackets:
            stack.append((ch, line, col))
        elif ch in brackets.values():
            if not stack:
                errors.append(f'  ❌ 多余的闭合符号 "{ch}" 在第 {line} 行, 第 {col} 列')
            else:
                open_ch, open_line, open_col = stack.pop()
                if brackets[open_ch] != ch:
                    errors.append(f'  ❌ 括号不匹配: "{open_ch}"(第{open_line}行,{open_col}列) 对应 "{ch}"(第{line}行,{col}列)')
        idx += 1

    while stack:
        open_ch, open_line, open_col = stack.pop()
        errors.append(f'  ❌ 未闭合的 "{open_ch}" 在第 {open_line} 行, 第 {open_col} 列')

    return errors

def main():
    html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dashboard.html')
    with open(html_path, 'r') as f:
        content = f.read()

    parser = JSExtractor()
    parser.feed(content)

    print(f'📄 HTML文件: {html_path}')
    print(f'🔍 找到 {len(parser.scripts)} 个 <script> 代码块\n')

    all_ok = True
    for i, js in enumerate(parser.scripts):
        print(f'━━━ Script #{i+1} ({len(js)} 字符) ━━━')

        errors = check_brackets(js)
        if errors:
            for e in errors:
                print(e)
            all_ok = False
        else:
            print('  ✅ 括号匹配检查通过')

        if sys.platform != 'win32':
            try:
                node = shutil.which('node')
            except:
                node = None
        else:
            node = None

        if not node:
            for path in ['/usr/local/bin/node', '/usr/bin/node', '/opt/homebrew/bin/node']:
                if os.path.exists(path):
                    node = path
                    break

        if node:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as tf:
                tf.write('(function() {\n' + js + '\n})();\n')
                tmp_path = tf.name
            try:
                result = subprocess.run(
                    [node, '--check', tmp_path],
                    capture_output=True, text=True, timeout=15
                )
                if result.returncode == 0:
                    print('  ✅ Node.js 语法检查通过')
                else:
                    print(f'  ❌ Node.js 语法错误:')
                    for line in result.stderr.strip().split('\n')[:10]:
                        print(f'     {line}')
                    all_ok = False
            finally:
                os.unlink(tmp_path)
        else:
            print('  ⚠️  未找到 node, 跳过 JS 语法检查')

        print()

    if all_ok:
        print('🎉 所有验证通过!')
        return 0
    else:
        print('💥 发现错误!')
        return 1

if __name__ == '__main__':
    import shutil
    sys.exit(main())
