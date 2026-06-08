using System;
using UnityEngine;
using UnityEngine.EventSystems;

namespace DecorMatch3.InputSystem
{
    public enum InputActionType
    {
        Tap,
        DragStart,
        Drag,
        DragEnd,
        SwipeLeft,
        SwipeRight,
        SwipeUp,
        SwipeDown,
        Back,
        Pause
    }

    public struct InputEvent
    {
        public InputActionType ActionType;
        public Vector2 ScreenPosition;
        public Vector2 WorldPosition;
        public Vector2 Delta;
        public float Magnitude;
    }

    public class InputManager : DecorMatch3.Core.Singleton<InputManager>
    {
        [Header("Swipe Settings")]
        [SerializeField] private float swipeThreshold = 50f;
        [SerializeField] private float tapThreshold = 10f;
        [SerializeField] private float maxTapDuration = 0.2f;

        public event Action<InputEvent> OnInput;

        private Camera _mainCamera;
        private Vector2 _startPosition;
        private Vector2 _lastPosition;
        private float _startTime;
        private bool _isDragging;
        private bool _isPointerOverUI;

        protected override void Awake()
        {
            base.Awake();
            _mainCamera = Camera.main;
        }

        private void Update()
        {
#if UNITY_EDITOR || UNITY_STANDALONE
            HandleMouseInput();
#elif UNITY_ANDROID || UNITY_IOS
            HandleTouchInput();
#endif
            HandleKeyboardInput();
        }

        private void HandleMouseInput()
        {
            if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject())
            {
                _isPointerOverUI = true;
                return;
            }

            _isPointerOverUI = false;

            if (Input.GetMouseButtonDown(0))
            {
                _startPosition = Input.mousePosition;
                _lastPosition = Input.mousePosition;
                _startTime = Time.time;
                _isDragging = false;

                PublishInput(InputActionType.DragStart, _startPosition, Vector2.zero);
            }
            else if (Input.GetMouseButton(0))
            {
                Vector2 currentPos = Input.mousePosition;
                Vector2 delta = currentPos - _lastPosition;

                if (delta.magnitude > tapThreshold && !_isDragging)
                {
                    _isDragging = true;
                }

                if (_isDragging && delta.magnitude > 0)
                {
                    PublishInput(InputActionType.Drag, currentPos, delta);
                }

                _lastPosition = currentPos;
            }
            else if (Input.GetMouseButtonUp(0))
            {
                Vector2 endPosition = Input.mousePosition;
                Vector2 totalDelta = endPosition - _startPosition;
                float duration = Time.time - _startTime;

                if (_isDragging)
                {
                    DetectSwipe(totalDelta);
                }
                else if (duration <= maxTapDuration && totalDelta.magnitude <= tapThreshold)
                {
                    PublishInput(InputActionType.Tap, endPosition, Vector2.zero);
                }

                PublishInput(InputActionType.DragEnd, endPosition, totalDelta);
                _isDragging = false;
            }
        }

        private void HandleTouchInput()
        {
            if (Input.touchCount == 0) return;

            Touch touch = Input.GetTouch(0);

            if (EventSystem.current != null && EventSystem.current.IsPointerOverGameObject(touch.fingerId))
            {
                _isPointerOverUI = true;
                return;
            }

            _isPointerOverUI = false;

            switch (touch.phase)
            {
                case TouchPhase.Began:
                    _startPosition = touch.position;
                    _lastPosition = touch.position;
                    _startTime = Time.time;
                    _isDragging = false;
                    PublishInput(InputActionType.DragStart, touch.position, Vector2.zero);
                    break;

                case TouchPhase.Moved:
                    Vector2 delta = touch.deltaPosition;
                    if (delta.magnitude > tapThreshold && !_isDragging)
                    {
                        _isDragging = true;
                    }
                    if (_isDragging && delta.magnitude > 0)
                    {
                        PublishInput(InputActionType.Drag, touch.position, delta);
                    }
                    _lastPosition = touch.position;
                    break;

                case TouchPhase.Ended:
                case TouchPhase.Canceled:
                    Vector2 endPos = touch.position;
                    Vector2 totalDelta = endPos - _startPosition;
                    float duration = Time.time - _startTime;

                    if (_isDragging)
                    {
                        DetectSwipe(totalDelta);
                    }
                    else if (duration <= maxTapDuration && totalDelta.magnitude <= tapThreshold)
                    {
                        PublishInput(InputActionType.Tap, endPos, Vector2.zero);
                    }

                    PublishInput(InputActionType.DragEnd, endPos, totalDelta);
                    _isDragging = false;
                    break;
            }
        }

        private void HandleKeyboardInput()
        {
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                PublishInput(InputActionType.Back, Vector2.zero, Vector2.zero);
            }

            if (Input.GetKeyDown(KeyCode.P) || Input.GetKeyDown(KeyCode.Space))
            {
                PublishInput(InputActionType.Pause, Vector2.zero, Vector2.zero);
            }
        }

        private void DetectSwipe(Vector2 delta)
        {
            if (delta.magnitude < swipeThreshold) return;

            if (Mathf.Abs(delta.x) > Mathf.Abs(delta.y))
            {
                PublishInput(delta.x > 0 ? InputActionType.SwipeRight : InputActionType.SwipeLeft,
                    _lastPosition, delta);
            }
            else
            {
                PublishInput(delta.y > 0 ? InputActionType.SwipeUp : InputActionType.SwipeDown,
                    _lastPosition, delta);
            }
        }

        private void PublishInput(InputActionType type, Vector2 screenPos, Vector2 delta)
        {
            Vector3 worldPos3D = _mainCamera != null
                ? _mainCamera.ScreenToWorldPoint(new Vector3(screenPos.x, screenPos.y, _mainCamera.nearClipPlane))
                : Vector3.zero;

            InputEvent inputEvent = new InputEvent
            {
                ActionType = type,
                ScreenPosition = screenPos,
                WorldPosition = new Vector2(worldPos3D.x, worldPos3D.y),
                Delta = delta,
                Magnitude = delta.magnitude
            };

            OnInput?.Invoke(inputEvent);
            DecorMatch3.Core.EventBus.Publish(inputEvent);
        }

        public bool IsPointerOverUI => _isPointerOverUI;
        public bool IsDragging => _isDragging;
    }
}
