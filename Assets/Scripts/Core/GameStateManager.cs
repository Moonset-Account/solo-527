using System;
using UnityEngine;

namespace BeatRunner.Core
{
    public class GameStateManager : MonoBehaviour
    {
        public static GameStateManager Instance { get; private set; }

        public enum GameState
        {
            Boot,
            MainMenu,
            Tutorial,
            Playing,
            Paused,
            GameOver,
            Results,
            Settings
        }

        public GameState CurrentState { get; private set; } = GameState.Boot;
        public GameState PreviousState { get; private set; } = GameState.Boot;

        public event Action<GameState, GameState> OnStateChanged;

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
            if (CurrentState == newState) return;

            PreviousState = CurrentState;
            CurrentState = newState;

            Debug.Log($"GameState changed: {PreviousState} -> {CurrentState}");
            OnStateChanged?.Invoke(PreviousState, CurrentState);

            HandleStateExit(PreviousState);
            HandleStateEnter(CurrentState);
        }

        private void HandleStateEnter(GameState state)
        {
            switch (state)
            {
                case GameState.Playing:
                    Time.timeScale = 1f;
                    break;
                case GameState.Paused:
                case GameState.Settings:
                    Time.timeScale = 0f;
                    break;
                case GameState.GameOver:
                case GameState.Results:
                    Time.timeScale = 1f;
                    break;
            }
        }

        private void HandleStateExit(GameState state)
        {
        }

        public void TogglePause()
        {
            if (CurrentState == GameState.Playing)
            {
                ChangeState(GameState.Paused);
            }
            else if (CurrentState == GameState.Paused)
            {
                ChangeState(GameState.Playing);
            }
        }

        public void OpenSettings()
        {
            if (CurrentState == GameState.Playing || CurrentState == GameState.Paused ||
                CurrentState == GameState.MainMenu)
            {
                ChangeState(GameState.Settings);
            }
        }

        public void CloseSettings()
        {
            if (CurrentState == GameState.Settings)
            {
                ChangeState(PreviousState == GameState.Settings ? GameState.MainMenu : PreviousState);
            }
        }
    }
}
