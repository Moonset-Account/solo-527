using System;
using UnityEngine;
using UnityEngine.EventSystems;
using SpaceCourier.Core;

namespace SpaceCourier.InputSystem
{
    public class InputManager : MonoBehaviour, IModule
    {
        public ModuleType Type => ModuleType.InputManager;

        [Header("Settings")]
        public bool enableMouseInput = true;
        public bool enableTouchInput = true;
        public bool enableKeyboardInput = true;
        public float longPressThreshold = 0.5f;
        public float dragThreshold = 10f;

        private Camera mainCamera;
        private bool isPointerDown = false;
        private Vector2 pointerStartPosition;
        private float pointerDownTime;
        private bool isDragging = false;
        private bool isLongPress = false;

        public event Action<Vector2, int> OnPointerDown;
        public event Action<Vector2, int> OnPointerUp;
        public event Action<Vector2, int> OnPointerClicked;
        public event Action<Vector2, int> OnLongPress;
        public event Action<Vector2, Vector2, int> OnDragStart;
        public event Action<Vector2, Vector2, int> OnDragging;
        public event Action<Vector2, Vector2, int> OnDragEnd;

        public event Action<float> OnScroll;
        public event Action<string> OnKeyPressed;

        public bool IsDragging => isDragging;
        public bool IsPointerOverUI => EventSystem.current != null && EventSystem.current.IsPointerOverGameObject();

        public void Initialize()
        {
            mainCamera = Camera.main;
            Debug.Log("[InputManager] Initialized.");
        }

        private void Update()
        {
            if (GameManager.Instance != null && GameManager.Instance.CurrentState != GameState.Playing)
            {
                if (GameManager.Instance.CurrentState != GameState.Paused) return;
            }

            HandlePointerInput();
            HandleKeyboardInput();
            HandleScrollInput();
        }

        private void HandlePointerInput()
        {
            if (!enableMouseInput && !enableTouchInput) return;

            if (Input.GetMouseButtonDown(0))
            {
                HandlePointerDown(Input.mousePosition, 0);
            }
            else if (Input.GetMouseButtonUp(0))
            {
                HandlePointerUp(Input.mousePosition, 0);
            }

            if (isPointerDown)
            {
                HandlePointerHeld(Input.mousePosition, 0);
            }
        }

        private void HandlePointerDown(Vector2 position, int pointerId)
        {
            isPointerDown = true;
            isDragging = false;
            isLongPress = false;
            pointerStartPosition = position;
            pointerDownTime = Time.time;

            OnPointerDown?.Invoke(position, pointerId);
        }

        private void HandlePointerUp(Vector2 position, int pointerId)
        {
            if (!isPointerDown) return;

            var dragDistance = Vector2.Distance(position, pointerStartPosition);
            var heldTime = Time.time - pointerDownTime;

            if (isDragging)
            {
                OnDragEnd?.Invoke(pointerStartPosition, position, pointerId);
            }
            else if (heldTime >= longPressThreshold && !IsPointerOverUI)
            {
                OnLongPress?.Invoke(position, pointerId);
            }
            else if (!IsPointerOverUI)
            {
                OnPointerClicked?.Invoke(position, pointerId);
            }

            OnPointerUp?.Invoke(position, pointerId);

            isPointerDown = false;
            isDragging = false;
            isLongPress = false;
        }

        private void HandlePointerHeld(Vector2 position, int pointerId)
        {
            if (isDragging)
            {
                OnDragging?.Invoke(pointerStartPosition, position, pointerId);
                return;
            }

            var dragDistance = Vector2.Distance(position, pointerStartPosition);
            var heldTime = Time.time - pointerDownTime;

            if (dragDistance > dragThreshold && !IsPointerOverUI)
            {
                isDragging = true;
                OnDragStart?.Invoke(pointerStartPosition, position, pointerId);
            }
        }

        private void HandleKeyboardInput()
        {
            if (!enableKeyboardInput) return;

            if (Input.GetKeyDown(KeyCode.Escape))
            {
                OnKeyPressed?.Invoke("Escape");
            }

            if (Input.GetKeyDown(KeyCode.Space))
            {
                OnKeyPressed?.Invoke("Space");
            }

            if (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter))
            {
                OnKeyPressed?.Invoke("Enter");
            }

            if (Input.GetKeyDown(KeyCode.Tab))
            {
                OnKeyPressed?.Invoke("Tab");
            }

            for (int i = 1; i <= 9; i++)
            {
                if (Input.GetKeyDown(KeyCode.Alpha1 + i - 1) ||
                    Input.GetKeyDown(KeyCode.Keypad1 + i - 1))
                {
                    OnKeyPressed?.Invoke($"Num{i}");
                }
            }
        }

        private void HandleScrollInput()
        {
            float scroll = Input.GetAxis("Mouse ScrollWheel");
            if (Mathf.Abs(scroll) > 0.001f)
            {
                OnScroll?.Invoke(scroll);
            }
        }

        public Vector2 ScreenToWorldPoint(Vector2 screenPos)
        {
            if (mainCamera == null) mainCamera = Camera.main;
            if (mainCamera == null) return screenPos;
            return mainCamera.ScreenToWorldPoint(new Vector3(screenPos.x, screenPos.y, -mainCamera.transform.position.z));
        }

        public Vector2 WorldToScreenPoint(Vector2 worldPos)
        {
            if (mainCamera == null) mainCamera = Camera.main;
            if (mainCamera == null) return worldPos;
            return mainCamera.WorldToScreenPoint(worldPos);
        }

        public bool RaycastWorld(Vector2 screenPos, out Vector3 hitPoint, out GameObject hitObject, float maxDistance = 100f)
        {
            hitPoint = Vector3.zero;
            hitObject = null;

            if (mainCamera == null) mainCamera = Camera.main;
            if (mainCamera == null) return false;

            var ray = mainCamera.ScreenPointToRay(screenPos);
            if (Physics.Raycast(ray, out var hit, maxDistance))
            {
                hitPoint = hit.point;
                hitObject = hit.collider.gameObject;
                return true;
            }

            return false;
        }

        public bool Raycast2DWorld(Vector2 screenPos, out Vector2 hitPoint, out GameObject hitObject)
        {
            hitPoint = Vector2.zero;
            hitObject = null;

            if (mainCamera == null) mainCamera = Camera.main;
            if (mainCamera == null) return false;

            var worldPos = ScreenToWorldPoint(screenPos);
            var hit = Physics2D.OverlapPoint(worldPos);
            if (hit != null)
            {
                hitPoint = worldPos;
                hitObject = hit.gameObject;
                return true;
            }

            return false;
        }

        public void Shutdown()
        {
            Debug.Log("[InputManager] Shutdown.");
        }
    }
}
