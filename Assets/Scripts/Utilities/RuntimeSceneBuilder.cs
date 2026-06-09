using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using DecorMatch3.Core;
using DecorMatch3.UI;
using DecorMatch3.Data;
using DecorMatch3.Audio;
using DecorMatch3.InputSystem;
using DecorMatch3.Utilities;
using DecorMatch3.Gameplay.Match3;
using DecorMatch3.Gameplay.Decoration;
using DecorMatch3.Gameplay.Customer;

namespace DecorMatch3
{
    public enum SceneBuildType
    {
        Bootstrap,
        MainMenu,
        Match3Level,
        Decoration,
        Settings
    }

    public class RuntimeSceneBuilder : MonoBehaviour
    {
        [SerializeField] private SceneBuildType sceneType = SceneBuildType.MainMenu;
        [SerializeField] private bool autoBuildOnAwake = true;

        private void Awake()
        {
            if (autoBuildOnAwake)
            {
                BuildScene();
            }
        }

        public void BuildScene()
        {
            EnsureEventSystem();

            switch (sceneType)
            {
                case SceneBuildType.Bootstrap:
                    BuildBootstrapScene();
                    break;
                case SceneBuildType.MainMenu:
                    BuildMainMenuScene();
                    break;
                case SceneBuildType.Match3Level:
                    BuildMatch3Scene();
                    break;
                case SceneBuildType.Decoration:
                    BuildDecorationScene();
                    break;
                case SceneBuildType.Settings:
                    BuildSettingsScene();
                    break;
            }
        }

        private void BuildBootstrapScene()
        {
            EnsureCamera(new Color(0.1f, 0.1f, 0.15f), 6);
            EnsureGameSystems();

            if (GetComponent<GameBootstrap>() == null)
            {
                gameObject.AddComponent<GameBootstrap>();
            }
        }

        private void BuildMainMenuScene()
        {
            EnsureCamera(new Color(0.12f, 0.1f, 0.18f), 6);
            EnsureGameSystems();
            Canvas canvas = EnsureUICanvas();

            CreateUIView<MainMenuView>(canvas.transform, "MainMenuView");
            CreateUIView<TutorialView>(canvas.transform, "TutorialView");
            CreateUIView<SettingsView>(canvas.transform, "SettingsView");
            CreateUIView<LevelSelectView>(canvas.transform, "LevelSelectView");
            CreateUIView<LoadingScreenView>(canvas.transform, "LoadingScreenView");
            CreateUIView<MaterialInventoryView>(canvas.transform, "MaterialInventoryView");

            EnsureUIManager(canvas.transform);

            if (UIManager.Instance != null)
            {
                UIManager.Instance.OpenView(UIView.MainMenu);
            }

            GameStateManager.Instance?.ChangeState(GameState.MainMenu);
            AudioManager.Instance?.PlayMusic(MusicType.MainMenu);
        }

