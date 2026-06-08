using System;
using System.Collections;
using UnityEngine;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Audio;

namespace DecorMatch3.Gameplay.Match3
{
    public class Match3GameManager : Singleton<Match3GameManager>
    {
        [Header("Game State")]
        [SerializeField] private int currentScore;
        [SerializeField] private int movesRemaining;
        [SerializeField] private bool isGameOver;

        private LevelData _currentLevel;
        private Coroutine _gameTimerCoroutine;

        public int CurrentScore => currentScore;
        public int MovesRemaining => movesRemaining;
        public bool IsGameOver => isGameOver;
        public LevelData CurrentLevel => _currentLevel;

        public event Action<int> OnScoreChanged;
        public event Action<int> OnMovesChanged;
        public event Action OnGameStarted;
        public event Action<int, int> OnGameWon;
        public event Action<string> OnGameLost;
        public event Action<GemType, int, int> OnObjectiveProgress;

        protected override void Awake()
        {
            base.Awake();
        }

        private void OnEnable()
        {
            EventBus.Subscribe<LevelStartedEvent>(OnLevelStartedHandler);
            EventBus.Subscribe<GameStateChangedEvent>(OnGameStateChanged);
        }

        private void OnDisable()
        {
            EventBus.Unsubscribe<LevelStartedEvent>(OnLevelStartedHandler);
            EventBus.Unsubscribe<GameStateChangedEvent>(OnGameStateChanged);
        }

        private void Start()
        {
            if (Board.Instance != null)
            {
                Board.Instance.OnScoreAdded += HandleScoreAdded;
                Board.Instance.OnMoveMade += HandleMoveMade;
                Board.Instance.OnGemsCleared += HandleGemsCleared;
                Board.Instance.OnBoardStable += HandleBoardStable;
            }
        }

        private void OnDestroy()
        {
            if (Board.Instance != null)
            {
                Board.Instance.OnScoreAdded -= HandleScoreAdded;
                Board.Instance.OnMoveMade -= HandleMoveMade;
                Board.Instance.OnGemsCleared -= HandleGemsCleared;
                Board.Instance.OnBoardStable -= HandleBoardStable;
            }
        }

        private void OnLevelStartedHandler(LevelStartedEvent e)
        {
            StartGame(e.LevelData);
        }

        private void OnGameStateChanged(GameStateChangedEvent e)
        {
            if (e.NewState == GameState.PausedMatch3)
            {
                Time.timeScale = 0f;
                AudioManager.Instance?.PauseAll();
            }
            else if (e.PreviousState == GameState.PausedMatch3)
            {
                Time.timeScale = 1f;
                AudioManager.Instance?.ResumeAll();
            }
        }

        public void StartGame(LevelData levelData)
        {
            if (levelData == null)
            {
                Debug.LogError("[Match3GameManager] Level data is null!");
                return;
            }

            _currentLevel = levelData;
            currentScore = 0;
            movesRemaining = levelData.MovesLimit;
            isGameOver = false;

            OnScoreChanged?.Invoke(currentScore);
            OnMovesChanged?.Invoke(movesRemaining);

            if (levelData.Objectives != null)
            {
                foreach (var obj in levelData.Objectives)
                {
                    OnObjectiveProgress?.Invoke(obj.TargetGem, 0, obj.RequiredCount);
                }
            }

            Board.Instance.InitializeBoard(
                levelData.BoardWidth,
                levelData.BoardHeight,
                levelData.AvailableGems,
                levelData.Objectives
            );

            AudioManager.Instance?.PlayMusic(MusicType.Match3);
            GameStateManager.Instance.ChangeState(GameState.PlayingMatch3);
            OnGameStarted?.Invoke();
        }

        private void HandleScoreAdded(int score, int combo)
        {
            currentScore += score;
            OnScoreChanged?.Invoke(currentScore);
            LevelManager.Instance.CurrentMatch3Stats.Score = currentScore;
            LevelManager.Instance.CurrentMatch3Stats.TotalCombos += combo > 1 ? 1 : 0;
            LevelManager.Instance.CurrentMatch3Stats.BestCombo = Mathf.Max(
                LevelManager.Instance.CurrentMatch3Stats.BestCombo,
                combo
            );
        }

