#if UNITY_EDITOR
using System;
using System.IO;
using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using DecorMatch3.Core;
using DecorMatch3.GameFlow;
using DecorMatch3.Scenes;
using DecorMatch3.UI;
using DecorMatch3.Audio;
using DecorMatch3.Data;
using DecorMatch3.Progression;

namespace DecorMatch3.EditorTools
{
    [InitializeOnLoad]
    public static class AutoAssetBuilder
    {
        private const string SCENES_DIR = "Assets/Scenes";
        private const string PREFABS_DIR = "Assets/Prefabs";
        private const string SO_DIR = "Assets/ScriptableObjects";
        private const string BOOTSTRAP_PATH = "Assets/Scenes/Bootstrap.unity";

        static AutoAssetBuilder()
        {
            EditorApplication.delayCall += TryBuildAll;
        }

        private static void TryBuildAll()
        {
            try
            {
                bool needsBuild = !File.Exists(BOOTSTRAP_PATH) ||
                                  !Directory.Exists(PREFABS_DIR) ||
                                  !Directory.Exists(SO_DIR) ||
                                  Directory.GetFiles(SO_DIR, "*.asset", SearchOption.AllDirectories).Length == 0;

                if (needsBuild)
                {
                    Debug.Log("[AutoAssetBuilder] 检测到缺失资产，正在自动生成...");
                    BuildAll();
                    Debug.Log("[AutoAssetBuilder] 资产自动生成完毕！请打开 Assets/Scenes/Bootstrap.unity 后点击 Play");
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[AutoAssetBuilder] 自动生成跳过（首次编译可忽略）: {e.Message}");
            }
        }

        public static void BuildAll()
        {
            EnsureDirectory(SCENES_DIR);
            EnsureDirectory(PREFABS_DIR);
            EnsureDirectory(SO_DIR);

            BuildBootstrapScene();
            BuildMainMenuScene();
            BuildMatch3Scene();
            BuildDecorationScene();

            UpdateBuildSettings();

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        private static void EnsureDirectory(string path)
        {
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
        }

        private static void BuildBootstrapScene()
        {
            string path = BOOTSTRAP_PATH;
            if (File.Exists(path)) return;

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "Bootstrap";

            GameObject bootstrapGO = new GameObject("[GameBootstrap]");
            bootstrapGO.AddComponent<GameBootstrap>();
            bootstrapGO.AddComponent<GameFlowController>();

            GameObject cameraGO = new GameObject("Main Camera");
            cameraGO.tag = "MainCamera";
            Camera cam = cameraGO.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.98f, 0.97f, 0.95f);
            cam.orthographic = true;
            if (cameraGO.GetComponent<AudioListener>() == null)
                cameraGO.AddComponent<AudioListener>();

            GameObject esGO = new GameObject("EventSystem");
            esGO.AddComponent<EventSystem>();
            esGO.AddComponent<StandaloneInputModule>();

            EditorSceneManager.SaveScene(scene, path);
            EditorSceneManager.CloseScene(scene, true);
        }

        private static void BuildMainMenuScene()
        {
            string path = $"{SCENES_DIR}/MainMenu.unity";
            if (File.Exists(path)) return;

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "MainMenu";

            AddCameraEventSystem(new Color(0.98f, 0.97f, 0.95f));

            GameObject controllerGO = new GameObject("SceneController");
            controllerGO.AddComponent<MainMenuSceneController>();

            AddCanvas();

            EditorSceneManager.SaveScene(scene, path);
            EditorSceneManager.CloseScene(scene, true);
        }

        private static void BuildMatch3Scene()
        {
            string path = $"{SCENES_DIR}/Match3Level.unity";
            if (File.Exists(path)) return;

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "Match3Level";

            AddCameraEventSystem(new Color(0.95f, 0.94f, 0.9f));

            GameObject controllerGO = new GameObject("SceneController");
            controllerGO.AddComponent<Match3SceneController>();

            AddCanvas();

            EditorSceneManager.SaveScene(scene, path);
            EditorSceneManager.CloseScene(scene, true);
        }

        private static void BuildDecorationScene()
        {
            string path = $"{SCENES_DIR}/DecorationStudio.unity";
            if (File.Exists(path)) return;

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "DecorationStudio";

            AddCameraEventSystem(new Color(0.96f, 0.95f, 0.92f));

            GameObject controllerGO = new GameObject("SceneController");
            controllerGO.AddComponent<DecorationSceneController>();

            AddCanvas();

            EditorSceneManager.SaveScene(scene, path);
            EditorSceneManager.CloseScene(scene, true);
        }

        private static void AddCameraEventSystem(Color bgColor)
        {
            GameObject cameraGO = new GameObject("Main Camera");
            cameraGO.tag = "MainCamera";
            Camera cam = cameraGO.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = bgColor;
            cam.orthographic = true;
            if (cameraGO.GetComponent<AudioListener>() == null)
                cameraGO.AddComponent<AudioListener>();

            GameObject esGO = new GameObject("EventSystem");
            esGO.AddComponent<EventSystem>();
            esGO.AddComponent<StandaloneInputModule>();
        }

        private static void AddCanvas()
        {
            GameObject canvasGO = new GameObject("MainCanvas");
            Canvas canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            CanvasScaler scaler = canvasGO.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGO.AddComponent<GraphicRaycaster>();
        }

        private static void UpdateBuildSettings()
        {
            EditorBuildSettingsScene[] scenes = new EditorBuildSettingsScene[]
            {
                new EditorBuildSettingsScene(BOOTSTRAP_PATH, true),
                new EditorBuildSettingsScene($"{SCENES_DIR}/MainMenu.unity", true),
                new EditorBuildSettingsScene($"{SCENES_DIR}/Match3Level.unity", true),
                new EditorBuildSettingsScene($"{SCENES_DIR}/DecorationStudio.unity", true)
            };
            EditorBuildSettings.scenes = scenes;
        }

        [MenuItem("DecorMatch3/Factory/Force Rebuild All (强制重建所有场景)")]
        public static void ForceRebuild()
        {
            string[] existingScenes = Directory.GetFiles(SCENES_DIR, "*.unity");
            foreach (string s in existingScenes)
            {
                File.Delete(s);
                string meta = s + ".meta";
                if (File.Exists(meta)) File.Delete(meta);
            }

            BuildAll();
            EditorUtility.DisplayDialog("重建完成",
                "已强制重建所有场景！\n\n请打开 Assets/Scenes/Bootstrap.unity 点击 Play 开始游戏。",
                "好的");
        }
    }
}
#endif
