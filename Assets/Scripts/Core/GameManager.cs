using System;
using System.Collections.Generic;
using Kitchen.Config;
using UnityEngine;

namespace Kitchen.Core
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public enum GameState
        {
            Boot,
            MainMenu,
            Tutorial,
            Countdown,
            Playing,
            Paused,
            LevelComplete,
            LevelFailed,
            Settings
        }

        [Header("References")]
        public LevelConfig currentLevelConfig;
        public Transform playerSpawnPoint;

        [Header("Runtime State")]
        [SerializeField] private GameState currentState = GameState.Boot;
        [SerializeField] private float levelTimer;
        [SerializeField] private int currentScore;
        [SerializeField] private int coinsEarned;
        [SerializeField] private int ordersCompleted;
        [SerializeField] private int ordersFailed;
        [SerializeField] private float scoreMultiplier = 1f;
        [SerializeField] private bool isSinglePlayerMode;

        public GameState CurrentState => currentState;
        public float LevelTimer => levelTimer;
        public int CurrentScore => currentScore;
        public int CoinsEarned => coinsEarned;
        public int OrdersCompleted => ordersCompleted;
        public int OrdersFailed => ordersFailed;
        public float ScoreMultiplier => scoreMultiplier;
        public bool IsSinglePlayerMode => isSinglePlayerMode;

        public event Action<GameState, GameState> OnStateChanged;
        public event Action<int> OnScoreChanged;
        public event Action<float> OnTimerTick;
        public event Action OnLevelEnd;
        public event Action<string> OnGameMessage;

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

        public void StartLevel(LevelConfig config, bool singlePlayer)
        {
            currentLevelConfig = config;
            isSinglePlayerMode = singlePlayer;
            levelTimer = config.levelDurationSeconds;
            currentScore = 0;
            coinsEarned = 0;
            ordersCompleted = 0;
            ordersFailed = 0;
            scoreMultiplier = 1f;

            if (config.tutorial != null && config.tutorial.enableTutorial)
            {
                ChangeState(GameState.Tutorial);
            }
            else
            {
                ChangeState(GameState.Countdown);
            }
        }

        public void SkipTutorial()
        {
            ChangeState(GameState.Countdown);
        }

        public void StartCountdownComplete()
        {
            ChangeState(GameState.Playing);
        }

        private void Update()
        {
            if (currentState == GameState.Playing)
            {
                UpdateLevelTimer();
            }
        }

        private void UpdateLevelTimer()
        {
            levelTimer -= Time.deltaTime;
            OnTimerTick?.Invoke(levelTimer);

            if (levelTimer <= 0)
            {
                levelTimer = 0;
                EndLevel();
            }
        }

        public void AddScore(int baseScore, string reason = "")
        {
            int finalScore = Mathf.RoundToInt(baseScore * scoreMultiplier);
            currentScore += finalScore;
            OnScoreChanged?.Invoke(currentScore);
            BroadcastMessage("OnScoreAdded", finalScore);
        }

        public void AddCoins(int amount)
        {
            coinsEarned += amount;
        }

        public void CompleteOrder(int score, int coins)
        {
            ordersCompleted++;
            AddScore(score);
            AddCoins(coins);
            scoreMultiplier += currentLevelConfig.difficultyCurve.scoreMultiplierIncrease;
            scoreMultiplier = Mathf.Min(scoreMultiplier, 3f);
        }

        public void FailOrder()
        {
            ordersFailed++;
            scoreMultiplier = Mathf.Max(1f, scoreMultiplier - 0.1f);
            OnGameMessage?.Invoke("订单失败！连击中断");
        }

        public void ChangeState(GameState newState)
        {
            if (currentState == newState) return;

            GameState oldState = currentState;
            currentState = newState;

            Time.timeScale = (newState == GameState.Paused || newState == GameState.Settings) ? 0f : 1f;

            OnStateChanged?.Invoke(oldState, newState);
        }

        public void TogglePause()
        {
            if (currentState == GameState.Playing)
                ChangeState(GameState.Paused);
            else if (currentState == GameState.Paused)
                ChangeState(GameState.Playing);
        }

        public void EndLevel()
        {
            bool passed = currentScore >= currentLevelConfig.targetScore;
            ChangeState(passed ? GameState.LevelComplete : GameState.LevelFailed);
            OnLevelEnd?.Invoke();
        }

        public void RestartLevel()
        {
            if (currentLevelConfig != null)
            {
                StartLevel(currentLevelConfig, isSinglePlayerMode);
            }
        }

        public int GetStarRating()
        {
            if (currentScore >= currentLevelConfig.threeStarScore) return 3;
            if (currentScore >= currentLevelConfig.twoStarScore) return 2;
            if (currentScore >= currentLevelConfig.oneStarScore) return 1;
            return 0;
        }
    }
}
