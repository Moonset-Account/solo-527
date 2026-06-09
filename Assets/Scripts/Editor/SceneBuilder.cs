#if UNITY_EDITOR
using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using System.IO;
using DecorMatch3.Scenes;
using DecorMatch3.Core;
using DecorMatch3.UI;
using DecorMatch3.Audio;
using DecorMatch3.Data;
using DecorMatch3.Progression;

namespace DecorMatch3.EditorTools
{
    public static class SceneBuilder
    {
        private const string SCENES_DIR = "Assets/Scenes";

        [MenuItem("DecorMatch3/Factory/Build All Scenes")]
        public static void BuildAllScenes()
        {
            EnsureDirectory(SCENES_DIR);

            string mainMenuPath = BuildMainMenuScene();
            string match3Path = BuildMatch3Scene();
            string decorationPath = BuildDecorationScene();
            string bootstrapPath = BuildBootstrapScene();

            EditorBuildSettingsScene[] scenes = new EditorBuildSettingsScene[]
            {
                new EditorBuildSettingsScene(bootstrapPath, true),
                new EditorBuildSettingsScene(mainMenuPath, true),
                new EditorBuildSettingsScene(match3Path, true),
                new EditorBuildSettingsScene(decorationPath, true)
            };
            EditorBuildSettings.scenes = scenes;

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log($"[SceneBuilder] All scenes built successfully!\nBootstrap: {bootstrapPath}");
            EditorUtility.DisplayDialog("场景构建完成",
                $"已创建4个场景并加入Build Settings:\n\n" +
                $"1. Bootstrap (启动引导)\n" +
                $"2. MainMenu (主菜单)\n" +
                $"3. Match3Level (三消关卡)\n" +
                $"4. DecorationStudio (装修工作间)\n\n" +
                $"请打开 Bootstrap 场景后点击 Play 开始游戏！",
                "好的");
        }

        private static void EnsureDirectory(string path)
        {
            if (!Directory.Exists(path)) Directory.CreateDirectory(path);
        }

        private static Scene SetupEmptyScene(string sceneName)
        {
            string path = $"{SCENES_DIR}/{sceneName}.unity";
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            EditorSceneManager.SaveScene(scene, path);
            return scene;
        }

        private static string BuildBootstrapScene()
        {
            Scene scene = SetupEmptyScene("Bootstrap");
            scene.name = "Bootstrap";

            GameObject bootstrapGO = new GameObject("[GameBootstrap]");
            bootstrapGO.AddComponent<GameBootstrap>();
            bootstrapGO.AddComponent<GameFlowController>();

            GameObject systemsGO = new GameObject("Systems");
            systemsGO.transform.SetParent(bootstrapGO.transform);
            systemsGO.AddComponent<DataManager>();
            systemsGO.AddComponent<UIManager>();
            systemsGO.AddComponent<AudioManager>();
            systemsGO.AddComponent<AchievementManager>();

            GameObject cameraGO = new GameObject("Main Camera");
            cameraGO.tag = "MainCamera";
            Camera cam = cameraGO.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.1f, 0.12f, 0.18f);
            cam.orthographic = true;

            GameObject starterGO = new GameObject("SceneStarter");
            SceneStarter starter = starterGO.AddComponent<SceneStarter>();
            starter.TargetSceneName = "MainMenu";
            starter.DelaySeconds = 0.5f;

            GameObject eventSysGO = new GameObject("EventSystem");
            eventSysGO.AddComponent<EventSystem>();
            eventSysGO.AddComponent<StandaloneInputModule>();

            string path = $"{SCENES_DIR}/Bootstrap.unity";
            EditorSceneManager.SaveScene(scene, path);
            EditorSceneManager.CloseScene(scene, true);
            return path;
        }

