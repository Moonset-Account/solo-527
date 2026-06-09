using UnityEngine;
using DecorMatch3.Core;
using DecorMatch3.UI;
using DecorMatch3.Audio;
using DecorMatch3.Progression;
using DecorMatch3.Decoration;
using DecorMatch3.Data;
using DecorMatch3.Utils;
using DecorMatch3.Animation;
using DecorMatch3.VFX;

namespace DecorMatch3.Core
{
    public class GameBootstrap : MonoBehaviour
    {
        [SerializeField] private bool _debugMode = true;
        [SerializeField] private bool _skipBootAnimation = false;

        private static bool _initialized = false;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void AutoInitialize()
        {
            if (_initialized) return;

            GameObject bootstrapGO = new GameObject("[GameBootstrap]");
            DontDestroyOnLoad(bootstrapGO);
            bootstrapGO.AddComponent<GameBootstrap>();
        }

        private void Awake()
        {
            if (_initialized)
            {
                Destroy(gameObject);
                return;
            }
            _initialized = true;

            InitializeCoreSystems();
            InitializeData();
            InitializeProgression();
            InitializeFeedback();
            InitializeDecorationSystem();

            if (_debugMode)
            {
                SetupDebugHandlers();
            }

            Debug.Log("[GameBootstrap] All systems initialized successfully");
        }

        private void InitializeCoreSystems()
        {
            GameObject coreParent = new GameObject("CoreSystems");
            coreParent.transform.SetParent(transform);

            if (GameManager.Instance == null)
            {
                GameObject gmGO = new GameObject("GameManager");
                gmGO.transform.SetParent(coreParent.transform);
                gmGO.AddComponent<GameManager>();
            }

            if (SceneLoader.Instance == null)
            {
                GameObject slGO = new GameObject("SceneLoader");
                slGO.transform.SetParent(coreParent.transform);
                slGO.AddComponent<SceneLoader>();
            }

            if (InputManager.Instance == null)
            {
                GameObject imGO = new GameObject("InputManager");
                imGO.transform.SetParent(coreParent.transform);
                imGO.AddComponent<InputManager>();
            }

            if (SaveSystem.Instance == null)
            {
                GameObject ssGO = new GameObject("SaveSystem");
                ssGO.transform.SetParent(coreParent.transform);
                ssGO.AddComponent<SaveSystem>();
            }

            if (AnalyticsSystem.Instance == null)
            {
                GameObject asGO = new GameObject("AnalyticsSystem");
                asGO.transform.SetParent(coreParent.transform);
                asGO.AddComponent<AnalyticsSystem>();
            }

            Debug.Log("[GameBootstrap] Core systems initialized");
        }

        private void InitializeData()
        {
            if (DataManager.Instance != null)
            {
                DataManager.Instance.InitializeWithDefaultData();
                Debug.Log("[GameBootstrap] Data initialized");
            }
        }

        private void InitializeProgression()
        {
            GameObject progressionParent = new GameObject("ProgressionSystems");
            progressionParent.transform.SetParent(transform);

            if (AchievementManager.Instance == null)
            {
                GameObject amGO = new GameObject("AchievementManager");
                amGO.transform.SetParent(progressionParent.transform);
                AchievementManager am = amGO.AddComponent<AchievementManager>();
                foreach (var ach in DataManager.Instance.Achievements)
                {
                    am.RegisterAchievement(ach);
                }
            }

            DailyChallengeManager dailyChallenge = new DailyChallengeManager();
            dailyChallenge.RegisterChallenges(DataManager.Instance.DailyChallenges);

            LeaderboardManager leaderboard = new LeaderboardManager();

            Debug.Log("[GameBootstrap] Progression systems initialized");
        }

        private void InitializeFeedback()
        {
            GameObject feedbackParent = new GameObject("FeedbackSystems");
            feedbackParent.transform.SetParent(transform);

            if (UIManager.Instance == null)
            {
                GameObject uiGO = new GameObject("UIManager");
                uiGO.transform.SetParent(feedbackParent.transform);
                uiGO.AddComponent<UIManager>();
            }

            if (AudioManager.Instance == null)
            {
                GameObject audioGO = new GameObject("AudioManager");
                audioGO.transform.SetParent(feedbackParent.transform);
                audioGO.AddComponent<AudioManager>();
            }

            if (AnimationManager.Instance == null)
            {
                GameObject animGO = new GameObject("AnimationManager");
                animGO.transform.SetParent(feedbackParent.transform);
                animGO.AddComponent<AnimationManager>();
            }

            if (VFXManager.Instance == null)
            {
                GameObject vfxGO = new GameObject("VFXManager");
                vfxGO.transform.SetParent(feedbackParent.transform);
                vfxGO.AddComponent<VFXManager>();
            }

            Debug.Log("[GameBootstrap] Feedback systems initialized");
        }

        private void InitializeDecorationSystem()
        {
            OrderManager orderManager = new OrderManager();
            orderManager.RegisterOrders(DataManager.Instance.Orders);

            Debug.Log("[GameBootstrap] Decoration system initialized");
        }

        private void SetupDebugHandlers()
        {
            InputManager.Instance.OnBackPressed += () =>
            {
                Debug.Log("[Debug] Back button pressed - saving game");
                SaveSystem.Instance?.SaveAll();
                AnalyticsSystem.Instance?.FlushEvents();
            };
        }

        private void OnApplicationQuit()
        {
            if (_initialized)
            {
                AnalyticsSystem.Instance?.EndPlaythrough();
                SaveSystem.Instance?.SaveAll();
            }
        }
    }
}
