using System;
using System.Collections.Generic;
using UnityEngine;
using YouthTrainingManagement.Audio;
using YouthTrainingManagement.Config;
using YouthTrainingManagement.InputSystem;
using YouthTrainingManagement.Models;
using YouthTrainingManagement.Systems;
using YouthTrainingManagement.UI;
using YouthTrainingManagement.Utils;

namespace YouthTrainingManagement.Core
{
    [DisallowMultipleComponent]
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("System References")]
        [SerializeField] private UIManager _uiManagerPrefab;
        [SerializeField] private ConfigLoader _configLoaderPrefab;

        public GameStateMachine StateMachine { get; private set; }
        public GameSettings Settings { get; private set; } = new GameSettings();
        public SaveSystem SaveSystem { get; private set; }
        public ConfigLoader Config { get; private set; }
        public ConfigLoader ConfigLoader => Config;
        public UIManager UIManager { get; private set; }
        public TimeSystem TimeSystem { get; private set; }
        public PlayerSystem PlayerSystem { get; private set; }
        public TrainingSystem TrainingSystem { get; private set; }
        public MatchSystem MatchSystem { get; private set; }
        public RecoverySystem RecoverySystem { get; private set; }
        public AudioManager AudioManager { get; private set; }
        public AudioManager Audio => AudioManager;
        public InputManager InputManager { get; private set; }
        public FeedbackSystem FeedbackSystem { get; private set; }
        public PerformanceStats PerformanceStats { get; private set; }

        public SeasonModel Season { get; set; }
        public FinanceModel Finance { get; set; }
        public GameStats Stats { get; set; } = new GameStats();

        public event Action OnGameInitialized;

        private bool _systemsInitialized = false;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            if (!_systemsInitialized)
            {
                InitializeCoreSystems();
            }
            if (StateMachine != null && StateMachine.CurrentState == null)
            {
                InitializeGameStates();
                StateMachine.ChangeState<BootState>();
            }
        }

        private void Update()
        {
            var dt = Time.deltaTime * (Settings?.AnimationSpeed ?? 1f);
            StateMachine?.Update(dt);
            PerformanceStats?.Update(dt);
        }

        private void InitializeCoreSystems()
        {
            try
            {
                StateMachine = new GameStateMachine();
                TimeSystem = new TimeSystem();
                PlayerSystem = new PlayerSystem(this);
                TrainingSystem = new TrainingSystem(this);
                MatchSystem = new MatchSystem(this);
                RecoverySystem = new RecoverySystem(this);
                AudioManager = new AudioManager(this);
                InputManager = new InputManager(this);
                FeedbackSystem = new FeedbackSystem(this);
                PerformanceStats = gameObject.AddComponent<PerformanceStats>();
                SaveSystem = new SaveSystem(this);

                if (_configLoaderPrefab != null)
                {
                    Config = Instantiate(_configLoaderPrefab, transform);
                    Config.name = "ConfigLoader";
                }
                else
                {
                    Config = gameObject.AddComponent<ConfigLoader>();
                }
                Config.LoadAllConfigs();

                if (_uiManagerPrefab != null)
                {
                    UIManager = Instantiate(_uiManagerPrefab, transform);
                    UIManager.name = "UIManager";
                }
                else
                {
                    UIManager = gameObject.AddComponent<UIManager>();
                }
                UIManager.Initialize(this);

                Debug.Log("Core systems initialized successfully.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to initialize core systems: {ex.Message}\n{ex.StackTrace}");
            }
        }

        private void InitializeGameStates()
        {
            StateMachine.AddState(new BootState(this));
            StateMachine.AddState(new MainMenuState(this));
            StateMachine.AddState(new TutorialState(this));
            StateMachine.AddState(new PlayingState(this));
            StateMachine.AddState(new PausedState(this));
            StateMachine.AddState(new SettingsState(this));
            StateMachine.AddState(new TrainingState(this));
            StateMachine.AddState(new MatchState(this));
            StateMachine.AddState(new RecoveryState(this));
            StateMachine.AddState(new ResultScreenState(this));
            StateMachine.AddState(new GameOverState(this));
        }

        public void InitializeNewGame()
        {
            try
            {
                PlayerSystem.InitializeDefaultPlayers();
                Season = Config.GenerateDefaultSeason();
                Finance = Config.GenerateDefaultFinance();
                Stats = new GameStats();
                OnGameInitialized?.Invoke();
                Debug.Log("New game initialized successfully.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to initialize new game: {ex.Message}");
            }
        }

        public void ApplySettings(GameSettings newSettings)
        {
            if (newSettings == null) return;
            Settings = newSettings;
            Application.targetFrameRate = newSettings.TargetFramerate;
            QualitySettings.vSyncCount = newSettings.VSync ? 1 : 0;
            Time.timeScale = newSettings.UiAnimationSpeed > 0.01f ? newSettings.UiAnimationSpeed : 0.01f;
            QualitySettings.SetQualityLevel(newSettings.QualityLevel, true);

            if (AudioManager != null)
            {
                AudioManager.SetVolume(VolumeChannel.Master, newSettings.MasterVolume);
                AudioManager.SetVolume(VolumeChannel.Music, newSettings.MusicVolume);
                AudioManager.SetVolume(VolumeChannel.SFX, newSettings.SfxVolume);
                AudioManager.SetVolume(VolumeChannel.UI, newSettings.UiVolume);
            }

            if (PerformanceStats != null)
            {
                PerformanceStats.Enabled = newSettings.ShowPerformanceStats;
            }

            if (InputManager != null && newSettings.InputBindings?.Bindings != null)
            {
                InputManager.SaveBindingsToSettings();
            }
        }

        public void TogglePerfStats(bool show)
        {
            if (PerformanceStats != null) PerformanceStats.Enabled = show;
        }

        public bool SaveGame()
        {
            SaveSystem?.SaveAll();
            return SaveSystem?.IsInitialized ?? false;
        }

        public bool LoadGame()
        {
            return SaveSystem?.LoadAll() ?? false;
        }

        public void StartTraining()
        {
            StateMachine.ChangeState<TrainingState>();
        }

        public void StartMatch()
        {
            StateMachine.ChangeState<MatchState>();
        }

        public void StartRecovery()
        {
            StateMachine.ChangeState<RecoveryState>();
        }

        public void OpenSettings()
        {
            StateMachine.ChangeState<SettingsState>();
        }

        public void PauseGame()
        {
            if (StateMachine.CurrentState is not PausedState)
            {
                StateMachine.ChangeState<PausedState>();
            }
        }

        public void ResumeGame()
        {
            var pausedState = StateMachine.GetState<PausedState>();
            pausedState?.Resume();
        }

        public void AdvanceDayPhase()
        {
            TimeSystem.AdvancePhase(this);
        }

        public void ShowResultScreen()
        {
            StateMachine.ChangeState<ResultScreenState>();
        }

        public void InitializeSystems()
        {
            if (_systemsInitialized) return;
            InitializeCoreSystems();
            _systemsInitialized = true;
        }

        public void SetUIManager(UIManager ui)
        {
            UIManager = ui;
        }

        public void SetPerformanceStats(PerformanceStats ps)
        {
            PerformanceStats = ps;
        }

        public void StartGame()
        {
            if (StateMachine.CurrentState == null)
            {
                InitializeGameStates();
            }
            StateMachine.ChangeState<BootState>();
        }
    }
}
#endif
