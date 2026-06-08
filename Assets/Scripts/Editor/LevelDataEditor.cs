using UnityEditor;
using UnityEngine;

namespace KitchenChaos.Editor
{
    public class LevelDataEditor : EditorWindow
    {
        private LevelData selectedLevelData;
        private string levelName = "";
        private float timeLimit = 120f;
        private float orderInterval = 20f;
        private int maxOrders = 4;
        private int targetScore = 100;
        private int targetScore2Stars = 200;
        private int targetScore3Stars = 300;
        private Vector2 stationScrollPosition;
        private Vector2 constraintScrollPosition;

        [MenuItem("Kitchen/Level Editor")]
        public static void ShowWindow()
        {
            GetWindow<LevelDataEditor>("Level Editor");
        }

        private void OnGUI()
        {
            EditorGUILayout.LabelField("Level Editor", EditorStyles.boldLabel);
            EditorGUILayout.Space();

            DrawLevelDataSelection();
            EditorGUILayout.Space();

            DrawLevelConfiguration();
            EditorGUILayout.Space();

            DrawStarTargets();
            EditorGUILayout.Space();

            DrawStationLayout();
            EditorGUILayout.Space();

            DrawSpatialConstraints();
            EditorGUILayout.Space();

            DrawActionButtons();
        }

        private void DrawLevelDataSelection()
        {
            EditorGUILayout.LabelField("Level Data", EditorStyles.boldLabel);
            selectedLevelData = (LevelData)EditorGUILayout.ObjectField("Selected Level Data", selectedLevelData, typeof(LevelData), false);

            if (selectedLevelData != null)
            {
                if (GUILayout.Button("Load from Asset"))
                {
                    LoadFromSelectedAsset();
                }
            }
        }

        private void DrawLevelConfiguration()
        {
            EditorGUILayout.LabelField("Level Configuration", EditorStyles.boldLabel);
            levelName = EditorGUILayout.TextField("Level Name", levelName);
            timeLimit = EditorGUILayout.FloatField("Time Limit", timeLimit);
            orderInterval = EditorGUILayout.FloatField("Order Interval", orderInterval);
            maxOrders = EditorGUILayout.IntField("Max Orders", maxOrders);
            targetScore = EditorGUILayout.IntField("Target Score", targetScore);
        }

        private void DrawStarTargets()
        {
            EditorGUILayout.LabelField("Star Targets", EditorStyles.boldLabel);
            targetScore2Stars = EditorGUILayout.IntField("2 Stars Score", targetScore2Stars);
            targetScore3Stars = EditorGUILayout.IntField("3 Stars Score", targetScore3Stars);
        }

        private void DrawStationLayout()
        {
            EditorGUILayout.LabelField("Station Layout", EditorStyles.boldLabel);

            if (selectedLevelData != null && selectedLevelData.stationLayout != null)
            {
                stationScrollPosition = EditorGUILayout.BeginScrollView(stationScrollPosition, GUILayout.Height(150));

                for (int i = 0; i < selectedLevelData.stationLayout.Count; i++)
                {
                    var entry = selectedLevelData.stationLayout[i];
                    EditorGUILayout.BeginHorizontal();
                    EditorGUILayout.LabelField($"Station {i}", GUILayout.Width(60));
                    entry.stationType = (StationType)EditorGUILayout.EnumPopup(entry.stationType);
                    entry.position = EditorGUILayout.Vector3Field("", entry.position);
                    entry.rotation = EditorGUILayout.FloatField("Rot", entry.rotation);
                    entry.stationName = EditorGUILayout.TextField(entry.stationName);
                    entry.isLocked = EditorGUILayout.Toggle("Locked", entry.isLocked);
                    EditorGUILayout.EndHorizontal();

                    if (GUILayout.Button($"Remove Station {i}", GUILayout.Width(120)))
                    {
                        selectedLevelData.stationLayout.RemoveAt(i);
                        break;
                    }
                }

                EditorGUILayout.EndScrollView();
            }

            if (GUILayout.Button("Add Station"))
            {
                if (selectedLevelData != null)
                {
                    if (selectedLevelData.stationLayout == null)
                        selectedLevelData.stationLayout = new System.Collections.Generic.List<StationLayoutEntry>();

                    selectedLevelData.stationLayout.Add(new StationLayoutEntry
                    {
                        stationType = StationType.Ingredient,
                        position = Vector3.zero,
                        rotation = 0f,
                        stationName = "New Station",
                        isLocked = false
                    });
                }
                else
                {
                    Debug.LogWarning("Select a LevelData asset first.");
                }
            }
        }

