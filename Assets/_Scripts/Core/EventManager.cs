using System;
using System.Collections.Generic;

namespace LightShadowPlatformer.Core
{
    public class EventManager
    {
        public static EventManager Instance { get; } = new EventManager();

        private readonly Dictionary<Type, Delegate> _eventHandlers = new Dictionary<Type, Delegate>();

        public delegate void GameStateChangedHandler(GameManager.GameState oldState, GameManager.GameState newState);
        public event GameStateChangedHandler OnGameStateChanged;

        public delegate void LevelLoadedHandler(int levelIndex);
        public event LevelLoadedHandler OnLevelLoaded;

        public delegate void PlayerDeathHandler();
        public event PlayerDeathHandler OnPlayerDeath;

        public delegate void PlayerSpawnHandler();
        public event PlayerSpawnHandler OnPlayerSpawn;

        public delegate void CheckpointActivatedHandler(string checkpointId);
        public event CheckpointActivatedHandler OnCheckpointActivated;

        public delegate void LightDirectionChangedHandler(LightManager.LightDirection direction);
        public event LightDirectionChangedHandler OnLightDirectionChanged;

        public delegate void CollectibleCollectedHandler(string collectibleId, int totalCollected);
        public event CollectibleCollectedHandler OnCollectibleCollected;

        public delegate void SwitchActivatedHandler(string switchId, bool isActive);
        public event SwitchActivatedHandler OnSwitchActivated;

        public delegate void DoorStateChangedHandler(string doorId, bool isOpen);
        public event DoorStateChangedHandler OnDoorStateChanged;

        public delegate void TutorialTriggeredHandler(string tutorialId, string message);
        public event TutorialTriggeredHandler OnTutorialTriggered;

        public delegate void LevelCompletedHandler(int levelIndex);
        public event LevelCompletedHandler OnLevelCompleted;

        private EventManager() { }

        public void TriggerGameStateChanged(GameManager.GameState oldState, GameManager.GameState newState)
            => OnGameStateChanged?.Invoke(oldState, newState);

        public void TriggerLevelLoaded(int levelIndex)
            => OnLevelLoaded?.Invoke(levelIndex);

        public void TriggerPlayerDeath()
            => OnPlayerDeath?.Invoke();

        public void TriggerPlayerSpawn()
            => OnPlayerSpawn?.Invoke();

        public void TriggerCheckpointActivated(string checkpointId)
            => OnCheckpointActivated?.Invoke(checkpointId);

        public void TriggerLightDirectionChanged(LightManager.LightDirection direction)
            => OnLightDirectionChanged?.Invoke(direction);

        public void TriggerCollectibleCollected(string collectibleId, int totalCollected)
            => OnCollectibleCollected?.Invoke(collectibleId, totalCollected);

        public void TriggerSwitchActivated(string switchId, bool isActive)
            => OnSwitchActivated?.Invoke(switchId, isActive);

        public void TriggerDoorStateChanged(string doorId, bool isOpen)
            => OnDoorStateChanged?.Invoke(doorId, isOpen);

        public void TriggerTutorialTriggered(string tutorialId, string message)
            => OnTutorialTriggered?.Invoke(tutorialId, message);

        public void TriggerLevelCompleted(int levelIndex)
            => OnLevelCompleted?.Invoke(levelIndex);

        public void UnsubscribeAll()
        {
            _eventHandlers.Clear();
            OnGameStateChanged = null;
            OnLevelLoaded = null;
            OnPlayerDeath = null;
            OnPlayerSpawn = null;
            OnCheckpointActivated = null;
            OnLightDirectionChanged = null;
            OnCollectibleCollected = null;
            OnSwitchActivated = null;
            OnDoorStateChanged = null;
            OnTutorialTriggered = null;
            OnLevelCompleted = null;
        }
    }
}
