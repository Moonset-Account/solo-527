using System;
using System.Collections.Generic;
using System.Reflection;
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

        private static readonly Dictionary<ModuleType, string> ModuleTypeNames = new Dictionary<ModuleType, string>
        {
            { ModuleType.DataManager, "SpaceCourier.DataModule.DataManager" },
            { ModuleType.TurnManager, "SpaceCourier.Gameplay.TurnManager" },
            { ModuleType.FuelManager, "SpaceCourier.Gameplay.FuelManager" },
            { ModuleType.ReputationManager, "SpaceCourier.Gameplay.ReputationManager" },
            { ModuleType.EventManager, "SpaceCourier.Gameplay.EventManager" },
            { ModuleType.UIManager, "SpaceCourier.UI.UIManager" },
            { ModuleType.SaveManager, "SpaceCourier.SaveSystem.SaveManager" },
            { ModuleType.AudioManager, "SpaceCourier.Audio.AudioManager" },
            { ModuleType.SceneLoader, "SpaceCourier.Core.SceneLoader" },
            { ModuleType.InputManager, "SpaceCourier.InputSystem.InputManager" },
            { ModuleType.PlayRecorder, "SpaceCourier.SaveSystem.PlayRecorder" }
        };

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
            var initOrder = new[]
            {
                ModuleType.SceneLoader,
                ModuleType.DataManager,
                ModuleType.SaveManager,
                ModuleType.AudioManager,
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
                try
                {
                    Type type = FindModuleType(moduleType);
                    if (type == null)
                    {
                        Debug.LogWarning($"[GameManager] Could not find type for module {moduleType}");
                        continue;
                    }

                    var component = gameObject.GetComponent(type) ?? gameObject.AddComponent(type);
                    if (component is IModule module)
                    {
                        modules[moduleType] = module;
                    }
                }
                catch (Exception e)
                {
                    Debug.LogError($"[GameManager] Error registering module {moduleType}: {e.Message}");
                }
            }
        }

        private Type FindModuleType(ModuleType moduleType)
        {
            if (ModuleTypeNames.TryGetValue(moduleType, out var typeName))
            {
                foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
                {
                    var t = assembly.GetType(typeName);
                    if (t != null) return t;
                }
            }
            return Type.GetType(typeName + ",Assembly-CSharp") ?? Type.GetType(typeName);
        }

        private void InitializeModules()
        {
            var initOrder = new[]
            {
                ModuleType.SceneLoader,
                ModuleType.DataManager,
                ModuleType.SaveManager,
                ModuleType.AudioManager,
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

            var recorder = GetModule<SpaceCourier.SaveSystem.PlayRecorder>(ModuleType.PlayRecorder);
            if (recorder != null)
            {
                recorder.StartSession(levelId);
            }

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

            var recorder = GetModule<SpaceCourier.SaveSystem.PlayRecorder>(ModuleType.PlayRecorder);
            if (recorder != null)
            {
                recorder.EndSession(isVictory, reason, score);
            }

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
