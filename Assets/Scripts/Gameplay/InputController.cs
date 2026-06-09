using UnityEngine;
using LakeSailing.Core;
using LakeSailing.Gameplay;
using LakeSailing.UI;
using LakeSailing.Audio;

namespace LakeSailing
{
    public class InputController : PersistentSingleton<InputController>
    {
        [Header("船控制")]
        [SerializeField] private bool enableMouseSteering = true;
        [SerializeField] private bool enableKeyboardSteering = true;
        [SerializeField] private float throttleValue = 0.8f;

        [Header("摄像机")]
        [SerializeField] private Camera targetCamera;
        [SerializeField] private float cameraFollowSmooth = 3f;
        [SerializeField] private float cameraZoomSpeed = 5f;
        [SerializeField] private float minZoom = 15f;
        [SerializeField] private float maxZoom = 50f;
        [SerializeField] private bool followBoat = true;

        [Header("路线规划")]
        [SerializeField] private bool isInRoutePlanningMode;
        [SerializeField] private LayerMask clickableLayer;

        private BoatController cachedBoat;
        private Vector2 lastMouseWorldPos;
        private Vector3 cameraVelocity;

        private void Update()
        {
            if (GameManager.Instance == null) return;

            if (GameManager.Instance.CurrentState == GameState.Playing)
            {
                HandleGameplayInput();
                HandleCameraInput();
            }
            else
            {
                HandleMenuInput();
            }

            HandleGlobalInput();
        }

        private void LateUpdate()
        {
            if (GameManager.Instance != null && GameManager.Instance.CurrentState == GameState.Playing)
            {
                UpdateCameraFollow();
            }
        }

        private void HandleGameplayInput()
        {
            cachedBoat = LevelSceneManager.Instance?.Boat;
            if (cachedBoat == null) return;

            if (Input.GetKey(KeyCode.Escape))
            {
                GameManager.Instance.TogglePause();
                if (GameManager.Instance.CurrentState == GameState.Paused)
                {
                    UIManager.Instance.OpenPanel(UIType.PauseMenu);
                }
                return;
            }

            if (isInRoutePlanningMode)
            {
                HandleRoutePlanningInput();
                return;
            }

            if (enableKeyboardSteering)
            {
                HandleKeyboardSteering();
            }

            if (enableMouseSteering)
            {
                HandleMouseSteering();
            }

            if (Input.GetKeyDown(KeyCode.Space))
            {
                TryShootPhoto();
            }

            if (Input.GetKeyDown(KeyCode.R))
            {
                ToggleRoutePlanningMode();
            }

            if (Input.GetKeyDown(KeyCode.E))
            {
                TryInteractWithSupplyStop();
            }

            if (Input.GetKeyDown(KeyCode.Q))
            {
                cachedBoat.Anchor();
            }

            if (Input.GetKeyDown(KeyCode.W) && Input.GetKey(KeyCode.LeftControl))
            {
                cachedBoat.SetSail();
            }
        }

        private void HandleKeyboardSteering()
        {
            if (cachedBoat == null) return;

            float horizontal = Input.GetAxis("Horizontal");
            float vertical = Input.GetAxis("Vertical");

            if (Mathf.Abs(horizontal) > 0.01f || Mathf.Abs(vertical) > 0.01f)
            {
                Vector2 direction = new Vector2(horizontal, vertical).normalized;
                float angle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg;
                float throttle = Mathf.Max(Mathf.Abs(horizontal), Mathf.Abs(vertical)) * throttleValue;
                cachedBoat.SetHeading(angle, throttle);
            }
        }

        private void HandleMouseSteering()
        {
            if (cachedBoat == null || targetCamera == null) return;

            if (Input.GetMouseButton(1))
            {
                Vector3 mousePos = Input.mousePosition;
                Vector3 worldPos = targetCamera.ScreenToWorldPoint(new Vector3(mousePos.x, mousePos.y, -targetCamera.transform.position.z));
                Vector2 direction = ((Vector2)worldPos - cachedBoat.GetPosition2D()).normalized;
                float distance = Vector2.Distance(cachedBoat.GetPosition2D(), (Vector2)worldPos);
                float throttle = Mathf.Clamp01(distance / 15f) * throttleValue;
                cachedBoat.MoveTowards(worldPos, throttle);
                lastMouseWorldPos = worldPos;
            }
        }

        private void HandleRoutePlanningInput()
        {
            if (targetCamera == null) return;

            if (Input.GetMouseButtonDown(0))
            {
                Vector3 mousePos = Input.mousePosition;
                Vector3 worldPos = targetCamera.ScreenToWorldPoint(new Vector3(mousePos.x, mousePos.y, -targetCamera.transform.position.z));
                cachedBoat?.AddWaypoint((Vector2)worldPos);
            }

            if (Input.GetMouseButtonDown(1))
            {
                isInRoutePlanningMode = false;
                UIManager.Instance.ClosePanel(UIType.RoutePlanner);
            }

            if (Input.GetKeyDown(KeyCode.C))
            {
                cachedBoat?.ClearRoute();
            }

            if (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.Space))
            {
                isInRoutePlanningMode = false;
                UIManager.Instance.ClosePanel(UIType.RoutePlanner);
                cachedBoat?.SetSail();
            }
        }

