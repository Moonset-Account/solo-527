using UnityEngine;
using UnityEditor;
using ShadowPlatformer.Level;
using System.IO;

namespace ShadowPlatformer.Editor
{
    public class LevelEditorWindow : EditorWindow
    {
        private LevelLayout _currentLayout;
        private Vector2 _scrollPos;
        private int _selectedTab;
        private string _layoutPath = "Assets/Data/Levels";
        private string _fileName = "NewLevel";

        [MenuItem("Tools/Shadow Platformer/Level Editor")]
        public static void ShowWindow()
        {
            GetWindow<LevelEditorWindow>("Level Editor");
        }

        private void OnGUI()
        {
            _selectedTab = GUILayout.Toolbar(_selectedTab, new string[] { "Level", "Platforms", "Triggers", "Receivers", "Hazards", "Checkpoints", "Export" });

            _scrollPos = EditorGUILayout.BeginScrollView(_scrollPos);

            switch (_selectedTab)
            {
                case 0: DrawLevelTab(); break;
                case 1: DrawPlatformsTab(); break;
                case 2: DrawTriggersTab(); break;
                case 3: DrawReceiversTab(); break;
                case 4: DrawHazardsTab(); break;
                case 5: DrawCheckpointsTab(); break;
                case 6: DrawExportTab(); break;
            }

            EditorGUILayout.EndScrollView();
        }

        private void DrawLevelTab()
        {
            if (_currentLayout == null)
                _currentLayout = new LevelLayout();

            _currentLayout.levelId = EditorGUILayout.TextField("Level ID", _currentLayout.levelId);
            _currentLayout.playerSpawn = EditorGUILayout.Vector2Field("Player Spawn", _currentLayout.playerSpawn);
            _currentLayout.levelExitPosition = EditorGUILayout.Vector2Field("Level Exit", _currentLayout.levelExitPosition);
            _currentLayout.startLightDirection = (Light.LightDirection)EditorGUILayout.EnumPopup("Start Light", _currentLayout.startLightDirection);

            if (GUILayout.Button("New Layout"))
                _currentLayout = new LevelLayout();

            if (GUILayout.Button("Load Layout"))
                LoadLayout();
        }

        private void DrawPlatformsTab()
        {
            if (_currentLayout == null) return;

            if (GUILayout.Button("Add Platform"))
            {
                var list = new System.Collections.Generic.List<PlatformConfig>(_currentLayout.platforms ?? new PlatformConfig[0]);
                list.Add(new PlatformConfig { id = $"p_{list.Count}" });
                _currentLayout.platforms = list.ToArray();
            }

            if (_currentLayout.platforms == null) return;
            for (int i = 0; i < _currentLayout.platforms.Length; i++)
            {
                var p = _currentLayout.platforms[i];
                EditorGUILayout.BeginVertical("box");
                p.id = EditorGUILayout.TextField("ID", p.id);
                p.position = EditorGUILayout.Vector2Field("Position", p.position);
                p.size = EditorGUILayout.Vector2Field("Size", p.size);
                p.isShadowPlatform = EditorGUILayout.Toggle("Is Shadow", p.isShadowPlatform);
                if (p.isShadowPlatform)
                {
                    p.shadowDirection = (Light.LightDirection)EditorGUILayout.EnumPopup("Shadow Dir", p.shadowDirection);
                    p.shadowVisibility = (Light.ShadowVisibility)EditorGUILayout.EnumPopup("Visibility", p.shadowVisibility);
                }
                if (GUILayout.Button("Remove"))
                {
                    var list = new System.Collections.Generic.List<PlatformConfig>(_currentLayout.platforms);
                    list.RemoveAt(i);
                    _currentLayout.platforms = list.ToArray();
                    break;
                }
                EditorGUILayout.EndVertical();
            }
        }