        private void BuildMatch3Scene()
        {
            Camera cam = EnsureCamera(new Color(0.15f, 0.12f, 0.2f), 7);
            EnsureGameSystems();

            GameObject boardGO = new GameObject("Board");
            Board board = boardGO.AddComponent<Board>();
            boardGO.AddComponent<BoardSceneInitializer>();

            GameObject gemPrefab = CreateGemPrefab();
            System.Reflection.FieldInfo gemField = typeof(Board).GetField("gemPrefab",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            gemField?.SetValue(board, gemPrefab.GetComponent<Gem>());
            Destroy(gemPrefab);

            if (Match3GameManager.Instance == null)
            {
                GameObject m3GO = new GameObject("Match3GameManager");
                m3GO.AddComponent<Match3GameManager>();
            }

            Canvas canvas = EnsureUICanvas();

            CreateUIView<Match3HUDView>(canvas.transform, "Match3HUDView");
            CreateUIView<PauseMenuView>(canvas.transform, "PauseMenuView");
            CreateUIView<LevelCompleteView>(canvas.transform, "LevelCompleteView");
            CreateUIView<LevelFailedView>(canvas.transform, "LevelFailedView");
            CreateUIView<SettingsView>(canvas.transform, "SettingsView");
            CreateUIView<TutorialView>(canvas.transform, "TutorialView");

            EnsureUIManager(canvas.transform);

            int startLevel = SaveManager.Instance?.CurrentSave.Progress.HighestUnlockedLevel ?? 1;
            OrderData order = LevelManager.Instance.GetOrderForLevel(startLevel);
            if (order != null)
            {
                LevelManager.Instance.StartOrder(order.OrderId);
            }
            LevelManager.Instance.StartLevel(startLevel);

            if (UIManager.Instance != null)
            {
                UIManager.Instance.OpenView(UIView.Match3HUD);
            }

            GameStateManager.Instance?.ChangeState(GameState.PlayingMatch3);
        }

        private void BuildDecorationScene()
        {
            Camera cam = EnsureCamera(new Color(0.9f, 0.85f, 0.8f), 8);
            EnsureGameSystems();

            GameObject roomGO = new GameObject("Room");
            GameObject wallGO = new GameObject("Wall");
            wallGO.transform.SetParent(roomGO.transform);
            SpriteRenderer wallSR = wallGO.AddComponent<SpriteRenderer>();
            wallSR.color = Color.white;
            wallSR.sortingOrder = -10;
            wallSR.transform.localScale = new Vector3(25f, 14f, 1f);
            Texture2D wallTex = new Texture2D(1, 1);
            wallTex.SetPixel(0, 0, new Color(0.95f, 0.92f, 0.88f));
            wallTex.Apply();
            wallSR.sprite = Sprite.Create(wallTex, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f));

            GameObject floorGO = new GameObject("Floor");
            floorGO.transform.SetParent(roomGO.transform);
            SpriteRenderer floorSR = floorGO.AddComponent<SpriteRenderer>();
            floorSR.sortingOrder = -5;
            floorGO.transform.localPosition = new Vector3(0, -4.5f, 0);
            floorSR.transform.localScale = new Vector3(25f, 5f, 1f);
            Texture2D floorTex = new Texture2D(1, 1);
            floorTex.SetPixel(0, 0, new Color(0.7f, 0.55f, 0.4f));
            floorTex.Apply();
            floorSR.sprite = Sprite.Create(floorTex, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f));

            GameObject furnContainerGO = new GameObject("FurnitureContainer");
            furnContainerGO.transform.SetParent(roomGO.transform);

