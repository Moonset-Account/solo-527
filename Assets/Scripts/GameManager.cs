using System.Collections;
using BeatRunner.Audio;
using BeatRunner.Bootstrap;
using BeatRunner.Core;
using BeatRunner.Data;
using BeatRunner.Diagnostics;
using BeatRunner.Gameplay;
using BeatRunner.Input;
using BeatRunner.Player;
using BeatRunner.UI;
using UnityEngine;

namespace BeatRunner
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Core Systems (auto-created if null)")]
        [SerializeField] private AudioManager _audioManager;
        [SerializeField] private BeatSystem _beatSystem;
        [SerializeField] private InputManager _inputManager;
        [SerializeField] private GameStateManager _stateManager;
        [SerializeField] private PerformanceStats _perfStats;
        [SerializeField] private FrameRateAdaptor _frameRateAdaptor;

        [Header("Gameplay")]
        [SerializeField] private LevelManager _levelManager;
        [SerializeField] private PlayerController _player;
        [SerializeField] private GameplayController _gameplayController;
        [SerializeField] private Transform _gameplayRoot;

        [Header("UI")]
        [SerializeField] private MainMenu _mainMenu;
        [SerializeField] private TutorialController _tutorialController;
        [SerializeField] private HudController _hud;
        [SerializeField] private PauseMenu _pauseMenu;
        [SerializeField] private SettingsMenu _settingsMenu;
        [SerializeField] private ResultsScreen _results;
        [SerializeField] private GameOverScreen _gameOver;
        [SerializeField] private AudioCalibration _audioCalibration;

        [Header("Default Content")]
        [SerializeField] private TrackLibrary _trackLibrary;
        [SerializeField] private GameSettings _gameSettings;
        [SerializeField] private RuntimeGameData _runtimeData;

        private int _currentDifficulty;
        private Coroutine _runCoroutine;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            EnsureCoreSystems();
        }

        private void EnsureCoreSystems()
        {
            if (_audioManager == null)
                _audioManager = FindOrCreate<AudioManager>("[AudioManager]");
            if (_beatSystem == null)
                _beatSystem = FindOrCreate<BeatSystem>("[BeatSystem]");
            if (_inputManager == null)
                _inputManager = FindOrCreate<InputManager>("[InputManager]");
            if (_stateManager == null)
                _stateManager = FindOrCreate<GameStateManager>("[GameStateManager]");
            if (_perfStats == null)
                _perfStats = FindOrCreate<PerformanceStats>("[PerformanceStats]");
            if (_frameRateAdaptor == null)
                _frameRateAdaptor = FindOrCreate<FrameRateAdaptor>("[FrameRateAdaptor]");
        }

        private T FindOrCreate<T>(string goName) where T : MonoBehaviour
        {
            var existing = FindObjectOfType<T>();
            if (existing != null) return existing;
            var go = new GameObject(goName);
            DontDestroyOnLoad(go);
            return go.AddComponent<T>();
        }

        private void Start()
        {
            BootstrapServices();
            EnsureContentLibrary();
            WireInputEvents();
            WireGameplayEvents();
            WireUiEvents();

            _inputManager?.LoadBindingsFromSaveData();
            _audioManager.SetLatency(SaveSystem.CurrentSave.audioLatencyMs);
            if (_frameRateAdaptor != null)
                _frameRateAdaptor.ForceFrameRate(SaveSystem.CurrentSave.targetFrameRate <= 0
                    ? 60
                    : SaveSystem.CurrentSave.targetFrameRate);

            ShowMainMenu();
        }

        private void BootstrapServices()
        {
            ServiceLocator.Initialize();

            if (_gameSettings == null) _gameSettings = GameSettings.Default;
            ServiceLocator.Register(_gameSettings);

            if (_runtimeData == null) _runtimeData = ScriptableObject.CreateInstance<RuntimeGameData>();
            ServiceLocator.Register(_runtimeData);
        }

        private void EnsureContentLibrary()
        {
            if (_trackLibrary == null)
            {
#if UNITY_EDITOR
                var asset = UnityEditor.AssetDatabase.LoadAssetAtPath<TrackLibrary>(
                    "Assets/Resources/Data/DefaultTrackLibrary.asset");
                _trackLibrary = asset;
#endif
            }

            if (_trackLibrary == null)
            {
                var generator = new DefaultContentBootstrap();
                _trackLibrary = generator.GenerateDefaultLibrary();
            }

            ServiceLocator.Register(_trackLibrary);

            foreach (var t in _trackLibrary.tracks)
            {
                if (t == null) continue;
                if (t.isUnlockedByDefault) SaveSystem.UnlockTrack(t.trackId);
            }
            foreach (var s in _trackLibrary.skins)
            {
                if (s == null) continue;
                if (s.isUnlockedByDefault) SaveSystem.UnlockSkin(s.skinId);
            }
        }

        private void WireInputEvents()
        {
            if (_inputManager == null) return;
            _inputManager.OnPause += HandlePauseInput;
        }

        private void WireGameplayEvents()
        {
            if (_levelManager != null)
            {
                _levelManager.OnLevelComplete += HandleLevelComplete;
                _levelManager.OnLevelFailed += HandleLevelFailed;
                _levelManager.OnNoteJudged += HandleNoteJudged;
            }
            if (_player != null)
            {
                _player.OnDeath += HandlePlayerDeath;
            }
        }

        private void WireUiEvents()
        {
            if (_mainMenu != null)
            {
                _mainMenu.OnStartSelected += HandleStartSelected;
                _mainMenu.OnOpenTutorial += HandleOpenTutorial;
                _mainMenu.OnOpenSettings += HandleOpenSettings;
            }
            if (_tutorialController != null)
            {
                _tutorialController.OnTutorialComplete += HandleTutorialComplete;
                _tutorialController.OnTutorialSkipped += HandleTutorialSkipped;
            }
            if (_hud != null)
            {
                _hud.OnPauseClicked += HandlePauseInput;
            }
            if (_pauseMenu != null)
            {
                _pauseMenu.OnResume += HandleResume;
                _pauseMenu.OnRetry += HandleRetry;
                _pauseMenu.OnSettings += HandleOpenSettings;
                _pauseMenu.OnQuitToMenu += HandleQuitToMenu;
            }
            if (_settingsMenu != null)
            {
                _settingsMenu.OnClose += HandleSettingsClosed;
            }
            if (_results != null)
            {
                _results.OnRetry += HandleRetry;
                _results.OnNext += HandleNextTrack;
                _results.OnBackToMenu += HandleQuitToMenu;
                _results.OnContinue += HandleQuitToMenu;
            }
            if (_gameOver != null)
            {
                _gameOver.OnRetry += HandleRetry;
                _gameOver.OnRestartTutorial += HandleOpenTutorial;
                _gameOver.OnBackToMenu += HandleQuitToMenu;
            }
        }

        private void ShowMainMenu()
        {
            HideAllUi();
            _mainMenu?.Show(_trackLibrary);
            _hud?.SetVisible(false);
        }

        private void HideAllUi()
        {
            _mainMenu?.Hide();
            _tutorialController?.SetVisible(false);
            _hud?.SetVisible(false);
            _pauseMenu?.Hide();
            _settingsMenu?.Hide();
            _results?.Hide();
            _gameOver?.Hide();
        }

        private void HandleStartSelected(TrackData track, SkinData skin, int difficulty)
        {
            _currentDifficulty = difficulty;
            StartRun(track, skin, difficulty, false);
        }

        private void HandleOpenTutorial()
        {
            var tutorialTrack = _tutorialController.GetTutorialTrack();
            SaveSystem.UnlockTrack(tutorialTrack.trackId);
            _currentDifficulty = 1;
            StartRun(tutorialTrack, _trackLibrary?.skins.Count > 0 ? _trackLibrary.skins[0] : null, 1, true);
        }

        private void HandleOpenSettings()
        {
            _settingsMenu?.Show();
        }

        private void HandleTutorialComplete()
        {
            if (_runCoroutine != null) StopCoroutine(_runCoroutine);
            _levelManager?.StopLevel();

            if (_results != null && _runtimeData != null)
            {
                _results.Show("教程", "节奏引导", new Color(0.5f, 0.8f, 1f), false, false);
                StartCoroutine(DelayCall(() =>
                {
                    _results?.Hide();
                    ShowMainMenu();
                }, 3f));
            }
            else
            {
                ShowMainMenu();
            }
        }

        private void HandleTutorialSkipped()
        {
            if (_runCoroutine != null) StopCoroutine(_runCoroutine);
            _levelManager?.StopLevel();
            ShowMainMenu();
        }

        private void HandlePauseInput()
        {
            if (_stateManager == null) return;
            if (_stateManager.CurrentState == GameStateManager.GameState.Playing)
            {
                _levelManager?.PauseLevel();
                _pauseMenu?.Show(_runtimeData?.selectedTrack?.trackName ?? "", _runtimeData?.currentScore ?? 0);
            }
            else if (_stateManager.CurrentState == GameStateManager.GameState.Paused)
            {
                HandleResume();
            }
        }

        private void HandleResume()
        {
            _pauseMenu?.Hide();
            _levelManager?.ResumeLevel();
            _stateManager?.ChangeState(GameStateManager.GameState.Playing);
        }

        private void HandleRetry()
        {
            HideAllUi();
            if (_runCoroutine != null) StopCoroutine(_runCoroutine);
            _levelManager?.StopLevel();
            if (_runtimeData?.selectedTrack != null)
            {
                StartRun(_runtimeData.selectedTrack, _runtimeData.selectedSkin, _currentDifficulty, false);
            }
            else
            {
                ShowMainMenu();
            }
        }

        private void HandleNextTrack()
        {
            HideAllUi();
            if (_trackLibrary != null && _runtimeData?.selectedTrack != null)
            {
                int idx = _trackLibrary.tracks.IndexOf(_runtimeData.selectedTrack);
                idx = (idx + 1) % _trackLibrary.tracks.Count;
                for (int i = 0; i < _trackLibrary.tracks.Count; i++)
                {
                    var t = _trackLibrary.tracks[(idx + i) % _trackLibrary.tracks.Count];
                    if (t != null && SaveSystem.IsTrackUnlocked(t.trackId))
                    {
                        StartRun(t, _runtimeData.selectedSkin, _currentDifficulty, false);
                        return;
                    }
                }
            }
            ShowMainMenu();
        }

        private void HandleSettingsClosed()
        {
            if (_stateManager == null) return;
            var st = _stateManager.PreviousState;
            if (st == GameStateManager.GameState.Playing || st == GameStateManager.GameState.Paused)
            {
                _pauseMenu?.Show(_runtimeData?.selectedTrack?.trackName ?? "", _runtimeData?.currentScore ?? 0);
            }
            else
            {
                ShowMainMenu();
            }
        }

        private void HandleQuitToMenu()
        {
            HideAllUi();
            if (_runCoroutine != null) StopCoroutine(_runCoroutine);
            _levelManager?.StopLevel();
            ShowMainMenu();
        }

        private void HandleLevelComplete()
        {
            if (_runCoroutine != null) StopCoroutine(_runCoroutine);
            _levelManager?.StopLevel();

            _levelManager?.ClearLevel();

            if (_runtimeData != null && _trackLibrary != null)
            {
                CheckUnlockProgress();
            }

            StartCoroutine(DelayCall(() =>
            {
                if (_results != null && _runtimeData != null && _runtimeData.selectedTrack != null)
                {
                    _results.Show(_runtimeData.selectedTrack.trackName,
                        _runtimeData.selectedTrack.artistName,
                        _runtimeData.selectedTrack.themeColor,
                        true, true);
                }
                else
                {
                    ShowMainMenu();
                }
            }, 0.8f));
        }

        private void HandleLevelFailed()
        {
            if (_runCoroutine != null) StopCoroutine(_runCoroutine);
            _levelManager?.StopLevel();
            StartCoroutine(DelayCall(() =>
            {
                _gameOver?.Show("撞上障碍物");
            }, 0.5f));
        }

        private void HandlePlayerDeath()
        {
        }

        private void HandleNoteJudged(JudgmentType type, Data.NoteData note)
        {
            _hud?.ShowJudgment(type);
            if (type != JudgmentType.Miss)
            {
                _hud?.PlayComboBurst();
            }
        }

        private void CheckUnlockProgress()
        {
            int total = SaveSystem.CurrentSave.totalFragmentsCollected;
            if (_trackLibrary == null) return;

            foreach (var t in _trackLibrary.tracks)
            {
                if (t == null) continue;
                if (!SaveSystem.IsTrackUnlocked(t.trackId) &&
                    total >= t.requiredFragments)
                {
                    SaveSystem.UnlockTrack(t.trackId);
                }
            }

            foreach (var s in _trackLibrary.skins)
            {
                if (s == null) continue;
                if (!SaveSystem.IsSkinUnlocked(s.skinId) &&
                    total >= s.requiredFragments)
                {
                    SaveSystem.UnlockSkin(s.skinId);
                }
            }
        }

        private void StartRun(TrackData track, SkinData skin, int difficulty, bool isTutorial)
        {
            if (track == null)
            {
                ShowMainMenu();
                return;
            }

            HideAllUi();

            if (_runtimeData != null)
            {
                _runtimeData.ResetRunStats();
                _runtimeData.selectedTrack = track;
                _runtimeData.selectedSkin = skin;
                _runtimeData.currentAudioLatencyMs = SaveSystem.CurrentSave.audioLatencyMs;
            }

            if (_hud != null)
            {
                _hud.SetVisible(true);
                _hud.SetTrackInfo(track);
            }

            if (_gameplayRoot != null && _player != null)
            {
                _gameplayRoot.gameObject.SetActive(true);
                _player.Revive();
            }

            if (isTutorial)
            {
                _tutorialController?.StartTutorial();
            }

            _runCoroutine = StartCoroutine(RunLevelCoroutine(track, difficulty));
        }

        private IEnumerator RunLevelCoroutine(TrackData track, int difficulty)
        {
            var level = track.GetLevelByDifficulty(difficulty);
            if (level == null)
            {
                ShowMainMenu();
                yield break;
            }

            yield return null;
            _stateManager?.ChangeState(GameStateManager.GameState.Playing);

            _levelManager?.StartLevel(track, level);

            float totalDuration = track.GetDurationSeconds();
            float secondsPerBeat = 60f / track.bpm;

            while (_stateManager != null &&
                   _stateManager.CurrentState == GameStateManager.GameState.Playing)
            {
                double t = AudioManager.Instance != null
                    ? AudioManager.Instance.currentPlaybackTime
                    : 0;
                float norm = Mathf.Clamp01((float)t / totalDuration);
                int total = Mathf.Max(1, level.TotalBeats);
                int cur = Mathf.Clamp((int)(t / secondsPerBeat), 0, total);
                string timeStr = $"{cur} / {total}";
                _hud?.UpdateProgress(norm, timeStr);

                yield return null;
            }
        }

        private IEnumerator DelayCall(System.Action action, float delay)
        {
            yield return new WaitForSecondsRealtime(delay);
            action?.Invoke();
        }
    }
}
