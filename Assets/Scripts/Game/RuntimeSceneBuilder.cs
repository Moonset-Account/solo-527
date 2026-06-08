using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Audio;
using TMPro;
using ShadowPlatformer.Core;
using ShadowPlatformer.Player;
using ShadowPlatformer.Light;
using ShadowPlatformer.Level;
using ShadowPlatformer.Save;
using ShadowPlatformer.Audio;
using ShadowPlatformer.Mechanics;
using ShadowPlatformer.UI;
using ShadowPlatformer.Analytics;

namespace ShadowPlatformer.Game
{
    public class RuntimeSceneBuilder : MonoBehaviour
    {
        public enum SceneType
        {
            MainMenu,
            Level
        }

        public SceneType sceneType;
        public string levelId = "tut_01";
        public LevelManifest levelManifest;

        private static bool _managersCreated;

        private void Awake()
        {
            if (!_managersCreated)
            {
                CreateManagers();
                _managersCreated = true;
            }
        }

        private void Start()
        {
            switch (sceneType)
            {
                case SceneType.MainMenu:
                    CreateMainMenuUI();
                    break;
                case SceneType.Level:
                    CreateLevelScene();
                    break;
            }
        }

        private void CreateManagers()
        {
            CreateSingleton<GameManager>("GameManager");
            CreateSingleton<SceneLoader>("SceneLoader");
            CreateSingleton<ResourcePreloader>("ResourcePreloader");
            CreateSingleton<LevelManager>("LevelManager");
            CreateSingleton<LightManager>("LightManager");
            CreateSingleton<SaveManager>("SaveManager");
            CreateSingleton<AudioManager>("AudioManager");
            CreateSingleton<PlaytestRecorder>("PlaytestRecorder");

            if (levelManifest != null && LevelManager.Instance != null)
                LevelManager.Instance.LoadManifest(levelManifest);
        }

        private T CreateSingleton<T>(string name) where T : MonoBehaviour
        {
            if (FindObjectOfType<T>() != null) return null;
            var go = new GameObject(name);
            DontDestroyOnLoad(go);
            return go.AddComponent<T>();
        }

        private void CreateMainMenuUI()
        {
            GameManager.Instance.SetGameMode(GameMode.Menu);

            var canvas = CreateCanvas("MenuCanvas", RenderMode.ScreenSpaceOverlay);
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var panel = CreateUIObject("MainPanel", canvas.transform);
            var rect = panel.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var titleText = CreateText("Title", panel.transform, "光影平台跳跃", 72, new Vector2(0, 200));
            var continueBtn = CreateButton("ContinueBtn", panel.transform, "继续", new Vector2(0, 50));
            var newGameBtn = CreateButton("NewGameBtn", panel.transform, "新游戏", new Vector2(0, -20));
            var settingsBtn = CreateButton("SettingsBtn", panel.transform, "设置", new Vector2(0, -90));
            var quitBtn = CreateButton("QuitBtn", panel.transform, "退出", new Vector2(0, -160));

            var mainMenu = canvas.AddComponent<MainMenu>();
            mainMenu.continueButton = continueBtn;
            mainMenu.newGameButton = newGameBtn;
            mainMenu.settingsButton = settingsBtn;
            mainMenu.quitButton = quitBtn;

            var eventSystemGo = new GameObject("EventSystem");
            eventSystemGo.AddComponent<UnityEngine.EventSystems.EventSystem>();
            eventSystemGo.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();

            AudioManager.Instance?.PlayMenuMusic();
        }

