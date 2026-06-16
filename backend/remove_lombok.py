#!/usr/bin/env python3
import os
import re
import sys

def remove_lombok_annotations(content):
    content = re.sub(r'import lombok\.Data;\s*\n', '', content)
    content = re.sub(r'@Data\s*\n', '', content)
    return content

def extract_fields(content):
    class_match = re.search(r'class\s+\w+.*?\{', content, re.DOTALL)
    if not class_match:
        return []
    
    class_start = class_match.end()
    
    fields = []
    pattern = r'(?:@[\w\.]+\s*(?:\([^)]*\))?\s*)*\s*(private|protected)\s+([\w<>\[\],\s]+?)\s+(\w+)\s*;'
    
    for match in re.finditer(pattern, content[class_start:]):
        access_modifier = match.group(1)
        field_type = match.group(2).strip()
        field_name = match.group(3).strip()
        
        if ' class ' in field_type or 'interface ' in field_type:
            continue
            
        fields.append({
            'type': field_type,
            'name': field_name
        })
    
    return fields

def generate_getters_setters(fields):
    methods = []
    for field in fields:
        field_name = field['name']
        field_type = field['type']
        cap_name = field_name[0].upper() + field_name[1:]
        
        is_boolean = field_type == 'boolean' or field_type == 'Boolean'
        
        if is_boolean and field_name.startswith('is'):
            getter_name = field_name
        elif is_boolean:
            getter_name = 'is' + cap_name
        else:
            getter_name = 'get' + cap_name
        
        methods.append(f'    public {field_type} {getter_name}() {{')
        methods.append(f'        return {field_name};')
        methods.append(f'    }}')
        methods.append('')
        
        setter_name = 'set' + cap_name
        methods.append(f'    public void {setter_name}({field_type} {field_name}) {{')
        methods.append(f'        this.{field_name} = {field_name};')
        methods.append(f'    }}')
        methods.append('')
    
    return '\n'.join(methods)

def find_class_end(content):
    brace_count = 0
    class_started = False
    
    for i, char in enumerate(content):
        if char == '{':
            brace_count += 1
            class_started = True
        elif char == '}':
            brace_count -= 1
            if class_started and brace_count == 0:
                return i
    
    return -1

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return False
    
    if '@Data' not in content and 'import lombok.Data' not in content:
        print(f"Skipping {file_path} - no lombok @Data found")
        return False
    
    original_content = content
    
    content = remove_lombok_annotations(content)
    
    fields = extract_fields(content)
    if not fields:
        print(f"Warning: No fields found in {file_path}")
        return False
    
    getters_setters = generate_getters_setters(fields)
    
    class_end = find_class_end(content)
    if class_end == -1:
        print(f"Error: Could not find class end in {file_path}")
        return False
    
    before_end = content[:class_end].rstrip()
    after_end = content[class_end:]
    
    new_content = before_end + '\n\n' + getters_setters + after_end
    
    if new_content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Processed: {file_path}")
        return True
    else:
        print(f"No changes: {file_path}")
        return False

def process_directory(directory):
    processed_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.java'):
                file_path = os.path.join(root, file)
                if process_file(file_path):
                    processed_files.append(file_path)
    return processed_files

def main():
    base_dir = '/Volumes/TraeProjects/trae-solo-generated-projects/work-0195/backend/src/main/java/com/badminton/arena'
    
    packages = ['entity', 'common', 'vo', 'dto']
    
    all_processed = []
    for pkg in packages:
        pkg_dir = os.path.join(base_dir, pkg)
        if os.path.exists(pkg_dir):
            processed = process_directory(pkg_dir)
            all_processed.extend(processed)
    
    print(f"\nTotal processed files: {len(all_processed)}")
    for f in all_processed:
        print(f"  - {f}")

if __name__ == '__main__':
    main()