        private void DrawTriggersTab()
        {
            if (_currentLayout == null) return;

            if (GUILayout.Button("Add Trigger"))
            {
                var list = new System.Collections.Generic.List<TriggerConfig>(_currentLayout.triggers ?? new TriggerConfig[0]);
                list.Add(new TriggerConfig { id = $"t_{list.Count}" });
                _currentLayout.triggers = list.ToArray();
            }

            if (_currentLayout.triggers == null) return;
            for (int i = 0; i < _currentLayout.triggers.Length; i++)
            {
                var t = _currentLayout.triggers[i];
                EditorGUILayout.BeginVertical("box");
                t.id = EditorGUILayout.TextField("ID", t.id);
                t.type = (Mechanisms.TriggerType)EditorGUILayout.EnumPopup("Type", t.type);
                t.position = EditorGUILayout.Vector2Field("Position", t.position);
                t.isOneShot = EditorGUILayout.Toggle("One Shot", t.isOneShot);
                if (t.type == Mechanisms.TriggerType.TimedSwitch)
                    t.timedDuration = EditorGUILayout.FloatField("Duration", t.timedDuration);
                if (t.type == Mechanisms.TriggerType.LightSensor)
                    t.requiredLightDirection = (Light.LightDirection)EditorGUILayout.EnumPopup("Req Light", t.requiredLightDirection);
                if (GUILayout.Button("Remove"))
                {
                    var list = new System.Collections.Generic.List<TriggerConfig>(_currentLayout.triggers);
                    list.RemoveAt(i);
                    _currentLayout.triggers = list.ToArray();
                    break;
                }
                EditorGUILayout.EndVertical();
            }
        }

        private void DrawReceiversTab()
        {
            if (_currentLayout == null) return;

            if (GUILayout.Button("Add Receiver"))
            {
                var list = new System.Collections.Generic.List<ReceiverConfig>(_currentLayout.receivers ?? new ReceiverConfig[0]);
                list.Add(new ReceiverConfig { id = $"r_{list.Count}" });
                _currentLayout.receivers = list.ToArray();
            }

            if (_currentLayout.receivers == null) return;
            for (int i = 0; i < _currentLayout.receivers.Length; i++)
            {
                var r = _currentLayout.receivers[i];
                EditorGUILayout.BeginVertical("box");
                r.id = EditorGUILayout.TextField("ID", r.id);
                r.position = EditorGUILayout.Vector2Field("Position", r.position);
                r.requireAllTriggers = EditorGUILayout.Toggle("Require All", r.requireAllTriggers);

                int triggerCount = EditorGUILayout.IntField("Trigger ID Count", r.requiredTriggerIds?.Length ?? 0);
                if (triggerCount != (r.requiredTriggerIds?.Length ?? 0))
                {
                    var arr = new string[triggerCount];
                    for (int j = 0; j < triggerCount && j < (r.requiredTriggerIds?.Length ?? 0); j++)
                        arr[j] = r.requiredTriggerIds[j];
                    r.requiredTriggerIds = arr;
                }
                if (r.requiredTriggerIds != null)
                {
                    for (int j = 0; j < r.requiredTriggerIds.Length; j++)
                        r.requiredTriggerIds[j] = EditorGUILayout.TextField($"  Trigger {j}", r.requiredTriggerIds[j]);
                }

                r.isDoor = EditorGUILayout.Toggle("Is Door", r.isDoor);
                r.isMovingPlatform = EditorGUILayout.Toggle("Is Moving Platform", r.isMovingPlatform);
                if (r.isMovingPlatform)
                {
                    r.moveTargetOffset = EditorGUILayout.Vector2Field("Move Offset", r.moveTargetOffset);
                    r.moveSpeed = EditorGUILayout.FloatField("Speed", r.moveSpeed);
                }

                if (GUILayout.Button("Remove"))
                {
                    var list = new System.Collections.Generic.List<ReceiverConfig>(_currentLayout.receivers);
                    list.RemoveAt(i);
                    _currentLayout.receivers = list.ToArray();
                    break;
                }
                EditorGUILayout.EndVertical();
            }
        }