            if (DecorationSystem.Instance == null)
            {
                GameObject decoSysGO = new GameObject("DecorationSystem");
                DecorationSystem decoSys = decoSysGO.AddComponent<DecorationSystem>();
                System.Reflection.FieldInfo roomField = typeof(DecorationSystem).GetField("roomContainer",
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                roomField?.SetValue(decoSys, roomGO.transform);
                System.Reflection.FieldInfo wallField = typeof(DecorationSystem).GetField("wallRenderer",
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                wallField?.SetValue(decoSys, wallSR);
                System.Reflection.FieldInfo floorField = typeof(DecorationSystem).GetField("floorRenderer",
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                floorField?.SetValue(decoSys, floorSR);
                System.Reflection.FieldInfo furnField = typeof(DecorationSystem).GetField("furnitureContainer",
                    System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                furnField?.SetValue(decoSys, furnContainerGO.transform);
            }

            if (CustomerReviewSystem.Instance == null)
            {
                GameObject reviewGO = new GameObject("CustomerReviewSystem");
                reviewGO.AddComponent<CustomerReviewSystem>();
            }

            Canvas canvas = EnsureUICanvas();

            CreateUIView<DecorationHUDView>(canvas.transform, "DecorationHUDView");
            CreateUIView<FurniturePanelView>(canvas.transform, "FurniturePanelView");
            CreateUIView<ColorPanelView>(canvas.transform, "ColorPanelView");
            CreateUIView<CustomerReviewView>(canvas.transform, "CustomerReviewView");
            CreateUIView<MaterialInventoryView>(canvas.transform, "MaterialInventoryView");
            CreateUIView<SettingsView>(canvas.transform, "SettingsView");
            CreateUIView<PauseMenuView>(canvas.transform, "PauseMenuView");

            EnsureUIManager(canvas.transform);

            int startLevel = SaveManager.Instance?.CurrentSave.Progress.HighestUnlockedLevel ?? 1;
            OrderData order = LevelManager.Instance.GetOrderForLevel(Mathf.Max(1, startLevel - 1));
            if (order == null)
            {
                order = LevelManager.Instance.GetOrder(1);
                if (order != null)
                {
                    LevelManager.Instance.StartOrder(order.OrderId);
                }
            }
            else
            {
                LevelManager.Instance.StartOrder(order.OrderId);
            }

            DecorationSystem.Instance.LoadRoomForOrder(LevelManager.Instance.CurrentOrder);

            if (UIManager.Instance != null)
            {
                UIManager.Instance.OpenView(UIView.DecorationHUD);
            }

            GameStateManager.Instance?.ChangeState(GameState.Decorating);
            AudioManager.Instance?.PlayMusic(MusicType.Decoration);
        }

        private void BuildSettingsScene()
        {
            EnsureCamera(new Color(0.1f, 0.1f, 0.15f), 6);
            EnsureGameSystems();
            Canvas canvas = EnsureUICanvas();

            CreateUIView<SettingsView>(canvas.transform, "SettingsView");
            EnsureUIManager(canvas.transform);

            UIManager.Instance?.OpenView(UIView.Settings);
            GameStateManager.Instance?.ChangeState(GameState.Settings);
        }

        private Camera EnsureCamera(Color bgColor, float orthoSize)
        {
            Camera cam = Camera.main;
            if (cam == null)
            {
                GameObject camGO = new GameObject("Main Camera");
                camGO.tag = "MainCamera";
                cam = camGO.AddComponent<Camera>();
                camGO.AddComponent<AudioListener>();
            }

            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = bgColor;
            cam.orthographic = true;
            cam.orthographicSize = orthoSize;
            cam.transform.position = new Vector3(0, 0, -10);
            cam.transform.rotation = Quaternion.identity;
            return cam;
        }

        private void EnsureEventSystem()
        {
            if (FindObjectOfType<EventSystem>() == null)
            {
                GameObject esGO = new GameObject("EventSystem");
                esGO.AddComponent<EventSystem>();
                esGO.AddComponent<StandaloneInputModule>();
            }
        }

        private void EnsureGameSystems()
        {
            EnsureSystem<SceneLoader>();
            EnsureSystem<GameStateManager>();
            EnsureSystem<InputManager>();
            EnsureSystem<ResourceManager>();
            EnsureSystem<SaveManager>();
            EnsureSystem<LevelManager>();
            EnsureSystem<AudioManager>();
            EnsureSystem<UIManager>();
            EnsureSystem<FeedbackManager>();
        }

        private T EnsureSystem<T>() where T : MonoBehaviour
        {
            T instance = FindObjectOfType<T>();
            if (instance == null)
            {
                GameObject systemsParent = GameObject.Find("GameSystems");
                if (systemsParent == null)
                {
                    systemsParent = new GameObject("GameSystems");
                    DontDestroyOnLoad(systemsParent);
                }

                GameObject go = new GameObject(typeof(T).Name);
                go.transform.SetParent(systemsParent.transform);
                instance = go.AddComponent<T>();
            }
            return instance;
        }

        private Canvas EnsureUICanvas()
        {
            Canvas canvas = FindObjectOfType<Canvas>();
            if (canvas == null)
            {
                GameObject canvasGO = new GameObject("UICanvas");
                canvas = canvasGO.AddComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvas.sortingOrder = 10;

                CanvasScaler scaler = canvasGO.AddComponent<CanvasScaler>();
                scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                scaler.referenceResolution = new Vector2(1920, 1080);
                scaler.matchWidthOrHeight = 0.5f;

                canvasGO.AddComponent<GraphicRaycaster>();
            }
            return canvas;
        }

        private UIManager EnsureUIManager(Transform parent)
        {
            UIManager uiManager = UIManager.Instance;
            if (uiManager == null)
            {
                GameObject go = new GameObject("UIManager");
                go.transform.SetParent(parent);
                uiManager = go.AddComponent<UIManager>();
            }
            return uiManager;
        }

        private T CreateUIView<T>(Transform parent, string name) where T : UIViewBase
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);

            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;

            CanvasGroup cg = go.AddComponent<CanvasGroup>();
            cg.alpha = 0;
            cg.blocksRaycasts = false;
            cg.interactable = false;

            T view = go.AddComponent<T>();

            CreateBasicViewElements(go, typeof(T).Name);

            UIManager.Instance?.RegisterView(view);
            view.gameObject.SetActive(true);

            return view;
        }

        private void CreateBasicViewElements(GameObject parentGO, string viewName)
        {
            GameObject panel = new GameObject("Panel");
            panel.transform.SetParent(parentGO.transform, false);
            RectTransform prt = panel.AddComponent<RectTransform>();
            prt.anchorMin = new Vector2(0.1f, 0.1f);
            prt.anchorMax = new Vector2(0.9f, 0.9f);
            prt.offsetMin = Vector2.zero;
            prt.offsetMax = Vector2.zero;

            Image panelImg = panel.AddComponent<Image>();
            panelImg.color = new Color(0.1f, 0.1f, 0.15f, 0.95f);
            panelImg.sprite = null;

            GameObject titleGO = new GameObject("Title");
            titleGO.transform.SetParent(panel.transform, false);
            RectTransform trt = titleGO.AddComponent<RectTransform>();
            trt.anchorMin = new Vector2(0, 1);
            trt.anchorMax = new Vector2(1, 1);
            trt.pivot = new Vector2(0.5f, 1);
            trt.anchoredPosition = new Vector2(0, -40);
            trt.sizeDelta = new Vector2(0, 60);

            Text titleText = titleGO.AddComponent<Text>();
            titleText.text = GetUITitle(viewName);
            titleText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            titleText.fontSize = 36;
            titleText.alignment = TextAnchor.MiddleCenter;
            titleText.color = Color.white;

            if (viewName != "Match3HUDView" && viewName != "DecorationHUDView")
            {
                GameObject closeBtnGO = new GameObject("CloseButton");
                closeBtnGO.transform.SetParent(panel.transform, false);
                RectTransform crt = closeBtnGO.AddComponent<RectTransform>();
                crt.anchorMin = new Vector2(1, 1);
                crt.anchorMax = new Vector2(1, 1);
                crt.pivot = new Vector2(1, 1);
                crt.anchoredPosition = new Vector2(-20, -20);
                crt.sizeDelta = new Vector2(80, 40);

                Image closeImg = closeBtnGO.AddComponent<Image>();
                closeImg.color = new Color(0.8f, 0.3f, 0.3f);
                Button closeBtn = closeBtnGO.AddComponent<Button>();

                GameObject closeTextGO = new GameObject("Text");
                closeTextGO.transform.SetParent(closeBtnGO.transform, false);
                RectTransform ctrt = closeTextGO.AddComponent<RectTransform>();
                ctrt.anchorMin = Vector2.zero;
                ctrt.anchorMax = Vector2.one;
                ctrt.offsetMin = Vector2.zero;
                ctrt.offsetMax = Vector2.zero;
                Text closeText = closeTextGO.AddComponent<Text>();
                closeText.text = "关闭";
                closeText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                closeText.fontSize = 18;
                closeText.alignment = TextAnchor.MiddleCenter;
                closeText.color = Color.white;

                closeBtn.onClick.AddListener(() =>
                {
                    AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
                    UIManager.Instance?.GoBack();
                });
            }
        }

        private string GetUITitle(string viewName)
        {
            switch (viewName)
            {
                case "MainMenuView": return "🏠 装修配色三消";
                case "TutorialView": return "📖 游戏教程";
                case "SettingsView": return "⚙️ 系统设置";
                case "LevelSelectView": return "🗺️ 关卡选择";
                case "PauseMenuView": return "⏸️ 游戏暂停";
                case "LevelCompleteView": return "🎉 关卡完成";
                case "LevelFailedView": return "😢 挑战失败";
                case "DecorationHUDView": return "";
                case "Match3HUDView": return "";
                case "FurniturePanelView": return "🛋️ 家具选择";
                case "ColorPanelView": return "🎨 配色方案";
                case "CustomerReviewView": return "💬 客户评价";
                case "MaterialInventoryView": return "📦 材料仓库";
                case "LoadingScreenView": return "⏳ 加载中...";
                default: return viewName;
            }
        }

        private GameObject CreateGemPrefab()
        {
            GameObject gemGO = GameObject.CreatePrimitive(PrimitiveType.Quad);
            gemGO.name = "Gem";
            gemGO.transform.localScale = Vector3.one * 0.85f;

            DestroyImmediate(gemGO.GetComponent<MeshFilter>());
            DestroyImmediate(gemGO.GetComponent<MeshRenderer>());
            DestroyImmediate(gemGO.GetComponent<MeshCollider>());

            SpriteRenderer sr = gemGO.AddComponent<SpriteRenderer>();
            Texture2D tex = new Texture2D(64, 64);
            for (int x = 0; x < 64; x++)
            {
                for (int y = 0; y < 64; y++)
                {
                    float dx = (x - 32) / 32f;
                    float dy = (y - 32) / 32f;
                    float d = Mathf.Sqrt(dx * dx + dy * dy);
                    tex.SetPixel(x, y, d < 0.9f ? Color.white : new Color(0, 0, 0, 0));
                }
            }
            tex.Apply();
            sr.sprite = Sprite.Create(tex, new Rect(0, 0, 64, 64), new Vector2(0.5f, 0.5f));

            gemGO.AddComponent<Gem>();
            return gemGO;
        }
    }
}
