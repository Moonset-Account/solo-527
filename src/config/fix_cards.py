with open('cards.json', 'r', encoding='utf-8') as f:
    content = f.read()

in_string = False
escape_next = False
result = []
i = 0
while i < len(content):
    c = content[i]
    if escape_next:
        result.append(c)
        escape_next = False
        i += 1
        continue
    if c == '\\':
        result.append(c)
        escape_next = True
        i += 1
        continue
    if c == '"':
        if not in_string:
            in_string = True
            result.append(c)
        else:
            peek_ahead = content[i+1:i+5] if i+1 < len(content) else ''
            if peek_ahead.startswith(',') or peek_ahead.startswith('}') or peek_ahead.startswith(']') or peek_ahead.startswith(':') or peek_ahead == '' or peek_ahead.startswith('\n') or peek_ahead.startswith('\r') or peek_ahead.startswith(' '):
                in_string = False
                result.append(c)
            elif peek_ahead.startswith(']') or peek_ahead.startswith('}'):
                in_string = False
                result.append(c)
            else:
                result.append('\u201c')
                inner_start = i + 1
                inner_end = content.find('"', inner_start)
                if inner_end != -1:
                    inner_text = content[inner_start:inner_end]
                    result.append(inner_text)
                    result.append('\u201d')
                    i = inner_end + 1
                    continue
                else:
                    result.append(c)
        i += 1
        continue
    result.append(c)
    i += 1

fixed = ''.join(result)

with open('cards.json', 'w', encoding='utf-8') as f:
    f.write(fixed)

import json
try:
    with open('cards.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f'Valid JSON: {len(data)} entries')
except json.JSONDecodeError as e:
    print(f'Still invalid: {e}')
    with open('cards.json', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    if e.lineno <= len(lines):
        print(f'Line {e.lineno}: {lines[e.lineno-1].rstrip()[:150]}')
