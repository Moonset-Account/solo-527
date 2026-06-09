using UnityEngine;
using System;

namespace LakeSailing.Core
{
    public enum GameState
    {
        Boot,
        MainMenu,
        Tutorial,
        LevelSelect,
        Playing,
        Paused,
        Victory,
        Defeat,
        Settings,
        Gallery,
        Achievements,
        Leaderboard,
        DailyChallenge
    }

    public class GameManager : PersistentSingleton<GameManager>
    {
        [SerializeField] private GameState currentState = GameState.Boot;
        [SerializeField] private string currentLevelId;
        [SerializeField] private int currentDifficulty = 1;

        public event Action<GameState, GameState> OnGameStateChanged;
        public event Action<string> OnLevelLoaded;

        public GameState CurrentState => currentState;
        public string CurrentLevelId => currentLevelId;
        public int CurrentDifficulty => currentDifficulty;

        protected override void Awake()
        {
            base.Awake();
            Application.targetFrameRate = 60;
            Screen.sleepTimeout = SleepTimeout.NeverSleep;
        }

        public void ChangeState(GameState newState)
        {
            if (currentState == newState) return;

            var oldState = currentState;
            currentState = newState;

            switch (newState)
            {
                case GameState.Playing:
                    Time.timeScale = 1f;
                    break;
                case GameState.Paused:
                case GameState.Settings:
                case GameState.Tutorial:
                    Time.timeScale = 0f;
                    break;
                default:
                    Time.timeScale = 1f;
                    break;
            }

            OnGameStateChanged?.Invoke(oldState, newState);
            EventBus.Trigger(new GameStateChangedEvent(oldState, newState));
        }

        public void SetCurrentLevel(string levelId, int difficulty = 1)
        {
            currentLevelId = levelId;
            currentDifficulty = difficulty;
            OnLevelLoaded?.Invoke(levelId);
        }

        public void TogglePause()
        {
            if (currentState == GameState.Playing)
            {
                ChangeState(GameState.Paused);
            }
            else if (currentState == GameState.Paused)
            {
                ChangeState(GameState.Playing);
            }
        }

        public void RestartLevel()
        {
            ChangeState(GameState.Playing);
            EventBus.Trigger(new LevelRestartEvent(currentLevelId));
        }

        public void ReturnToMainMenu()
        {
            ChangeState(GameState.MainMenu);
            currentLevelId = null;
        }
    }

    public struct GameStateChangedEvent : IEvent
    {
        public readonly GameState OldState;
        public readonly GameState NewState;

        public GameStateChangedEvent(GameState oldState, GameState newState)
        {
            OldState = oldState;
            NewState = newState;
        }
    }

    public struct LevelRestartEvent : IEvent
    {
        public readonly string LevelId;

        public LevelRestartEvent(string levelId)
        {
            LevelId = levelId;
        }
    }
}
