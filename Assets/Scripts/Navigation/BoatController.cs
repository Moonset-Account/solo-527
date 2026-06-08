using UnityEngine;
using System;
using System.Collections.Generic;

namespace LakeNavigation
{
    public class BoatController : MonoBehaviour
    {
        public float Speed = 3f;
        public float currentSpeed;
        public float health = 100f;

        public BoatState CurrentState { get; private set; } = BoatState.Idle;

        public event Action<Vector2> OnBoatMoved;
        public event Action<float, string> OnBoatDamaged;
        public event Action<BoatState> OnBoatStateChanged;
        public event Action OnRouteCompleted;
        public event Action<float, float> OnHealthChanged;

        private List<Vector2> _waypoints = new List<Vector2>();
        private int _currentWaypointIndex;
        private GameConfig _gameConfig;
        private const float WaypointThreshold = 0.2f;
        private const float MaxHealth = 100f;

        private void Start()
        {
            ServiceLocator.Instance.TryGet(out _gameConfig);
        }

        private void Update()
        {
            if (CurrentState != BoatState.Moving || _waypoints.Count == 0)
                return;

            if (_currentWaypointIndex >= _waypoints.Count)
            {
                CurrentState = BoatState.Idle;
                OnBoatStateChanged?.Invoke(CurrentState);
                OnRouteCompleted?.Invoke();
                return;
            }

            Vector2 targetWaypoint = _waypoints[_currentWaypointIndex];
            Vector2 currentPosition = transform.position;
            Vector2 moveDirection = targetWaypoint - currentPosition;
            float distance = moveDirection.magnitude;

            if (distance <= WaypointThreshold)
            {
                _currentWaypointIndex++;
                if (_currentWaypointIndex >= _waypoints.Count)
                {
                    CurrentState = BoatState.Idle;
                    OnBoatStateChanged?.Invoke(CurrentState);
                    OnRouteCompleted?.Invoke();
                    return;
                }
                return;
            }

            Vector2 normalizedDirection = moveDirection / distance;
            float windEffect = 0f;
            if (WeatherSystem.Instance != null)
            {
                windEffect = WeatherSystem.Instance.GetWindEffectOnDirection(normalizedDirection);
            }

            currentSpeed = Speed * (1f + windEffect);
            currentSpeed = Mathf.Clamp(currentSpeed, Speed * 0.3f, Speed * 1.8f);

            Vector2 newPosition = currentPosition + normalizedDirection * currentSpeed * Time.deltaTime;
            newPosition = ClampToGrid(newPosition);

            transform.position = new Vector3(newPosition.x, newPosition.y, transform.position.z);
            OnBoatMoved?.Invoke(newPosition);
        }

        public void TakeDamage(float amount, string cause)
        {
            if (CurrentState == BoatState.Sinking)
                return;

            health = Mathf.Clamp(health - amount, 0f, MaxHealth);
            OnBoatDamaged?.Invoke(amount, cause);
            OnHealthChanged?.Invoke(health, MaxHealth);

            if (health <= 0f)
            {
                CurrentState = BoatState.Sinking;
                OnBoatDamaged?.Invoke(0f, "Boat destroyed");
                OnBoatStateChanged?.Invoke(CurrentState);
            }
        }

        public void SetRoute(List<Vector2> waypoints)
        {
            _waypoints = new List<Vector2>(waypoints);
            _currentWaypointIndex = 0;
            CurrentState = BoatState.Moving;
            OnBoatStateChanged?.Invoke(CurrentState);
        }

        public void StopBoat()
        {
            CurrentState = BoatState.Anchored;
            OnBoatStateChanged?.Invoke(CurrentState);
        }

        public void ResumeBoat()
        {
            if (CurrentState == BoatState.Anchored)
            {
                CurrentState = BoatState.Moving;
                OnBoatStateChanged?.Invoke(CurrentState);
            }
        }

        public void ResetBoat(Vector2 startPosition, float startHealth)
        {
            health = Mathf.Clamp(startHealth, 0f, MaxHealth);
            transform.position = new Vector3(startPosition.x, startPosition.y, transform.position.z);
            _waypoints.Clear();
            _currentWaypointIndex = 0;
            currentSpeed = 0f;
            CurrentState = BoatState.Idle;
            OnBoatStateChanged?.Invoke(CurrentState);
            OnHealthChanged?.Invoke(health, MaxHealth);
        }

        private Vector2 ClampToGrid(Vector2 position)
        {
            float gridWidth = _gameConfig != null ? _gameConfig.GridWidth : 20f;
            float gridHeight = _gameConfig != null ? _gameConfig.GridHeight : 15f;

            position.x = Mathf.Clamp(position.x, 0f, gridWidth);
            position.y = Mathf.Clamp(position.y, 0f, gridHeight);
            return position;
        }
    }
}
