using UnityEngine;
using UnityEngine.SceneManagement;

namespace LightShadowPlatformer.Core
{
    public class SceneBootstrap : MonoBehaviour
    {
        [Header("Prefabs")]
        public GameManager gameManagerPrefab;
        public SaveManager saveManagerPrefab;
        public SettingsManager settingsManagerPrefab;
        public AudioManager audioManagerPrefab;
        public EventManager eventManagerPrefab;
        public LightManager lightManagerPrefab;
        public UI.UIManager uiManagerPrefab;

        [Header("Managers")]
        public GameManager gameManager;
        public SaveManager saveManager;
        public SettingsManager settingsManager;
        public AudioManager audioManager;
        public LightManager lightManager;
        public UI.UIManager uiManager;

        [Header("Debug")]
        public bool verboseLogging = true;
        public bool skipToLevel = -1;

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
            if (_bootstrapped)
            {
                Destroy(gameObject);
                return;
            }
            _bootstrapped = true;
            DontDestroyOnLoad(gameObject);

            InitializeCoreManagers();
        }

        private void Start()
        {
            if (skipToLevel >= 0 && GameManager.Instance != null)
            {
                GameManager.Instance.LoadLevel(skipToLevel);
            }
            else if (GameManager.Instance != null && SceneManager.GetActiveScene().buildIndex > 0)
            {
                int levelIdx = Mathf.Max(0, SceneManager.GetActiveScene().buildIndex - 1);
                GameManager.Instance.currentLevelIndex = levelIdx;
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

        private void InitializeCoreManagers()
        {
            Log("Initializing core managers...");

            if (EventManager.Instance == null) { }

            gameManager = CreateManager(gameManagerPrefab, "GameManager") as GameManager;
            saveManager = CreateManager(saveManagerPrefab, "SaveManager") as SaveManager;
            settingsManager = CreateManager(settingsManagerPrefab, "SettingsManager") as SettingsManager;
            audioManager = CreateManager(audioManagerPrefab, "AudioManager") as AudioManager;
            uiManager = CreateManager(uiManagerPrefab, "UIManager") as UI.UIManager;
            lightManager = CreateManager(lightManagerPrefab, "LightManager") as LightManager;

            Log("Core managers initialized.");
        }

        private MonoBehaviour CreateManager(Object prefab, string name)
        {
            GameObject go = null;

            if (prefab != null)
            {
                go = Instantiate(prefab) as GameObject;
                go.name = $"[{name}]";
            }
            else
            {
                go = new GameObject($"[{name}]");
                System.Type t = System.Type.GetType($"LightShadowPlatformer.Core.{name}, Assembly-CSharp");
                if (t != null)
                {
                    MonoBehaviour comp = go.AddComponent(t) as MonoBehaviour;
                    DontDestroyOnLoad(go);
                    return comp;
                }
                if (name == "UIManager")
                {
                    var comp = go.AddComponent<UI.UIManager>();
                    DontDestroyOnLoad(go);
                    return comp;
                }
            }

            if (go != null) DontDestroyOnLoad(go);
            return go?.GetComponent<MonoBehaviour>();
        }

        private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            Log($"Scene loaded: {scene.name}");
            SetupSceneReferences();
        }

        private void SetupSceneReferences()
        {
            if (LightManager.Instance != null)
            {
                LightManager.Instance.backgroundRenderer = FindSceneObject<SpriteRenderer>("Background");
                LightManager.Instance.mainCamera = FindObjectOfType<UnityEngine.Camera>();
                LightManager.Instance.RegisterAllPlatforms();
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
        }

        private T FindSceneObject<T>(string nameContains) where T : Component
        {
            T[] all = FindObjectsOfType<T>();
            foreach (var o in all)
            {
                if (o.gameObject.name.Contains(nameContains))
                    return o;
            }
            return all.Length > 0 ? all[0] : null;
        }

        private void Log(string msg)
        {
            if (verboseLogging)
                Debug.Log($"[SceneBootstrap] {msg}");
        }
    }
}
