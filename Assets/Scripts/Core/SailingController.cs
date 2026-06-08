using UnityEngine;
using System;
using System.Collections.Generic;

namespace LakeNavigation
{
    public class SailingController : MonoBehaviour
    {
        public static SailingController Instance { get; private set; }

        private BoatController _boatController;
        private SupplyManager _supplyManager;
        private MissionManager _missionManager;
        private CollisionDetector _collisionDetector;
        private WeatherSystem _weatherSystem;
        private LevelManager _levelManager;
        private GameConfig _gameConfig;

        private const float DockProximityRadius = 1.0f;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            _boatController = FindObjectOfType<BoatController>();
            _supplyManager = FindObjectOfType<SupplyManager>();
            _missionManager = FindObjectOfType<MissionManager>();
            _collisionDetector = FindObjectOfType<CollisionDetector>();
            _weatherSystem = FindObjectOfType<WeatherSystem>();
            _levelManager = FindObjectOfType<LevelManager>();
            ServiceLocator.Instance.TryGet(out _gameConfig);

            SubscribeEvents();
        }

        private void OnDestroy()
        {
            UnsubscribeEvents();
        }

        private void SubscribeEvents()
        {
            if (_boatController != null)
            {
                _boatController.OnBoatMoved += OnBoatMoved;
                _boatController.OnRouteCompleted += OnRouteCompleted;
                _boatController.OnBoatDamaged += OnBoatDamaged;
            }

            if (_supplyManager != null)
            {
                _supplyManager.OnSupplyDepleted += OnSupplyDepleted;
            }

            if (_missionManager != null)
            {
                _missionManager.OnTimeExpired += OnTimeExpired;
                _missionManager.OnAllMissionsCompleted += OnAllMissionsCompleted;
            }

            if (_weatherSystem != null)
            {
                _weatherSystem.OnStormDamage += OnStormDamage;
            }

            if (_collisionDetector != null)
            {
                _collisionDetector.OnPhotoTargetProximity += OnPhotoTargetProximity;
                _collisionDetector.OnDockReached += OnDockReached;
            }
        }

        private void UnsubscribeEvents()
        {
            if (_boatController != null)
            {
                _boatController.OnBoatMoved -= OnBoatMoved;
                _boatController.OnRouteCompleted -= OnRouteCompleted;
                _boatController.OnBoatDamaged -= OnBoatDamaged;
            }

            if (_supplyManager != null)
            {
                _supplyManager.OnSupplyDepleted -= OnSupplyDepleted;
            }

            if (_missionManager != null)
            {
                _missionManager.OnTimeExpired -= OnTimeExpired;
                _missionManager.OnAllMissionsCompleted -= OnAllMissionsCompleted;
            }

            if (_weatherSystem != null)
            {
                _weatherSystem.OnStormDamage -= OnStormDamage;
            }

            if (_collisionDetector != null)
            {
                _collisionDetector.OnPhotoTargetProximity -= OnPhotoTargetProximity;
                _collisionDetector.OnDockReached -= OnDockReached;
            }
        }

        private void Update()
        {
            if (GameManager.Instance.CurrentState != GameState.Sailing)
                return;

            if (_supplyManager != null)
                _supplyManager.ConsumeOverTime(Time.deltaTime);
            if (_missionManager != null)
                _missionManager.UpdateTime(Time.deltaTime);

            if (_boatController != null && _boatController.health <= 0f)
            {
                FailLevel(FailReason.BoatDamaged);
                return;
            }

            if (_supplyManager != null && _supplyManager.IsDepleted(SupplyType.Battery))
            {
                FailLevel(FailReason.MissionFailed);
                return;
            }

            if (_boatController != null && _collisionDetector != null)
            {
                Vector2 boatPosition = _boatController.transform.position;
                _collisionDetector.CheckCollisions(boatPosition);
            }

            if (UIManager.Instance != null)
            {
                UIManager.Instance.UpdateHUD();
            }
        }

        private void OnBoatMoved(Vector2 position)
        {
            if (GameManager.Instance.CurrentState != GameState.Sailing)
                return;

            if (_collisionDetector != null)
            {
                _collisionDetector.CheckCollisions(position);
            }
        }

