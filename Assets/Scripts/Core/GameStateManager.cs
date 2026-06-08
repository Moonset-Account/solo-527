using System;

namespace DecorMatch3.Core
{
    public enum GameState
    {
        None,
        Bootstrap,
        MainMenu,
        Tutorial,
        PlayingMatch3,
        PausedMatch3,
        Match3Complete,
        Match3Failed,
        Decorating,
        CustomerReview,
        Settings
    }

    public class GameStateManager : Singleton<GameStateManager>
    {
        public event Action<GameState, GameState> OnStateChanged;

        private GameState _currentState = GameState.None;
        private GameState _previousState = GameState.None;

        public GameState CurrentState
        {
            get => _currentState;
            private set
            {
                if (_currentState == value) return;

                _previousState = _currentState;
                _currentState = value;

                OnStateChanged?.Invoke(_previousState, _currentState);
                EventBus.Publish(new GameStateChangedEvent
                {
                    PreviousState = _previousState,
                    NewState = _currentState
                });
            }
        }

        public GameState PreviousState => _previousState;

        public bool IsInGameplayState =>
            CurrentState == GameState.PlayingMatch3 ||
            CurrentState == GameState.PausedMatch3 ||
            CurrentState == GameState.Decorating ||
            CurrentState == GameState.CustomerReview;

        public void ChangeState(GameState newState)
        {
            if (!CanTransitionTo(newState))
            {
                Debug.LogWarning($"[GameStateManager] Invalid state transition: {CurrentState} -> {newState}");
                return;
            }

            Debug.Log($"[GameStateManager] State transition: {CurrentState} -> {newState}");
            CurrentState = newState;
        }

        public bool CanTransitionTo(GameState newState)
        {
            switch (CurrentState)
            {
                case GameState.None:
                    return newState == GameState.Bootstrap;

                case GameState.Bootstrap:
                    return newState == GameState.MainMenu;

                case GameState.MainMenu:
                    return newState == GameState.Tutorial ||
                           newState == GameState.PlayingMatch3 ||
                           newState == GameState.Settings;

                case GameState.Tutorial:
                    return newState == GameState.MainMenu ||
                           newState == GameState.PlayingMatch3;

                case GameState.PlayingMatch3:
                    return newState == GameState.PausedMatch3 ||
                           newState == GameState.Match3Complete ||
                           newState == GameState.Match3Failed ||
                           newState == GameState.MainMenu;

                case GameState.PausedMatch3:
                    return newState == GameState.PlayingMatch3 ||
                           newState == GameState.MainMenu ||
                           newState == GameState.Settings;

                case GameState.Match3Complete:
                    return newState == GameState.Decorating ||
                           newState == GameState.MainMenu;

                case GameState.Match3Failed:
                    return newState == GameState.PlayingMatch3 ||
                           newState == GameState.MainMenu;

                case GameState.Decorating:
                    return newState == GameState.CustomerReview ||
                           newState == GameState.MainMenu;

                case GameState.CustomerReview:
                    return newState == GameState.PlayingMatch3 ||
                           newState == GameState.MainMenu;

                case GameState.Settings:
                    return newState == GameState.MainMenu ||
                           newState == GameState.PausedMatch3;

                default:
                    return false;
            }
        }

        public void TogglePause()
        {
            if (CurrentState == GameState.PlayingMatch3)
            {
                ChangeState(GameState.PausedMatch3);
            }
            else if (CurrentState == GameState.PausedMatch3)
            {
                ChangeState(GameState.PlayingMatch3);
            }
        }

        public void ReturnToMainMenu()
        {
            ChangeState(GameState.MainMenu);
        }
    }

    public struct GameStateChangedEvent
    {
        public GameState PreviousState;
        public GameState NewState;
    }
}
