using System;
using System.Collections.Generic;
using UnityEngine;

namespace YouthTrainingManagement.Core
{
    public class GameStateMachine
    {
        private readonly Dictionary<Type, IGameState> _states = new Dictionary<Type, IGameState>();
        private IGameState _currentState;

        public IGameState CurrentState => _currentState;
        public event Action<IGameState, IGameState> OnStateChanged;

        public void AddState<TState>(TState state) where TState : class, IGameState
        {
            if (state == null) throw new ArgumentNullException(nameof(state));
            var type = typeof(TState);
            if (_states.ContainsKey(type))
            {
                Debug.LogWarning($"State {type.Name} already exists in state machine. Overwriting.");
            }
            _states[type] = state;
        }

        public void ChangeState<TState>() where TState : class, IGameState
        {
            var type = typeof(TState);
            if (!_states.TryGetValue(type, out var newState))
            {
                throw new InvalidOperationException($"State {type.Name} is not registered in the state machine.");
            }
            ChangeStateInternal(newState);
        }

        public void ChangeState(Type stateType)
        {
            if (stateType == null) throw new ArgumentNullException(nameof(stateType));
            if (!_states.TryGetValue(stateType, out var newState))
            {
                throw new InvalidOperationException($"State {stateType.Name} is not registered in the state machine.");
            }
            ChangeStateInternal(newState);
        }

        private void ChangeStateInternal(IGameState newState)
        {
            if (newState == _currentState) return;

            var previousState = _currentState;
            _currentState?.Exit();
            _currentState = newState;
            _currentState?.Enter();
            OnStateChanged?.Invoke(previousState, newState);
        }

        public void Update(float deltaTime)
        {
            _currentState?.Update(deltaTime);
        }

        public TState GetState<TState>() where TState : class, IGameState
        {
            return _states.TryGetValue(typeof(TState), out var state) ? state as TState : null;
        }
    }

    public interface IGameState
    {
        void Enter();
        void Exit();
        void Update(float deltaTime);
    }

    public abstract class GameStateBase : IGameState
    {
        protected readonly GameManager GameManager;

        protected GameStateBase(GameManager gameManager)
        {
            GameManager = gameManager ?? throw new ArgumentNullException(nameof(gameManager));
        }

        public abstract void Enter();
        public abstract void Exit();
        public virtual void Update(float deltaTime) { }
    }
}
