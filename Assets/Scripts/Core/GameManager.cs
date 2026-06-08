using UnityEngine;
using System;

namespace LakeNavigation
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        public event Action<GameState, GameState> OnStateChanged;
        public event Action OnGamePaused;
        public event Action OnGameResumed;

        public GameState CurrentState { get; private set; } = GameState.None;
        public int CurrentLevelIndex { get; private set; }
        public FailReason CurrentFailReason { get; private set; } = FailReason.None;
        public bool IsPaused { get; private set; }
        public int TotalStars => PlayerPrefs.GetInt(GameConstants.PlayerPrefs.TotalStars, 0);

        private GameState _previousState;

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

        public void ChangeState(GameState newState)
        {
            if (newState == CurrentState) return;

            if (!IsValidTransition(CurrentState, newState))
            {
                Debug.LogWarning($"Invalid state transition: {CurrentState} -> {newState}");
                return;
            }

            if (newState == GameState.Settings)
            {
                _previousState = CurrentState;
            }

            var previousState = CurrentState;
            CurrentState = newState;
            OnStateChanged?.Invoke(previousState, newState);
        }

        private bool IsValidTransition(GameState from, GameState to)
        {
            if (from == GameState.Settings)
            {
                return to == _previousState;
            }

            return (from, to) switch
            {
                (GameState.None, GameState.MainMenu) => true,
                (GameState.MainMenu, GameState.Tutorial) => true,
                (GameState.MainMenu, GameState.Planning) => true,
                (GameState.MainMenu, GameState.Encyclopedia) => true,
                (GameState.MainMenu, GameState.Settings) => true,
                (GameState.Tutorial, GameState.MainMenu) => true,
                (GameState.Planning, GameState.Sailing) => true,
                (GameState.Planning, GameState.MainMenu) => true,
                (GameState.Sailing, GameState.Paused) => true,
                (GameState.Sailing, GameState.Result) => true,
                (GameState.Paused, GameState.Sailing) => true,
                (GameState.Paused, GameState.Planning) => true,
                (GameState.Paused, GameState.MainMenu) => true,
                (GameState.Paused, GameState.Settings) => true,
                (GameState.Result, GameState.Planning) => true,
                (GameState.Result, GameState.MainMenu) => true,
                (GameState.Result, GameState.Encyclopedia) => true,
                (GameState.Encyclopedia, GameState.MainMenu) => true,
                (GameState.Encyclopedia, GameState.Result) => true,
                _ => false
            };
        }

        public void StartLevel(int levelIndex)
        {
            CurrentLevelIndex = levelIndex;
            CurrentFailReason = FailReason.None;
            ChangeState(GameState.Planning);
        }

        public void CompleteLevel()
        {
            ChangeState(GameState.Result);
        }

        public void FailLevel(FailReason reason)
        {
            CurrentFailReason = reason;
            ChangeState(GameState.Result);
        }

        public void PauseGame()
        {
            if (CurrentState != GameState.Sailing) return;

            IsPaused = true;
            Time.timeScale = 0f;
            ChangeState(GameState.Paused);
            OnGamePaused?.Invoke();
        }

        public void ResumeGame()
        {
            if (CurrentState != GameState.Paused) return;

            IsPaused = false;
            Time.timeScale = 1f;
            ChangeState(GameState.Sailing);
            OnGameResumed?.Invoke();
        }

        public void ReturnToMenu()
        {
            IsPaused = false;
            Time.timeScale = 1f;
            CurrentFailReason = FailReason.None;
            ChangeState(GameState.MainMenu);
        }

        public void RestartLevel()
        {
            IsPaused = false;
            Time.timeScale = 1f;
            CurrentFailReason = FailReason.None;
            ChangeState(GameState.Planning);
        }

        public void AddStars(int stars)
        {
            int current = TotalStars;
            PlayerPrefs.SetInt(GameConstants.PlayerPrefs.TotalStars, current + stars);
            PlayerPrefs.Save();
        }
    }
}
