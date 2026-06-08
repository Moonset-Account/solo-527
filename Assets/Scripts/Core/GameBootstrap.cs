using UnityEngine;
using Kitchen.Core;
using Kitchen.Save;
using Kitchen.Performance;
using Kitchen.Input;
using Kitchen.Gameplay;
using Kitchen.Levels;

namespace Kitchen.Core
{
    public class GameBootstrap : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void PreBootstrap()
        {
            QualitySettings.vSyncCount = 1;
            Application.targetFrameRate = 60;
            Application.runInBackground = false;
        }

        [Header("Core Singletons")]
        public GameManager gameManagerPrefab;
        public PlayerManager playerManagerPrefab;
        public InputManager inputManagerPrefab;
        public OrderManager orderManagerPrefab;
        public LevelManager levelManagerPrefab;
        public SaveManager saveManagerPrefab;
        public PerformanceStats performanceStatsPrefab;
        public FrameRateAdapter frameRateAdapterPrefab;

        [Header("UI Controllers")]
        public GameObject uiSystemPrefab;

        private void Awake()
        {
            EnsureSingleton(gameManagerPrefab, GameManager.Instance);
            EnsureSingleton(playerManagerPrefab, PlayerManager.Instance);
            EnsureSingleton(inputManagerPrefab, InputManager.Instance);
            EnsureSingleton(orderManagerPrefab, OrderManager.Instance);
            EnsureSingleton(levelManagerPrefab, LevelManager.Instance);
            EnsureSingleton(saveManagerPrefab, SaveManager.Instance);
            EnsureSingleton(performanceStatsPrefab, PerformanceStats.Instance);
            EnsureSingleton(frameRateAdapterPrefab, FrameRateAdapter.Instance);

            if (uiSystemPrefab != null)
            {
                GameObject existing = GameObject.Find("UISystem");
                if (existing == null)
                {
                    Instantiate(uiSystemPrefab);
                }
            }
        }

        private void Start()
        {
            SaveManager.Instance?.LoadOrCreateSave();
            SaveManager.Instance?.ApplySettings();
            FrameRateAdapter.Instance?.ApplySettingsFromSave();
            FrameRateAdapter.Instance?.StartAdaptation();
            PerformanceStats.Instance?.ResetStats();

            if (GameManager.Instance != null)
                GameManager.Instance.ChangeState(GameManager.GameState.MainMenu);
        }

        private static T EnsureSingleton<T>(T prefab, T instance) where T : MonoBehaviour
        {
            if (instance != null) return instance;
            if (prefab != null)
            {
                T created = Instantiate(prefab);
                created.name = typeof(T).Name;
                return created;
            }
            GameObject go = new GameObject(typeof(T).Name);
            return go.AddComponent<T>();
        }
    }
}