        private void CreateLevelScene()
        {
            GameManager.Instance.SetGameMode(GameMode.Playing);

            var camObj = new GameObject("Main Camera");
            camObj.tag = "MainCamera";
            var cam = camObj.AddComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 5f;
            cam.backgroundColor = new Color(0.08f, 0.08f, 0.12f, 1f);
            camObj.AddComponent<AudioListener>();
            var camCtrl = camObj.AddComponent<CameraController>();
            camObj.transform.position = new Vector3(0f, 1f, -10f);

            var lightObj = new GameObject("DirectionalLight");
            var dLight = lightObj.AddComponent<Light>();
            dLight.type = LightType.Directional;
            dLight.intensity = 0.8f;
            dLight.color = new Color(1f, 0.95f, 0.8f);
            lightObj.transform.rotation = Quaternion.Euler(0f, 0f, 0f);
            if (LightManager.Instance != null)
                LightManager.Instance.directionalLightObject = lightObj;

            CreatePlayer(camCtrl);

            var levelRoot = new GameObject("LevelRoot");

            CreateGround(levelRoot);
            CreateLevelPlatforms(levelRoot);
            CreateLevelExit(levelRoot);
            CreateCheckpoints(levelRoot);

            var hudCanvas = CreateHUD();
            var deathCanvas = CreateDeathScreen();
            var completeCanvas = CreateLevelCompleteScreen();
            var pauseCanvas = CreatePauseMenu();

            if (!FindObjectOfType<UnityEngine.EventSystems.EventSystem>())
            {
                var es = new GameObject("EventSystem");
                es.AddComponent<UnityEngine.EventSystems.EventSystem>();
                es.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }

            if (LevelManager.Instance != null)
                LevelManager.Instance.StartLevel(levelId);

            AudioManager.Instance?.PlayLevelMusic(0);
        }

        private void CreatePlayer(CameraController camCtrl)
        {
            var playerObj = new GameObject("Player");
            playerObj.tag = "Player";
            playerObj.transform.position = new Vector2(-5f, 1f);

            var rb = playerObj.AddComponent<Rigidbody2D>();
            rb.constraints = RigidbodyConstraints2D.FreezeRotation;
            rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            rb.gravityScale = 3f;

            var col = playerObj.AddComponent<BoxCollider2D>();
            col.size = new Vector2(0.6f, 1f);

            var sr = playerObj.AddComponent<SpriteRenderer>();
            sr.color = Color.white;
            sr.sprite = CreatePixelSprite();

            var input = playerObj.AddComponent<PlayerInput>();
            var ctrl = playerObj.AddComponent<PlayerController>();

            var gcp = new GameObject("GroundCheck");
            gcp.transform.SetParent(playerObj.transform);
            gcp.transform.localPosition = new Vector3(0f, -0.5f, 0f);
            ctrl.groundCheckPoint = gcp.transform;

            camCtrl.target = playerObj.transform;
        }

        private void CreateGround(GameObject parent)
        {
            var ground = new GameObject("Ground");
            ground.transform.SetParent(parent.transform);
            ground.transform.position = new Vector3(0f, -3f, 0f);

            var sr = ground.AddComponent<SpriteRenderer>();
            sr.color = new Color(0.3f, 0.3f, 0.35f);
            sr.size = new Vector2(40f, 1f);
            sr.sprite = CreatePixelSprite();

            var col = ground.AddComponent<BoxCollider2D>();
            col.size = new Vector2(40f, 1f);
            ground.layer = LayerMask.NameToLayer("Default");
        }

        private void CreateLevelPlatforms(GameObject parent)
        {
            CreateShadowPlatform("SP_Right", new Vector2(3f, 0f), new Vector2(3f, 0.5f), LightDirection.Right, parent);
            CreateShadowPlatform("SP_Left", new Vector2(7f, 2f), new Vector2(3f, 0.5f), LightDirection.Left, parent);
            CreateShadowPlatform("SP_Up", new Vector2(11f, 4f), new Vector2(3f, 0.5f), LightDirection.Up, parent);
        }

        private void CreateShadowPlatform(string name, Vector2 pos, Vector2 size, LightDirection dir, GameObject parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent.transform);
            obj.transform.position = pos;

            var sr = obj.AddComponent<SpriteRenderer>();
            sr.color = new Color(0.4f, 0.4f, 0.7f, 0.8f);
            sr.size = size;
            sr.sprite = CreatePixelSprite();

            var col = obj.AddComponent<BoxCollider2D>();
            col.size = size;

            var sp = obj.AddComponent<ShadowPlatform>();
            sp.shadowDirection = dir;
            sp.visibilityRule = ShadowVisibility.WhenLightMatches;
        }

