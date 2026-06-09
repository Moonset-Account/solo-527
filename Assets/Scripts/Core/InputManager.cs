using System;
using UnityEngine;
using UnityEngine.InputSystem;
using DecorMatch3.Utils;

namespace DecorMatch3.Core
{
    public class InputManager : Singleton<InputManager>
    {
        [SerializeField] private PlayerInput _playerInput;

        public Vector2 PointerPosition { get; private set; }
        public bool IsPointerDown { get; private set; }
        public bool IsPointerHeld { get; private set; }
        public Vector2 PointerDelta { get; private set; }

        public event Action<Vector2> OnPointerDown;
        public event Action<Vector2> OnPointerUp;
        public event Action<Vector2> OnPointerMoved;
        public event Action OnBackPressed;
        public event Action OnPausePressed;

        private InputAction _pointerPositionAction;
        private InputAction _pointerDownAction;
        private InputAction _pointerUpAction;
        private InputAction _backAction;
        private InputAction _pauseAction;

        private Vector2 _lastPointerPosition;

        protected override void Awake()
        {
            base.Awake();
            InitializeInput();
        }

        private void InitializeInput()
        {
            if (_playerInput == null)
            {
                GameObject inputGO = new GameObject("PlayerInput");
                inputGO.transform.SetParent(transform);
                _playerInput = inputGO.AddComponent<PlayerInput>();

                InputActionAsset asset = ScriptableObject.CreateInstance<InputActionAsset>();
                InputActionMap map = asset.AddActionMap("Gameplay");

                _pointerPositionAction = map.AddAction("PointerPosition", InputActionType.Value, "<Pointer>/position");
                _pointerDownAction = map.AddAction("PointerDown", InputActionType.Button, "<Pointer>/press");
                _pointerUpAction = map.AddAction("PointerUp", InputActionType.Button, "<Pointer>/press");
                _backAction = map.AddAction("Back", InputActionType.Button, "<Keyboard>/escape", interactions: "press");
                _pauseAction = map.AddAction("Pause", InputActionType.Button, "<Keyboard>/p", interactions: "press");

                _playerInput.actions = asset;
                _playerInput.defaultActionMap = "Gameplay";
                _playerInput.neverAutoSwitchControlSchemes = true;
            }

            _pointerPositionAction = _playerInput.actions["PointerPosition"];
            _pointerDownAction = _playerInput.actions["PointerDown"];
            _pointerUpAction = _playerInput.actions["PointerUp"];
            _backAction = _playerInput.actions["Back"];
            _pauseAction = _playerInput.actions["Pause"];
        }

        private void OnEnable()
        {
            if (_pointerDownAction != null)
            {
                _pointerDownAction.performed += HandlePointerDown;
                _pointerDownAction.canceled += HandlePointerUp;
                _pointerUpAction.canceled += HandlePointerUp;
                _backAction.performed += HandleBack;
                _pauseAction.performed += HandlePause;
            }
        }

        private void OnDisable()
        {
            if (_pointerDownAction != null)
            {
                _pointerDownAction.performed -= HandlePointerDown;
                _pointerDownAction.canceled -= HandlePointerUp;
                _pointerUpAction.canceled -= HandlePointerUp;
                _backAction.performed -= HandleBack;
                _pauseAction.performed -= HandlePause;
            }
        }

        private void Update()
        {
            if (_pointerPositionAction != null)
            {
                Vector2 currentPos = _pointerPositionAction.ReadValue<Vector2>();
                PointerDelta = currentPos - _lastPointerPosition;
                _lastPointerPosition = currentPos;
                PointerPosition = currentPos;

                if (IsPointerHeld && PointerDelta.sqrMagnitude > 0.1f)
                {
                    OnPointerMoved?.Invoke(PointerPosition);
                }
            }
        }

        private void HandlePointerDown(InputAction.CallbackContext context)
        {
            IsPointerDown = true;
            IsPointerHeld = true;
            _lastPointerPosition = PointerPosition;
            OnPointerDown?.Invoke(PointerPosition);
        }

        private void HandlePointerUp(InputAction.CallbackContext context)
        {
            IsPointerDown = false;
            IsPointerHeld = false;
            OnPointerUp?.Invoke(PointerPosition);
        }

        private void HandleBack(InputAction.CallbackContext context)
        {
            Debug.Log("[InputManager] Back pressed");
            OnBackPressed?.Invoke();
        }

        private void HandlePause(InputAction.CallbackContext context)
        {
            Debug.Log("[InputManager] Pause pressed");
            OnPausePressed?.Invoke();
        }

        public void SetInputEnabled(bool enabled)
        {
            if (enabled)
            {
                _playerInput?.ActivateInput();
            }
            else
            {
                _playerInput?.DeactivateInput();
            }
        }

        public Vector2 ScreenToWorldPoint(Vector2 screenPos, Camera camera = null)
        {
            Camera cam = camera ?? Camera.main;
            if (cam == null) return Vector2.zero;
            return cam.ScreenToWorldPoint(screenPos);
        }
    }
}
