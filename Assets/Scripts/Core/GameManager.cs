using UnityEngine;
using DecorMatch3.Utils;
using DecorMatch3.Core.Events;
using System;

namespace DecorMatch3.Core
{
    public enum GameState
    {
        Boot,
        MainMenu,
        Loading,
        Match3Level,
        Decoration,
        OrderManagement,
        Paused,
        Settings,
        Credits
    }

    public class GameManager : Singleton<GameManager>
    {
        [SerializeField] private GameState _currentState = GameState.Boot;
        [SerializeField] private string _playerId;
        [SerializeField] private bool _isFirstLaunch = true;

        public GameState CurrentState => _currentState;
        public string PlayerId => _playerId;
        public bool IsFirstLaunch => _isFirstLaunch;

        public event Action<GameState, GameState> OnStateChanged;

        protected override void Awake()
        {
            base.Awake();
            InitializeSystems();
        }

        private void Start()
        {
            ChangeState(GameState.MainMenu);
        }

        private void InitializeSystems()
        {
            if (string.IsNullOrEmpty(_playerId))
            {
                _playerId = SystemInfo.deviceUniqueIdentifier;
            }
        }

        public void ChangeState(GameState newState)
        {
            if (_currentState == newState) return;

            GameState previousState = _currentState;
            _currentState = newState;

            Debug.Log($"[GameManager] State changed: {previousState} -> {newState}");

            OnStateChanged?.Invoke(previousState, newState);
            EventBus.Publish(new GameStateChangedEvent
            {
                PreviousState = previousState,
                NewState = newState
            });
        }

        public void SetFirstLaunchComplete()
        {
            _isFirstLaunch = false;
        }

        private void OnApplicationPause(bool pauseStatus)
        {
            if (pauseStatus)
            {
                SaveSystem.Instance.SaveAll(true);
                AnalyticsSystem.Instance.FlushEvents();
            }
        }

        private void OnApplicationQuit()
        {
            SaveSystem.Instance.SaveAll(true);
            AnalyticsSystem.Instance.FlushEvents();
        }
    }
}
