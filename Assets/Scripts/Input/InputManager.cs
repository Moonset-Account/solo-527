using System;
using System.Collections.Generic;
using UnityEngine;
using YouthTrainingManagement.Core;

namespace YouthTrainingManagement.InputSystem
{
    [Serializable]
    public class InputBinding
    {
        public string ActionId;
        public string DisplayName;
        public KeyCode PrimaryKey;
        public KeyCode SecondaryKey;
        public bool CanBeRemapped;
        public string Category;
    }

    [Serializable]
    public class InputBindings
    {
        public List<InputBinding> Bindings = new List<InputBinding>();
    }

    [Serializable]
    public struct KeyBinding
    {
        public KeyCode PrimaryKey;
        public KeyCode SecondaryKey;
    }

    public enum GameAction
    {
        Pause,
        OpenSettings,
        SaveGame,
        LoadGame,
        AdvancePhase,
        SelectAll,
        DeselectAll,
        NavigateUp,
        NavigateDown,
        NavigateLeft,
        NavigateRight,
        Confirm,
        Cancel,
        OpenTraining,
        OpenRecovery,
        OpenMatch,
        OpenSquad,
        OpenFixtures,
        OpenFinance,
        QuickSave,
        QuickLoad
    }

    public class InputManager
    {
        private readonly GameManager _gameManager;
        private readonly Dictionary<GameAction, InputBinding> _bindings = new Dictionary<GameAction, InputBinding>();
        private readonly Dictionary<string, GameAction> _actionMap = new Dictionary<string, GameAction>();

        public event Action<GameAction> OnActionTriggered;
        public event Action<string, KeyCode> OnBindingChanged;
        public bool IsListeningForRebind { get; private set; }
        public GameAction RebindTargetAction { get; private set; }

        public InputManager(GameManager gameManager)
        {
            _gameManager = gameManager ?? throw new ArgumentNullException(nameof(gameManager));
        }

        public void Initialize()
        {
            InitializeDefaultBindings();
            LoadBindingsFromSettings();
            Debug.Log($"InputManager initialized with {_bindings.Count} bindings.");
        }

        private void InitializeDefaultBindings()
        {
            var defaults = new List<(GameAction action, string id, string name, KeyCode primary, KeyCode secondary, string category, bool remappable)>
            {
                (GameAction.Pause, "pause", "Pause / Resume", KeyCode.Escape, KeyCode.P, "General", true),
                (GameAction.OpenSettings, "settings", "Open Settings", KeyCode.F1, KeyCode.None, "General", true),
                (GameAction.SaveGame, "save", "Save Game", KeyCode.F5, KeyCode.None, "General", true),
                (GameAction.LoadGame, "load", "Load Game", KeyCode.F9, KeyCode.None, "General", true),
                (GameAction.QuickSave, "quicksave", "Quick Save", KeyCode.LeftControl | KeyCode.S, KeyCode.None, "General", true),
                (GameAction.AdvancePhase, "advance", "Advance Time", KeyCode.Space, KeyCode.Return, "Gameplay", true),
                (GameAction.SelectAll, "selectall", "Select All", KeyCode.LeftControl | KeyCode.A, KeyCode.None, "Gameplay", true),
                (GameAction.DeselectAll, "deselectall", "Deselect All", KeyCode.LeftControl | KeyCode.D, KeyCode.None, "Gameplay", true),
                (GameAction.OpenTraining, "training", "Open Training", KeyCode.T, KeyCode.None, "Navigation", true),
                (GameAction.OpenRecovery, "recovery", "Open Recovery", KeyCode.R, KeyCode.None, "Navigation", true),
                (GameAction.OpenMatch, "match", "Open Match", KeyCode.M, KeyCode.None, "Navigation", true),
                (GameAction.OpenSquad, "squad", "Open Squad", KeyCode.S, KeyCode.None, "Navigation", true),
                (GameAction.OpenFixtures, "fixtures", "Open Fixtures", KeyCode.F, KeyCode.None, "Navigation", true),
                (GameAction.OpenFinance, "finance", "Open Finance", KeyCode.G, KeyCode.None, "Navigation", true),
                (GameAction.NavigateUp, "nav_up", "Navigate Up", KeyCode.UpArrow, KeyCode.W, "Navigation", true),
                (GameAction.NavigateDown, "nav_down", "Navigate Down", KeyCode.DownArrow, KeyCode.S, "Navigation", true),
                (GameAction.NavigateLeft, "nav_left", "Navigate Left", KeyCode.LeftArrow, KeyCode.A, "Navigation", true),
                (GameAction.NavigateRight, "nav_right", "Navigate Right", KeyCode.RightArrow, KeyCode.D, "Navigation", true),
                (GameAction.Confirm, "confirm", "Confirm", KeyCode.Return, KeyCode.Space, "General", true),
                (GameAction.Cancel, "cancel", "Cancel", KeyCode.Backspace, KeyCode.Escape, "General", true)
            };

            foreach (var def in defaults)
            {
                var binding = new InputBinding
                {
                    ActionId = def.id,
                    DisplayName = def.name,
                    PrimaryKey = def.primary,
                    SecondaryKey = def.secondary,
                    CanBeRemapped = def.remappable,
                    Category = def.category
                };
                _bindings[def.action] = binding;
                _actionMap[def.id] = def.action;
            }
        }

