using System.Collections;
using UnityEngine;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Audio;
using DecorMatch3.UI;
using DecorMatch3.InputSystem;
using DecorMatch3.Utilities;

namespace DecorMatch3
{
    public class GameBootstrap : MonoBehaviour
    {
        [Header("Bootstrap Settings")]
        [SerializeField] private bool autoInitialize = true;
        [SerializeField] private float bootstrapDelay = 0.1f;
        [SerializeField] private bool showLoadingScreen = true;

        [Header("System Prefabs")]
        [SerializeField] private GameObject systemsPrefab;

        [Header("Startup Scene")]
        [SerializeField] private SceneType startupScene = SceneType.MainMenu;

        private bool _isInitialized = false;

        private void Awake()
        {
            Application.targetFrameRate = 60;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;

            if (autoInitialize)
            {
                StartCoroutine(BootstrapCoroutine());
            }
        }

        private IEnumerator BootstrapCoroutine()
        {
            yield return new WaitForSeconds(bootstrapDelay);

            InitializeSystems();
            yield return null;

            InitializeData();
            yield return null;

            InitializeUI();
            yield return null;

            ApplySavedSettings();
            yield return null;

            _isInitialized = true;

            OnBootstrapComplete();
        }

        private void InitializeSystems()
        {
            GameObject systemsGO = null;

            if (systemsPrefab != null)
            {
                systemsGO = Instantiate(systemsPrefab);
                systemsGO.name = "GameSystems";
            }
            else
            {
                systemsGO = new GameObject("GameSystems");
            }

            DontDestroyOnLoad(systemsGO);

            EnsureSystemComponent<SceneLoader>(systemsGO);
            EnsureSystemComponent<GameStateManager>(systemsGO);
            EnsureSystemComponent<InputManager>(systemsGO);
            EnsureSystemComponent<ResourceManager>(systemsGO);
            EnsureSystemComponent<SaveManager>(systemsGO);
            EnsureSystemComponent<LevelManager>(systemsGO);
            EnsureSystemComponent<AudioManager>(systemsGO);
            EnsureSystemComponent<UIManager>(systemsGO);
            EnsureSystemComponent<FeedbackManager>(systemsGO);

            Debug.Log("[GameBootstrap] Core systems initialized.");
        }

        private T EnsureSystemComponent<T>(GameObject parent) where T : Component
        {
            T component = parent.GetComponentInChildren<T>();
            if (component == null)
            {
                GameObject childGO = new GameObject(typeof(T).Name);
                childGO.transform.SetParent(parent.transform, false);
                component = childGO.AddComponent<T>();
            }
            return component;
        }

        private void InitializeData()
        {
            var saveManager = SaveManager.Instance;
            if (saveManager != null)
            {
                saveManager.LoadOrCreateSave();
            }

            var levelManager = LevelManager.Instance;
            if (levelManager != null)
            {
                levelManager.LoadAllData();
            }

            Debug.Log("[GameBootstrap] Data systems initialized.");
        }

        private void InitializeUI()
        {
            var uiManager = UIManager.Instance;
            if (uiManager == null)
            {
                Debug.LogWarning("[GameBootstrap] UIManager not found, skipping UI registration.");
                return;
            }

            RegisterAllUIViews();
            Debug.Log("[GameBootstrap] UI systems initialized.");
        }

        private void RegisterAllUIViews()
        {
            var uiManager = UIManager.Instance;
            if (uiManager == null) return;

            UIViewBase[] allViews = FindObjectsOfType<UIViewBase>(true);
            foreach (var view in allViews)
            {
                uiManager.RegisterView(view);
            }
        }

        private void ApplySavedSettings()
        {
            var settings = SaveManager.Instance?.CurrentSave.Settings;
            if (settings == null) return;

            QualitySettings.SetQualityLevel(settings.QualityLevel);
            Screen.fullScreen = settings.Fullscreen;

            var audioManager = AudioManager.Instance;
            if (audioManager != null)
            {
                audioManager.SetMasterVolume(settings.Audio.MasterVolume);
                audioManager.SetMusicVolume(settings.Audio.MusicVolume);
                audioManager.SetSFXVolume(settings.Audio.SFXVolume);
                audioManager.SetMusicMuted(settings.Audio.MusicMuted);
                audioManager.SetSFXMuted(settings.Audio.SFXMuted);
            }

            Debug.Log("[GameBootstrap] Settings applied.");
        }

        private void OnBootstrapComplete()
        {
            Debug.Log("[GameBootstrap] Bootstrap complete. Starting game...");

            EventBus.Publish(new BootstrapCompleteEvent());

            GameStateManager.Instance?.ChangeState(GameState.Bootstrap);

            switch (startupScene)
            {
                case SceneType.MainMenu:
                    GoToMainMenu();
                    break;
                case SceneType.Match3Level:
                    StartFirstLevel();
                    break;
            }

            if (!SaveManager.Instance.CurrentSave.Progress.TutorialCompleted)
            {
                StartCoroutine(ShowTutorialAfterDelay(1.0f));
            }
        }

        private IEnumerator ShowTutorialAfterDelay(float delay)
        {
            yield return new WaitForSeconds(delay);
            var settings = SaveManager.Instance?.CurrentSave.Settings;
            if (settings != null && settings.ShowTutorials)
            {
                UIManager.Instance?.OpenView(UIView.Tutorial);
                GameStateManager.Instance?.ChangeState(GameState.Tutorial);
            }
        }

        private void GoToMainMenu()
        {
            GameStateManager.Instance?.ChangeState(GameState.MainMenu);

            if (SceneLoader.Instance != null && SceneLoader.Instance.CurrentScene != SceneType.MainMenu)
            {
                SceneLoader.Instance.LoadScene(SceneType.MainMenu, false, () =>
                {
                    UIManager.Instance?.OpenView(UIView.MainMenu);
                });
            }
            else
            {
                UIManager.Instance?.OpenView(UIView.MainMenu);
            }

            AudioManager.Instance?.PlayMusic(MusicType.MainMenu);
        }

        private void StartFirstLevel()
        {
            int startLevel = SaveManager.Instance.CurrentSave.Progress.HighestUnlockedLevel;
            OrderData order = LevelManager.Instance.GetOrderForLevel(startLevel);

            if (order != null)
            {
                LevelManager.Instance.StartOrder(order.OrderId);
            }

            LevelManager.Instance.StartLevel(startLevel);

            if (SceneLoader.Instance != null)
            {
                SceneLoader.Instance.LoadScene(SceneType.Match3Level, false, () =>
                {
                    GameStateManager.Instance?.ChangeState(GameState.PlayingMatch3);
                    UIManager.Instance?.OpenView(UIView.Match3HUD);
                });
            }
        }

        private void OnApplicationQuit()
        {
            if (_isInitialized)
            {
                SaveManager.Instance?.SaveGame(true);
                Debug.Log("[GameBootstrap] Game saved before quit.");
            }
        }

        private void OnApplicationPause(bool pause)
        {
            if (pause && _isInitialized && SaveManager.Instance?.CurrentSave.Settings.AutoSaveEnabled == true)
            {
                SaveManager.Instance?.SaveGame();
                Debug.Log("[GameBootstrap] Game saved on pause.");
            }
        }

        public bool IsInitialized => _isInitialized;
    }

    public struct BootstrapCompleteEvent
    {
    }
}
