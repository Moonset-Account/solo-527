using UnityEngine;
using KitchenChaos.Config;
using KitchenChaos.Core.Abstractions;

namespace KitchenChaos.Core
{
    public class GameManager : Singleton<GameManager>, IGameManager
    {
        [SerializeField] GameConfig _gameConfig;

        GameState _state = GameState.Boot;
        int _currentLevelIndex = 0;
        int _currentScore = 0;
        float _timer = 0f;
        bool _isSinglePlayerMode = true;
        FailReason _lastFailReason = FailReason.None;
        int _starsEarned = 0;
        int _failedOrderCount = 0;

        public GameState State => _state;
        public int CurrentLevelIndex => _currentLevelIndex;
        public int CurrentScore => _currentScore;
        public float TimeRemaining => _timer;
        public bool IsSinglePlayerMode => _isSinglePlayerMode;
        public GameConfig Config => _gameConfig;
        public FailReason LastFailReason => _lastFailReason;
        public int StarsEarned => _starsEarned;

        public LevelConfig CurrentLevelConfig
        {
            get
            {
                if (_gameConfig == null || _gameConfig.Levels == null || _gameConfig.Levels.Length == 0)
                    return LevelConfig.Default;
                int idx = Mathf.Clamp(_currentLevelIndex, 0, _gameConfig.Levels.Length - 1);
                return _gameConfig.Levels[idx];
            }
        }

        protected override void OnAwake()
        {
            RegisterServices();
            SubscribeEvents();
        }

        void Start()
        {
            ChangeState(GameState.MainMenu);
        }

        void Update()
        {
            if (_state == GameState.Playing)
            {
                _timer -= Time.deltaTime;
                EventBus.Raise(new TimerUpdatedEvent { TimeRemaining = _timer, TotalTime = CurrentLevelConfig.Duration });
                if (_timer <= 0f)
                    EndLevel(true);
            }
        }

        void RegisterServices()
        {
            if (_gameConfig == null) _gameConfig = Resources.Load<GameConfig>("Config/GameConfig");
            if (_gameConfig != null) ServiceLocator.Register(_gameConfig);
            ServiceLocator.Register<IGameManager>(this);
            ServiceLocator.Register(this);
        }

        void SubscribeEvents()
        {
            EventBus.Subscribe<ScoreUpdatedEvent>(OnScoreUpdated);
            EventBus.Subscribe<OrderFailedEvent>(OnOrderFailed);
        }

        void OnDestroy()
        {
            EventBus.Unsubscribe<ScoreUpdatedEvent>(OnScoreUpdated);
            EventBus.Unsubscribe<OrderFailedEvent>(OnOrderFailed);
        }

        public void ChangeState(GameState newState)
        {
            if (_state == newState) return;
            var prev = _state;
            _state = newState;
            OnStateChanged(prev, newState);
            EventBus.Raise(new GameStateChangedEvent { PreviousState = prev, NewState = newState });
        }

        void OnStateChanged(GameState from, GameState to)
        {
            if (to == GameState.Paused) Time.timeScale = 0f;
            else if (from == GameState.Paused && to != GameState.LevelComplete && to != GameState.LevelFailed)
                Time.timeScale = 1f;
        }

        public void SetSinglePlayerMode(bool single) => _isSinglePlayerMode = single;

        public void StartLevel(int levelIndex)
        {
            _currentLevelIndex = levelIndex;
            _currentScore = 0;
            _timer = CurrentLevelConfig.Duration;
            _starsEarned = 0;
            _lastFailReason = FailReason.None;
            _failedOrderCount = 0;

            ChangeState(GameState.PreGame);
            EventBus.Raise(new LevelStartedEvent { LevelIndex = levelIndex, Duration = _timer });
            EventBus.Raise(new RequestInitializeLevelEvent { LevelIndex = levelIndex, IsSinglePlayer = _isSinglePlayerMode });
            EventBus.Raise(new RequestResetComboEvent());
            EventBus.Raise(new RequestApplyLevelMechanicsEvent { LevelIndex = levelIndex });

            ChangeState(GameState.Playing);
        }

        public void Pause()
        {
            if (_state.CanPause() && _state != GameState.Paused)
                ChangeState(GameState.Paused);
        }

        public void Resume()
        {
            if (_state == GameState.Paused)
                ChangeState(GameState.Playing);
        }

        public void TogglePause()
        {
            if (_state == GameState.Paused) Resume();
            else Pause();
        }

        public void RestartLevel()
        {
            StartLevel(_currentLevelIndex);
        }

        public void ExitToMenu()
        {
            Time.timeScale = 1f;
            ChangeState(GameState.MainMenu);
        }

        public void EndLevel(bool timeUp = false)
        {
            var level = CurrentLevelConfig;
            bool victory = false;
            _lastFailReason = FailReason.None;

            if (timeUp)
            {
                victory = _currentScore >= level.StarThresholds[0];
                _lastFailReason = victory ? FailReason.None : FailReason.TimeUp;
            }
            else
            {
                victory = _currentScore >= level.StarThresholds[0];
                _lastFailReason = victory ? FailReason.None : FailReason.ObjectiveNotMet;
            }

            _starsEarned = CalculateStars(_currentScore, level.StarThresholds);

            if (victory)
            {
                ChangeState(GameState.LevelComplete);
                EventBus.Raise(new RequestSaveLevelResultEvent { LevelIndex = _currentLevelIndex, Score = _currentScore, Stars = _starsEarned, Victory = true });
                EventBus.Raise(new RequestCheckAchievementsEvent { Score = _currentScore, Stars = _starsEarned, LevelIndex = _currentLevelIndex, Victory = true });
            }
            else
            {
                ChangeState(GameState.LevelFailed);
                EventBus.Raise(new RequestSaveLevelResultEvent { LevelIndex = _currentLevelIndex, Score = _currentScore, Stars = _starsEarned, Victory = false });
            }

            EventBus.Raise(new LevelEndedEvent
            {
                LevelIndex = _currentLevelIndex,
                Victory = victory,
                FailReason = _lastFailReason,
                FinalScore = _currentScore,
                StarsEarned = _starsEarned
            });
        }

        int CalculateStars(int score, int[] thresholds)
        {
            int stars = 0;
            for (int i = 0; i < thresholds.Length; i++)
                if (score >= thresholds[i]) stars = i + 1;
            return stars;
        }

        void OnScoreUpdated(ScoreUpdatedEvent e)
        {
            _currentScore = e.CurrentScore;
        }

        void OnOrderFailed(OrderFailedEvent e)
        {
            _failedOrderCount++;
            var level = CurrentLevelConfig;
            if (level.MaxFailedOrders > 0 && _failedOrderCount >= level.MaxFailedOrders)
            {
                _lastFailReason = FailReason.TooManyFailedOrders;
                EndLevel(false);
            }
        }

        public void SetGameConfig(GameConfig cfg)
        {
            _gameConfig = cfg;
            if (_gameConfig != null)
            {
                ServiceLocator.Unregister<GameConfig>();
                ServiceLocator.Register(_gameConfig);
            }
        }
    }
}