        private void LoadBindingsFromSettings()
        {
            if (_gameManager.Settings?.InputBindings?.Bindings == null) return;
            foreach (var savedBinding in _gameManager.Settings.InputBindings.Bindings)
            {
                if (_actionMap.TryGetValue(savedBinding.ActionId, out var action))
                {
                    if (_bindings.TryGetValue(action, out var binding) && binding.CanBeRemapped)
                    {
                        binding.PrimaryKey = savedBinding.PrimaryKey;
                        binding.SecondaryKey = savedBinding.SecondaryKey;
                    }
                }
            }
        }

        public void SaveBindingsToSettings()
        {
            if (_gameManager.Settings?.InputBindings == null) return;
            _gameManager.Settings.InputBindings.Bindings.Clear();
            foreach (var kvp in _bindings)
            {
                _gameManager.Settings.InputBindings.Bindings.Add(new InputBinding
                {
                    ActionId = kvp.Value.ActionId,
                    DisplayName = kvp.Value.DisplayName,
                    PrimaryKey = kvp.Value.PrimaryKey,
                    SecondaryKey = kvp.Value.SecondaryKey,
                    CanBeRemapped = kvp.Value.CanBeRemapped,
                    Category = kvp.Value.Category
                });
            }
            _gameManager.SaveSystem.SaveSettings();
        }

        public void Update()
        {
            if (IsListeningForRebind)
            {
                ListenForRebind();
                return;
            }

            foreach (var kvp in _bindings)
            {
                var binding = kvp.Value;
                if (binding.PrimaryKey != KeyCode.None && Input.GetKeyDown(binding.PrimaryKey))
                {
                    TriggerAction(kvp.Key);
                }
                else if (binding.SecondaryKey != KeyCode.None && Input.GetKeyDown(binding.SecondaryKey))
                {
                    TriggerAction(kvp.Key);
                }
            }
        }

        private void TriggerAction(GameAction action)
        {
            try
            {
                switch (action)
                {
                    case GameAction.Pause:
                        if (_gameManager.StateMachine.CurrentState is Core.PausedState)
                            _gameManager.ResumeGame();
                        else
                            _gameManager.PauseGame();
                        break;
                    case GameAction.OpenSettings:
                        _gameManager.OpenSettings();
                        break;
                    case GameAction.SaveGame:
                        _gameManager.SaveSystem.SaveAll();
                        break;
                    case GameAction.LoadGame:
                        _gameManager.SaveSystem.LoadAll();
                        break;
                    case GameAction.AdvancePhase:
                        _gameManager.AdvanceDayPhase();
                        break;
                    case GameAction.OpenTraining:
                        _gameManager.StartTraining();
                        break;
                    case GameAction.OpenRecovery:
                        _gameManager.StartRecovery();
                        break;
                    case GameAction.OpenMatch:
                        _gameManager.StartMatch();
                        break;
                }
                OnActionTriggered?.Invoke(action);
            }
            catch (Exception ex)
            {
                Debug.LogError($"Error handling input action {action}: {ex.Message}");
            }
        }

        public void StartRebind(GameAction action)
        {
            if (!_bindings.TryGetValue(action, out var binding) || !binding.CanBeRemapped) return;
            RebindTargetAction = action;
            IsListeningForRebind = true;
        }

        public void CancelRebind()
        {
            IsListeningForRebind = false;
            RebindTargetAction = GameAction.Pause;
        }

        private void ListenForRebind()
        {
            foreach (KeyCode key in Enum.GetValues(typeof(KeyCode)))
            {
                if (key == KeyCode.None) continue;
                if (Input.GetKeyDown(key))
                {
                    ApplyRebind(key);
                    return;
                }
            }
            if (Input.GetMouseButtonDown(0))
            {
                ApplyRebind(KeyCode.Mouse0);
            }
        }