        private void CreateLevelExit(GameObject parent)
        {
            var exitObj = new GameObject("LevelExit");
            exitObj.transform.SetParent(parent.transform);
            exitObj.transform.position = new Vector2(14f, 3f);

            var col = exitObj.AddComponent<BoxCollider2D>();
            col.size = new Vector2(1f, 2f);
            col.isTrigger = true;

            var sr = exitObj.AddComponent<SpriteRenderer>();
            sr.color = new Color(0f, 1f, 0.5f, 0.5f);
            sr.size = new Vector2(1f, 2f);
            sr.sprite = CreatePixelSprite();

            var exit = exitObj.AddComponent<LevelExit>();
            exit.nextLevelId = "tut_02";
        }

        private void CreateCheckpoints(GameObject parent)
        {
            CreateCheckpoint("CP_Start", new Vector2(-4f, -2.5f), parent);
            CreateCheckpoint("CP_Mid", new Vector2(5f, -2.5f), parent);
        }

        private void CreateCheckpoint(string name, Vector2 pos, GameObject parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent.transform);
            obj.transform.position = pos;

            var col = obj.AddComponent<BoxCollider2D>();
            col.size = new Vector2(1f, 1.5f);
            col.isTrigger = true;

            var sr = obj.AddComponent<SpriteRenderer>();
            sr.color = Color.cyan;
            sr.size = new Vector2(0.5f, 1.5f);
            sr.sprite = CreatePixelSprite();

