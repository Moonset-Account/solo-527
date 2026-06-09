using System.Reflection;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
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
    public enum SceneBuildType { Bootstrap, MainMenu, Match3Level, Decoration, Settings }

    public partial class RuntimeSceneBuilder : MonoBehaviour
    {
        [SerializeField] private SceneBuildType sceneType = SceneBuildType.MainMenu;
        [SerializeField] private bool autoBuildOnAwake = true;
        private static Font _cachedFont;
        public static Font UIFont => _cachedFont ?? (_cachedFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"));

        private void Awake() { if (autoBuildOnAwake) BuildScene(); }

        public void BuildScene()
        {
            EnsureEventSystem();
            switch (sceneType)
            {
                case SceneBuildType.Bootstrap: BuildBootstrapScene(); break;
                case SceneBuildType.MainMenu: BuildMainMenuScene(); break;
                case SceneBuildType.Match3Level: BuildMatch3Scene(); break;
                case SceneBuildType.Decoration: BuildDecorationScene(); break;
                case SceneBuildType.Settings: BuildSettingsScene(); break;
            }
        }

        private void BuildBootstrapScene()
        {
            EnsureCamera(new Color(0.08f, 0.08f, 0.12f), 6);
            EnsureGameSystems();
            if (GetComponent<GameBootstrap>() == null) gameObject.AddComponent<GameBootstrap>();
            Canvas c = EnsureUICanvas();
            CreateUIView<LoadingScreenView>(c.transform, "LoadingScreenView", UIBuilder.BuildLoadingScreen);
            CreateUIView<TutorialView>(c.transform, "TutorialView", (go, v) => UIBuilder.BuildTutorial(go, v, sceneType));
            CreateUIView<SettingsView>(c.transform, "SettingsView", (go, v) => UIBuilder.BuildSettings(go, v, sceneType));
            EnsureUIManager(c.transform);
            StartCoroutine(DelayedBootstrap());
        }

        private System.Collections.IEnumerator DelayedBootstrap()
        {
            yield return null;
            SaveManager.Instance?.LoadOrCreateSave();
            LevelManager.Instance?.LoadAllData();
            UIManager.Instance?.OpenView(UIView.LoadingScreen);
            yield return new WaitForSeconds(0.8f);
            UIManager.Instance?.CloseAllViews();
            SceneManager.LoadScene("MainMenu");
        }

        private void BuildMainMenuScene()
        {
            EnsureCamera(new Color(0.12f, 0.1f, 0.2f), 6);
            EnsureGameSystems();
            Canvas c = EnsureUICanvas();
            CreateUIView<MainMenuView>(c.transform, "MainMenuView", UIBuilder.BuildMainMenu);
            CreateUIView<TutorialView>(c.transform, "TutorialView", (go, v) => UIBuilder.BuildTutorial(go, v, sceneType));
            CreateUIView<SettingsView>(c.transform, "SettingsView", (go, v) => UIBuilder.BuildSettings(go, v, sceneType));
            CreateUIView<LevelSelectView>(c.transform, "LevelSelectView", UIBuilder.BuildLevelSelect);
            CreateUIView<LoadingScreenView>(c.transform, "LoadingScreenView", UIBuilder.BuildLoadingScreen);
            CreateUIView<MaterialInventoryView>(c.transform, "MaterialInventoryView", UIBuilder.BuildMaterialInventory);
            EnsureUIManager(c.transform);
            UIManager.Instance?.OpenView(UIView.MainMenu);
            GameStateManager.Instance?.ChangeState(GameState.MainMenu);
            AudioManager.Instance?.PlayMusic(MusicType.MainMenu);
            StartCoroutine(AutoShowTutorialIfNeeded());
        }

        private System.Collections.IEnumerator AutoShowTutorialIfNeeded()
        {
            yield return new WaitForSeconds(0.6f);
            if (SaveManager.Instance != null &&
                !SaveManager.Instance.CurrentSave.Progress.TutorialCompleted &&
                SaveManager.Instance.CurrentSave.Settings.ShowTutorials)
            {
                UIManager.Instance?.OpenView(UIView.Tutorial);
                GameStateManager.Instance?.ChangeState(GameState.Tutorial);
            }
        }

        private void BuildMatch3Scene()
        {
            EnsureCamera(new Color(0.15f, 0.12f, 0.22f), 7);
            EnsureGameSystems();
            GameObject bgo = new GameObject("Board");
            Board board = bgo.AddComponent<Board>();
            bgo.AddComponent<BoardSceneInitializer>();
            GameObject gemPrefab = GemFactory.CreateGemPrefab();
            typeof(Board).GetField("gemPrefab", BindingFlags.NonPublic | BindingFlags.Instance)
                ?.SetValue(board, gemPrefab.GetComponent<Gem>());
            Destroy(gemPrefab);
            if (FindObjectOfType<Match3GameManager>() == null)
                new GameObject("Match3GameManager").AddComponent<Match3GameManager>();
            Canvas c = EnsureUICanvas();
            CreateUIView<Match3HUDView>(c.transform, "Match3HUDView", UIBuilder.BuildMatch3HUD);
            CreateUIView<PauseMenuView>(c.transform, "PauseMenuView", (go, v) => UIBuilder.BuildPause(go, v, sceneType));
            CreateUIView<LevelCompleteView>(c.transform, "LevelCompleteView", UIBuilder.BuildLevelComplete);
            CreateUIView<LevelFailedView>(c.transform, "LevelFailedView", UIBuilder.BuildLevelFailed);
            CreateUIView<SettingsView>(c.transform, "SettingsView", (go, v) => UIBuilder.BuildSettings(go, v, sceneType));
            CreateUIView<TutorialView>(c.transform, "TutorialView", (go, v) => UIBuilder.BuildTutorial(go, v, sceneType));
            EnsureUIManager(c.transform);
            int start = SaveManager.Instance?.CurrentSave.Progress.HighestUnlockedLevel ?? 1;
            OrderData o = LevelManager.Instance.GetOrderForLevel(start);
            if (o != null) LevelManager.Instance.StartOrder(o.OrderId);
            LevelManager.Instance.StartLevel(start);
            UIManager.Instance?.OpenView(UIView.Match3HUD);
            GameStateManager.Instance?.ChangeState(GameState.PlayingMatch3);
            StartCoroutine(SubscribePauseInput());
        }

        private System.Collections.IEnumerator SubscribePauseInput()
        {
            yield return null;
            EventBus.Subscribe<InputEvent>(OnInputEvt);
        }

        private void OnInputEvt(InputEvent e)
        {
            if (e.ActionType == InputActionType.Pause && GameStateManager.Instance != null)
            {
                var s = GameStateManager.Instance.CurrentState;
                if (s == GameState.PlayingMatch3 || s == GameState.Decorating)
                {
                    UIManager.Instance?.OpenView(UIView.PauseMenu);
                    GameStateManager.Instance?.ChangeState(GameState.Paused);
                    if (AudioManager.Instance != null) AudioManager.Instance.MasterPitch = 0.7f;
                }
            }
            else if (e.ActionType == InputActionType.Back) UIManager.Instance?.GoBack();
        }

        private void BuildDecorationScene()
        {
            EnsureCamera(new Color(0.92f, 0.86f, 0.8f), 8);
            EnsureGameSystems();
            GameObject roomGO = new GameObject("Room");
            GameObject wallGO = new GameObject("Wall"); wallGO.transform.SetParent(roomGO.transform);
            SpriteRenderer wallSR = wallGO.AddComponent<SpriteRenderer>();
            wallSR.sortingOrder = -10; wallSR.transform.localScale = new Vector3(25f, 14f, 1f);
            wallSR.sprite = Sprite.Create(UIPrim.MakeSolidTex(new Color(0.95f, 0.92f, 0.88f)), new Rect(0,0,1,1), new Vector2(0.5f,0.5f));
            GameObject floorGO = new GameObject("Floor"); floorGO.transform.SetParent(roomGO.transform);
            SpriteRenderer floorSR = floorGO.AddComponent<SpriteRenderer>();
            floorSR.sortingOrder = -5; floorGO.transform.localPosition = new Vector3(0, -4.5f, 0);
            floorSR.transform.localScale = new Vector3(25f, 5f, 1f);
            floorSR.sprite = Sprite.Create(UIPrim.MakeSolidTex(new Color(0.72f, 0.58f, 0.42f)), new Rect(0,0,1,1), new Vector2(0.5f,0.5f));
            GameObject fCGO = new GameObject("FurnitureContainer"); fCGO.transform.SetParent(roomGO.transform);
            if (FindObjectOfType<DecorationSystem>() == null)
            {
                DecorationSystem d = new GameObject("DecorationSystem").AddComponent<DecorationSystem>();
                var bf = BindingFlags.NonPublic | BindingFlags.Instance;
                typeof(DecorationSystem).GetField("roomContainer", bf)?.SetValue(d, roomGO.transform);
                typeof(DecorationSystem).GetField("wallRenderer", bf)?.SetValue(d, wallSR);
                typeof(DecorationSystem).GetField("floorRenderer", bf)?.SetValue(d, floorSR);
                typeof(DecorationSystem).GetField("furnitureContainer", bf)?.SetValue(d, fCGO.transform);
            }
            if (FindObjectOfType<CustomerReviewSystem>() == null)
                new GameObject("CustomerReviewSystem").AddComponent<CustomerReviewSystem>();
            Canvas c = EnsureUICanvas();
            CreateUIView<DecorationHUDView>(c.transform, "DecorationHUDView", UIBuilder.BuildDecorationHUD);
            CreateUIView<FurniturePanelView>(c.transform, "FurniturePanelView", UIBuilder.BuildFurniturePanel);
            CreateUIView<ColorPanelView>(c.transform, "ColorPanelView", UIBuilder.BuildColorPanel);
            CreateUIView<CustomerReviewView>(c.transform, "CustomerReviewView", UIBuilder.BuildCustomerReview);
            CreateUIView<MaterialInventoryView>(c.transform, "MaterialInventoryView", UIBuilder.BuildMaterialInventory);
            CreateUIView<SettingsView>(c.transform, "SettingsView", (go, v) => UIBuilder.BuildSettings(go, v, sceneType));
            CreateUIView<PauseMenuView>(c.transform, "PauseMenuView", (go, v) => UIBuilder.BuildPause(go, v, sceneType));
            EnsureUIManager(c.transform);
            int start = SaveManager.Instance?.CurrentSave.Progress.HighestUnlockedLevel ?? 1;
            OrderData ord = LevelManager.Instance.GetOrderForLevel(Mathf.Max(1, start - 1)) ?? LevelManager.Instance.GetOrder(1);
            if (ord != null) LevelManager.Instance.StartOrder(ord.OrderId);
            DecorationSystem.Instance?.LoadRoomForOrder(LevelManager.Instance.CurrentOrder);
            UIManager.Instance?.OpenView(UIView.DecorationHUD);
            GameStateManager.Instance?.ChangeState(GameState.Decorating);
            AudioManager.Instance?.PlayMusic(MusicType.Decoration);
            StartCoroutine(SubscribePauseInput());
        }

        private void BuildSettingsScene()
        {
            EnsureCamera(new Color(0.1f, 0.1f, 0.15f), 6);
            EnsureGameSystems();
            Canvas c = EnsureUICanvas();
            CreateUIView<SettingsView>(c.transform, "SettingsView", (go, v) => UIBuilder.BuildSettings(go, v, sceneType));
            EnsureUIManager(c.transform);
            UIManager.Instance?.OpenView(UIView.Settings);
            GameStateManager.Instance?.ChangeState(GameState.Settings);
        }

        // ---- base helpers ----
        private Camera EnsureCamera(Color bg, float ortho)
        {
            Camera cam = Camera.main;
            if (cam == null)
            {
                GameObject cgo = new GameObject("Main Camera"); cgo.tag = "MainCamera";
                cam = cgo.AddComponent<Camera>(); cgo.AddComponent<AudioListener>();
            }
            cam.clearFlags = CameraClearFlags.SolidColor; cam.backgroundColor = bg;
            cam.orthographic = true; cam.orthographicSize = ortho;
            cam.transform.position = new Vector3(0, 0, -10); cam.transform.rotation = Quaternion.identity;
            return cam;
        }

        private void EnsureEventSystem()
        {
            if (FindObjectOfType<EventSystem>() == null)
            {
                GameObject e = new GameObject("EventSystem");
                e.AddComponent<EventSystem>(); e.AddComponent<StandaloneInputModule>();
            }
        }

        private void EnsureGameSystems()
        {
            EnsureSystem<SceneLoader>(); EnsureSystem<GameStateManager>(); EnsureSystem<InputManager>();
            EnsureSystem<ResourceManager>(); EnsureSystem<SaveManager>(); EnsureSystem<LevelManager>();
            EnsureSystem<AudioManager>(); EnsureSystem<UIManager>(); EnsureSystem<FeedbackManager>();
        }

        private T EnsureSystem<T>() where T : MonoBehaviour
        {
            T inst = FindObjectOfType<T>();
            if (inst == null)
            {
                GameObject p = GameObject.Find("GameSystems");
                if (p == null) { p = new GameObject("GameSystems"); DontDestroyOnLoad(p); }
                GameObject go = new GameObject(typeof(T).Name);
                go.transform.SetParent(p.transform, false); inst = go.AddComponent<T>();
            }
            return inst;
        }

        private Canvas EnsureUICanvas()
        {
            Canvas c = FindObjectOfType<Canvas>();
            if (c == null)
            {
                GameObject cgo = new GameObject("UICanvas");
                c = cgo.AddComponent<Canvas>(); c.renderMode = RenderMode.ScreenSpaceOverlay; c.sortingOrder = 10;
                CanvasScaler s = cgo.AddComponent<CanvasScaler>();
                s.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                s.referenceResolution = new Vector2(1920, 1080); s.matchWidthOrHeight = 0.5f;
                cgo.AddComponent<GraphicRaycaster>();
            }
            return c;
        }

        private UIManager EnsureUIManager(Transform p)
        {
            UIManager m = UIManager.Instance;
            if (m == null)
            {
                GameObject go = new GameObject("UIManager");
                go.transform.SetParent(p, false); m = go.AddComponent<UIManager>();
            }
            return m;
        }

        private T CreateUIView<T>(Transform p, string name, System.Action<GameObject, T> build) where T : UIViewBase
        {
            GameObject go = new GameObject(name); go.transform.SetParent(p, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one;
            rt.offsetMin = Vector2.zero; rt.offsetMax = Vector2.zero;
            CanvasGroup cg = go.AddComponent<CanvasGroup>();
            cg.alpha = 0; cg.blocksRaycasts = false; cg.interactable = false;
            T view = go.AddComponent<T>(); build?.Invoke(go, view);
            UIManager.Instance?.RegisterView(view); go.SetActive(true);
            return view;
        }
    }

    // ---- Primitive helpers (separate static class for readability) ----
    internal static class UIPrim
    {
        public static Texture2D MakeSolidTex(Color c)
        {
            Texture2D t = new Texture2D(4, 4);
            Color[] px = new Color[16]; for (int i = 0; i < 16; i++) px[i] = c;
            t.SetPixels(px); t.Apply(); return t;
        }
        public static Sprite MakeSprite(Color c) => Sprite.Create(MakeSolidTex(c), new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));

        public static RectTransform MakePanel(Transform p, string name, Vector2 aMin, Vector2 aMax,
            Vector2 oMin, Vector2 oMax, Color bg)
        {
            GameObject go = new GameObject(name); go.transform.SetParent(p, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = aMin; rt.anchorMax = aMax; rt.offsetMin = oMin; rt.offsetMax = oMax;
            Image img = go.AddComponent<Image>(); img.color = bg; img.sprite = MakeSprite(bg);
            return rt;
        }

        public static Text MakeText(Transform p, string name, string text, int size,
            TextAnchor anchor, Vector2 aPos, Vector2 sd, Color c, Vector2 pivot = default)
        {
            GameObject go = new GameObject(name); go.transform.SetParent(p, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f); rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.pivot = pivot == default ? new Vector2(0.5f, 0.5f) : pivot;
            rt.anchoredPosition = aPos; rt.sizeDelta = sd;
            Text t = go.AddComponent<Text>();
            t.font = RuntimeSceneBuilder.UIFont; t.text = text; t.fontSize = size;
            t.alignment = anchor; t.color = c;
            t.horizontalOverflow = HorizontalWrapMode.Overflow; t.verticalOverflow = VerticalWrapMode.Overflow;
            return t;
        }

        public static Text MakeTextStretch(Transform p, string name, string text, int size,
            TextAnchor anchor, Vector2 aMin, Vector2 aMax, Vector2 oMin, Vector2 oMax, Color c)
        {
            GameObject go = new GameObject(name); go.transform.SetParent(p, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = aMin; rt.anchorMax = aMax; rt.offsetMin = oMin; rt.offsetMax = oMax;
            Text t = go.AddComponent<Text>();
            t.font = RuntimeSceneBuilder.UIFont; t.text = text; t.fontSize = size;
            t.alignment = anchor; t.color = c;
            t.horizontalOverflow = HorizontalWrapMode.Wrap; t.verticalOverflow = VerticalWrapMode.Overflow;
            return t;
        }

        public static Button MakeButton(Transform p, string name, string label,
            Vector2 aPos, Vector2 sd, Color bg, Color tc, int fsz = 22)
        {
            GameObject go = new GameObject(name); go.transform.SetParent(p, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f); rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.anchoredPosition = aPos; rt.sizeDelta = sd;
            Image img = go.AddComponent<Image>(); img.color = bg; img.sprite = MakeSprite(bg);
            Button b = go.AddComponent<Button>();
            MakeText(go.transform, "Lbl", label, fsz, TextAnchor.MiddleCenter, Vector2.zero, sd, tc);
            return b;
        }

        public static Button MakeButtonAnchored(Transform p, string name, string label,
            Vector2 aMin, Vector2 aMax, Vector2 pivot, Vector2 aPos, Vector2 sd,
            Color bg, Color tc, int fsz = 22)
        {
            GameObject go = new GameObject(name); go.transform.SetParent(p, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = aMin; rt.anchorMax = aMax; rt.pivot = pivot;
            rt.anchoredPosition = aPos; rt.sizeDelta = sd;
            Image img = go.AddComponent<Image>(); img.color = bg; img.sprite = MakeSprite(bg);
            Button b = go.AddComponent<Button>();
            MakeText(go.transform, "Lbl", label, fsz, TextAnchor.MiddleCenter, Vector2.zero, sd, tc);
            return b;
        }

        public static Slider MakeSlider(Transform p, string name, Vector2 aPos, Vector2 sd,
            float min, float max, float val, Color bgC, Color fillC)
        {
            GameObject go = new GameObject(name); go.transform.SetParent(p, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f); rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.anchoredPosition = aPos; rt.sizeDelta = sd;
            Image bg = go.AddComponent<Image>(); bg.color = bgC; bg.sprite = MakeSprite(bgC);

            GameObject fa = new GameObject("FillArea"); fa.transform.SetParent(go.transform, false);
            RectTransform faRT = fa.AddComponent<RectTransform>();
            faRT.anchorMin = new Vector2(0, 0.25f); faRT.anchorMax = new Vector2(1, 0.75f);
            faRT.offsetMin = new Vector2(10, 0); faRT.offsetMax = new Vector2(-10, 0);
            GameObject fill = new GameObject("Fill"); fill.transform.SetParent(fa.transform, false);
            RectTransform fRT = fill.AddComponent<RectTransform>();
            fRT.anchorMin = Vector2.zero; fRT.anchorMax = Vector2.one;
            fRT.offsetMin = Vector2.zero; fRT.offsetMax = Vector2.zero;
            Image fi = fill.AddComponent<Image>(); fi.color = fillC; fi.sprite = MakeSprite(fillC);

            GameObject ha = new GameObject("HandleArea"); ha.transform.SetParent(go.transform, false);
            RectTransform haRT = ha.AddComponent<RectTransform>();
            haRT.anchorMin = Vector2.zero; haRT.anchorMax = Vector2.one;
            haRT.offsetMin = new Vector2(20, 0); haRT.offsetMax = new Vector2(-20, 0);
            GameObject h = new GameObject("Handle"); h.transform.SetParent(ha.transform, false);
            RectTransform hRT = h.AddComponent<RectTransform>(); hRT.sizeDelta = new Vector2(30, 30);
            Image hi = h.AddComponent<Image>(); hi.color = Color.white; hi.sprite = MakeSprite(Color.white);

            Slider s = go.AddComponent<Slider>();
            s.fillRect = fRT; s.handleRect = hRT; s.targetGraphic = hi;
            s.direction = Slider.Direction.LeftToRight;
            s.minValue = min; s.maxValue = max; s.value = val;
            return s;
        }

        public static Toggle MakeToggle(Transform p, string name, Vector2 aPos, Vector2 sd, bool on)
        {
            GameObject go = new GameObject(name); go.transform.SetParent(p, false);
            RectTransform rt = go.AddComponent<RectTransform>();
            rt.anchorMin = new Vector2(0.5f, 0.5f); rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.anchoredPosition = aPos; rt.sizeDelta = sd;
            Image bgi = go.AddComponent<Image>();
            var bc = new Color(0.25f, 0.25f, 0.35f);
            bgi.color = bc; bgi.sprite = MakeSprite(bc);
            GameObject m = new GameObject("Mark"); m.transform.SetParent(go.transform, false);
            RectTransform mRT = m.AddComponent<RectTransform>();
            mRT.anchorMin = new Vector2(0.15f, 0.15f); mRT.anchorMax = new Vector2(0.85f, 0.85f);
            mRT.offsetMin = Vector2.zero; mRT.offsetMax = Vector2.zero;
            Image mi = m.AddComponent<Image>();
            var mc = new Color(0.3f, 0.85f, 0.4f);
            mi.color = mc; mi.sprite = MakeSprite(mc);
            Toggle t = go.AddComponent<Toggle>(); t.graphic = mi; t.isOn = on;
            return t;
        }

        public static void SetField(object t, string f, object v)
        {
            t.GetType().GetField(f, BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)?.SetValue(t, v);
        }

        public static TMPro.TextMeshProUGUI ToTMP(Text text)
        {
            if (text == null) return null;
            var tmp = text.GetComponent<TMPro.TextMeshProUGUI>();
            if (tmp == null) tmp = text.gameObject.AddComponent<TMPro.TextMeshProUGUI>();
            tmp.text = text.text; tmp.fontSize = text.fontSize; tmp.color = text.color;
            return tmp;
        }
    }

    // ---- Gem factory ----
    internal static class GemFactory
    {
        public static GameObject CreateGemPrefab()
        {
            GameObject go = GameObject.CreatePrimitive(PrimitiveType.Quad);
            go.name = "Gem"; go.transform.localScale = Vector3.one * 0.85f;
            Object.DestroyImmediate(go.GetComponent<MeshFilter>());
            Object.DestroyImmediate(go.GetComponent<MeshRenderer>());
            Object.DestroyImmediate(go.GetComponent<MeshCollider>());
            SpriteRenderer sr = go.AddComponent<SpriteRenderer>();
            Texture2D t = new Texture2D(64, 64);
            for (int x = 0; x < 64; x++)
                for (int y = 0; y < 64; y++)
                {
                    float dx = (x - 32) / 32f, dy = (y - 32) / 32f;
                    float d = Mathf.Sqrt(dx * dx + dy * dy);
                    t.SetPixel(x, y, d < 0.9f ? Color.white : new Color(0, 0, 0, 0));
                }
            t.Apply();
            sr.sprite = Sprite.Create(t, new Rect(0, 0, 64, 64), new Vector2(0.5f, 0.5f));
            go.AddComponent<Gem>();
            return go;
        }
    }
}
