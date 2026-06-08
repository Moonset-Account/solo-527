using System;
using System.Collections.Generic;
using UnityEngine;

namespace SpaceCourier.Core
{
    public class GameManager : Singleton<GameManager>, IModule
    {
        private Dictionary<ModuleType, IModule> modules = new Dictionary<ModuleType, IModule>();
        private bool isInitialized = false;
        private bool isGameRunning = false;

        public ModuleType Type => ModuleType.GameManager;
        public bool IsGameRunning => isGameRunning;
        public GameState CurrentState { get; private set; } = GameState.Menu;

        public event Action<GameState> OnGameStateChanged;

        protected override void Awake()
        {
            base.Awake();
            if (!isInitialized)
            {
                Initialize();
            }
        }

        public void Initialize()
        {
            if (isInitialized) return;

            RegisterAllModules();
            InitializeModules();
            isInitialized = true;

            Debug.Log("[GameManager] All modules initialized successfully.");
        }

        private void RegisterAllModules()
        {
            var moduleTypes = new Dictionary<ModuleType, Type>
            {
                { ModuleType.DataManager, typeof(DataModule.DataManager) },
                { ModuleType.TurnManager, typeof(Gameplay.TurnManager) },
                { ModuleType.FuelManager, typeof(Gameplay.FuelManager) },
                { ModuleType.ReputationManager, typeof(Gameplay.ReputationManager) },
                { ModuleType.EventManager, typeof(Gameplay.EventManager) },
                { ModuleType.UIManager, typeof(UI.UIManager) },
                { ModuleType.SaveManager, typeof(SaveSystem.SaveManager) },
                { ModuleType.AudioManager, typeof(Audio.AudioManager) },
                { ModuleType.SceneLoader, typeof(Core.SceneLoader) },
                { ModuleType.InputManager, typeof(Input.InputManager) },
                { ModuleType.PlayRecorder, typeof(SaveSystem.PlayRecorder) }
            };

            foreach (var kvp in moduleTypes)
            {
                var component = gameObject.GetComponent(kvp.Value) ?? gameObject.AddComponent(kvp.Value);
                if (component is IModule module)
                {
                    modules[kvp.Key] = module;
                }
            }
        }

        private void InitializeModules()
        {
            var initOrder = new[]
            {
                ModuleType.DataManager,
                ModuleType.SaveManager,
                ModuleType.AudioManager,
                ModuleType.SceneLoader,
                ModuleType.InputManager,
                ModuleType.PlayRecorder,
                ModuleType.UIManager,
                ModuleType.TurnManager,
                ModuleType.FuelManager,
                ModuleType.ReputationManager,
                ModuleType.EventManager
            };

            foreach (var moduleType in initOrder)
            {
                if (modules.TryGetValue(moduleType, out var module))
                {
                    try
                    {
                        module.Initialize();
                    }
                    catch (Exception e)
                    {
                        Debug.LogError($"[GameManager] Failed to initialize module {moduleType}: {e.Message}");
                    }
                }
            }
        }

        public T GetModule<T>(ModuleType type) where T : class, IModule
        {
            if (modules.TryGetValue(type, out var module))
            {
                return module as T;
            }
            return null;
        }

        public void StartGame(int levelId)
        {
            SetGameState(GameState.Playing);
            isGameRunning = true;

            var recorder = GetModule<SaveSystem.PlayRecorder>(ModuleType.PlayRecorder);
            recorder?.StartSession(levelId);

            EventBus.Publish(new GameEvents.GameStarted { LevelId = levelId });
            Debug.Log($"[GameManager] Game started with level {levelId}");
        }

        public void PauseGame()
        {
            if (CurrentState != GameState.Playing) return;
            SetGameState(GameState.Paused);
            EventBus.Publish(new GameEvents.GamePaused { IsPaused = true });
        }

        public void ResumeGame()
        {
            if (CurrentState != GameState.Paused) return;
            SetGameState(GameState.Playing);
            EventBus.Publish(new GameEvents.GamePaused { IsPaused = false });
        }

        public void EndGame(bool isVictory, string reason, int score)
        {
            if (CurrentState == GameState.Ended) return;

            isGameRunning = false;
            SetGameState(GameState.Ended);

            var recorder = GetModule<SaveSystem.PlayRecorder>(ModuleType.PlayRecorder);
            recorder?.EndSession(isVictory, reason, score);

            EventBus.Publish(new GameEvents.GameEnded
            {
                IsVictory = isVictory,
                Reason = reason,
                Score = score
            });

            Debug.Log($"[GameManager] Game ended. Victory: {isVictory}, Reason: {reason}, Score: {score}");
        }

        public void ReturnToMenu()
        {
            isGameRunning = false;
            SetGameState(GameState.Menu);
        }

        private void SetGameState(GameState newState)
        {
            if (CurrentState == newState) return;
            CurrentState = newState;
            OnGameStateChanged?.Invoke(newState);
        }

        public void Shutdown()
        {
            foreach (var module in modules.Values)
            {
                try
                {
                    module.Shutdown();
                }
                catch (Exception e)
                {
                    Debug.LogError($"[GameManager] Error shutting down module: {e.Message}");
                }
            }
            modules.Clear();
            isInitialized = false;
        }

        protected override void OnDestroy()
        {
            Shutdown();
            base.OnDestroy();
        }
    }

    public enum GameState
    {
        Menu,
        Loading,
        Playing,
        Paused,
        Ended
    }
}
