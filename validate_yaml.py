import re, sys

files = [
    '/Volumes/TraeProjects/trae-solo-generated-projects/question-240/Assets/Scenes/MainMenu.unity',
    '/Volumes/TraeProjects/trae-solo-generated-projects/question-240/Assets/Scenes/LevelSelect.unity',
    '/Volumes/TraeProjects/trae-solo-generated-projects/question-240/Assets/Scenes/Gameplay.unity'
]

for f in files:
    with open(f, 'r') as fh:
        content = fh.read()
    lines = content.split('\n')
    name = f.split('/')[-1]

    if not content.startswith('%YAML 1.1'):
        print(f'{name}: INVALID - missing %YAML header')
        sys.exit(1)

    if '%TAG !u! tag:unity3d.com,2011:' not in content:
        print(f'{name}: INVALID - missing %TAG directive')
        sys.exit(1)

    doc_separators = [i for i, l in enumerate(lines) if l.startswith('--- !u!')]
    if len(doc_separators) < 4:
        print(f'{name}: INVALID - too few documents ({len(doc_separators)})')
        sys.exit(1)

    fileids = set()
    for line in lines:
        m = re.match(r'^--- !u!\d+ &(\d+)$', line)
        if m:
            fid = int(m.group(1))
            if fid in fileids:
                print(f'{name}: INVALID - duplicate fileID {fid}')
                sys.exit(1)
            fileids.add(fid)

    refs = re.findall(r'\{fileID: (\d+)\}', content)
    for ref in refs:
        rif = int(ref)
        if rif != 0 and rif not in fileids:
            print(f'{name}: INVALID - broken ref to fileID {rif}')
            sys.exit(1)

    gos = len(re.findall(r'^--- !u!1 &', content, re.MULTILINE))
    transforms = len(re.findall(r'^--- !u!4 &', content, re.MULTILINE))
    mono_behaviours = len(re.findall(r'^--- !u!114 &', content, re.MULTILINE))

    print(f'{name}: VALID - {len(doc_separators)} docs, {gos} GameObjects, {transforms} Transforms, {mono_behaviours} MonoBehaviours, fileIDs: {sorted(fileids)}')

print('All files pass structural validation!')
