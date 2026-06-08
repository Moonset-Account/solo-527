using System;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class InputManager
    {
        private static InputManager _instance;
        public static InputManager Instance
        {
            get
            {
                if (_instance == null) _instance = new InputManager();
                return _instance;
            }
        }

        private Dictionary<string, InputAction> _actions;
        private Dictionary<string, KeyCode> _primaryKeys;
        private Dictionary<string, KeyCode> _secondaryKeys;
        private bool _isInitialized;

        public event Action<string> OnActionPressed;
        public event Action<string> OnActionReleased;
        public event Action<string, float> OnAxisChanged;
        public event Action<Vector2> OnMousePositionChanged;
        public event Action<string, KeyCode> OnKeyRebound;

        private Vector2 _lastMousePosition;
        private bool _mousePositionChanged;

        private InputManager()
        {
            _actions = new Dictionary<string, InputAction>();
            _primaryKeys = new Dictionary<string, KeyCode>();
            _secondaryKeys = new Dictionary<string, KeyCode>();
            _lastMousePosition = Vector2.zero;
        }

        public void Initialize()
        {
            LoadMappingsFromSave();
            RegisterDefaultActions();
            _isInitialized = true;
        }

        private void LoadMappingsFromSave()
        {
            var save = SaveSystem.Instance;
            if (!save.IsPlayerDataLoaded) return;

            foreach (var kvp in save.PlayerData.inputMappings)
            {
                if (Enum.TryParse<KeyCode>(kvp.Value.primaryKey, out var primary))
                    _primaryKeys[kvp.Key] = primary;
                if (Enum.TryParse<KeyCode>(kvp.Value.secondaryKey, out var secondary) && secondary != KeyCode.None)
                    _secondaryKeys[kvp.Key] = secondary;
            }
        }

        private void RegisterDefaultActions()
        {
            RegisterAction("start_wave");
            RegisterAction("speed_up");
            RegisterAction("pause");
            RegisterAction("select_tower_1");
            RegisterAction("select_tower_2");
            RegisterAction("select_tower_3");
            RegisterAction("select_tower_4");
            RegisterAction("select_tower_5");
            RegisterAction("upgrade_tower");
            RegisterAction("sell_tower");
            RegisterAction("cancel");
            RegisterAction("mouse_left");
            RegisterAction("mouse_right");
            RegisterAction("confirm");
        }

        public void RegisterAction(string actionName)
        {
            if (!_actions.ContainsKey(actionName))
            {
                _actions[actionName] = new InputAction { name = actionName };
            }
        }

        public void Update()
        {
            if (!_isInitialized) return;

            Vector2 currentMousePos = new Vector2(Input.mousePosition.x, Input.mousePosition.y);
            if (currentMousePos != _lastMousePosition)
            {
                _lastMousePosition = currentMousePos;
                OnMousePositionChanged?.Invoke(currentMousePos);
            }

            UpdateMouseButton("mouse_left", 0);
            UpdateMouseButton("mouse_right", 1);

            foreach (var kvp in _actions)
            {
                if (kvp.Key == "mouse_left" || kvp.Key == "mouse_right") continue;
                UpdateKeyAction(kvp.Key);
            }
        }

        private void UpdateKeyAction(string actionName)
        {
            bool isPressed = false;
            bool wasPressed = _actions[actionName].isHeld;

            if (_primaryKeys.TryGetValue(actionName, out var primary))
            {
                isPressed |= Input.GetKey(primary);
            }
            if (_secondaryKeys.TryGetValue(actionName, out var secondary))
            {
                isPressed |= Input.GetKey(secondary);
            }

            if (isPressed && !wasPressed)
            {
                _actions[actionName].isHeld = true;
                _actions[actionName].pressedFrame = Time.frameCount;
                OnActionPressed?.Invoke(actionName);
            }
            else if (!isPressed && wasPressed)
            {
                _actions[actionName].isHeld = false;
                _actions[actionName].releasedFrame = Time.frameCount;
                OnActionReleased?.Invoke(actionName);
            }
        }

        private void UpdateMouseButton(string actionName, int buttonIndex)
        {
            bool isPressed = Input.GetMouseButton(buttonIndex);
            bool wasPressed = _actions.ContainsKey(actionName) && _actions[actionName].isHeld;

            if (!_actions.ContainsKey(actionName))
                _actions[actionName] = new InputAction { name = actionName };

            if (isPressed && !wasPressed)
            {
                _actions[actionName].isHeld = true;
                _actions[actionName].pressedFrame = Time.frameCount;
                OnActionPressed?.Invoke(actionName);
            }
            else if (!isPressed && wasPressed)
            {
                _actions[actionName].isHeld = false;
                _actions[actionName].releasedFrame = Time.frameCount;
                OnActionReleased?.Invoke(actionName);
            }
        }

        public bool IsActionPressed(string actionName)
        {
            if (!_actions.TryGetValue(actionName, out var action)) return false;
            return action.pressedFrame == Time.frameCount;
        }

        public bool IsActionHeld(string actionName)
        {
            if (!_actions.TryGetValue(actionName, out var action)) return false;
            return action.isHeld;
        }

        public bool IsActionReleased(string actionName)
        {
            if (!_actions.TryGetValue(actionName, out var action)) return false;
            return action.releasedFrame == Time.frameCount;
        }

        public float GetHoldDuration(string actionName)
        {
            if (!_actions.TryGetValue(actionName, out var action)) return 0f;
            if (!action.isHeld) return 0f;
            return (Time.frameCount - action.pressedFrame) * Time.unscaledDeltaTime;
        }

        public void RebindKey(string actionName, KeyCode newKey, bool isPrimary = true)
        {
            if (isPrimary)
                _primaryKeys[actionName] = newKey;
            else
                _secondaryKeys[actionName] = newKey;

            KeyCode secondary = _secondaryKeys.ContainsKey(actionName) ? _secondaryKeys[actionName] : KeyCode.None;
            SaveSystem.Instance.UpdateInputMapping(actionName, newKey, secondary);
            OnKeyRebound?.Invoke(actionName, newKey);
        }

        public KeyCode GetPrimaryKey(string actionName)
        {
            return _primaryKeys.ContainsKey(actionName) ? _primaryKeys[actionName] : KeyCode.None;
        }

        public KeyCode GetSecondaryKey(string actionName)
        {
            return _secondaryKeys.ContainsKey(actionName) ? _secondaryKeys[actionName] : KeyCode.None;
        }

        public string GetKeyDisplayString(string actionName)
        {
            var primary = GetPrimaryKey(actionName);
            var secondary = GetSecondaryKey(actionName);
            string result = KeyCodeToString(primary);
            if (secondary != KeyCode.None)
                result += $" / {KeyCodeToString(secondary)}";
            return result;
        }

        public string KeyCodeToString(KeyCode code)
        {
            switch (code)
            {
                case KeyCode.Alpha1: return "1";
                case KeyCode.Alpha2: return "2";
                case KeyCode.Alpha3: return "3";
                case KeyCode.Alpha4: return "4";
                case KeyCode.Alpha5: return "5";
                case KeyCode.Keypad1: return "Num1";
                case KeyCode.Keypad2: return "Num2";
                case KeyCode.Keypad3: return "Num3";
                case KeyCode.Keypad4: return "Num4";
                case KeyCode.Keypad5: return "Num5";
                case KeyCode.LeftShift: return "LShift";
                case KeyCode.RightShift: return "RShift";
                case KeyCode.LeftControl: return "LCtrl";
                case KeyCode.RightControl: return "RCtrl";
                case KeyCode.Return: return "Enter";
                case KeyCode.Escape: return "Esc";
                case KeyCode.None: return "";
                default: return code.ToString();
            }
        }

        public Vector2 GetMousePosition()
        {
            return _lastMousePosition;
        }

        public Vector2 GetMouseWorldPosition(Camera camera = null)
        {
            Camera cam = camera ?? Camera.main;
            if (cam == null) return Vector2.zero;
            return cam.ScreenToWorldPoint(new Vector3(_lastMousePosition.x, _lastMousePosition.y, -cam.transform.position.z));
        }

        public bool IsMouseOverUI()
        {
            return UnityEngine.EventSystems.EventSystem.current != null &&
                   UnityEngine.EventSystems.EventSystem.current.IsPointerOverGameObject();
        }
    }

    public class InputAction
    {
        public string name;
        public bool isHeld;
        public int pressedFrame;
        public int releasedFrame;
    }
}
