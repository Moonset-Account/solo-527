using System;
using System.Collections.Generic;
using BeatRunner.Core;
using UnityEngine;
using UnityEngine.EventSystems;

namespace BeatRunner.Input
{
    public class InputManager : MonoBehaviour
    {
        public static InputManager Instance { get; private set; }

        [SerializeField] private InputType _currentInputType = InputType.Keyboard;

        public InputType CurrentInputType
        {
            get => _currentInputType;
            private set
            {
                _currentInputType = value;
                OnInputTypeChanged?.Invoke(value);
            }
        }

        public event Action<InputType> OnInputTypeChanged;
        public event Action OnBindingsChanged;
        public event Action OnLeft;
        public event Action OnRight;
        public event Action OnJump;
        public event Action OnSlide;
        public event Action OnPause;
        public event Action OnConfirm;
        public event Action OnCancel;

        [Serializable]
        public class InputBindings
        {
            public KeyCode leftKey = KeyCode.A;
            public KeyCode rightKey = KeyCode.D;
            public KeyCode leftAlt = KeyCode.LeftArrow;
            public KeyCode rightAlt = KeyCode.RightArrow;
            public KeyCode jumpKey = KeyCode.Space;
            public KeyCode jumpAlt = KeyCode.W;
            public KeyCode jumpAlt2 = KeyCode.UpArrow;
            public KeyCode slideKey = KeyCode.S;
            public KeyCode slideAlt = KeyCode.DownArrow;
            public KeyCode pauseKey = KeyCode.Escape;
            public KeyCode pauseAlt = KeyCode.P;
            public KeyCode confirmKey = KeyCode.Return;
            public KeyCode cancelKey = KeyCode.Backspace;
        }

        [SerializeField] private InputBindings _bindings = new InputBindings();
        public InputBindings Bindings => _bindings;

        [Serializable]
        public class GamepadBindings
        {
            public string horizontalAxis = "Horizontal";
            public string jumpButton = "Jump";
            public string slideButton = "Fire1";
            public string pauseButton = "Submit";
        }

        [SerializeField] private GamepadBindings _gamepadBindings = new GamepadBindings();
        public GamepadBindings Gamepad => _gamepadBindings;

        [Serializable]
        public class TouchZones
        {
            public RectTransform leftZone;
            public RectTransform rightZone;
            public RectTransform upperZone;
            public RectTransform lowerZone;
            public RectTransform pauseZone;
        }

        [SerializeField] private TouchZones _touchZones;
        public TouchZones Zones => _touchZones;

        private bool _leftPressed;
        private bool _rightPressed;
        private bool _jumpPressed;
        private bool _slidePressed;

        private readonly HashSet<int> _activeTouches = new HashSet<int>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            DetectInputType();
        }

        private void Update()
        {
            DetectInputType();
            HandleKeyboardInput();
            HandleGamepadInput();
            HandleTouchInput();
        }

        private void DetectInputType()
        {
            if (UnityEngine.Input.touchCount > 0 || UnityEngine.Input.GetMouseButtonDown(0))
            {
                if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject())
                {
                    if (UnityEngine.Input.touchCount > 0 && CurrentInputType != InputType.Touch)
                    {
                        CurrentInputType = InputType.Touch;
                    }
                }
            }

            if (WasAnyKeyPressed())
            {
                if (CurrentInputType != InputType.Keyboard) CurrentInputType = InputType.Keyboard;
            }