            var cp = obj.AddComponent<Checkpoint>();
            cp.checkpointId = name;
        }

        private Canvas CreateHUD()
        {
            var canvas = CreateCanvas("HUD", RenderMode.ScreenSpaceOverlay);
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var hud = canvas.AddComponent<HUD>();
            hud.timerText = CreateText("Timer", canvas.transform, "00:00", 36, new Vector2(-600, 450)).GetComponent<TMP_Text>();
            hud.deathCountText = CreateText("Deaths", canvas.transform, "0", 36, new Vector2(600, 450)).GetComponent<TMP_Text>();

            var tutorialPanel = CreateUIObject("TutorialPanel", canvas.transform);
            var tutRect = tutorialPanel.AddComponent<RectTransform>();
            tutRect.anchorMin = new Vector2(0.5f, 0.3f);
            tutRect.anchorMax = new Vector2(0.5f, 0.3f);
            tutRect.sizeDelta = new Vector2(800, 80);
            var tutText = CreateText("TutorialText", tutorialPanel.transform, "", 28, Vector2.zero);
            hud.tutorialPanel = tutorialPanel;
            hud.tutorialText = tutText.GetComponent<TMP_Text>();

            var lightDirText = CreateText("LightDir", canvas.transform, "→", 48, new Vector2(0, 450));
            hud.lightDirectionIndicator = null;

            return canvas;
        }

        private Canvas CreateDeathScreen()
        {
            var canvas = CreateCanvas("DeathScreen", RenderMode.ScreenSpaceOverlay);
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var ds = canvas.AddComponent<DeathScreen>();
            canvas.SetActive(false);
            ds.deathPanel = canvas.gameObject;

            var msgText = CreateText("DeathMsg", canvas.transform, "", 42, new Vector2(0, 100));
            ds.deathMessageText = msgText.GetComponent<TMP_Text>();

            var retryBtn = CreateButton("RetryBtn", canvas.transform, "重试", new Vector2(0, -20));
            ds.retryButton = retryBtn;
            var menuBtn = CreateButton("MenuBtn", canvas.transform, "主菜单", new Vector2(0, -90));
            ds.quitButton = menuBtn;

            return canvas;
        }

        private Canvas CreateLevelCompleteScreen()
        {
            var canvas = CreateCanvas("LevelComplete", RenderMode.ScreenSpaceOverlay);
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var lcs = canvas.AddComponent<LevelCompleteScreen>();
            canvas.SetActive(false);
            lcs.completePanel = canvas.gameObject;

            var titleText = CreateText("CompleteTitle", canvas.transform, "关卡完成!", 52, new Vector2(0, 150));
            lcs.levelNameText = CreateText("LevelName", canvas.transform, "", 36, new Vector2(0, 80)).GetComponent<TMP_Text>();
            lcs.timeText = CreateText("Time", canvas.transform, "", 30, new Vector2(0, 20)).GetComponent<TMP_Text>();
            lcs.deathsText = CreateText("Deaths", canvas.transform, "", 30, new Vector2(0, -20)).GetComponent<TMP_Text>();

            var nextBtn = CreateButton("NextBtn", canvas.transform, "下一关", new Vector2(0, -80));
            lcs.nextLevelButton = nextBtn;
            var replayBtn = CreateButton("ReplayBtn", canvas.transform, "重玩", new Vector2(0, -140));
            lcs.replayButton = replayBtn;
            var menuBtn = CreateButton("MenuBtn", canvas.transform, "主菜单", new Vector2(0, -200));
            lcs.menuButton = menuBtn;

            return canvas;
        }

        private Canvas CreatePauseMenu()
        {
            var canvas = CreateCanvas("PauseMenu", RenderMode.ScreenSpaceOverlay);
            var scaler = canvas.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);

            var pm = canvas.AddComponent<PauseMenu>();
            canvas.SetActive(false);
            pm.pausePanel = canvas.gameObject;

            var resumeBtn = CreateButton("ResumeBtn", canvas.transform, "继续", new Vector2(0, 50));
            pm.resumeButton = resumeBtn;
            var restartBtn = CreateButton("RestartBtn", canvas.transform, "重启关卡", new Vector2(0, -20));
            pm.restartButton = restartBtn;
            var quitBtn = CreateButton("QuitBtn", canvas.transform, "主菜单", new Vector2(0, -90));
            pm.quitButton = quitBtn;

            return canvas;
        }

        private Canvas CreateCanvas(string name, RenderMode renderMode)
        {
            var obj = new GameObject(name);
            var canvas = obj.AddComponent<Canvas>();
            canvas.renderMode = renderMode;
            canvas.sortingOrder = 0;
            return canvas;
        }

        private GameObject CreateUIObject(string name, Transform parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent, false);
            return obj;
        }

        private Button CreateButton(string name, Transform parent, string text, Vector2 anchoredPos)
        {
            var obj = CreateUIObject(name, parent);
            var rect = obj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.sizeDelta = new Vector2(300f, 60f);
            rect.anchoredPosition = anchoredPos;

            var img = obj.AddComponent<Image>();
            img.color = new Color(0.2f, 0.2f, 0.3f, 0.9f);

            var btn = obj.AddComponent<Button>();
            btn.targetGraphic = img;

            var colors = btn.colors;
            colors.highlightedColor = new Color(0.4f, 0.4f, 0.6f);
            colors.pressedColor = new Color(0.15f, 0.15f, 0.2f);
            btn.colors = colors;

            var childObj = CreateUIObject("Text", obj.transform);
            var childRect = childObj.AddComponent<RectTransform>();
            childRect.anchorMin = Vector2.zero;
            childRect.anchorMax = Vector2.one;
            childRect.offsetMin = Vector2.zero;
            childRect.offsetMax = Vector2.zero;

            var tmp = childObj.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = 28;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;

            return btn;
        }

        private GameObject CreateText(string name, Transform parent, string text, int fontSize, Vector2 anchoredPos)
        {
            var obj = CreateUIObject(name, parent);
            var rect = obj.AddComponent<RectTransform>();
            rect.anchorMin = new Vector2(0.5f, 0.5f);
            rect.anchorMax = new Vector2(0.5f, 0.5f);
            rect.sizeDelta = new Vector2(800f, 60f);
            rect.anchoredPosition = anchoredPos;

            var tmp = obj.AddComponent<TextMeshProUGUI>();
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.alignment = TextAlignmentOptions.Center;
            tmp.color = Color.white;

            return obj;
        }

        private Sprite CreatePixelSprite()
        {
            var tex = new Texture2D(1, 1);
            tex.SetPixel(0, 0, Color.white);
            tex.Apply();
            var sprite = Sprite.Create(tex, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 100f);
            return sprite;
        }
    }
}
