#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using UnityEngine.SceneManagement;
using UnityEditor.SceneManagement;
using System.IO;

namespace DecorMatch3.EditorTools
{
    public static class ProjectSetup
    {
        private const string ProjectName = "DecorMatch3";
        private static readonly string[] SceneNames = { "Bootstrap", "MainMenu", "Match3Level", "Decoration", "Settings" };

        [MenuItem("DecorMatch3/Setup/Create All Scenes")]
        public static void CreateAllScenes()
        {
            string scenesPath = "Assets/Scenes";
            if (!Directory.Exists(scenesPath))
            {
                Directory.CreateDirectory(scenesPath);
            }

            foreach (string sceneName in SceneNames)
            {
                string scenePath = Path.Combine(scenesPath, sceneName + ".unity");
                if (!File.Exists(scenePath))
                {
                    Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                    SetupSceneContent(sceneName, scene);
                    EditorSceneManager.SaveScene(scene, scenePath);
                    Debug.Log($"Created scene: {scenePath}");
                }
                else
                {
                    Debug.Log($"Scene already exists: {scenePath}");
                }
            }

            AddScenesToBuildSettings();
            Debug.Log("All scenes created successfully!");
        }

        private static void SetupSceneContent(string sceneName, Scene scene)
        {
            switch (sceneName)
            {
                case "Bootstrap":
                    SetupBootstrapScene(scene);
                    break;
                case "MainMenu":
                    SetupMainMenuScene(scene);
                    break;
                case "Match3Level":
                    SetupMatch3Scene(scene);
                    break;
                case "Decoration":
                    SetupDecorationScene(scene);
                    break;
                case "Settings":
                    SetupSettingsScene(scene);
                    break;
            }
        }

        private static void SetupBootstrapScene(Scene scene)
        {
            GameObject bootstrapGO = new GameObject("GameBootstrap");
            bootstrapGO.AddComponent<GameBootstrap>();

            GameObject cameraGO = new GameObject("Main Camera");
            cameraGO.tag = "MainCamera";
            Camera cam = cameraGO.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.1f, 0.1f, 0.15f);
            cam.orthographic = true;
            cam.orthographicSize = 6;
            cameraGO.AddComponent<AudioListener>();

            GameObject eventSystemGO = new GameObject("EventSystem");
            eventSystemGO.AddComponent<UnityEngine.EventSystems.EventSystem>();
            eventSystemGO.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();

            GameObject initGO = new GameObject("SceneInitializer");
            initGO.AddComponent<RuntimeSceneBuilder>();
        }

        private static void SetupMainMenuScene(Scene scene)
        {
            GameObject initGO = new GameObject("SceneInitializer");
            var builder = initGO.AddComponent<RuntimeSceneBuilder>();
            SerializedObject so = new SerializedObject(builder);
            so.FindProperty("sceneType").enumValueIndex = 1;
            so.ApplyModifiedProperties();
        }

        private static void SetupMatch3Scene(Scene scene)
        {
            GameObject initGO = new GameObject("SceneInitializer");
            var builder = initGO.AddComponent<RuntimeSceneBuilder>();
            SerializedObject so = new SerializedObject(builder);
            so.FindProperty("sceneType").enumValueIndex = 2;
            so.ApplyModifiedProperties();
        }

        private static void SetupDecorationScene(Scene scene)
        {
            GameObject initGO = new GameObject("SceneInitializer");
            var builder = initGO.AddComponent<RuntimeSceneBuilder>();
            SerializedObject so = new SerializedObject(builder);
            so.FindProperty("sceneType").enumValueIndex = 3;
            so.ApplyModifiedProperties();
        }

        private static void SetupSettingsScene(Scene scene)
        {
            GameObject initGO = new GameObject("SceneInitializer");
            var builder = initGO.AddComponent<RuntimeSceneBuilder>();
            SerializedObject so = new SerializedObject(builder);
            so.FindProperty("sceneType").enumValueIndex = 4;
            so.ApplyModifiedProperties();
        }

        private static void AddScenesToBuildSettings()
        {
            string scenesPath = "Assets/Scenes";
            EditorBuildSettingsScene[] buildScenes = new EditorBuildSettingsScene[SceneNames.Length];

            for (int i = 0; i < SceneNames.Length; i++)
            {
                string path = Path.Combine(scenesPath, SceneNames[i] + ".unity");
                buildScenes[i] = new EditorBuildSettingsScene(path, true);
            }

            EditorBuildSettings.scenes = buildScenes;
        }

        [MenuItem("DecorMatch3/Setup/Create Folder Structure")]
        public static void CreateFolderStructure()
        {
            string[] folders = {
                "Assets/Scripts/Core",
                "Assets/Scripts/Gameplay/Match3",
                "Assets/Scripts/Gameplay/Decoration",
                "Assets/Scripts/Gameplay/Customer",
                "Assets/Scripts/Managers",
                "Assets/Scripts/UI",
                "Assets/Scripts/Data",
                "Assets/Scripts/Utilities",
                "Assets/Scripts/Input",
                "Assets/Editor",
                "Assets/Scenes",
                "Assets/Prefabs",
                "Assets/Prefabs/UI",
                "Assets/Prefabs/Gems",
                "Assets/Prefabs/Furniture",
                "Assets/Art",
                "Assets/Art/UI",
                "Assets/Art/Gems",
                "Assets/Art/Furniture",
                "Assets/Audio/Music",
                "Assets/Audio/SFX",
                "Assets/Resources/LevelData",
                "Assets/Resources/CustomerData",
                "Assets/Resources/DecorationData"
            };

            foreach (string folder in folders)
            {
                if (!Directory.Exists(folder))
                {
                    Directory.CreateDirectory(folder);
                    Debug.Log($"Created folder: {folder}");
                }
            }

            AssetDatabase.Refresh();
        }

        [MenuItem("DecorMatch3/Setup/Full Project Setup")]
        public static void FullSetup()
        {
            CreateFolderStructure();
            CreateAllScenes();
            Debug.Log("=== Full project setup complete! ===");
            Debug.Log("Next steps:");
            Debug.Log("1. Press Play on the Bootstrap scene to start");
            Debug.Log("2. Tutorial / Settings / Pause are all built into each scene's runtime builder");
        }
    }
}
#endif