            try
            {
                if (!string.IsNullOrEmpty(_gamepadBindings.jumpButton) &&
                    UnityEngine.Input.GetButtonDown(_gamepadBindings.jumpButton))
                {
                    if (CurrentInputType != InputType.Gamepad) CurrentInputType = InputType.Gamepad;
                }
            }
            catch
            {
            }
        }

        private bool WasAnyKeyPressed()
        {
            return UnityEngine.Input.GetKeyDown(_bindings.leftKey) ||
                   UnityEngine.Input.GetKeyDown(_bindings.rightKey) ||
                   UnityEngine.Input.GetKeyDown(_bindings.leftAlt) ||
                   UnityEngine.Input.GetKeyDown(_bindings.rightAlt) ||
                   UnityEngine.Input.GetKeyDown(_bindings.jumpKey) ||
                   UnityEngine.Input.GetKeyDown(_bindings.jumpAlt) ||
                   UnityEngine.Input.GetKeyDown(_bindings.jumpAlt2) ||
                   UnityEngine.Input.GetKeyDown(_bindings.slideKey) ||
                   UnityEngine.Input.GetKeyDown(_bindings.slideAlt);
        }

        private void HandleKeyboardInput()
        {
            CheckKeyDown(_bindings.leftKey, ref _leftPressed, OnLeft);
            CheckKeyDown(_bindings.rightKey, ref _rightPressed, OnRight);
            CheckKeyDown(_bindings.leftAlt, ref _leftPressed, OnLeft);
            CheckKeyDown(_bindings.rightAlt, ref _rightPressed, OnRight);

            CheckKeyDown(_bindings.jumpKey, ref _jumpPressed, OnJump);
            CheckKeyDown(_bindings.jumpAlt, ref _jumpPressed, OnJump);
            CheckKeyDown(_bindings.jumpAlt2, ref _jumpPressed, OnJump);

            CheckKeyDown(_bindings.slideKey, ref _slidePressed, OnSlide);
            CheckKeyDown(_bindings.slideAlt, ref _slidePressed, OnSlide);

            if (UnityEngine.Input.GetKeyDown(_bindings.pauseKey) ||
                UnityEngine.Input.GetKeyDown(_bindings.pauseAlt))
            {
                OnPause?.Invoke();
            }

            if (UnityEngine.Input.GetKeyDown(_bindings.confirmKey)) OnConfirm?.Invoke();
            if (UnityEngine.Input.GetKeyDown(_bindings.cancelKey)) OnCancel?.Invoke();

            CheckKeyUp(_bindings.leftKey, ref _leftPressed);
            CheckKeyUp(_bindings.rightKey, ref _rightPressed);
            CheckKeyUp(_bindings.leftAlt, ref _leftPressed);
            CheckKeyUp(_bindings.rightAlt, ref _rightPressed);
            CheckKeyUp(_bindings.jumpKey, ref _jumpPressed);
            CheckKeyUp(_bindings.jumpAlt, ref _jumpPressed);
            CheckKeyUp(_bindings.jumpAlt2, ref _jumpPressed);
            CheckKeyUp(_bindings.slideKey, ref _slidePressed);
            CheckKeyUp(_bindings.slideAlt, ref _slidePressed);
        }

        private void CheckKeyDown(KeyCode key, ref bool pressedFlag, Action evt)
        {
            if (!pressedFlag && UnityEngine.Input.GetKeyDown(key))
            {
                pressedFlag = true;
                evt?.Invoke();
            }
        }

        private void CheckKeyUp(KeyCode key, ref bool pressedFlag)
        {
            if (pressedFlag && UnityEngine.Input.GetKeyUp(key))
            {
                pressedFlag = false;
            }
        }

        private void HandleGamepadInput()
        {
            try
            {
                float axis = UnityEngine.Input.GetAxisRaw(_gamepadBindings.horizontalAxis);
                if (axis < -0.5f && !_leftPressed)
                {
                    _leftPressed = true;
                    OnLeft?.Invoke();
                }
                else if (axis > -0.1f && _leftPressed && axis < 0.1f)
                {
                    _leftPressed = false;
                }

                if (axis > 0.5f && !_rightPressed)
                {
                    _rightPressed = true;
                    OnRight?.Invoke();
                }
                else if (axis < 0.1f && _rightPressed && axis > -0.1f)
                {
                    _rightPressed = false;
                }

                if (UnityEngine.Input.GetButtonDown(_gamepadBindings.jumpButton))
                {
                    OnJump?.Invoke();
                }
                if (UnityEngine.Input.GetButtonDown(_gamepadBindings.slideButton))
                {
                    OnSlide?.Invoke();
                }
                if (UnityEngine.Input.GetButtonDown(_gamepadBindings.pauseButton))
                {
                    OnPause?.Invoke();
                }
            }
            catch
            {
            }
        }

        private void HandleTouchInput()
        {
            for (int i = 0; i < UnityEngine.Input.touchCount; i++)
            {
                var touch = UnityEngine.Input.GetTouch(i);
                if (touch.phase == TouchPhase.Began)
                {
                    ProcessTouchStart(touch);
                }
                else if (touch.phase == TouchPhase.Ended || touch.phase == TouchPhase.Canceled)
                {
                    _activeTouches.Remove(touch.fingerId);
                }
            }
        }

        private void ProcessTouchStart(Touch touch)
        {
            Vector2 pos = touch.position;

            if (_touchZones.pauseZone != null &&
                RectTransformUtility.RectangleContainsScreenPoint(_touchZones.pauseZone, pos))
            {
                OnPause?.Invoke();
                return;
            }

            if (_touchZones.upperZone != null &&
                RectTransformUtility.RectangleContainsScreenPoint(_touchZones.upperZone, pos))
            {
                OnJump?.Invoke();
                return;
            }

            if (_touchZones.lowerZone != null &&
                RectTransformUtility.RectangleContainsScreenPoint(_touchZones.lowerZone, pos))
            {
                OnSlide?.Invoke();
                return;
            }

            if (_touchZones.leftZone != null &&
                RectTransformUtility.RectangleContainsScreenPoint(_touchZones.leftZone, pos))
            {
                OnLeft?.Invoke();
                return;
            }

            if (_touchZones.rightZone != null &&
                RectTransformUtility.RectangleContainsScreenPoint(_touchZones.rightZone, pos))
            {
                OnRight?.Invoke();
                return;
            }

            float screenThird = Screen.width / 3f;
            float screenHeightThird = Screen.height / 2f;

            if (pos.y > screenHeightThird)
            {
                OnJump?.Invoke();
            }
            else
            {
                if (pos.x < screenThird) OnLeft?.Invoke();
                else if (pos.x > screenThird * 2) OnRight?.Invoke();
                else OnSlide?.Invoke();
            }
        }

        public void SetInputBindings(InputBindings newBindings)
        {
            _bindings = newBindings;
            SaveBindingsToSaveData();
            OnBindingsChanged?.Invoke();
        }

        private void SaveBindingsToSaveData()
        {
            var data = SaveSystem.CurrentSave;
            if (data == null) return;

            data.inputRemap["left"] = new InputRemapEntry
                { actionName = "left", primaryKey = _bindings.leftKey.ToString(), secondaryKey = _bindings.leftAlt.ToString() };
            data.inputRemap["right"] = new InputRemapEntry
                { actionName = "right", primaryKey = _bindings.rightKey.ToString(), secondaryKey = _bindings.rightAlt.ToString() };
            data.inputRemap["jump"] = new InputRemapEntry
                { actionName = "jump", primaryKey = _bindings.jumpKey.ToString(), secondaryKey = _bindings.jumpAlt.ToString() };
            data.inputRemap["slide"] = new InputRemapEntry
                { actionName = "slide", primaryKey = _bindings.slideKey.ToString(), secondaryKey = _bindings.slideAlt.ToString() };
            data.inputRemap["pause"] = new InputRemapEntry
                { actionName = "pause", primaryKey = _bindings.pauseKey.ToString(), secondaryKey = _bindings.pauseAlt.ToString() };

            SaveSystem.SaveSaveData();
        }

        public void LoadBindingsFromSaveData()
        {
            var data = SaveSystem.CurrentSave;
            if (data == null || data.inputRemap.Count == 0) return;

            if (data.inputRemap.TryGetValue("left", out var left))
            {
                if (Enum.TryParse<KeyCode>(left.primaryKey, out var pk)) _bindings.leftKey = pk;
                if (Enum.TryParse<KeyCode>(left.secondaryKey, out var sk)) _bindings.leftAlt = sk;
            }
            if (data.inputRemap.TryGetValue("right", out var right))
            {
                if (Enum.TryParse<KeyCode>(right.primaryKey, out var pk)) _bindings.rightKey = pk;
                if (Enum.TryParse<KeyCode>(right.secondaryKey, out var sk)) _bindings.rightAlt = sk;
            }
            if (data.inputRemap.TryGetValue("jump", out var jump))
            {
                if (Enum.TryParse<KeyCode>(jump.primaryKey, out var pk)) _bindings.jumpKey = pk;
                if (Enum.TryParse<KeyCode>(jump.secondaryKey, out var sk)) _bindings.jumpAlt = sk;
            }
            if (data.inputRemap.TryGetValue("slide", out var slide))
            {
                if (Enum.TryParse<KeyCode>(slide.primaryKey, out var pk)) _bindings.slideKey = pk;
                if (Enum.TryParse<KeyCode>(slide.secondaryKey, out var sk)) _bindings.slideAlt = sk;
            }
            if (data.inputRemap.TryGetValue("pause", out var pause))
            {
                if (Enum.TryParse<KeyCode>(pause.primaryKey, out var pk)) _bindings.pauseKey = pk;
                if (Enum.TryParse<KeyCode>(pause.secondaryKey, out var sk)) _bindings.pauseAlt = sk;
            }
        }

        public string[] GetKeyHintsForAction(string action)
        {
            var result = new System.Collections.Generic.List<string>();
            switch (action)
            {
                case "left":
                    result.Add(GetKeyDisplayName(_bindings.leftKey));
                    if (_bindings.leftAlt != KeyCode.None) result.Add(GetKeyDisplayName(_bindings.leftAlt));
                    break;
                case "right":
                    result.Add(GetKeyDisplayName(_bindings.rightKey));
                    if (_bindings.rightAlt != KeyCode.None) result.Add(GetKeyDisplayName(_bindings.rightAlt));
                    break;
                case "jump":
                    result.Add(GetKeyDisplayName(_bindings.jumpKey));
                    if (_bindings.jumpAlt != KeyCode.None) result.Add(GetKeyDisplayName(_bindings.jumpAlt));
                    break;
                case "slide":
                    result.Add(GetKeyDisplayName(_bindings.slideKey));
                    if (_bindings.slideAlt != KeyCode.None) result.Add(GetKeyDisplayName(_bindings.slideAlt));
                    break;
                case "pause":
                    result.Add(GetKeyDisplayName(_bindings.pauseKey));
                    break;
            }
            return result.ToArray();
        }

        private string GetKeyDisplayName(KeyCode key)
        {
            switch (key)
            {
                case KeyCode.Alpha1: return "1";
                case KeyCode.Alpha2: return "2";
                case KeyCode.Return: return "Enter";
                case KeyCode.Escape: return "Esc";
                case KeyCode.LeftArrow: return "←";
                case KeyCode.RightArrow: return "→";
                case KeyCode.UpArrow: return "↑";
                case KeyCode.DownArrow: return "↓";
                case KeyCode.LeftControl: return "Ctrl";
                case KeyCode.RightControl: return "Ctrl";
                case KeyCode.LeftShift: return "Shift";
                case KeyCode.RightShift: return "Shift";
                default: return key.ToString();
            }
        }
    }
}
