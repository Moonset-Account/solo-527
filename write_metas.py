#!/usr/bin/env python3
"""Re-write the .meta files for ScriptableObject source scripts (fixed GUIDs)."""
import os

BASE = "/Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/Scripts"

META_TEMPLATE = """fileFormatVersion: 2
guid: {guid}
MonoImporter:
  externalObjects: {{}}
  serializedVersion: 2
  defaultReferences: []
  executionOrder: 0
  icon: {{instanceID: 0}}
  userData:
  assetBundleName:
  assetBundleVariant:
"""

FILES = [
    ("Match3/LevelData.cs",                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
    ("Decoration/MaterialData.cs",          "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"),
    ("Decoration/CustomerProfile.cs",       "cccccccccccccccccccccccccccccccc"),
    ("Decoration/FurnitureItem.cs",         "dddddddddddddddddddddddddddddddd"),
    ("Decoration/DecorationOrder.cs",       "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"),
    ("Progression/AchievementData.cs",      "1111111111111111111111111111111a"),
    ("Progression/DailyChallengeManager.cs","2222222222222222222222222222222b"),
]

for rel, guid in FILES:
    path = os.path.join(BASE, rel + ".meta")
    with open(path, "w", encoding="utf-8") as f:
        f.write(META_TEMPLATE.format(guid=guid))
    print(f"[OK] {rel}.meta  guid={guid}")
print(f"\nDone. {len(FILES)} meta files written.")