        private void OnRouteCompleted()
        {
            if (GameManager.Instance.CurrentState != GameState.Sailing)
                return;

            if (_boatController == null || _levelManager == null || _levelManager.CurrentLevel == null)
                return;

            Vector2 boatPos = _boatController.transform.position;
            bool atDock = false;

            foreach (var dock in _levelManager.CurrentLevel.DockPositions)
            {
                if (Vector2.Distance(boatPos, dock) < DockProximityRadius)
                {
                    atDock = true;
                    break;
                }
            }

            if (atDock)
            {
                if (_missionManager != null && _missionManager.AreAllRequiredMissionsCompleted())
                {
                    CompleteLevel();
                }
                else
                {
                    FailLevel(FailReason.MissionFailed);
                }
            }
        }

        private void OnBoatDamaged(float amount, string cause)
        {
            if (GameManager.Instance.CurrentState != GameState.Sailing)
                return;

            if (_boatController != null && _boatController.health <= 0f)
            {
                FailLevel(FailReason.BoatDamaged);
            }
        }

        private void OnSupplyDepleted(SupplyType type)
        {
            if (GameManager.Instance.CurrentState != GameState.Sailing)
                return;

            switch (type)
            {
                case SupplyType.Fuel:
                    FailLevel(FailReason.OutOfFuel);
                    break;
                case SupplyType.Food:
                    FailLevel(FailReason.OutOfFood);
                    break;
            }
        }

        private void OnTimeExpired()
        {
            if (GameManager.Instance.CurrentState != GameState.Sailing)
                return;

            FailLevel(FailReason.TimeExpired);
        }

        private void OnAllMissionsCompleted()
        {
            if (GameManager.Instance.CurrentState != GameState.Sailing)
                return;

            if (_boatController == null || _levelManager == null || _levelManager.CurrentLevel == null)
                return;

            Vector2 boatPos = _boatController.transform.position;
            foreach (var dock in _levelManager.CurrentLevel.DockPositions)
            {
                if (Vector2.Distance(boatPos, dock) < DockProximityRadius)
                {
                    CompleteLevel();
                    return;
                }
            }
        }

        private void OnStormDamage(float damage)
        {
            if (GameManager.Instance.CurrentState != GameState.Sailing)
                return;

            if (_boatController != null)
            {
                _boatController.TakeDamage(damage, "Storm damage");
            }
        }

        private void OnPhotoTargetProximity(PhotoTarget target, float distance)
        {
            if (GameManager.Instance.CurrentState != GameState.Sailing)
                return;

            if (_missionManager != null && _boatController != null)
            {
                _missionManager.TryTakePhoto(_boatController.transform.position);
            }
        }

        private void OnDockReached(Vector2 dockPosition)
        {
            if (GameManager.Instance.CurrentState != GameState.Sailing)
                return;

            if (_missionManager != null && _missionManager.AreAllRequiredMissionsCompleted())
            {
                CompleteLevel();
            }
        }

        public void TakePhoto()
        {
            if (GameManager.Instance.CurrentState != GameState.Sailing)
                return;

            if (_missionManager != null && _boatController != null)
            {
                _missionManager.TryTakePhoto(_boatController.transform.position);
            }
        }

        public void StartSailing(List<Vector2> route)
        {
            if (_boatController != null)
            {
                _boatController.SetRoute(route);
            }

            GameManager.Instance.ChangeState(GameState.Sailing);
        }

        public void CompleteLevel()
        {
            if (GameManager.Instance.CurrentState != GameState.Sailing)
                return;

            float timeUsed = _missionManager.levelTimeLimit - _missionManager.timeRemaining;
            var result = ScoreCalculator.CalculateLevelScore(
                _missionManager, _supplyManager, timeUsed, _missionManager.levelTimeLimit, _gameConfig);

            if (_levelManager != null)
            {
                _levelManager.CompleteCurrentLevel(result);
            }

            var resultPanel = UIManager.Instance.GetPanel<ResultPanel>();
            if (resultPanel != null)
            {
                resultPanel.SetResult(result, FailReason.None);
            }

            GameManager.Instance.CompleteLevel();
        }

        public void FailLevel(FailReason reason)
        {
            if (GameManager.Instance.CurrentState != GameState.Sailing)
                return;

            if (_levelManager != null)
            {
                _levelManager.FailCurrentLevel(reason);
            }

            var result = default(LevelScoreResult);
            var resultPanel = UIManager.Instance.GetPanel<ResultPanel>();
            if (resultPanel != null)
            {
                resultPanel.SetResult(result, reason);
            }

            GameManager.Instance.FailLevel(reason);
        }

        public void ResetLevel()
        {
            if (_levelManager != null)
            {
                _levelManager.LoadLevel(_levelManager.CurrentLevelIndex);
            }

            GameManager.Instance.RestartLevel();
        }
    }
}