        private void DrawHazardsTab()
        {
            if (_currentLayout == null) return;

            if (GUILayout.Button("Add Hazard"))
            {
                var list = new System.Collections.Generic.List<HazardConfig>(_currentLayout.hazards ?? new HazardConfig[0]);
                list.Add(new HazardConfig { id = $"h_{list.Count}", size = new Vector2(2f, 0.5f) });
                _currentLayout.hazards = list.ToArray();
            }

            if (_currentLayout.hazards == null) return;
            for (int i = 0; i < _currentLayout.hazards.Length; i++)
            {
                var h = _currentLayout.hazards[i];
                EditorGUILayout.BeginVertical("box");
                h.id = EditorGUILayout.TextField("ID", h.id);
                h.position = EditorGUILayout.Vector2Field("Position", h.position);
                h.size = EditorGUILayout.Vector2Field("Size", h.size);
                h.instantKill = EditorGUILayout.Toggle("Instant Kill", h.instantKill);
                if (GUILayout.Button("Remove"))
                {
                    var list = new System.Collections.Generic.List<HazardConfig>(_currentLayout.hazards);
                    list.RemoveAt(i);
                    _currentLayout.hazards = list.ToArray();
                    break;
                }
                EditorGUILayout.EndVertical();
            }
        }

        private void DrawCheckpointsTab()
        {
            if (_currentLayout == null) return;

            if (GUILayout.Button("Add Checkpoint"))
            {
                var list = new System.Collections.Generic.List<CheckpointConfig>(_currentLayout.checkpoints ?? new CheckpointConfig[0]);
                list.Add(new CheckpointConfig { id = $"cp_{list.Count}" });
                _currentLayout.checkpoints = list.ToArray();
            }

            if (_currentLayout.checkpoints == null) return;
            for (int i = 0; i < _currentLayout.checkpoints.Length; i++)
            {
                var c = _currentLayout.checkpoints[i];
                EditorGUILayout.BeginVertical("box");
                c.id = EditorGUILayout.TextField("ID", c.id);
                c.position = EditorGUILayout.Vector2Field("Position", c.position);
                if (GUILayout.Button("Remove"))
                {
                    var list = new System.Collections.Generic.List<CheckpointConfig>(_currentLayout.checkpoints);
                    list.RemoveAt(i);
                    _currentLayout.checkpoints = list.ToArray();
                    break;
                }
                EditorGUILayout.EndVertical();
            }
        }

        private void DrawExportTab()
        {
            if (_currentLayout == null) return;

            _fileName = EditorGUILayout.TextField("File Name", _fileName);
            _layoutPath = EditorGUILayout.TextField("Path", _layoutPath);

            if (GUILayout.Button("Export as JSON"))
            {
                ExportLayout();
            }

            if (GUILayout.Button("Build in Scene"))
            {
                var builder = FindObjectOfType<LevelBuilder>();
                if (builder != null)
                    builder.BuildLevel(_currentLayout);
                else
                    Debug.LogWarning("No LevelBuilder found in scene");
            }
        }

        private void ExportLayout()
        {
            if (_currentLayout == null) return;
            string json = JsonUtility.ToJson(_currentLayout, true);
            if (!Directory.Exists(_layoutPath))
                Directory.CreateDirectory(_layoutPath);
            string fullPath = Path.Combine(_layoutPath, _fileName + ".json");
            File.WriteAllText(fullPath, json);
            AssetDatabase.Refresh();
            Debug.Log($"Level exported to {fullPath}");
        }

        private void LoadLayout()
        {
            string path = EditorUtility.OpenFilePanel("Load Level Layout", "Assets/Data/Levels", "json");
            if (string.IsNullOrEmpty(path)) return;
            string json = File.ReadAllText(path);
            _currentLayout = JsonUtility.FromJson<LevelLayout>(json);
        }
    }
}
