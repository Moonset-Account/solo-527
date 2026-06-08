using UnityEngine;
using UnityEngine.SceneManagement;

namespace LightShadowPlatformer.Runtime
{
    public class SceneBootstrap : MonoBehaviour
    {
        public Core.GameManager gameManager;
        public Core.SaveManager saveManager;
        public Core.SettingsManager settingsManager;
        public Core.AudioManager audioManager;
        public Core.LightManager lightManager;
        public UI.UIManager uiManager;

        public bool verboseLogging = true;
        public int skipToLevel = -1;

        private static bool _bootstrapped;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void AutoBootstrap()
        {
            if (_bootstrapped) return;
            GameObject bootstrap = new GameObject("[SceneBootstrap]");
            bootstrap.AddComponent<SceneBootstrap>();
        }

        private void Awake()
        {
            if (_bootstrapped) { Destroy(gameObject); return; }
            _bootstrapped = true;
            DontDestroyOnLoad(gameObject);
            InitializeCoreManagers();
        }

        private void Start()
        {
            BuildCurrentSceneWithRuntime();

            if (skipToLevel >= 0 && Core.GameManager.Instance != null)
            {
                Core.GameManager.Instance.LoadLevel(skipToLevel);
                return;
            }

            int bi = SceneManager.GetActiveScene().buildIndex;
            if (bi > 0 && Core.GameManager.Instance != null)
            {
                int levelIdx = Mathf.Max(0, bi - 1);
                Core.GameManager.Instance.currentLevelIndex = levelIdx;
                Core.GameManager.Instance.ChangeState(Core.GameManager.GameState.Playing);
            }
            else if (bi == 0 && Core.GameManager.Instance != null)
            {
                Core.GameManager.Instance.ChangeState(Core.GameManager.GameState.MainMenu);
            }

            SetupSceneReferences();
        }

        private void OnEnable()
        {
            SceneManager.sceneLoaded += OnSceneLoaded;
        }

        private void OnDisable()
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
        }

        private void BuildCurrentSceneWithRuntime()
        {
            int bi = SceneManager.GetActiveScene().buildIndex;
            var type = bi switch
            {
                0 => SceneType.MainMenu,
                1 => SceneType.Level01,
                2 => SceneType.Level02,
                3 => SceneType.Level03,
                _ => SceneType.MainMenu
            };

            RuntimeSceneBuilder.EnsureAllManagersExist();
            RuntimeSceneBuilder.Build(type);
            RuntimeUIFactory.EnsureAllUI();
            RuntimeAudioFactory.EnsureAllAudio();
            RuntimeAnimationFactory.EnsureAnimators();
        }

        private void InitializeCoreManagers()
        {
            Log("Initializing core managers (asmdef)...");

            gameManager = CreateOrFind<Core.GameManager>("GameManager");
            saveManager = CreateOrFind<Core.SaveManager>("SaveManager");
            settingsManager = CreateOrFind<Core.SettingsManager>("SettingsManager");
            audioManager = CreateOrFind<Core.AudioManager>("AudioManager");
            uiManager = CreateOrFind<UI.UIManager>("UIManager");
            lightManager = CreateOrFind<Core.LightManager>("LightManager");

            Log("Core managers initialized.");
        }

        private T CreateOrFind<T>(string name) where T : MonoBehaviour
        {
            T existing = FindObjectOfType<T>();
            if (existing != null)
            {
                DontDestroyOnLoad(existing.gameObject);
                return existing;
            }
            GameObject go = new GameObject($"[{name}]");
            T comp = go.AddComponent<T>();
            DontDestroyOnLoad(go);
            return comp;
        }

        private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            Log($"Scene loaded: {scene.name} (idx={scene.buildIndex})");
            BuildCurrentSceneWithRuntime();
            SetupSceneReferences();
            int bi = scene.buildIndex;
            if (bi == 0 && Core.GameManager.Instance != null)
                Core.GameManager.Instance.ChangeState(Core.GameManager.GameState.MainMenu);
            else if (bi > 0 && Core.GameManager.Instance != null)
            {
                Core.GameManager.Instance.currentLevelIndex = bi - 1;
                Core.GameManager.Instance.ChangeState(Core.GameManager.GameState.Playing);
            }
        }

        private void SetupSceneReferences()
        {
            if (Core.LightManager.Instance != null)
            {
                Core.LightManager.Instance.backgroundRenderer = FindSceneObject<SpriteRenderer>("Background");
                Core.LightManager.Instance.mainCamera = FindObjectOfType<UnityEngine.Camera>();
                Core.LightManager.Instance.RegisterAllPlatforms();
            }

            Player.PlayerController player = FindObjectOfType<Player.PlayerController>();
            Camera.CameraController cam = FindObjectOfType<Camera.CameraController>();
            if (cam != null && player != null && cam.target == null)
            {
                cam.SetTarget(player.transform);
            }

            UI.HUDController hud = FindObjectOfType<UI.HUDController>();
            hud?.CountTotalCollectibles();
            hud?.Refresh();

            UI.UIManager uim = UI.UIManager.Instance;
            if (uim != null)
            {
                int bi = SceneManager.GetActiveScene().buildIndex;
                if (bi == 0) { uim.ShowMainMenu(); uim.HideHUD(); }
                else { uim.HideMainMenu(); uim.ShowHUD(); }
            }
        }

        private T FindSceneObject<T>(string nameContains) where T : Component
        {
            T[] all = FindObjectsOfType<T>();
            foreach (var o in all)
                if (o.gameObject.name.Contains(nameContains)) return o;
            return all.Length > 0 ? all[0] : null;
        }

        private void Log(string msg)
        {
            if (verboseLogging) Debug.Log($"[SceneBootstrap] {msg}");
        }
    }
}