        private void HandleMoveMade()
        {
            movesRemaining--;
            OnMovesChanged?.Invoke(movesRemaining);
            LevelManager.Instance.CurrentMatch3Stats.TotalMovesMade++;
        }

        private void HandleGemsCleared(GemType gemType, int count)
        {
            LevelManager.Instance.CurrentMatch3Stats.TotalGemsCleared += count;
            LevelManager.Instance.UpdateObjectiveProgress(gemType, count);

            if (_currentLevel?.Objectives != null)
            {
                foreach (var obj in _currentLevel.Objectives)
                {
                    if (obj.TargetGem == gemType)
                    {
                        OnObjectiveProgress?.Invoke(gemType, obj.CurrentCount, obj.RequiredCount);
                    }
                }
            }
        }

        private void HandleBoardStable()
        {
            if (isGameOver) return;
            CheckWinCondition();
        }

        public void CheckWinCondition()
        {
            if (LevelManager.Instance.AreAllObjectivesComplete() && currentScore >= _currentLevel.TargetScore)
            {
                WinGame();
            }
            else if (movesRemaining <= 0)
            {
                if (LevelManager.Instance.AreAllObjectivesComplete() && currentScore >= _currentLevel.TargetScore)
                {
                    WinGame();
                }
                else
                {
                    LoseGame("步数用尽！");
                }
            }
            else
            {
                int possibleMoves = Board.Instance.GetRemainingPossibleMoves();
                if (possibleMoves == 0)
                {
                    Debug.Log("[Match3GameManager] No possible moves, board will reshuffle.");
                }
            }
        }

        private void WinGame()
        {
            if (isGameOver) return;
            isGameOver = true;

            int stars = CalculateStars();
            LevelManager.Instance.CompleteCurrentLevel();

            AudioManager.Instance?.PlaySFX(SFXType.LevelComplete);
            AudioManager.Instance?.StopMusic(0.5f);

            GameStateManager.Instance.ChangeState(GameState.Match3Complete);

            EventBus.Publish(new LevelCompletedEvent
            {
                LevelData = _currentLevel,
                FinalScore = currentScore,
                StarsEarned = stars
            });

            OnGameWon?.Invoke(currentScore, stars);

            SaveManager.Instance.SaveGame();
        }

        private int CalculateStars()
        {
            float scoreRatio = (float)currentScore / _currentLevel.TargetScore;

            if (scoreRatio >= 2.0f) return 3;
            if (scoreRatio >= 1.5f) return 2;
            if (scoreRatio >= 1.0f) return 1;
            return 0;
        }

        private void LoseGame(string reason)
        {
            if (isGameOver) return;
            isGameOver = true;

            AudioManager.Instance?.PlaySFX(SFXType.LevelFailed);
            AudioManager.Instance?.StopMusic(0.5f);

            GameStateManager.Instance.ChangeState(GameState.Match3Failed);

            EventBus.Publish(new LevelFailedEvent
            {
                LevelData = _currentLevel,
                FinalScore = currentScore,
                Reason = reason
            });

            OnGameLost?.Invoke(reason);
        }

        public void RestartLevel()
        {
            StartCoroutine(RestartLevelCoroutine());
        }

        private IEnumerator RestartLevelCoroutine()
        {
            Time.timeScale = 1f;
            yield return new WaitForEndOfFrame();
            StartGame(_currentLevel);
        }

        public void ExitToMainMenu()
        {
            Time.timeScale = 1f;
            GameStateManager.Instance.ChangeState(GameState.MainMenu);
            SceneLoader.Instance.LoadScene(SceneType.MainMenu);
        }

        public void PauseGame()
        {
            if (!isGameOver && GameStateManager.Instance.CurrentState == GameState.PlayingMatch3)
            {
                GameStateManager.Instance.ChangeState(GameState.PausedMatch3);
                AudioManager.Instance?.PlaySFX(SFXType.Pause);
            }
        }

        public void ResumeGame()
        {
            if (GameStateManager.Instance.CurrentState == GameState.PausedMatch3)
            {
                GameStateManager.Instance.ChangeState(GameState.PlayingMatch3);
            }
        }

        public void AddBonusMoves(int moves)
        {
            movesRemaining += moves;
            OnMovesChanged?.Invoke(movesRemaining);
            AudioManager.Instance?.PlaySFX(SFXType.MaterialGain);
        }
    }
}
