import os

BASE = "/Volumes/TraeProjects/trae-solo-generated-projects/question-237"

CS_META_TEMPLATE = """fileFormatVersion: 2
guid: {guid}
MonoImporter:
  externalObjects: {{}}
  serializedVersion: 2
  defaultReferences: []
  executionOrder: 0
  icon: {{instanceID: 0}}
  userData: 
"""

DIR_META_TEMPLATE = """fileFormatVersion: 2
guid: {guid}
folderAsset: yes
DefaultImporter:
  externalObjects: {{}}
  userData: 
  assetBundleName: 
  assetBundleVariant: 
"""

DEFAULT_META_TEMPLATE = """fileFormatVersion: 2
guid: {guid}
DefaultImporter:
  externalObjects: {{}}
  userData: 
"""

cs_files = [
    ("Assets/Scripts/Core/GameManager.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d5"),
    ("Assets/Scripts/Core/SceneFlowManager.cs", "f1e2d3c4b5a6978869504132a7b8c9d0"),
    ("Assets/Scripts/Core/EventBus.cs", "11111111111111111111111111111111"),
    ("Assets/Scripts/Core/Singleton.cs", "22222222222222222222222222222222"),
    ("Assets/Scripts/Core/GameConstants.cs", "33333333333333333333333333333333"),
    ("Assets/Scripts/Core/Timer.cs", "44444444444444444444444444444444"),
    ("Assets/Scripts/Core/GameBootstrapper.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d4"),
    ("Assets/Scripts/Core/GameEvents.cs", "55555555555555555555555555555555"),
    ("Assets/Scripts/Input/MultiplayerInputManager.cs", "66666666666666666666666666666666"),
    ("Assets/Scripts/Input/InputActionAsset.cs", "77777777777777777777777777777777"),
    ("Assets/Scripts/Input/PlayerInputData.cs", "88888888888888888888888888888888"),
    ("Assets/Scripts/Input/GameInputActions.cs", "99999999999999999999999999999999"),
    ("Assets/Scripts/Kitchen/Ingredient.cs", "aaaa0000aaaa0000aaaa0000aaaa0000"),
    ("Assets/Scripts/Kitchen/Recipe.cs", "bbbb0000bbbb0000bbbb0000bbbb0000"),
    ("Assets/Scripts/Kitchen/Dish.cs", "cccc0000cccc0000cccc0000cccc0000"),
    ("Assets/Scripts/Kitchen/KitchenStation.cs", "dddd0000dddd0000dddd0000dddd0000"),
    ("Assets/Scripts/Kitchen/PrepStation.cs", "eeee0000eeee0000eeee0000eeee0000"),
    ("Assets/Scripts/Kitchen/CookingStation.cs", "ffff0000ffff0000ffff0000ffff0000"),
    ("Assets/Scripts/Kitchen/PlatingStation.cs", "aaaa1111aaaa1111aaaa1111aaaa1111"),
    ("Assets/Scripts/Kitchen/CleaningStation.cs", "bbbb1111bbbb1111bbbb1111bbbb1111"),
    ("Assets/Scripts/Kitchen/IngredientStation.cs", "cccc1111cccc1111cccc1111cccc1111"),
    ("Assets/Scripts/Kitchen/StationManager.cs", "dddd1111dddd1111dddd1111dddd1111"),
    ("Assets/Scripts/Orders/Order.cs", "eeee1111eeee1111eeee1111eeee1111"),
    ("Assets/Scripts/Orders/OrderManager.cs", "ffff1111ffff1111ffff1111ffff1111"),
    ("Assets/Scripts/Level/LevelData.cs", "aaaa2222aaaa2222aaaa2222aaaa2222"),
    ("Assets/Scripts/Level/SpatialConstraint.cs", "bbbb2222bbbb2222bbbb2222bbbb2222"),
    ("Assets/Scripts/Level/StationLayoutEntry.cs", "cccc2222cccc2222cccc2222cccc2222"),
    ("Assets/Scripts/Level/TutorialStep.cs", "dddd2222dddd2222dddd2222dddd2222"),
    ("Assets/Scripts/Level/LevelManager.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"),
    ("Assets/Scripts/Level/LevelMechanic.cs", "eeee2222eeee2222eeee2222eeee2222"),
    ("Assets/Scripts/Level/LevelProgression.cs", "ffff2222ffff2222ffff2222ffff2222"),
    ("Assets/Scripts/Level/LevelConfigLoader.cs", "aaaa3333aaaa3333aaaa3333aaaa3333"),
    ("Assets/Scripts/Player/PlayerController.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5e0"),
    ("Assets/Scripts/Player/PlayerManager.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5e1"),
    ("Assets/Scripts/Scoring/ScoringManager.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d8"),
    ("Assets/Scripts/UI/UIManager.cs", "bbbb3333bbbb3333bbbb3333bbbb3333"),
    ("Assets/Scripts/UI/StartMenuUI.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d1"),
    ("Assets/Scripts/UI/TutorialUI.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5dc"),
    ("Assets/Scripts/UI/LevelSelectUI.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d3"),
    ("Assets/Scripts/UI/GameplayHUD.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5dd"),
    ("Assets/Scripts/UI/FailureUI.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5de"),
    ("Assets/Scripts/UI/SettlementUI.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5df"),
    ("Assets/Scripts/UI/SettingsUI.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d2"),
    ("Assets/Scripts/Analytics/AnalyticsManager.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d9"),
    ("Assets/Scripts/Analytics/PlaySessionData.cs", "cccc3333cccc3333cccc3333cccc3333"),
    ("Assets/Scripts/Analytics/KeyChoice.cs", "dddd3333dddd3333dddd3333dddd3333"),
    ("Assets/Scripts/Analytics/CheckpointData.cs", "eeee3333eeee3333eeee3333eeee3333"),
    ("Assets/Scripts/Audio/AudioManager.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5da"),
    ("Assets/Scripts/Audio/SoundData.cs", "ffff3333ffff3333ffff3333ffff3333"),
    ("Assets/Scripts/Debug/DebugLogger.cs", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5db"),
    ("Assets/Scripts/Debug/LogEntry.cs", "aaaa4444aaaa4444aaaa4444aaaa4444"),
    ("Assets/Scripts/Editor/LevelDataEditor.cs", "bbbb4444bbbb4444bbbb4444bbbb4444"),
]

asmdef_files = [
    ("Assets/Scripts/KitchenChaos.asmdef", "cccc4444cccc4444cccc4444cccc4444"),
    ("Assets/Scripts/Editor/KitchenChaos.Editor.asmdef", "dddd4444dddd4444dddd4444dddd4444"),
]

scene_files = [
    ("Assets/Scenes/MainMenu.unity", "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"),
    ("Assets/Scenes/Tutorial.unity", "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7"),
    ("Assets/Scenes/LevelSelect.unity", "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8"),
    ("Assets/Scenes/Gameplay.unity", "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9"),
]

json_files = [
    ("Assets/StreamingAssets/LevelConfigs/level_0_tutorial.json", "eeee5555eeee5555eeee5555eeee5555"),
    ("Assets/StreamingAssets/LevelConfigs/level_1.json", "ffff5555ffff5555ffff5555ffff5555"),
    ("Assets/StreamingAssets/LevelConfigs/level_2.json", "aaaa6666aaaa6666aaaa6666aaaa6666"),
]

directories = [
    "Assets",
    "Assets/Scripts",
    "Assets/Scripts/Core",
    "Assets/Scripts/Input",
    "Assets/Scripts/Kitchen",
    "Assets/Scripts/Orders",
    "Assets/Scripts/Level",
    "Assets/Scripts/Player",
    "Assets/Scripts/Scoring",
    "Assets/Scripts/UI",
    "Assets/Scripts/Analytics",
    "Assets/Scripts/Audio",
    "Assets/Scripts/Debug",
    "Assets/Scripts/Editor",
    "Assets/Data",
    "Assets/Data/Levels",
    "Assets/Prefabs",
    "Assets/Prefabs/Players",
    "Assets/Prefabs/Stations",
    "Assets/Prefabs/UI",
    "Assets/Prefabs/Orders",
    "Assets/Prefabs/Environment",
    "Assets/Scenes",
    "Assets/Resources",
    "Assets/Resources/Prefabs",
    "Assets/Resources/Audio",
    "Assets/Resources/Data",
    "Assets/Sprites",
    "Assets/Sprites/Characters",
    "Assets/Sprites/Stations",
    "Assets/Sprites/Ingredients",
    "Assets/Sprites/UI",
    "Assets/Sprites/Environment",
    "Assets/Audio",
    "Assets/Audio/BGM",
    "Assets/Audio/SFX",
    "Assets/StreamingAssets",
    "Assets/StreamingAssets/LevelConfigs",
]

count = 0

for rel_path, guid in cs_files:
    full = os.path.join(BASE, rel_path + ".meta")
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(CS_META_TEMPLATE.format(guid=guid))
    count += 1

for rel_path, guid in asmdef_files:
    full = os.path.join(BASE, rel_path + ".meta")
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(DEFAULT_META_TEMPLATE.format(guid=guid))
    count += 1

for rel_path, guid in scene_files:
    full = os.path.join(BASE, rel_path + ".meta")
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(DEFAULT_META_TEMPLATE.format(guid=guid))
    count += 1

for rel_path, guid in json_files:
    full = os.path.join(BASE, rel_path + ".meta")
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(DEFAULT_META_TEMPLATE.format(guid=guid))
    count += 1

for i, rel_path in enumerate(directories):
    guid = f"d{i+1:07x}0000000000000000000000"
    full = os.path.join(BASE, rel_path + ".meta")
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(DIR_META_TEMPLATE.format(guid=guid))
    count += 1

print(f"Total .meta files created: {count}")
