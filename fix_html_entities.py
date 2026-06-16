#!/usr/bin/env python3
import os
import re

project_root = "/Volumes/TraeProjects/trae-solo-generated-projects/work-0171"

# 要处理的文件扩展名
target_extensions = {
    '.js', '.jsx', '.ts', '.tsx',
    '.cs', '.csproj',
    '.html', '.css',
    '.json',
}

# 排除 node_modules 和其他不需要的目录
exclude_dirs = {'node_modules', '.git', 'bin', 'obj', 'dist', 'packages', 'wwwroot'}

def unescape_html_entities(content):
    """将 HTML 实体转义还原为真实字符"""
    # 注意替换顺序：先替换 &amp; 可能会影响其他实体，
    # 但这里我们是从实体还原到原始字符，所以顺序是：
    # 先替换 &lt; &gt; 等，最后替换 &amp;
    # 不对，应该反过来想：原始内容被转义了，比如 < 变成 &lt;
    # 要还原的话，直接替换即可，顺序不影响
    replacements = [
        ('&lt;', '<'),
        ('&gt;', '>'),
        ('&quot;', '"'),
        ('&apos;', "'"),
        ('&amp;', '&'),  # 最后替换 &amp;，避免破坏其他实体
    ]
    for entity, char in replacements:
        content = content.replace(entity, char)
    return content

def should_process_file(filepath):
    """判断是否应该处理该文件"""
    filename = os.path.basename(filepath)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in target_extensions:
        return False
    
    # 排除特定目录
    parts = filepath.split(os.sep)
    for excl in exclude_dirs:
        if excl in parts:
            return False
    return True

def find_files(root):
    """递归查找所有需要处理的文件"""
    files = []
    for dirpath, dirnames, filenames in os.walk(root):
        # 原地修改 dirnames 来排除目录
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            if should_process_file(filepath):
                files.append(filepath)
    return files

def main():
    files = find_files(project_root)
    modified_count = 0
    
    for filepath in sorted(files):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                original = f.read()
            
            modified = unescape_html_entities(original)
            
            if original != modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(modified)
                print(f"修复: {filepath}")
                modified_count += 1
        except Exception as e:
            print(f"错误: {filepath} - {e}")
    
    print(f"\n完成！共处理 {len(files)} 个文件，修改了 {modified_count} 个文件。")

if __name__ == '__main__':
    main()