        private void DrawSpatialConstraints()
        {
            EditorGUILayout.LabelField("Spatial Constraints", EditorStyles.boldLabel);

            if (selectedLevelData != null && selectedLevelData.spatialConstraints != null)
            {
                constraintScrollPosition = EditorGUILayout.BeginScrollView(constraintScrollPosition, GUILayout.Height(100));

                for (int i = 0; i < selectedLevelData.spatialConstraints.Count; i++)
                {
                    var constraint = selectedLevelData.spatialConstraints[i];
                    EditorGUILayout.BeginHorizontal();
                    EditorGUILayout.LabelField($"Constraint {i}", GUILayout.Width(80));
                    constraint.constraintName = EditorGUILayout.TextField(constraint.constraintName);
                    constraint.constraintType = (SpatialConstraint.ConstraintType)EditorGUILayout.EnumPopup(constraint.constraintType);
                    EditorGUILayout.EndHorizontal();

                    if (GUILayout.Button($"Remove Constraint {i}", GUILayout.Width(140)))
                    {
                        selectedLevelData.spatialConstraints.RemoveAt(i);
                        break;
                    }
                }

                EditorGUILayout.EndScrollView();
            }

            if (GUILayout.Button("Add Spatial Constraint"))
            {
                if (selectedLevelData != null)
                {
                    if (selectedLevelData.spatialConstraints == null)
                        selectedLevelData.spatialConstraints = new System.Collections.Generic.List<SpatialConstraint>();

                    selectedLevelData.spatialConstraints.Add(new SpatialConstraint
                    {
                        constraintName = "New Constraint",
                        constraintType = SpatialConstraint.ConstraintType.BlockedArea,
                        position = Vector2.zero,
                        size = new Vector2(2, 2),
                        moveSpeed = 0f,
                        moveRange = 0f
                    });
                }
                else
                {
                    Debug.LogWarning("Select a LevelData asset first.");
                }
            }
        }

        private void DrawActionButtons()
        {
            EditorGUILayout.Space();

            if (GUILayout.Button("Create New Level Data", GUILayout.Height(30)))
            {
                CreateNewLevelData();
            }

            if (GUILayout.Button("Save Level Data", GUILayout.Height(30)))
            {
                SaveLevelData();
            }

            if (GUILayout.Button("Test Level", GUILayout.Height(30)))
            {
                TestLevel();
            }
        }

        private void LoadFromSelectedAsset()
        {
            if (selectedLevelData == null) return;

            levelName = selectedLevelData.levelName;
            timeLimit = selectedLevelData.timeLimit;
            orderInterval = selectedLevelData.orderInterval;
            maxOrders = selectedLevelData.maxOrders;
            targetScore = selectedLevelData.targetScore;
            targetScore2Stars = selectedLevelData.targetScore2Stars;
            targetScore3Stars = selectedLevelData.targetScore3Stars;
        }

        private void CreateNewLevelData()
        {
            var asset = ScriptableObject.CreateInstance<LevelData>();
            asset.levelName = levelName;
            asset.timeLimit = timeLimit;
            asset.orderInterval = orderInterval;
            asset.maxOrders = maxOrders;
            asset.targetScore = targetScore;
            asset.targetScore2Stars = targetScore2Stars;
            asset.targetScore3Stars = targetScore3Stars;

            if (!AssetDatabase.IsValidFolder("Assets/Data"))
                AssetDatabase.CreateFolder("Assets", "Data");
            if (!AssetDatabase.IsValidFolder("Assets/Data/Levels"))
                AssetDatabase.CreateFolder("Assets/Data", "Levels");

            int levelCount = System.IO.Directory.GetFiles("Assets/Data/Levels", "Level_*.asset").Length / 2;
            string assetPath = $"Assets/Data/Levels/Level_{levelCount}.asset";

            AssetDatabase.CreateAsset(asset, assetPath);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            selectedLevelData = asset;
            EditorUtility.FocusProjectWindow();
            Selection.activeObject = asset;
            Debug.Log($"Created new LevelData at {assetPath}");
        }

        private void SaveLevelData()
        {
            if (selectedLevelData == null)
            {
                Debug.LogWarning("No LevelData selected to save.");
                return;
            }

            Undo.RecordObject(selectedLevelData, "Save Level Data");
            selectedLevelData.levelName = levelName;
            selectedLevelData.timeLimit = timeLimit;
            selectedLevelData.orderInterval = orderInterval;
            selectedLevelData.maxOrders = maxOrders;
            selectedLevelData.targetScore = targetScore;
            selectedLevelData.targetScore2Stars = targetScore2Stars;
            selectedLevelData.targetScore3Stars = targetScore3Stars;

            EditorUtility.SetDirty(selectedLevelData);
            AssetDatabase.SaveAssets();
            Debug.Log("Level Data saved successfully.");
        }

        private void TestLevel()
        {
            if (selectedLevelData == null)
            {
                Debug.LogWarning("No LevelData selected to test.");
                return;
            }

            PlayerPrefs.SetString("TestLevelData", selectedLevelData.name);
            PlayerPrefs.Save();

            Debug.Log($"Testing level: {selectedLevelData.levelName}");
        }
    }
}
