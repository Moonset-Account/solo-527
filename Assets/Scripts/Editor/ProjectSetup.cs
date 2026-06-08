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
        }

        private static void SetupMainMenuScene(Scene scene)
        {
            CreateUICameraAndCanvas(scene, out GameObject canvasGO, out GameObject cameraGO);

            GameObject mainMenuGO = new GameObject("MainMenuView");
            mainMenuGO.transform.SetParent(canvasGO.transform, false);
            var mainMenu = mainMenuGO.AddComponent<UI.MainMenuView>();
            SetupUIViewDefaults(mainMenuGO);

            GameObject tutorialGO = new GameObject("TutorialView");
            tutorialGO.transform.SetParent(canvasGO.transform, false);
            var tutorial = tutorialGO.AddComponent<UI.TutorialView>();
            SetupUIViewDefaults(tutorialGO);

            GameObject settingsGO = new GameObject("SettingsView");
            settingsGO.transform.SetParent(canvasGO.transform, false);
            var settings = settingsGO.AddComponent<UI.SettingsView>();
            SetupUIViewDefaults(settingsGO);

            GameObject levelSelectGO = new GameObject("LevelSelectView");
            levelSelectGO.transform.SetParent(canvasGO.transform, false);
            var levelSelect = levelSelectGO.AddComponent<UI.LevelSelectView>();
            SetupUIViewDefaults(levelSelectGO);

            GameObject loadingGO = new GameObject("LoadingScreenView");
            loadingGO.transform.SetParent(canvasGO.transform, false);
            var loading = loadingGO.AddComponent<UI.LoadingScreenView>();
            SetupUIViewDefaults(loadingGO);

            GameObject uiManagerGO = new GameObject("UIManager");
            uiManagerGO.transform.SetParent(canvasGO.transform, false);
            var uiManager = uiManagerGO.AddComponent<UI.UIManager>();

            EditorUtility.SetDirty(uiManagerGO);
        }

        private static void SetupMatch3Scene(Scene scene)
        {
            GameObject cameraGO = new GameObject("Main Camera");
            cameraGO.tag = "MainCamera";
            Camera cam = cameraGO.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.15f, 0.12f, 0.2f);
            cam.orthographic = true;
            cam.orthographicSize = 6;
            cameraGO.AddComponent<AudioListener>();

            GameObject eventSystemGO = new GameObject("EventSystem");
            eventSystemGO.AddComponent<UnityEngine.EventSystems.EventSystem>();
            eventSystemGO.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();

            GameObject boardGO = new GameObject("Board");
            var board = boardGO.AddComponent<Gameplay.Match3.Board>();

            GameObject gemPrefabGO = CreateGemPrefab();
            PropertyInfo_InjectPrefab(board, gemPrefabGO);

            GameObject match3ManagerGO = new GameObject("Match3GameManager");
            match3ManagerGO.AddComponent<Gameplay.Match3.Match3GameManager>();

            CreateUICameraAndCanvas(scene, out GameObject canvasGO, out _, true);

            GameObject hudGO = new GameObject("Match3HUDView");
            hudGO.transform.SetParent(canvasGO.transform, false);
            var hud = hudGO.AddComponent<UI.Match3HUDView>();
            SetupUIViewDefaults(hudGO);

            GameObject pauseGO = new GameObject("PauseMenuView");
            pauseGO.transform.SetParent(canvasGO.transform, false);
            var pause = pauseGO.AddComponent<UI.PauseMenuView>();
            SetupUIViewDefaults(pauseGO);

            GameObject completeGO = new GameObject("LevelCompleteView");
            completeGO.transform.SetParent(canvasGO.transform, false);
            var complete = completeGO.AddComponent<UI.LevelCompleteView>();
            SetupUIViewDefaults(completeGO);

            GameObject failedGO = new GameObject("LevelFailedView");
            failedGO.transform.SetParent(canvasGO.transform, false);
            var failed = failedGO.AddComponent<UI.LevelFailedView>();
            SetupUIViewDefaults(failedGO);

            GameObject settingsGO = new GameObject("SettingsView");
            settingsGO.transform.SetParent(canvasGO.transform, false);
            var settings = settingsGO.AddComponent<UI.SettingsView>();
            SetupUIViewDefaults(settingsGO);
        }

        private static void SetupDecorationScene(Scene scene)
        {
            GameObject cameraGO = new GameObject("Main Camera");
            cameraGO.tag = "MainCamera";
            Camera cam = cameraGO.AddComponent<Camera>();
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.9f, 0.85f, 0.8f);
            cam.orthographic = true;
            cam.orthographicSize = 7;
            cameraGO.AddComponent<AudioListener>();

            GameObject eventSystemGO = new GameObject("EventSystem");
            eventSystemGO.AddComponent<UnityEngine.EventSystems.EventSystem>();
            eventSystemGO.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();

            GameObject roomGO = new GameObject("Room");
            GameObject wallGO = new GameObject("Wall");
            wallGO.transform.SetParent(roomGO.transform);
            SpriteRenderer wallSR = wallGO.AddComponent<SpriteRenderer>();
            wallSR.color = Color.white;
            wallSR.sortingOrder = -10;

            GameObject floorGO = new GameObject("Floor");
            floorGO.transform.SetParent(roomGO.transform);
            SpriteRenderer floorSR = floorGO.AddComponent<SpriteRenderer>();
            floorSR.color = new Color(0.7f, 0.55f, 0.4f);
            floorSR.sortingOrder = -5;
            floorGO.transform.localPosition = new Vector3(0, -4, 0);

            GameObject furnitureContainerGO = new GameObject("FurnitureContainer");
            furnitureContainerGO.transform.SetParent(roomGO.transform);

            GameObject decoSystemGO = new GameObject("DecorationSystem");
            var decoSystem = decoSystemGO.AddComponent<Gameplay.Decoration.DecorationSystem>();
            PropertyInfo_InjectField(decoSystem, "roomContainer", roomGO.transform);
            PropertyInfo_InjectField(decoSystem, "wallRenderer", wallSR);
            PropertyInfo_InjectField(decoSystem, "floorRenderer", floorSR);
            PropertyInfo_InjectField(decoSystem, "furnitureContainer", furnitureContainerGO.transform);

            GameObject reviewSystemGO = new GameObject("CustomerReviewSystem");
            reviewSystemGO.AddComponent<Gameplay.Customer.CustomerReviewSystem>();

            CreateUICameraAndCanvas(scene, out GameObject canvasGO, out _, true);

            GameObject hudGO = new GameObject("DecorationHUDView");
            hudGO.transform.SetParent(canvasGO.transform, false);
            var hud = hudGO.AddComponent<UI.DecorationHUDView>();
            SetupUIViewDefaults(hudGO);

            GameObject furnitureGO = new GameObject("FurniturePanelView");
            furnitureGO.transform.SetParent(canvasGO.transform, false);
            var furniture = furnitureGO.AddComponent<UI.FurniturePanelView>();
            SetupUIViewDefaults(furnitureGO);

            GameObject colorGO = new GameObject("ColorPanelView");
            colorGO.transform.SetParent(canvasGO.transform, false);
            var color = colorGO.AddComponent<UI.ColorPanelView>();
            SetupUIViewDefaults(colorGO);

            GameObject reviewGO = new GameObject("CustomerReviewView");
            reviewGO.transform.SetParent(canvasGO.transform, false);
            var review = reviewGO.AddComponent<UI.CustomerReviewView>();
            SetupUIViewDefaults(reviewGO);

            GameObject invGO = new GameObject("MaterialInventoryView");
            invGO.transform.SetParent(canvasGO.transform, false);
            var inv = invGO.AddComponent<UI.MaterialInventoryView>();
            SetupUIViewDefaults(invGO);
        }

        private static void SetupSettingsScene(Scene scene)
        {
            CreateUICameraAndCanvas(scene, out GameObject canvasGO, out _);

            GameObject settingsGO = new GameObject("SettingsView");
            settingsGO.transform.SetParent(canvasGO.transform, false);
            var settings = settingsGO.AddComponent<UI.SettingsView>();
            SetupUIViewDefaults(settingsGO);
        }

        private static GameObject CreateGemPrefab()
        {
            GameObject gemGO = GameObject.CreatePrimitive(PrimitiveType.Quad);
            gemGO.name = "Gem";
            gemGO.transform.localScale = Vector3.one * 0.8f;
            SpriteRenderer sr = gemGO.GetComponent<MeshRenderer>().gameObject.AddComponent<SpriteRenderer>();
            Object.DestroyImmediate(gemGO.GetComponent<MeshFilter>());
            Object.DestroyImmediate(gemGO.GetComponent<MeshRenderer>());
            Object.DestroyImmediate(gemGO.GetComponent<MeshCollider>());
            gemGO.AddComponent<Gameplay.Match3.Gem>();
            return gemGO;
        }

        private static void CreateUICameraAndCanvas(Scene scene, out GameObject canvasGO, out GameObject cameraGO, bool overlay = false)
        {
            cameraGO = GameObject.Find("Main Camera");
            if (cameraGO == null)
            {
                cameraGO = new GameObject("Main Camera");
                cameraGO.tag = "MainCamera";
                Camera cam = cameraGO.AddComponent<Camera>();
                cam.orthographic = true;
                cam.orthographicSize = 6;
                cameraGO.AddComponent<AudioListener>();
            }

            canvasGO = new GameObject("UICanvas");
            Canvas canvas = canvasGO.AddComponent<Canvas>();
            canvas.renderMode = overlay ? RenderMode.ScreenSpaceOverlay : RenderMode.ScreenSpaceCamera;
            if (!overlay)
            {
                canvas.worldCamera = cameraGO.GetComponent<Camera>();
            }

            CanvasScaler scaler = canvasGO.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;

            canvasGO.AddComponent<GraphicRaycaster>();

            if (!GameObject.Find("EventSystem"))
            {
                GameObject esGO = new GameObject("EventSystem");
                esGO.AddComponent<UnityEngine.EventSystems.EventSystem>();
                esGO.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }
        }

        private static void SetupUIViewDefaults(GameObject viewGO)
        {
            RectTransform rt = viewGO.GetComponent<RectTransform>();
            if (rt == null) rt = viewGO.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            CanvasGroup cg = viewGO.GetComponent<CanvasGroup>();
            if (cg == null) cg = viewGO.AddComponent<CanvasGroup>();
            cg.alpha = 0;
            cg.blocksRaycasts = false;
            cg.interactable = false;
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

        private static void PropertyInfo_InjectPrefab(Gameplay.Match3.Board board, GameObject prefab)
        {
            System.Reflection.FieldInfo field = typeof(Gameplay.Match3.Board).GetField("gemPrefab",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            if (field != null)
            {
                field.SetValue(board, prefab.GetComponent<Gameplay.Match3.Gem>());
            }
        }

        private static void PropertyInfo_InjectField(object target, string fieldName, object value)
        {
            System.Reflection.FieldInfo field = target.GetType().GetField(fieldName,
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            if (field != null)
            {
                field.SetValue(target, value);
            }
        }

        [MenuItem("DecorMatch3/Setup/Add Required Packages")]
        public static void AddRequiredPackages()
        {
            Debug.Log("Please ensure the following packages are installed via Package Manager:");
            Debug.Log("1. TextMeshPro (required for UI text)");
            Debug.Log("2. Unity UI (built-in)");
            Debug.Log("3. Input System (optional for new input system)");
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
            Debug.Log("1. Import TextMeshPro via Window > TextMeshPro > Import TMP Essential Resources");
            Debug.Log("2. Add your artwork and audio files to the appropriate folders");
            Debug.Log("3. Set up the Gem prefab with sprites");
            Debug.Log("4. Press Play on the Bootstrap scene");
        }
    }
}