        private void TryShootPhoto()
        {
            if (cachedBoat == null || TaskSystem.Instance == null || !cachedBoat.CanShootPhoto()) return;

            var boatPos = cachedBoat.GetPosition2D();
            Data.PhotoTaskData nearestTask = null;
            float nearestDist = float.MaxValue;

            var tasks = TaskSystem.Instance.ActiveTasks;
            foreach (var task in tasks)
            {
                if (task.status != TaskStatus.Available) continue;
                var taskData = TaskSystem.Instance.GetTaskData(task.taskId);
                if (taskData == null) continue;
                float dist = Vector2.Distance(boatPos, taskData.targetPosition);
                if (dist < taskData.detectionRadius && dist < nearestDist)
                {
                    nearestTask = taskData;
                    nearestDist = dist;
                }
            }

            if (nearestTask != null)
            {
                cachedBoat.ShootPhoto();
                var result = TaskSystem.Instance.TakePhoto(nearestTask, boatPos, cachedBoat.CurrentHeading);
                cachedBoat.FinishShooting();

                if (result.success)
                {
                    AudioManager.Instance.PlaySfx(SfxType.PhotoShutter);
                    UIManager.Instance.ShowNotification(result.message, 2f);
                }
                else
                {
                    AudioManager.Instance.PlaySfx(SfxType.PhotoShutter, 0.5f);
                    UIManager.Instance.ShowNotification(result.message, 2f);
                }
            }
            else
            {
                UIManager.Instance.ShowNotification("附近没有可拍摄的目标", 1.5f);
            }
        }

        private void TryInteractWithSupplyStop()
        {
            if (cachedBoat == null || TaskSystem.Instance?.CurrentLevelConfig == null) return;
            var config = TaskSystem.Instance.CurrentLevelConfig;
            if (config.supplyStops == null) return;

            Vector2 boatPos = cachedBoat.GetPosition2D();
            foreach (var stop in config.supplyStops)
            {
                if (Vector2.Distance(boatPos, stop) < 4f)
                {
                    cachedBoat.Refuel(cachedBoat.MaxFuel * 0.5f);
                    cachedBoat.RestockFood(cachedBoat.MaxFood * 0.5f);
                    cachedBoat.RechargeBattery(cachedBoat.MaxBattery * 0.5f);
                    UIManager.Instance.ShowNotification("补给完成！", 1.5f);
                    cachedBoat.Anchor();
                    return;
                }
            }
        }

        private void ToggleRoutePlanningMode()
        {
            isInRoutePlanningMode = !isInRoutePlanningMode;
            if (isInRoutePlanningMode)
            {
                cachedBoat?.ClearRoute();
                UIManager.Instance.OpenPanel(UIType.RoutePlanner);
            }
            else
            {
                UIManager.Instance.ClosePanel(UIType.RoutePlanner);
            }
        }

        private void HandleCameraInput()
        {
            if (targetCamera == null) return;

            float scroll = Input.mouseScrollDelta.y;
            if (Mathf.Abs(scroll) > 0.01f)
            {
                targetCamera.orthographicSize = Mathf.Clamp(
                    targetCamera.orthographicSize - scroll * cameraZoomSpeed * Time.deltaTime,
                    minZoom, maxZoom);
            }

            if (Input.GetKeyDown(KeyCode.F))
            {
                followBoat = !followBoat;
            }

            if (!followBoat)
            {
                float moveX = Input.GetAxis("Horizontal");
                float moveY = Input.GetAxis("Vertical");
                Vector3 offset = new Vector3(moveX, moveY, 0) * (targetCamera.orthographicSize * 0.3f) * Time.deltaTime;
                targetCamera.transform.position += offset;
            }
        }

        private void UpdateCameraFollow()
        {
            if (!followBoat || targetCamera == null || cachedBoat == null) return;

            Vector3 targetPos = new Vector3(
                cachedBoat.transform.position.x,
                cachedBoat.transform.position.y,
                targetCamera.transform.position.z);

            targetCamera.transform.position = Vector3.SmoothDamp(
                targetCamera.transform.position,
                targetPos,
                ref cameraVelocity,
                1f / cameraFollowSmooth);
        }

        private void HandleMenuInput()
        {
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                if (UIManager.Instance != null && UIManager.Instance.OpenPanelsCount > 1)
                {
                    UIManager.Instance.ReturnToPreviousPanel();
                }
            }
        }

        private void HandleGlobalInput()
        {
            if (Input.GetKeyDown(KeyCode.F1))
            {
                UIManager.Instance?.OpenPanel(UIType.Tutorial);
            }

            if (Input.GetKeyDown(KeyCode.F5))
            {
                _ = SaveSystem.Instance.SaveGame();
                UIManager.Instance?.ShowNotification("游戏已保存", 1f);
            }

            if (targetCamera == null)
            {
                var cam = GameObject.Find("Main Camera");
                if (cam != null) targetCamera = cam.GetComponent<Camera>();
            }
        }

        public void SetRoutePlanningMode(bool active)
        {
            isInRoutePlanningMode = active;
        }

        public bool IsInRoutePlanningMode()
        {
            return isInRoutePlanningMode;
        }
    }
}