        private static string BuildMainMenuScene()
        {
            Scene scene = SetupEmptyScene("MainMenu");
            scene.name = "MainMenu";

            GameObject cameraGO = new GameObject("Main Camera");
            cameraGO.tag = "MainCamera";
            Camera cam = cameraGO.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.98f, 0.97f, 0.95f);
            cam.orthographic = true;

            GameObject eventSysGO = new GameObject("EventSystem");
            eventSysGO.AddComponent<EventSystem>();
            eventSysGO.AddComponent<StandaloneInputModule>();

            GameObject controllerGO = new GameObject("SceneController");
            controllerGO.AddComponent<MainMenuSceneController>();

            GameObject canvasGO = new GameObject("MainCanvas");
            Canvas canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            CanvasScaler scaler = canvasGO.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGO.AddComponent<GraphicRaycaster>();

            string path = $"{SCENES_DIR}/MainMenu.unity";
            EditorSceneManager.SaveScene(scene, path);
            EditorSceneManager.CloseScene(scene, true);
            return path;
        }

        private static string BuildMatch3Scene()
        {
            Scene scene = SetupEmptyScene("Match3Level");
            scene.name = "Match3Level";

            GameObject cameraGO = new GameObject("Main Camera");
            cameraGO.tag = "MainCamera";
            Camera cam = cameraGO.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.95f, 0.94f, 0.9f);
            cam.orthographic = true;

            GameObject eventSysGO = new GameObject("EventSystem");
            eventSysGO.AddComponent<EventSystem>();
            eventSysGO.AddComponent<StandaloneInputModule>();

            GameObject controllerGO = new GameObject("SceneController");
            controllerGO.AddComponent<Match3SceneController>();

            GameObject canvasGO = new GameObject("MainCanvas");
            Canvas canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            CanvasScaler scaler = canvasGO.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGO.AddComponent<GraphicRaycaster>();

            string path = $"{SCENES_DIR}/Match3Level.unity";
            EditorSceneManager.SaveScene(scene, path);
            EditorSceneManager.CloseScene(scene, true);
            return path;
        }

        private static string BuildDecorationScene()
        {
            Scene scene = SetupEmptyScene("DecorationStudio");
            scene.name = "DecorationStudio";

            GameObject cameraGO = new GameObject("Main Camera");
            cameraGO.tag = "MainCamera";
            Camera cam = cameraGO.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.96f, 0.95f, 0.92f);
            cam.orthographic = true;

            GameObject eventSysGO = new GameObject("EventSystem");
            eventSysGO.AddComponent<EventSystem>();
            eventSysGO.AddComponent<StandaloneInputModule>();

            GameObject controllerGO = new GameObject("SceneController");
            controllerGO.AddComponent<DecorationSceneController>();

            GameObject canvasGO = new GameObject("MainCanvas");
            Canvas canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            CanvasScaler scaler = canvasGO.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            canvasGO.AddComponent<GraphicRaycaster>();

            string path = $"{SCENES_DIR}/DecorationStudio.unity";
            EditorSceneManager.SaveScene(scene, path);
            EditorSceneManager.CloseScene(scene, true);
            return path;
        }

        [MenuItem("DecorMatch3/Factory/Generate Everything (一键完成所有资源和场景)")]
        public static void GenerateEverything()
        {
            EditorUtility.DisplayProgressBar("正在生成...", "生成ScriptableObject数据...", 0.1f);
            try { ScriptableObjectGenerator.GenerateAllDataAssets(); } catch (System.Exception e) { Debug.LogWarning(e); }

            EditorUtility.DisplayProgressBar("正在生成...", "生成Prefab资源...", 0.4f);
            try { PrefabFactory.CreateAllPrefabs(); } catch (System.Exception e) { Debug.LogWarning(e); }

            EditorUtility.DisplayProgressBar("正在生成...", "构建Unity场景文件...", 0.7f);
            try { BuildAllScenes(); } catch (System.Exception e) { Debug.LogWarning(e); }

            EditorUtility.ClearProgressBar();
        }
    }
}
#endif