        private void ApplyRebind(KeyCode newKey)
        {
            if (!_bindings.TryGetValue(RebindTargetAction, out var binding))
            {
                CancelRebind();
                _rebindCallback?.Invoke(KeyCode.None);
                _rebindCallback = null;
                return;
            }

            if (_rebindSlot == "secondary")
                binding.SecondaryKey = newKey;
            else
                binding.PrimaryKey = newKey;

            OnBindingChanged?.Invoke(binding.ActionId, newKey);
            SaveBindingsToSettings();
            IsListeningForRebind = false;
            _gameManager.FeedbackSystem.ShowFeedback($"Rebound {binding.DisplayName} to {newKey}", FeedbackType.Info);
            _rebindCallback?.Invoke(newKey);
            _rebindCallback = null;
        }

        public InputBinding GetBinding(GameAction action)
        {
            return _bindings.TryGetValue(action, out var b) ? b : null;
        }

        public IEnumerable<InputBinding> GetBindingsByCategory(string category)
        {
            foreach (var kvp in _bindings)
            {
                if (kvp.Value.Category == category)
                    yield return kvp.Value;
            }
        }

        public IEnumerable<string> GetAllCategories()
        {
            var categories = new HashSet<string>();
            foreach (var kvp in _bindings)
                categories.Add(kvp.Value.Category);
            return categories;
        }

        public void ResetToDefaults()
        {
            _bindings.Clear();
            _actionMap.Clear();
            InitializeDefaultBindings();
            SaveBindingsToSettings();
            _gameManager.FeedbackSystem.ShowFeedback("Input bindings reset to defaults", FeedbackType.Success);
        }

        public static Dictionary<GameAction, KeyBinding> GetDefaultBindings()
        {
            var defaults = new Dictionary<GameAction, KeyBinding>();
            var map = new (GameAction action, KeyCode primary, KeyCode secondary)[]
            {
                (GameAction.Pause, KeyCode.Escape, KeyCode.P),
                (GameAction.OpenSettings, KeyCode.F1, KeyCode.None),
                (GameAction.SaveGame, KeyCode.F5, KeyCode.None),
                (GameAction.LoadGame, KeyCode.F9, KeyCode.None),
                (GameAction.QuickSave, KeyCode.LeftControl | KeyCode.S, KeyCode.None),
                (GameAction.AdvancePhase, KeyCode.Space, KeyCode.Return),
                (GameAction.SelectAll, KeyCode.LeftControl | KeyCode.A, KeyCode.None),
                (GameAction.DeselectAll, KeyCode.LeftControl | KeyCode.D, KeyCode.None),
                (GameAction.OpenTraining, KeyCode.T, KeyCode.None),
                (GameAction.OpenRecovery, KeyCode.R, KeyCode.None),
                (GameAction.OpenMatch, KeyCode.M, KeyCode.None),
                (GameAction.OpenSquad, KeyCode.S, KeyCode.None),
                (GameAction.OpenFixtures, KeyCode.F, KeyCode.None),
                (GameAction.OpenFinance, KeyCode.G, KeyCode.None),
                (GameAction.NavigateUp, KeyCode.UpArrow, KeyCode.W),
                (GameAction.NavigateDown, KeyCode.DownArrow, KeyCode.S),
                (GameAction.NavigateLeft, KeyCode.LeftArrow, KeyCode.A),
                (GameAction.NavigateRight, KeyCode.RightArrow, KeyCode.D),
                (GameAction.Confirm, KeyCode.Return, KeyCode.Space),
                (GameAction.Cancel, KeyCode.Backspace, KeyCode.Escape),
            };
            foreach (var m in map)
                defaults[m.action] = new KeyBinding { PrimaryKey = m.primary, SecondaryKey = m.secondary };
            return defaults;
        }

        private Action<KeyCode> _rebindCallback;
        private string _rebindSlot;

        public void StartRebind(GameAction action, string slot, Action<KeyCode> callback)
        {
            if (!_bindings.TryGetValue(action, out var binding) || !binding.CanBeRemapped) return;
            RebindTargetAction = action;
            _rebindSlot = slot ?? "primary";
            _rebindCallback = callback;
            IsListeningForRebind = true;
        }

        public void SetBindings(Dictionary<GameAction, KeyBinding> bindings)
        {
            if (bindings == null) return;
            foreach (var kvp in bindings)
            {
                if (_bindings.TryGetValue(kvp.Key, out var b) && b.CanBeRemapped)
                {
                    b.PrimaryKey = kvp.Value.PrimaryKey;
                    b.SecondaryKey = kvp.Value.SecondaryKey;
                }
            }
            SaveBindingsToSettings();
        }
    }
}
