using System;
using System.Collections.Generic;
using Kitchen.Config;
using Kitchen.Core;
using Kitchen.Gameplay;
using Kitchen.Input;
using Kitchen.Levels;
using Kitchen.Performance;
using Kitchen.Save;
using Kitchen.UI;
using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace Kitchen.Setup
{
    public class RuntimeGameBuilder : MonoBehaviour
    {
        public static RuntimeGameBuilder Instance { get; private set; }

        private Camera _mainCamera;
        private Transform _environmentRoot;
        private Transform _stationsRoot;
        private Transform _playersRoot;
        private GameObject[] _stationRuntimePrefabs;
        private GameObject _playerRuntimePrefab;
        private GameObject _heldItemRuntimePrefab;
        private GameObject _plateRuntimePrefab;

        private GameObject _uiRoot;
        private RectTransform _mainMenuPanel;
        private RectTransform _levelSelectPanel;
        private RectTransform _playerSetupPanel;
        private RectTransform _settingsPanel;
        private RectTransform _hudRoot;
        private RectTransform _tutorialPanel;
        private RectTransform _pausePanel;
        private RectTransform _resultPanel;
        private MainMenuController _mainMenu;
        private HUDController _hud;
        private TutorialController _tutorial;
        private PauseMenuController _pause;
        private SettingsMenuController _settings;
        private ResultScreenController _result;
        private PerformanceOverlay _perfOverlay;
        private Sprite _starSprite;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this; DontDestroyOnLoad(gameObject);
            RuntimeConfigFactory.EnsureInitialized();
            EnsureEventSystem();
            EnsureCameraEnvironment();
            EnsureSingletonManagers();
            EnsurePrefabTemplates();
            WireManagerReferences();
            EnsureFullUI();
            SubscribeLevelStartup();
        }

        private void Start()
        {
            SaveManager.Instance?.LoadOrCreateSave();
            SaveManager.Instance?.ApplySettings();
            if (FrameRateAdapter.Instance != null)
            {
                FrameRateAdapter.Instance.ApplySettingsFromSave();
                FrameRateAdapter.Instance.StartAdaptation();
            }
            PerformanceStats.Instance?.ResetStats();
            GameManager.Instance?.ChangeState(GameManager.GameState.MainMenu);
        }

        private static void EnsureEventSystem()
        {
            if (FindObjectOfType<EventSystem>() != null) return;
            GameObject es = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            DontDestroyOnLoad(es);
        }

        private void EnsureCameraEnvironment()
        {
            _mainCamera = Camera.main;
            if (_mainCamera == null)
            {
                GameObject camGo = new GameObject("Main Camera", typeof(Camera), typeof(AudioListener));
                camGo.tag = "MainCamera";
                _mainCamera = camGo.GetComponent<Camera>();
                DontDestroyOnLoad(camGo);
            }
            _mainCamera.clearFlags = CameraClearFlags.SolidColor;
            _mainCamera.backgroundColor = new Color(0.14f, 0.16f, 0.2f);
            _mainCamera.orthographic = true;
            _mainCamera.orthographicSize = 8f;
            _mainCamera.transform.position = new Vector3(0, 18, -6);
            _mainCamera.transform.rotation = Quaternion.Euler(63, 0, 0);
            _mainCamera.nearClipPlane = -50f;
            _mainCamera.farClipPlane = 50f;

            GameObject env = new GameObject("Environment");
            _environmentRoot = env.transform; DontDestroyOnLoad(env);

            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.transform.SetParent(_environmentRoot);
            ground.transform.localScale = new Vector3(3.2f, 1, 2.2f);
            Material gm = new Material(Shader.Find("Standard"));
            gm.color = new Color(0.3f, 0.27f, 0.23f);
            ground.GetComponent<Renderer>().sharedMaterial = gm;

            GameObject sr = new GameObject("Stations");
            sr.transform.SetParent(_environmentRoot); _stationsRoot = sr.transform;
            GameObject pr = new GameObject("Players");
            pr.transform.SetParent(_environmentRoot); _playersRoot = pr.transform;

            CreateWall(new Vector3(-8.5f, 1, 0), new Vector3(0.3f, 2, 20), new Color(0.5f, 0.45f, 0.4f));
            CreateWall(new Vector3(8.5f, 1, 0), new Vector3(0.3f, 2, 20), new Color(0.5f, 0.45f, 0.4f));
            CreateWall(new Vector3(0, 1, 8.5f), new Vector3(20, 2, 0.3f), new Color(0.55f, 0.5f, 0.45f));
            CreateWall(new Vector3(0, 1, -8.5f), new Vector3(20, 2, 0.3f), new Color(0.55f, 0.5f, 0.45f));
        }

        private void CreateWall(Vector3 pos, Vector3 scale, Color color)
        {
            GameObject w = GameObject.CreatePrimitive(PrimitiveType.Cube);
            Destroy(w.GetComponent<BoxCollider>());
            w.transform.SetParent(_environmentRoot);
            w.transform.position = pos; w.transform.localScale = scale;
            Material m = new Material(Shader.Find("Standard")); m.color = color;
            w.GetComponent<Renderer>().sharedMaterial = m;
        }

        private static void EnsureSingletonManagers()
        {
            EnsureSingle<GameManager>(); EnsureSingle<PlayerManager>();
            EnsureSingle<InputManager>(); EnsureSingle<OrderManager>();
            EnsureSingle<LevelManager>(); EnsureSingle<SaveManager>();
            EnsureSingle<PerformanceStats>(); EnsureSingle<FrameRateAdapter>();
        }
        private static T EnsureSingle<T>() where T : MonoBehaviour
        {
            T inst = FindObjectOfType<T>();
            if (inst != null) return inst;
            GameObject go = new GameObject(typeof(T).Name);
            inst = go.AddComponent<T>(); DontDestroyOnLoad(go);
            return inst;
        }

        private void EnsurePrefabTemplates()
        {
            _heldItemRuntimePrefab = BuildHeldItemPrefab();
            _plateRuntimePrefab = BuildPlatePrefab();
            int count = Enum.GetNames(typeof(StationType)).Length;
            _stationRuntimePrefabs = new GameObject[count];
            for (int i = 0; i < count; i++)
                _stationRuntimePrefabs[i] = BuildStationPrefab((StationType)i);
            _playerRuntimePrefab = BuildPlayerPrefab();
        }

        private GameObject BuildPlayerPrefab()
        {
            GameObject go = new GameObject("PlayerTemplate");
            go.SetActive(false); DontDestroyOnLoad(go);
            Rigidbody rb = go.AddComponent<Rigidbody>();
            rb.constraints = RigidbodyConstraints.FreezeRotation;
            rb.interpolation = RigidbodyInterpolation.Interpolate;
            rb.collisionDetectionMode = CollisionDetectionMode.Continuous;
            rb.drag = 6f; rb.mass = 80f;
            CapsuleCollider col = go.AddComponent<CapsuleCollider>();
            col.height = 1.6f; col.radius = 0.4f; col.center = new Vector3(0, 0.8f, 0);

            GameObject body = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            Destroy(body.GetComponent<CapsuleCollider>());
            body.transform.SetParent(go.transform);
            body.transform.localPosition = new Vector3(0, 0.8f, 0);
            body.transform.localScale = new Vector3(0.8f, 0.8f, 0.8f);
            body.name = "Body";

            GameObject head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            Destroy(head.GetComponent<SphereCollider>());
            head.transform.SetParent(go.transform);
            head.transform.localPosition = new Vector3(0, 1.7f, 0);
            head.transform.localScale = new Vector3(0.45f, 0.45f, 0.45f);
            head.name = "Head";

            GameObject hp = new GameObject("HoldPoint");
            hp.transform.SetParent(go.transform);
            hp.transform.localPosition = new Vector3(0.3f, 1.3f, 0.45f);

            PlayerController pc = go.AddComponent<PlayerController>();
            pc.holdPoint = hp.transform;
            pc.bodyRenderer = body.GetComponent<Renderer>();
            pc.interactRange = 2f; pc.moveSpeed = 4.5f; pc.stationLayer = ~0;
            return go;
        }

        private GameObject BuildStationPrefab(StationType type)
        {
            GameObject go = new GameObject("Station_" + type);
            go.SetActive(false); DontDestroyOnLoad(go);
            BoxCollider col = go.AddComponent<BoxCollider>();
            col.isTrigger = true; col.size = new Vector3(1.6f, 2f, 1.6f); col.center = new Vector3(0, 1, 0);

            GameObject model = GameObject.CreatePrimitive(PrimitiveType.Cube);
            Destroy(model.GetComponent<BoxCollider>());
            model.transform.SetParent(go.transform);
            model.transform.localPosition = new Vector3(0, 0.45f, 0);
            model.transform.localScale = new Vector3(1.4f, 0.9f, 1.4f);
            Material mm = new Material(Shader.Find("Standard"));
            mm.color = StationColorOf(type);
            model.GetComponent<Renderer>().sharedMaterial = mm;

            GameObject top = GameObject.CreatePrimitive(PrimitiveType.Cube);
            Destroy(top.GetComponent<BoxCollider>());
            top.transform.SetParent(go.transform);
            top.transform.localPosition = new Vector3(0, 0.92f, 0);
            top.transform.localScale = new Vector3(1.45f, 0.05f, 1.45f);
            Material tm = new Material(Shader.Find("Standard"));
            tm.color = new Color(0.88f, 0.86f, 0.82f);
            top.GetComponent<Renderer>().sharedMaterial = tm;

            GameObject slotPoint = new GameObject("SlotPoint");
            slotPoint.transform.SetParent(go.transform);
            slotPoint.transform.localPosition = new Vector3(0, 1.05f, 0);

            GameObject high = new GameObject("Highlight", typeof(SpriteRenderer));
            high.transform.SetParent(go.transform);
            high.transform.localPosition = new Vector3(0, 0.96f, 0);
            high.transform.localScale = new Vector3(2.4f, 2.4f, 1f);
            high.transform.rotation = Quaternion.Euler(90, 0, 0);
            SpriteRenderer hsr = high.GetComponent<SpriteRenderer>();
            hsr.color = new Color(1f, 1f, 0.2f, 0.6f); hsr.enabled = false;
            Texture2D t2d = new Texture2D(10, 10);
            for (int x = 0; x < 10; x++) for (int y = 0; y < 10; y++) t2d.SetPixel(x, y, Color.white);
            t2d.Apply(); hsr.sprite = Sprite.Create(t2d, new Rect(0, 0, 10, 10), new Vector2(0.5f, 0.5f));

            SpriteRenderer sr = hsr;

            if (type == StationType.IngredientBox)
            {
                GameObject icon = GameObject.CreatePrimitive(PrimitiveType.Cube);
                Destroy(icon.GetComponent<BoxCollider>());
                icon.transform.SetParent(go.transform); icon.name = "IconCube";
                icon.transform.localPosition = new Vector3(0, 1.15f, 0);
                icon.transform.localScale = new Vector3(0.35f, 0.35f, 0.35f);
            }

            switch (type)
            {
                case StationType.IngredientBox:
                    IngredientBox ib = go.AddComponent<IngredientBox>();
                    ib.stationType = type; ib.highlightRenderer = sr; ib.interactionRadius = 1.5f;
                    ib.heldItemPrefab = _heldItemRuntimePrefab;
                    ib.spawnPoint = slotPoint.transform;
                    ib.maxStock = 99; ib.respawnDelay = 1.5f;
                    break;
                case StationType.CuttingBoard:
                    CuttingBoard cb = go.AddComponent<CuttingBoard>();
                    cb.stationType = type; cb.highlightRenderer = sr; cb.interactionRadius = 1.5f;
                    cb.itemSlot = slotPoint.transform;
                    break;
                case StationType.Stove:
                    Stove stv = go.AddComponent<Stove>();
                    stv.stationType = type; stv.highlightRenderer = sr; stv.interactionRadius = 1.8f;
                    break;
                case StationType.PlateStack:
                    PlateStack ps = go.AddComponent<PlateStack>();
                    ps.stationType = type; ps.highlightRenderer = sr; ps.interactionRadius = 1.5f;
                    ps.platePrefab = _plateRuntimePrefab;
                    ps.stackPoint = slotPoint.transform; ps.maxPlates = 8;
                    break;
                case StationType.ServingWindow:
                    ServingWindow sw = go.AddComponent<ServingWindow>();
                    sw.stationType = type; sw.highlightRenderer = sr; sw.interactionRadius = 1.5f;
                    break;
                case StationType.Sink:
                    Sink sk = go.AddComponent<Sink>();
                    sk.stationType = type; sk.highlightRenderer = sr; sk.interactionRadius = 1.5f;
                    sk.dirtyStackPoint = slotPoint.transform; sk.cleanStackPoint = slotPoint.transform;
                    break;
                case StationType.Trash:
                    TrashBin tb = go.AddComponent<TrashBin>();
                    tb.stationType = type; tb.highlightRenderer = sr; tb.interactionRadius = 1.5f;
                    break;
                default:
                    CounterDummy sb = go.AddComponent<CounterDummy>();
                    sb.stationType = type; sb.highlightRenderer = sr; sb.interactionRadius = 1.5f;
                    break;
            }
            return go;
        }

        private static Color StationColorOf(StationType t)
        {
            switch (t)
            {
                case StationType.IngredientBox: return new Color(0.4f, 0.7f, 0.4f);
                case StationType.CuttingBoard: return new Color(0.85f, 0.7f, 0.4f);
                case StationType.Stove: return new Color(0.35f, 0.35f, 0.35f);
                case StationType.PlateStack: return new Color(0.7f, 0.8f, 0.9f);
                case StationType.ServingWindow: return new Color(0.3f, 0.5f, 0.75f);
                case StationType.Sink: return new Color(0.3f, 0.6f, 0.72f);
                case StationType.Trash: return new Color(0.4f, 0.3f, 0.3f);
                default: return new Color(0.6f, 0.6f, 0.6f);
            }
        }

        private GameObject BuildHeldItemPrefab()
        {
            GameObject go = new GameObject("HeldItem");
            go.SetActive(false); DontDestroyOnLoad(go);
            SphereCollider sc = go.AddComponent<SphereCollider>();
            sc.radius = 0.3f; sc.isTrigger = true;
            GameObject visual = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            Destroy(visual.GetComponent<SphereCollider>());
            visual.transform.SetParent(go.transform); visual.name = "Visual";
            visual.transform.localScale = new Vector3(0.4f, 0.4f, 0.4f);
            HeldItem hi = go.AddComponent<HeldItem>();
            hi.visualRenderer = visual.GetComponent<Renderer>();
            return go;
        }

        private GameObject BuildPlatePrefab()
        {
            GameObject go = new GameObject("Plate");
            go.SetActive(false); DontDestroyOnLoad(go);
            SphereCollider sc = go.AddComponent<SphereCollider>();
            sc.radius = 0.45f; sc.isTrigger = true;
            GameObject visual = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            Destroy(visual.GetComponent<CapsuleCollider>());
            visual.transform.SetParent(go.transform);
            visual.transform.localScale = new Vector3(0.85f, 0.12f, 0.85f);
            Material pm = new Material(Shader.Find("Standard")) { color = Color.white };
            visual.GetComponent<Renderer>().sharedMaterial = pm;
            HeldItem hi = go.AddComponent<HeldItem>();
            hi.visualRenderer = visual.GetComponent<Renderer>();
            return go;
        }

        private class CounterDummy : StationBase
        {
            public override void Interact(PlayerController player) { }
        }

        private void WireManagerReferences()
        {
            if (PlayerManager.Instance != null)
            {
                PlayerManager.Instance.playerPrefab = _playerRuntimePrefab;
                List<Transform> spawns = new List<Transform>();
                for (int i = 0; i < 4; i++)
                {
                    GameObject sp = new GameObject("Spawn_" + i);
                    sp.transform.SetParent(_playersRoot);
                    sp.transform.localPosition = new Vector3(-3.5f + i * 1.8f, 0, -4f + i * 1.2f);
                    spawns.Add(sp.transform);
                }
                PlayerManager.Instance.spawnPoints = spawns.ToArray();
            }
            if (OrderManager.Instance != null)
                OrderManager.Instance.heldItemPrefab = _heldItemRuntimePrefab;
            if (LevelManager.Instance != null)
            {
                LevelManager.Instance.stationPrefabs = _stationRuntimePrefabs;
                LevelManager.Instance.stationSpawnRoot = _stationsRoot;
            }
        }

        private void SubscribeLevelStartup()
        {
            var gm = GameManager.Instance;
            if (gm == null) return;
            gm.OnStateChanged += (oldS, newS) =>
            {
                bool shouldBuildStations = (newS == GameManager.GameState.Tutorial || newS == GameManager.GameState.Countdown)
                                           && gm.currentLevelConfig != null;
                if (shouldBuildStations)
                    BuildLevelStations(gm.currentLevelConfig);
                if (newS == GameManager.GameState.MainMenu)
                {
                    PlayerManager.Instance?.ClearAllPlayers();
                    for (int i = _stationsRoot.childCount - 1; i >= 0; i--)
                        Destroy(_stationsRoot.GetChild(i).gameObject);
                }
            };
        }

        private void BuildLevelStations(LevelConfig config)
        {
            for (int i = _stationsRoot.childCount - 1; i >= 0; i--)
                Destroy(_stationsRoot.GetChild(i).gameObject);
            foreach (StationConfig s in config.stations)
            {
                int idx = (int)s.type;
                if (idx < 0 || idx >= _stationRuntimePrefabs.Length) continue;
                GameObject prefab = _stationRuntimePrefabs[idx];
                if (prefab == null) continue;
                GameObject station = Instantiate(prefab);
                station.SetActive(true);
                station.transform.SetParent(_stationsRoot);
                station.transform.position = s.position;
                station.name = s.id;
                StationBase sb = station.GetComponent<StationBase>();
                if (sb != null) { sb.stationId = s.id; sb.interactionRadius = s.interactionRadius; }
                IngredientBox ib = station.GetComponent<IngredientBox>();
                if (ib != null)
                {
                    ib.storedIngredient = s.storedIngredient;
                    Transform ic = station.transform.Find("IconCube");
                    if (ic != null && s.storedIngredient != null)
                    {
                        Renderer rr = ic.GetComponent<Renderer>();
                        if (rr != null) rr.material.color = s.storedIngredient.color;
                    }
                }
            }
        }

        private void EnsureFullUI()
        {
            _uiRoot = RuntimeUIFactory.CreateUIRoot();
            DontDestroyOnLoad(_uiRoot);
            Transform rt = _uiRoot.transform;

            _mainMenuPanel = RuntimeUIFactory.AddPanel(rt, "MainMenuPanel", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, new Color(0.08f, 0.1f, 0.14f, 1f));
            _levelSelectPanel = RuntimeUIFactory.AddPanel(rt, "LevelSelectPanel", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, new Color(0.1f, 0.12f, 0.16f, 1f));
            _playerSetupPanel = RuntimeUIFactory.AddPanel(rt, "PlayerSetupPanel", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, new Color(0.1f, 0.12f, 0.16f, 1f));
            _settingsPanel = RuntimeUIFactory.AddPanel(rt, "SettingsPanel", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, new Color(0.05f, 0.07f, 0.1f, 0.96f));
            _hudRoot = RuntimeUIFactory.AddPanel(rt, "HUDRoot", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, new Color(0, 0, 0, 0));
            _tutorialPanel = RuntimeUIFactory.AddPanel(rt, "TutorialPanel", new Vector2(0.18f, 0.1f), new Vector2(0.82f, 0.32f), Vector2.zero, Vector2.zero, new Color(0.08f, 0.12f, 0.22f, 0.95f));
            _pausePanel = RuntimeUIFactory.AddPanel(rt, "PausePanel", new Vector2(0.3f, 0.2f), new Vector2(0.7f, 0.8f), Vector2.zero, Vector2.zero, new Color(0.15f, 0.12f, 0.2f, 0.95f));
            _resultPanel = RuntimeUIFactory.AddPanel(rt, "ResultPanel", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, new Color(0.05f, 0.05f, 0.1f, 0.92f));

            _levelSelectPanel.gameObject.SetActive(false);
            _playerSetupPanel.gameObject.SetActive(false);
            _settingsPanel.gameObject.SetActive(false);
            _hudRoot.gameObject.SetActive(false);
            _tutorialPanel.gameObject.SetActive(false);
            _pausePanel.gameObject.SetActive(false);
            _resultPanel.gameObject.SetActive(false);

            BuildMainMenu();
            BuildHUD();
            BuildTutorial();
            BuildPause();
            BuildResult();
            BuildSettings();
            BuildPerfOverlay();
            ConnectGlobalStateUI();
        }

        private void BuildMainMenu()
        {
            GameObject compGo = new GameObject("MainMenuController");
            compGo.transform.SetParent(_mainMenuPanel, false);
            _mainMenu = compGo.AddComponent<MainMenuController>();

            RuntimeUIFactory.AddText(_mainMenuPanel, "Title", "限时厨房协作游戏", new Vector2(0.3f, 0.82f), new Vector2(0.7f, 0.92f), Vector2.zero, Vector2.zero, 64, TextAlignmentOptions.Center, new Color(1f, 0.85f, 0.3f));
            RuntimeUIFactory.AddText(_mainMenuPanel, "Subtitle", "Kitchen Chaos · 本地多人派对", new Vector2(0.3f, 0.74f), new Vector2(0.7f, 0.8f), Vector2.zero, Vector2.zero, 26, TextAlignmentOptions.Center, new Color(0.7f, 0.85f, 1f));
            RuntimeUIFactory.AddText(_mainMenuPanel, "Hint", "P1: WASD + E 交互 · P2: 方向键 + Enter\n单人模式下按 Tab 在角色之间切换", new Vector2(0.2f, 0.06f), new Vector2(0.8f, 0.2f), Vector2.zero, Vector2.zero, 18, TextAlignmentOptions.Center, new Color(0.7f, 0.7f, 0.75f));

            _mainMenu.playButton = RuntimeUIFactory.AddButton(_mainMenuPanel, "Play", "▶ 开始游戏", new Vector2(0.4f, 0.56f), new Vector2(0.6f, 0.64f), Vector2.zero, Vector2.zero, new Color(0.2f, 0.7f, 0.35f), 28);
            _mainMenu.settingsButton = RuntimeUIFactory.AddButton(_mainMenuPanel, "Settings", "⚙ 设置", new Vector2(0.4f, 0.44f), new Vector2(0.6f, 0.52f), Vector2.zero, Vector2.zero, new Color(0.3f, 0.5f, 0.85f), 26);
            _mainMenu.quitButton = RuntimeUIFactory.AddButton(_mainMenuPanel, "Quit", "✕ 退出游戏", new Vector2(0.4f, 0.32f), new Vector2(0.6f, 0.40f), Vector2.zero, Vector2.zero, new Color(0.7f, 0.3f, 0.3f), 26);
            _mainMenu.creditsButton = _mainMenu.quitButton;
            _mainMenu.settingsPanelRef = _settingsPanel.gameObject;

            _mainMenu.levelSelectBackButton = RuntimeUIFactory.AddButton(_levelSelectPanel, "Back", "← 返回主菜单", new Vector2(0.03f, 0.9f), new Vector2(0.18f, 0.955f), Vector2.zero, Vector2.zero, new Color(0.4f, 0.4f, 0.45f), 20);
            RuntimeUIFactory.AddText(_levelSelectPanel, "Header", "选择关卡", new Vector2(0.4f, 0.9f), new Vector2(0.6f, 0.96f), Vector2.zero, Vector2.zero, 36, TextAlignmentOptions.Center, new Color(1f, 0.85f, 0.3f));

            GameObject lvCards = new GameObject("LevelCards", typeof(RectTransform), typeof(GridLayoutGroup));
            lvCards.transform.SetParent(_levelSelectPanel, false);
            RectTransform lcRt = (RectTransform)lvCards.transform;
            lcRt.anchorMin = new Vector2(0.05f, 0.15f); lcRt.anchorMax = new Vector2(0.95f, 0.85f);
            lcRt.offsetMin = Vector2.zero; lcRt.offsetMax = Vector2.zero;
            GridLayoutGroup glg = lvCards.GetComponent<GridLayoutGroup>();
            glg.cellSize = new Vector2(320, 220); glg.spacing = new Vector2(30, 30);
            glg.childAlignment = TextAnchor.UpperCenter;
            glg.constraint = GridLayoutGroup.Constraint.FixedColumnCount; glg.constraintCount = 3;
            _mainMenu.levelCardContainer = lvCards.transform;
            _mainMenu.levelCardPrefab = BuildLevelCardTemplate();

            _mainMenu.playerSetupBackButton = RuntimeUIFactory.AddButton(_playerSetupPanel, "Back", "← 返回选关", new Vector2(0.03f, 0.9f), new Vector2(0.22f, 0.955f), Vector2.zero, Vector2.zero, new Color(0.4f, 0.4f, 0.45f), 20);
            RuntimeUIFactory.AddText(_playerSetupPanel, "Header", "选择模式与玩家", new Vector2(0.35f, 0.9f), new Vector2(0.65f, 0.96f), Vector2.zero, Vector2.zero, 36, TextAlignmentOptions.Center, Color.white);
            _mainMenu.singlePlayerButton = RuntimeUIFactory.AddButton(_playerSetupPanel, "Single", "🎮 单人模式（Tab 切换角色）", new Vector2(0.25f, 0.68f), new Vector2(0.75f, 0.76f), Vector2.zero, Vector2.zero, new Color(0.2f, 0.55f, 0.85f), 24);
            _mainMenu.multiPlayerButton = RuntimeUIFactory.AddButton(_playerSetupPanel, "Multi", "👥 多人模式（按 E 加入）", new Vector2(0.25f, 0.56f), new Vector2(0.75f, 0.64f), Vector2.zero, Vector2.zero, new Color(0.3f, 0.55f, 0.45f), 24);

            GameObject js = new GameObject("JoinStatus", typeof(RectTransform), typeof(VerticalLayoutGroup));
            js.transform.SetParent(_playerSetupPanel, false);
            RectTransform jsRt = (RectTransform)js.transform;
            jsRt.anchorMin = new Vector2(0.35f, 0.3f); jsRt.anchorMax = new Vector2(0.65f, 0.52f);
            jsRt.offsetMin = Vector2.zero; jsRt.offsetMax = Vector2.zero;
            VerticalLayoutGroup jvlg = js.GetComponent<VerticalLayoutGroup>();
            jvlg.spacing = 8; jvlg.childAlignment = TextAnchor.UpperCenter;
            _mainMenu.joinStatusContainer = js.transform;
            _mainMenu.playerJoinStatusPrefab = BuildPlayerJoinTemplate();

            _mainMenu.startGameButton = RuntimeUIFactory.AddButton(_playerSetupPanel, "Start", "▶ 开始关卡", new Vector2(0.38f, 0.14f), new Vector2(0.62f, 0.22f), Vector2.zero, Vector2.zero, new Color(0.2f, 0.75f, 0.35f), 28);
            _mainMenu.startGameButton.interactable = false;
            _mainMenu.waitingText = RuntimeUIFactory.AddText(_playerSetupPanel, "Wait", "先选择上方模式，再点开始", new Vector2(0.3f, 0.24f), new Vector2(0.7f, 0.3f), Vector2.zero, Vector2.zero, 20, TextAlignmentOptions.Center, new Color(0.8f, 0.8f, 0.85f));
        }

        private GameObject BuildLevelCardTemplate()
        {
            GameObject go = new GameObject("LevelCard", typeof(RectTransform), typeof(Image), typeof(Button));
            RectTransform rt = (RectTransform)go.transform; rt.sizeDelta = new Vector2(320, 220);
            Image img = go.GetComponent<Image>(); img.color = new Color(0.18f, 0.22f, 0.28f);

            RuntimeUIFactory.AddText(rt, "LevelName", "关卡名称", new Vector2(0, 0.7f), new Vector2(1, 0.92f), new Vector2(15, 0), new Vector2(-15, 0), 28, TextAlignmentOptions.Center, Color.white);
            RuntimeUIFactory.AddText(rt, "Description", "关卡描述", new Vector2(0, 0.45f), new Vector2(1, 0.7f), new Vector2(12, 0), new Vector2(-12, 0), 16, TextAlignmentOptions.TopLeft, new Color(0.75f, 0.8f, 0.85f));
            RuntimeUIFactory.AddText(rt, "BestScore", "", new Vector2(0, 0.02f), new Vector2(1, 0.2f), new Vector2(15, 0), new Vector2(-15, 0), 16, TextAlignmentOptions.Center, new Color(1f, 0.85f, 0.3f));

            GameObject starsGo = new GameObject("Stars", typeof(RectTransform), typeof(HorizontalLayoutGroup));
            starsGo.transform.SetParent(rt, false);
            RectTransform sRt = (RectTransform)starsGo.transform;
            sRt.anchorMin = new Vector2(0, 0.2f); sRt.anchorMax = new Vector2(1, 0.42f);
            sRt.offsetMin = Vector2.zero; sRt.offsetMax = Vector2.zero;
            HorizontalLayoutGroup shlg = starsGo.GetComponent<HorizontalLayoutGroup>();
            shlg.childAlignment = TextAnchor.MiddleCenter; shlg.spacing = 15;
            for (int i = 0; i < 3; i++)
            {
                Image star = new GameObject("Star" + i, typeof(RectTransform), typeof(Image)).GetComponent<Image>();
                star.transform.SetParent(starsGo.transform, false);
                star.sprite = GetStarSprite(); star.color = new Color(0.25f, 0.25f, 0.25f);
                ((RectTransform)star.transform).sizeDelta = new Vector2(28, 28);
            }

            GameObject lockGo = new GameObject("LockOverlay", typeof(RectTransform), typeof(Image));
            lockGo.transform.SetParent(rt, false);
            RectTransform loRt = (RectTransform)lockGo.transform;
            loRt.anchorMin = Vector2.zero; loRt.anchorMax = Vector2.one;
            loRt.offsetMin = Vector2.zero; loRt.offsetMax = Vector2.zero;
            Image loImg = lockGo.GetComponent<Image>(); loImg.color = new Color(0, 0, 0, 0.75f);
            RuntimeUIFactory.AddText(loRt, "LockText", "🔒 未解锁", new Vector2(0, 0.35f), new Vector2(1, 0.65f), Vector2.zero, Vector2.zero, 32, TextAlignmentOptions.Center, Color.white);
            lockGo.SetActive(false);
            return go;
        }

        private GameObject BuildPlayerJoinTemplate()
        {
            GameObject go = new GameObject("JoinItem", typeof(RectTransform), typeof(Image));
            RectTransform rt = (RectTransform)go.transform; rt.sizeDelta = new Vector2(280, 44);
            Image img = go.GetComponent<Image>(); img.color = new Color(0.25f, 0.25f, 0.32f);
            RuntimeUIFactory.AddText(rt, "Text", "P1: 等待加入...", Vector2.zero, Vector2.one, new Vector2(18, 2), new Vector2(-18, -2), 20, TextAlignmentOptions.MidlineLeft, new Color(0.85f, 0.85f, 0.9f));
            return go;
        }

        private void BuildHUD()
        {
            GameObject compGo = new GameObject("HUDController");
            compGo.transform.SetParent(_hudRoot, false);
            _hud = compGo.AddComponent<HUDController>();

            RectTransform topBar = RuntimeUIFactory.AddPanel(_hudRoot, "TopBar", new Vector2(0, 0.88f), new Vector2(1, 1), Vector2.zero, Vector2.zero, new Color(0, 0, 0, 0.6f));
            _hud.timerFillImage = RuntimeUIFactory.AddImage(topBar, "TimerFill", null, Vector2.zero, new Vector2(1, 0.2f), Vector2.zero, Vector2.zero, new Color(0.3f, 0.85f, 0.35f));
            _hud.timerFillImage.type = Image.Type.Filled;
            _hud.timerFillImage.fillMethod = Image.FillMethod.Horizontal;
            _hud.timerFillImage.fillAmount = 1;
            _hud.timerText = RuntimeUIFactory.AddText(topBar, "Timer", "03:00", new Vector2(0.04f, 0.25f), new Vector2(0.22f, 0.95f), Vector2.zero, Vector2.zero, 42, TextAlignmentOptions.MidlineLeft, Color.white);
            _hud.scoreText = RuntimeUIFactory.AddText(topBar, "Score", "0", new Vector2(0.38f, 0.25f), new Vector2(0.62f, 0.95f), Vector2.zero, Vector2.zero, 48, TextAlignmentOptions.Center, new Color(1f, 0.9f, 0.35f));
            _hud.multiplierText = RuntimeUIFactory.AddText(topBar, "Mult", "", new Vector2(0.63f, 0.35f), new Vector2(0.75f, 0.9f), Vector2.zero, Vector2.zero, 26, TextAlignmentOptions.MidlineLeft, new Color(0.45f, 1f, 0.5f));
            _hud.activePlayerText = RuntimeUIFactory.AddText(topBar, "ActiveP", "", new Vector2(0.8f, 0.3f), new Vector2(0.96f, 0.9f), Vector2.zero, Vector2.zero, 24, TextAlignmentOptions.MidlineRight, new Color(0.7f, 0.9f, 1f));

            _hud.gameMessageText = RuntimeUIFactory.AddText(_hudRoot, "GameMsg", "", new Vector2(0.3f, 0.72f), new Vector2(0.7f, 0.78f), Vector2.zero, Vector2.zero, 30, TextAlignmentOptions.Center, new Color(1f, 0.4f, 0.4f, 0));

            RectTransform orderPanel = RuntimeUIFactory.AddPanel(_hudRoot, "Orders", new Vector2(0.015f, 0.55f), new Vector2(0.23f, 0.86f), Vector2.zero, Vector2.zero, new Color(0, 0, 0, 0.4f));
            RuntimeUIFactory.AddText(orderPanel, "Header", "📋 订单列表", new Vector2(0, 0.88f), new Vector2(1, 1), new Vector2(12, 0), new Vector2(-12, 0), 22, TextAlignmentOptions.MidlineLeft, new Color(1f, 0.85f, 0.4f));

            GameObject orderCards = new GameObject("Cards", typeof(RectTransform), typeof(VerticalLayoutGroup), typeof(ContentSizeFitter));
            orderCards.transform.SetParent(orderPanel, false);
            RectTransform ocRt = (RectTransform)orderCards.transform;
            ocRt.anchorMin = new Vector2(0.05f, 0.03f); ocRt.anchorMax = new Vector2(0.95f, 0.86f);
            ocRt.offsetMin = Vector2.zero; ocRt.offsetMax = Vector2.zero;
            VerticalLayoutGroup oVlg = orderCards.GetComponent<VerticalLayoutGroup>();
            oVlg.spacing = 8; oVlg.childControlHeight = true; oVlg.childControlWidth = true;
            _hud.ordersContainer = orderCards.transform;
            _hud.orderCardPrefab = BuildOrderCardTemplate();

            GameObject countdown = RuntimeUIFactory.AddPanel(_hudRoot, "Countdown", new Vector2(0.35f, 0.35f), new Vector2(0.65f, 0.65f), Vector2.zero, Vector2.zero, new Color(0, 0, 0, 0.55f)).gameObject;
            _hud.countdownPanel = countdown;
            _hud.countdownText = RuntimeUIFactory.AddText(countdown.GetComponent<RectTransform>(), "CText", "3", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, 160, TextAlignmentOptions.Center, new Color(1f, 0.9f, 0.3f));
            countdown.SetActive(false);
        }

        private GameObject BuildOrderCardTemplate()
        {
            GameObject go = new GameObject("OrderCard", typeof(RectTransform), typeof(Image), typeof(LayoutElement));
            RectTransform rt = (RectTransform)go.transform; rt.sizeDelta = new Vector2(0, 70);
            LayoutElement le = go.GetComponent<LayoutElement>(); le.minHeight = 70;
            go.GetComponent<Image>().color = new Color(0.15f, 0.2f, 0.26f);
            RuntimeUIFactory.AddText(rt, "RecipeName", "食谱名", new Vector2(0.08f, 0.4f), new Vector2(0.95f, 0.95f), Vector2.zero, Vector2.zero, 18, TextAlignmentOptions.MidlineLeft, Color.white);

            GameObject barBg = new GameObject("TimerBar", typeof(RectTransform), typeof(Image));
            barBg.transform.SetParent(rt, false);
            RectTransform bbRt = (RectTransform)barBg.transform;
            bbRt.anchorMin = new Vector2(0.08f, 0.12f); bbRt.anchorMax = new Vector2(0.92f, 0.3f);
            bbRt.offsetMin = Vector2.zero; bbRt.offsetMax = Vector2.zero;
            barBg.GetComponent<Image>().color = new Color(0.25f, 0.25f, 0.25f);

            GameObject fillGo = new GameObject("Progress", typeof(RectTransform), typeof(Image));
            fillGo.transform.SetParent(barBg.transform, false);
            RectTransform fRt = (RectTransform)fillGo.transform;
            fRt.anchorMin = Vector2.zero; fRt.anchorMax = Vector2.one;
            fRt.offsetMin = Vector2.zero; fRt.offsetMax = Vector2.zero;
            Image fillImg = fillGo.GetComponent<Image>();
            fillImg.color = new Color(0.3f, 0.85f, 0.35f);
            fillImg.type = Image.Type.Filled;
            fillImg.fillMethod = Image.FillMethod.Horizontal;
            fillImg.fillAmount = 1;
            return go;
        }

        private void BuildTutorial()
        {
            GameObject compGo = new GameObject("TutorialController");
            compGo.transform.SetParent(_tutorialPanel, false);
            _tutorial = compGo.AddComponent<TutorialController>();
            _tutorial.tutorialPanel = _tutorialPanel.gameObject;
            _tutorial.stepText = RuntimeUIFactory.AddText(_tutorialPanel, "Step", "教程说明", new Vector2(0.05f, 0.25f), new Vector2(0.95f, 0.85f), Vector2.zero, Vector2.zero, 28, TextAlignmentOptions.Center, Color.white);
            _tutorial.stepCounterText = RuntimeUIFactory.AddText(_tutorialPanel, "Counter", "1 / 6", new Vector2(0.4f, 0.08f), new Vector2(0.6f, 0.2f), Vector2.zero, Vector2.zero, 20, TextAlignmentOptions.Center, new Color(0.75f, 0.85f, 1f));

            Button nextBtn = RuntimeUIFactory.AddButton(_tutorialPanel, "Next", "下一步 ▶", new Vector2(0.7f, 0.05f), new Vector2(0.93f, 0.17f), Vector2.zero, Vector2.zero, new Color(0.25f, 0.7f, 0.35f), 22);
            Button skipBtn = RuntimeUIFactory.AddButton(_tutorialPanel, "Skip", "跳过教程", new Vector2(0.07f, 0.05f), new Vector2(0.28f, 0.17f), Vector2.zero, Vector2.zero, new Color(0.45f, 0.45f, 0.5f), 20);
            _tutorial.nextButton = nextBtn.gameObject; _tutorial.skipButton = skipBtn.gameObject;
            nextBtn.onClick.AddListener(_tutorial.OnUserClickedNext);
            skipBtn.onClick.AddListener(_tutorial.OnUserClickedSkip);
        }

        private void BuildPause()
        {
            GameObject compGo = new GameObject("PauseMenuController");
            compGo.transform.SetParent(_pausePanel, false);
            _pause = compGo.AddComponent<PauseMenuController>();
            _pause.pausePanel = _pausePanel.gameObject;
            _pause.settingsPanelRef = _settingsPanel.gameObject;

            RuntimeUIFactory.AddText(_pausePanel, "Title", "⏸ 游戏暂停", new Vector2(0, 0.82f), new Vector2(1, 0.94f), Vector2.zero, Vector2.zero, 44, TextAlignmentOptions.Center, new Color(1f, 0.85f, 0.35f));
            _pause.retryCountText = RuntimeUIFactory.AddText(_pausePanel, "RetryCount", "", new Vector2(0.1f, 0.72f), new Vector2(0.9f, 0.8f), Vector2.zero, Vector2.zero, 20, TextAlignmentOptions.Center, new Color(1f, 0.7f, 0.7f));
            _pause.failureHintsText = RuntimeUIFactory.AddText(_pausePanel, "Hint", "", new Vector2(0.1f, 0.64f), new Vector2(0.9f, 0.7f), Vector2.zero, Vector2.zero, 18, TextAlignmentOptions.Center, new Color(0.7f, 0.9f, 1f));

            _pause.resumeButton = RuntimeUIFactory.AddButton(_pausePanel, "Resume", "▶ 继续游戏", new Vector2(0.22f, 0.48f), new Vector2(0.78f, 0.57f), Vector2.zero, Vector2.zero, new Color(0.2f, 0.7f, 0.35f), 26);
            _pause.restartButton = RuntimeUIFactory.AddButton(_pausePanel, "Restart", "↻ 重新开始本关", new Vector2(0.22f, 0.37f), new Vector2(0.78f, 0.46f), Vector2.zero, Vector2.zero, new Color(0.25f, 0.5f, 0.8f), 24);
            _pause.settingsButton = RuntimeUIFactory.AddButton(_pausePanel, "Settings", "⚙ 设置", new Vector2(0.22f, 0.26f), new Vector2(0.78f, 0.35f), Vector2.zero, Vector2.zero, new Color(0.5f, 0.45f, 0.2f), 24);
            _pause.quitButton = RuntimeUIFactory.AddButton(_pausePanel, "Quit", "🏠 返回主菜单", new Vector2(0.22f, 0.14f), new Vector2(0.78f, 0.23f), Vector2.zero, Vector2.zero, new Color(0.7f, 0.3f, 0.3f), 24);
        }

        private void BuildResult()
        {
            GameObject compGo = new GameObject("ResultScreenController");
            compGo.transform.SetParent(_resultPanel, false);
            _result = compGo.AddComponent<ResultScreenController>();
            _result.starFilledSprite = GetStarSprite();
            _result.starEmptySprite = GetStarSprite();

            _result.successPanel = RuntimeUIFactory.AddPanel(_resultPanel, "SuccessP", new Vector2(0.18f, 0.08f), new Vector2(0.82f, 0.92f), Vector2.zero, Vector2.zero, new Color(0.08f, 0.22f, 0.12f, 0.92f)).gameObject;
            _result.failurePanel = RuntimeUIFactory.AddPanel(_resultPanel, "FailureP", new Vector2(0.1f, 0.04f), new Vector2(0.9f, 0.96f), Vector2.zero, Vector2.zero, new Color(0.22f, 0.08f, 0.08f, 0.92f)).gameObject;

            _result.levelNameText = RuntimeUIFactory.AddText(_resultPanel, "LevelName", "第1关", new Vector2(0.3f, 0.89f), new Vector2(0.7f, 0.95f), Vector2.zero, Vector2.zero, 32, TextAlignmentOptions.Center, Color.white);

            GameObject starsGo = new GameObject("Stars", typeof(RectTransform), typeof(HorizontalLayoutGroup));
            starsGo.transform.SetParent(_resultPanel, false);
            RectTransform sRt = (RectTransform)starsGo.transform;
            sRt.anchorMin = new Vector2(0.35f, 0.74f); sRt.anchorMax = new Vector2(0.65f, 0.84f);
            sRt.offsetMin = Vector2.zero; sRt.offsetMax = Vector2.zero;
            HorizontalLayoutGroup shlg = starsGo.GetComponent<HorizontalLayoutGroup>();
            shlg.childAlignment = TextAnchor.MiddleCenter; shlg.spacing = 40;
            _result.starImages = new Image[3];
            for (int i = 0; i < 3; i++)
            {
                Image star = new GameObject("S" + i, typeof(RectTransform), typeof(Image)).GetComponent<Image>();
                star.transform.SetParent(starsGo.transform, false);
                star.sprite = GetStarSprite();
                ((RectTransform)star.transform).sizeDelta = new Vector2(70, 70);
                _result.starImages[i] = star;
            }

            _result.scoreText = RuntimeUIFactory.AddText(_resultPanel, "Score", "0", new Vector2(0.38f, 0.52f), new Vector2(0.62f, 0.7f), Vector2.zero, Vector2.zero, 60, TextAlignmentOptions.Center, new Color(1f, 0.9f, 0.35f));
            RuntimeUIFactory.AddText(_resultPanel, "ScoreLabel", "最终分数", new Vector2(0.4f, 0.47f), new Vector2(0.6f, 0.52f), Vector2.zero, Vector2.zero, 18, TextAlignmentOptions.Center, new Color(0.7f, 0.75f, 0.8f));

            _result.coinsText = RuntimeUIFactory.AddText(_resultPanel, "Coins", "+0", new Vector2(0.2f, 0.4f), new Vector2(0.4f, 0.46f), Vector2.zero, Vector2.zero, 26, TextAlignmentOptions.Center, new Color(1f, 0.8f, 0.3f));
            _result.ordersCompletedText = RuntimeUIFactory.AddText(_resultPanel, "Orders", "0", new Vector2(0.42f, 0.4f), new Vector2(0.58f, 0.46f), Vector2.zero, Vector2.zero, 26, TextAlignmentOptions.Center, new Color(0.4f, 1f, 0.5f));
            _result.ordersFailedText = RuntimeUIFactory.AddText(_resultPanel, "Failed", "0", new Vector2(0.6f, 0.4f), new Vector2(0.8f, 0.46f), Vector2.zero, Vector2.zero, 26, TextAlignmentOptions.Center, new Color(1f, 0.45f, 0.45f));
            _result.bestScoreText = RuntimeUIFactory.AddText(_resultPanel, "Best", "", new Vector2(0.35f, 0.33f), new Vector2(0.65f, 0.39f), Vector2.zero, Vector2.zero, 20, TextAlignmentOptions.Center, new Color(0.75f, 0.9f, 1f));

            RectTransform sPanelRt = _result.successPanel.GetComponent<RectTransform>();
            _result.successMessageText = RuntimeUIFactory.AddText(sPanelRt, "Msg", "关卡通过！", new Vector2(0.1f, 0.87f), new Vector2(0.9f, 0.93f), Vector2.zero, Vector2.zero, 24, TextAlignmentOptions.Center, new Color(0.6f, 1f, 0.65f));
            _result.nextLevelButton = RuntimeUIFactory.AddButton(sPanelRt, "Next", "下一关 →", new Vector2(0.55f, 0.04f), new Vector2(0.88f, 0.11f), Vector2.zero, Vector2.zero, new Color(0.2f, 0.7f, 0.35f), 22);
            _result.retryButtonSuccess = RuntimeUIFactory.AddButton(sPanelRt, "RetryS", "↻ 再玩一次", new Vector2(0.12f, 0.04f), new Vector2(0.45f, 0.11f), Vector2.zero, Vector2.zero, new Color(0.25f, 0.5f, 0.8f), 22);
            _result.menuButtonSuccess = RuntimeUIFactory.AddButton(sPanelRt, "MenuS", "🏠 主菜单", new Vector2(0.34f, 0.14f), new Vector2(0.66f, 0.2f), Vector2.zero, Vector2.zero, new Color(0.45f, 0.45f, 0.5f), 18);

            RectTransform fPanelRt = _result.failurePanel.GetComponent<RectTransform>();
            _result.failureMessageText = RuntimeUIFactory.AddText(fPanelRt, "Msg", "未通过，再接再厉！", new Vector2(0.08f, 0.63f), new Vector2(0.92f, 0.68f), Vector2.zero, Vector2.zero, 22, TextAlignmentOptions.Center, new Color(1f, 0.65f, 0.65f));
            _result.retryHintText = RuntimeUIFactory.AddText(fPanelRt, "Hint", "", new Vector2(0.08f, 0.07f), new Vector2(0.92f, 0.11f), Vector2.zero, Vector2.zero, 18, TextAlignmentOptions.Center, new Color(1f, 0.75f, 0.45f));
            _result.failureAnalysisText = RuntimeUIFactory.AddText(fPanelRt, "Analysis", "", new Vector2(0.08f, 0.42f), new Vector2(0.92f, 0.47f), Vector2.zero, Vector2.zero, 20, TextAlignmentOptions.MidlineLeft, new Color(1f, 0.8f, 0.65f));

            GameObject fs = new GameObject("FailureSteps", typeof(RectTransform), typeof(VerticalLayoutGroup));
            fs.transform.SetParent(fPanelRt, false);
            RectTransform fsRt = (RectTransform)fs.transform;
            fsRt.anchorMin = new Vector2(0.08f, 0.14f); fsRt.anchorMax = new Vector2(0.92f, 0.4f);
            fsRt.offsetMin = Vector2.zero; fsRt.offsetMax = Vector2.zero;
            VerticalLayoutGroup fVlg = fs.GetComponent<VerticalLayoutGroup>();
            fVlg.spacing = 7;
            _result.failureStepsContainer = fs.transform;
            _result.failureStepItemPrefab = BuildFailItem();

            _result.retryButtonFailure = RuntimeUIFactory.AddButton(fPanelRt, "RetryF", "↻ 重试本关", new Vector2(0.55f, 0.02f), new Vector2(0.88f, 0.07f), Vector2.zero, Vector2.zero, new Color(0.25f, 0.55f, 0.85f), 20);
            _result.tutorialButton = RuntimeUIFactory.AddButton(fPanelRt, "Tutor", "📖 重看教程", new Vector2(0.12f, 0.02f), new Vector2(0.3f, 0.07f), Vector2.zero, Vector2.zero, new Color(0.55f, 0.45f, 0.2f), 18);
            _result.menuButtonFailure = RuntimeUIFactory.AddButton(fPanelRt, "MenuF", "🏠 主菜单", new Vector2(0.32f, 0.02f), new Vector2(0.52f, 0.07f), Vector2.zero, Vector2.zero, new Color(0.45f, 0.45f, 0.5f), 18);
        }

        private GameObject BuildFailItem()
        {
            GameObject go = new GameObject("FailItem", typeof(RectTransform), typeof(LayoutElement));
            go.GetComponent<LayoutElement>().minHeight = 26;
            RuntimeUIFactory.AddText(go.transform, "Text", "", Vector2.zero, Vector2.one, new Vector2(5, 0), new Vector2(-5, 0), 18, TextAlignmentOptions.MidlineLeft, new Color(1f, 0.75f, 0.75f));
            return go;
        }

        private void BuildSettings()
        {
            GameObject compGo = new GameObject("SettingsMenuController");
            compGo.transform.SetParent(_settingsPanel, false);
            _settings = compGo.AddComponent<SettingsMenuController>();
            _settings.settingsPanel = _settingsPanel.gameObject;

            RuntimeUIFactory.AddText(_settingsPanel, "Title", "⚙ 游戏设置", new Vector2(0.4f, 0.92f), new Vector2(0.6f, 0.975f), Vector2.zero, Vector2.zero, 38, TextAlignmentOptions.Center, new Color(1f, 0.85f, 0.3f));

            _settings.generalTab = RuntimeUIFactory.AddPanel(_settingsPanel, "General", new Vector2(0.05f, 0.12f), new Vector2(0.95f, 0.88f), Vector2.zero, Vector2.zero, new Color(0.1f, 0.12f, 0.16f, 0.85f)).gameObject;
            _settings.audioTab = RuntimeUIFactory.AddPanel(_settingsPanel, "Audio", new Vector2(0.05f, 0.12f), new Vector2(0.95f, 0.88f), Vector2.zero, Vector2.zero, new Color(0.1f, 0.12f, 0.16f, 0.85f)).gameObject;
            _settings.graphicsTab = RuntimeUIFactory.AddPanel(_settingsPanel, "Graphics", new Vector2(0.05f, 0.12f), new Vector2(0.95f, 0.88f), Vector2.zero, Vector2.zero, new Color(0.1f, 0.12f, 0.16f, 0.85f)).gameObject;
            _settings.inputTab = RuntimeUIFactory.AddPanel(_settingsPanel, "Input", new Vector2(0.05f, 0.12f), new Vector2(0.95f, 0.88f), Vector2.zero, Vector2.zero, new Color(0.1f, 0.12f, 0.16f, 0.85f)).gameObject;
            _settings.generalTab.SetActive(true);
            _settings.audioTab.SetActive(false);
            _settings.graphicsTab.SetActive(false);
            _settings.inputTab.SetActive(false);

            _settings.generalTabButton = RuntimeUIFactory.AddButton(_settingsPanel, "G", "常规", new Vector2(0.05f, 0.885f), new Vector2(0.17f, 0.92f), Vector2.zero, Vector2.zero, new Color(0.35f, 0.35f, 0.45f), 20);
            _settings.audioTabButton = RuntimeUIFactory.AddButton(_settingsPanel, "A", "音频", new Vector2(0.18f, 0.885f), new Vector2(0.30f, 0.92f), Vector2.zero, Vector2.zero, new Color(0.35f, 0.35f, 0.45f), 20);
            _settings.graphicsTabButton = RuntimeUIFactory.AddButton(_settingsPanel, "Gr", "画质", new Vector2(0.31f, 0.885f), new Vector2(0.43f, 0.92f), Vector2.zero, Vector2.zero, new Color(0.35f, 0.35f, 0.45f), 20);
            _settings.inputTabButton = RuntimeUIFactory.AddButton(_settingsPanel, "I", "输入", new Vector2(0.44f, 0.885f), new Vector2(0.56f, 0.92f), Vector2.zero, Vector2.zero, new Color(0.35f, 0.35f, 0.45f), 20);

            Button closeBtn = RuntimeUIFactory.AddButton(_settingsPanel, "Close", "✕ 关闭", new Vector2(0.8f, 0.885f), new Vector2(0.94f, 0.92f), Vector2.zero, Vector2.zero, new Color(0.7f, 0.3f, 0.3f), 20);
            closeBtn.onClick.AddListener(() => _settingsPanel.gameObject.SetActive(false));

            _settings.applyGraphicsButton = RuntimeUIFactory.AddButton(_settingsPanel, "Apply", "✓ 保存应用", new Vector2(0.62f, 0.05f), new Vector2(0.78f, 0.095f), Vector2.zero, Vector2.zero, new Color(0.2f, 0.7f, 0.35f), 18);

            Button resetBtn = RuntimeUIFactory.AddButton(_settingsPanel, "Reset", "↺ 恢复默认", new Vector2(0.45f, 0.05f), new Vector2(0.61f, 0.095f), Vector2.zero, Vector2.zero, new Color(0.55f, 0.45f, 0.2f), 18);
            resetBtn.onClick.AddListener(() =>
            {
                if (_settings.languageDropdown != null) _settings.languageDropdown.value = 0;
                if (_settings.masterVolumeSlider != null) _settings.masterVolumeSlider.value = 1f;
                if (_settings.musicVolumeSlider != null) _settings.musicVolumeSlider.value = 0.8f;
                if (_settings.sfxVolumeSlider != null) _settings.sfxVolumeSlider.value = 1f;
                if (_settings.qualityDropdown != null && _settings.qualityDropdown.options.Count > 0)
                    _settings.qualityDropdown.value = 2;
                if (_settings.vsyncToggle != null) _settings.vsyncToggle.isOn = true;
                if (_settings.autoAdaptToggle != null) _settings.autoAdaptToggle.isOn = true;
                if (_settings.targetFPSDropdown != null && _settings.targetFPSDropdown.options.Count > 1)
                    _settings.targetFPSDropdown.value = 1;
                if (_settings.screenShakeToggle != null) _settings.screenShakeToggle.isOn = true;
                if (_settings.subtitlesToggle != null) _settings.subtitlesToggle.isOn = true;
                if (_settings.showPerfStatsToggle != null) _settings.showPerfStatsToggle.isOn = false;
                if (_settings.uiScaleSlider != null) _settings.uiScaleSlider.value = 1f;
            });

            _settings.backButton = RuntimeUIFactory.AddButton(_settingsPanel, "Back", "← 返回", new Vector2(0.22f, 0.05f), new Vector2(0.38f, 0.095f), Vector2.zero, Vector2.zero, new Color(0.45f, 0.45f, 0.5f), 18);

            RectTransform grt = _settings.generalTab.GetComponent<RectTransform>();
            _settings.languageDropdown = RuntimeUIFactory.AddDropdown(grt, "Lang",
                new Vector2(0.45f, 0.78f), new Vector2(0.82f, 0.85f), Vector2.zero, Vector2.zero,
                new List<string> { "简体中文", "English" }, 0);
            _settings.showPerfStatsToggle = RuntimeUIFactory.AddToggle(grt, "显示性能统计",
                new Vector2(0.55f, 0.62f), new Vector2(0.9f, 0.7f), Vector2.zero, Vector2.zero, false);
            _settings.screenShakeToggle = RuntimeUIFactory.AddToggle(grt, "屏幕震动",
                new Vector2(0.1f, 0.50f), new Vector2(0.45f, 0.58f), Vector2.zero, Vector2.zero, true);
            _settings.subtitlesToggle = RuntimeUIFactory.AddToggle(grt, "字幕显示",
                new Vector2(0.55f, 0.50f), new Vector2(0.9f, 0.58f), Vector2.zero, Vector2.zero, true);
            _settings.uiScaleSlider = RuntimeUIFactory.AddSlider(grt, "UI Scale",
                new Vector2(0.45f, 0.62f), new Vector2(0.88f, 0.68f), Vector2.zero, Vector2.zero,
                0.5f, 2f, 1f);
            _settings.uiScaleValue = RuntimeUIFactory.AddText(grt, "UI Scale Val", "100%",
                new Vector2(0.86f, 0.62f), new Vector2(0.95f, 0.68f),
                Vector2.zero, Vector2.zero, 18, TextAlignmentOptions.Center, Color.white);
            _settings.uiScaleSlider.onValueChanged.AddListener(v => _settings.uiScaleValue.text = $"{v * 100:F0}%");
            RuntimeUIFactory.AddText(grt, "LangL", "语言：", new Vector2(0.1f, 0.78f), new Vector2(0.4f, 0.85f), Vector2.zero, Vector2.zero, 22, TextAlignmentOptions.MidlineLeft, Color.white);
            RuntimeUIFactory.AddText(grt, "UIL", "UI 缩放：", new Vector2(0.1f, 0.62f), new Vector2(0.4f, 0.68f), Vector2.zero, Vector2.zero, 22, TextAlignmentOptions.MidlineLeft, Color.white);

            RectTransform art = _settings.audioTab.GetComponent<RectTransform>();
            _settings.masterVolumeSlider = RuntimeUIFactory.AddSlider(art, "Master Volume",
                new Vector2(0.45f, 0.78f), new Vector2(0.88f, 0.83f), Vector2.zero, Vector2.zero,
                0f, 1f, 1f);
            _settings.musicVolumeSlider = RuntimeUIFactory.AddSlider(art, "Music Volume",
                new Vector2(0.45f, 0.66f), new Vector2(0.88f, 0.71f), Vector2.zero, Vector2.zero,
                0f, 1f, 0.8f);
            _settings.sfxVolumeSlider = RuntimeUIFactory.AddSlider(art, "SFX Volume",
                new Vector2(0.45f, 0.54f), new Vector2(0.88f, 0.59f), Vector2.zero, Vector2.zero,
                0f, 1f, 1f);
            RuntimeUIFactory.AddText(art, "MasL", "主音量：", new Vector2(0.1f, 0.78f), new Vector2(0.4f, 0.83f), Vector2.zero, Vector2.zero, 22, TextAlignmentOptions.MidlineLeft, Color.white);
            RuntimeUIFactory.AddText(art, "MusL", "音乐音量：", new Vector2(0.1f, 0.66f), new Vector2(0.4f, 0.71f), Vector2.zero, Vector2.zero, 22, TextAlignmentOptions.MidlineLeft, Color.white);
            RuntimeUIFactory.AddText(art, "SfxL", "音效音量：", new Vector2(0.1f, 0.54f), new Vector2(0.4f, 0.59f), Vector2.zero, Vector2.zero, 22, TextAlignmentOptions.MidlineLeft, Color.white);
            _settings.masterVolumeValue = RuntimeUIFactory.AddText(art, "MasVal", "100%",
                new Vector2(0.86f, 0.78f), new Vector2(0.95f, 0.85f),
                Vector2.zero, Vector2.zero, 18, TextAlignmentOptions.Center, Color.white);
            _settings.musicVolumeValue = RuntimeUIFactory.AddText(art, "MusVal", "80%",
                new Vector2(0.86f, 0.66f), new Vector2(0.95f, 0.73f),
                Vector2.zero, Vector2.zero, 18, TextAlignmentOptions.Center, Color.white);
            _settings.sfxVolumeValue = RuntimeUIFactory.AddText(art, "SFXVal", "100%",
                new Vector2(0.86f, 0.54f), new Vector2(0.95f, 0.61f),
                Vector2.zero, Vector2.zero, 18, TextAlignmentOptions.Center, Color.white);
            _settings.masterVolumeSlider.onValueChanged.AddListener(v => _settings.masterVolumeValue.text = $"{v * 100:F0}%");
            _settings.musicVolumeSlider.onValueChanged.AddListener(v => _settings.musicVolumeValue.text = $"{v * 100:F0}%");
            _settings.sfxVolumeSlider.onValueChanged.AddListener(v => _settings.sfxVolumeValue.text = $"{v * 100:F0}%");

            RectTransform gr2t = _settings.graphicsTab.GetComponent<RectTransform>();
            _settings.qualityDropdown = RuntimeUIFactory.AddDropdown(gr2t, "Quality",
                new Vector2(0.45f, 0.78f), new Vector2(0.82f, 0.85f), Vector2.zero, Vector2.zero,
                new List<string> { "极低", "低", "中", "高", "极高", "超高质量" }, QualitySettings.GetQualityLevel());
            _settings.fullscreenDropdown = RuntimeUIFactory.AddDropdown(gr2t, "Fullscreen Mode",
                new Vector2(0.45f, 0.68f), new Vector2(0.82f, 0.75f), Vector2.zero, Vector2.zero,
                new List<string> { "全屏", "无边框", "最大化", "窗口化" }, 1);
            _settings.resolutionDropdown = RuntimeUIFactory.AddDropdown(gr2t, "Resolution",
                new Vector2(0.45f, 0.58f), new Vector2(0.82f, 0.65f), Vector2.zero, Vector2.zero,
                new List<string> { "1920x1080", "1280x720", "3840x2160", "2560x1440" }, 0);
            _settings.targetFPSDropdown = RuntimeUIFactory.AddDropdown(gr2t, "Target FPS",
                new Vector2(0.45f, 0.48f), new Vector2(0.82f, 0.55f), Vector2.zero, Vector2.zero,
                new List<string> { "30", "60", "90", "120", "144", "240" }, 1);
            _settings.vsyncToggle = RuntimeUIFactory.AddToggle(gr2t, "垂直同步",
                new Vector2(0.1f, 0.32f), new Vector2(0.45f, 0.40f), Vector2.zero, Vector2.zero, true);
            _settings.autoAdaptToggle = RuntimeUIFactory.AddToggle(gr2t, "根据性能自动调节画质",
                new Vector2(0.55f, 0.32f), new Vector2(0.95f, 0.40f), Vector2.zero, Vector2.zero, true);
            RuntimeUIFactory.AddText(gr2t, "QL", "画质级别：", new Vector2(0.1f, 0.78f), new Vector2(0.4f, 0.85f), Vector2.zero, Vector2.zero, 22, TextAlignmentOptions.MidlineLeft, Color.white);
            RuntimeUIFactory.AddText(gr2t, "FSL", "显示模式：", new Vector2(0.1f, 0.68f), new Vector2(0.4f, 0.75f), Vector2.zero, Vector2.zero, 22, TextAlignmentOptions.MidlineLeft, Color.white);
            RuntimeUIFactory.AddText(gr2t, "RL", "分辨率：", new Vector2(0.1f, 0.58f), new Vector2(0.4f, 0.65f), Vector2.zero, Vector2.zero, 22, TextAlignmentOptions.MidlineLeft, Color.white);
            RuntimeUIFactory.AddText(gr2t, "FL", "帧率上限：", new Vector2(0.1f, 0.48f), new Vector2(0.4f, 0.55f), Vector2.zero, Vector2.zero, 22, TextAlignmentOptions.MidlineLeft, Color.white);

            RectTransform irt = _settings.inputTab.GetComponent<RectTransform>();
            _settings.playerSelectDropdown = RuntimeUIFactory.AddDropdown(irt, "Player Select",
                new Vector2(0.45f, 0.78f), new Vector2(0.82f, 0.85f), Vector2.zero, Vector2.zero,
                new List<string> { "玩家 1", "玩家 2", "玩家 3", "玩家 4" }, 0);
            RuntimeUIFactory.AddText(irt, "PL", "选择玩家：", new Vector2(0.1f, 0.78f), new Vector2(0.4f, 0.85f), Vector2.zero, Vector2.zero, 22, TextAlignmentOptions.MidlineLeft, Color.white);

            GameObject bindingsGo = new GameObject("BindingsContainer", typeof(RectTransform), typeof(VerticalLayoutGroup));
            bindingsGo.transform.SetParent(irt, false);
            RectTransform bcRt = (RectTransform)bindingsGo.transform;
            bcRt.anchorMin = new Vector2(0.05f, 0.28f); bcRt.anchorMax = new Vector2(0.95f, 0.72f);
            bcRt.offsetMin = Vector2.zero; bcRt.offsetMax = Vector2.zero;
            VerticalLayoutGroup bVlg = bindingsGo.GetComponent<VerticalLayoutGroup>();
            bVlg.spacing = 10; bVlg.childControlHeight = true; bVlg.childControlWidth = true;
            _settings.bindingsContainer = bindingsGo.transform;

            GameObject rowTpl = new GameObject("BindingRowPrefab", typeof(RectTransform), typeof(Image), typeof(LayoutElement));
            rowTpl.GetComponent<LayoutElement>().minHeight = 40;
            rowTpl.GetComponent<Image>().color = new Color(0.18f, 0.2f, 0.25f);
            RuntimeUIFactory.AddText(rowTpl.transform, "ActionLabel", "动作名称",
                new Vector2(0.02f, 0), new Vector2(0.48f, 1), Vector2.zero, Vector2.zero, 18,
                TextAlignmentOptions.MidlineLeft, Color.white);
            Button rebindBtn = RuntimeUIFactory.AddButton(rowTpl.transform, "RebindBtn", "按 E 重新绑定",
                new Vector2(0.52f, 0.15f), new Vector2(0.98f, 0.85f), Vector2.zero, Vector2.zero,
                new Color(0.3f, 0.4f, 0.7f), 16);
            rebindBtn.name = "RebindBtn";
            _settings.bindingRowPrefab = rowTpl;

            _settings.resetBindingsButton = RuntimeUIFactory.AddButton(irt, "ResetBindings",
                "↺ 恢复所有按键为默认",
                new Vector2(0.1f, 0.12f), new Vector2(0.45f, 0.20f), Vector2.zero, Vector2.zero,
                new Color(0.55f, 0.45f, 0.2f), 18);
            _settings.saveBindingsButton = RuntimeUIFactory.AddButton(irt, "SaveBindings",
                "✓ 保存按键绑定",
                new Vector2(0.55f, 0.12f), new Vector2(0.9f, 0.20f), Vector2.zero, Vector2.zero,
                new Color(0.2f, 0.6f, 0.8f), 18);
        }

        private void BuildPerfOverlay()
        {
            if (_uiRoot == null) return;
            GameObject po = new GameObject("PerformanceOverlay", typeof(RectTransform));
            po.transform.SetParent(_uiRoot.transform, false);
            RectTransform poRt = (RectTransform)po.transform;
            poRt.anchorMin = new Vector2(0.01f, 0.01f); poRt.anchorMax = new Vector2(0.22f, 0.11f);
            poRt.offsetMin = Vector2.zero; poRt.offsetMax = Vector2.zero;
            Image bgi = po.AddComponent<Image>();
            bgi.color = new Color(0, 0, 0, 0.55f);
            _perfOverlay = po.AddComponent<PerformanceOverlay>();
            _perfOverlay.fpsText = RuntimeUIFactory.AddText(poRt, "FPS", "FPS: 0", new Vector2(0.05f, 0.55f), new Vector2(0.95f, 0.92f), Vector2.zero, Vector2.zero, 16, TextAlignmentOptions.TopLeft, new Color(0.45f, 1f, 0.45f));
            _perfOverlay.memoryText = RuntimeUIFactory.AddText(poRt, "Mem", "MEM: 0MB", new Vector2(0.05f, 0.08f), new Vector2(0.95f, 0.5f), Vector2.zero, Vector2.zero, 14, TextAlignmentOptions.TopLeft, new Color(0.7f, 0.9f, 1f));
            po.SetActive(false);
        }

        private void ConnectGlobalStateUI()
        {
            var gm = GameManager.Instance;
            if (gm == null) return;

            gm.OnStateChanged += (oldS, newS) =>
            {
                bool inGameplay = newS == GameManager.GameState.Playing
                                  || newS == GameManager.GameState.Countdown
                                  || newS == GameManager.GameState.Tutorial;
                if (_hudRoot != null) _hudRoot.gameObject.SetActive(inGameplay || newS == GameManager.GameState.Paused);
                if (_mainMenuPanel != null) _mainMenuPanel.gameObject.SetActive(newS == GameManager.GameState.MainMenu);
                if (_tutorialPanel != null) _tutorialPanel.gameObject.SetActive(newS == GameManager.GameState.Tutorial);
                if (_pausePanel != null) _pausePanel.gameObject.SetActive(newS == GameManager.GameState.Paused);
                if (_resultPanel != null) _resultPanel.gameObject.SetActive(newS == GameManager.GameState.LevelComplete || newS == GameManager.GameState.LevelFailed);
                if (newS == GameManager.GameState.Settings) _settingsPanel?.gameObject.SetActive(true);
                else if (oldS == GameManager.GameState.Settings && newS != GameManager.GameState.Settings) _settingsPanel?.gameObject.SetActive(false);
            };
        }

        private Sprite GetStarSprite()
        {
            if (_starSprite != null) return _starSprite;
            Texture2D t = new Texture2D(32, 32);
            for (int x = 0; x < 32; x++)
                for (int y = 0; y < 32; y++)
                {
                    float dx = x - 15.5f, dy = y - 15.5f;
                    float d = Mathf.Sqrt(dx * dx + dy * dy);
                    t.SetPixel(x, y, d < 14 ? Color.white : new Color(0, 0, 0, 0));
                }
            t.Apply();
            _starSprite = Sprite.Create(t, new Rect(0, 0, 32, 32), new Vector2(0.5f, 0.5f));
            return _starSprite;
        }
    }
}