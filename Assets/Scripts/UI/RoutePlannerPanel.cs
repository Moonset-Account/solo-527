using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Gameplay;
using LakeSailing.Audio;
using LakeSailing.UI;

namespace LakeSailing.UI
{
    public class RoutePlannerPanel : UIPanelBase
    {
        [Header("地图组件")]
        [SerializeField] private RectTransform mapContainer;
        [SerializeField] private Image mapBackground;
        [SerializeField] private Transform waypointContainer;
        [SerializeField] private GameObject waypointPrefab;
        [SerializeField] private LineRenderer routeLineRenderer;

        [Header("信息显示")]
        [SerializeField] private Text waypointCountText;
        [SerializeField] private Text estimatedDistanceText;
        [SerializeField] private Text estimatedFuelText;
        [SerializeField] private Text estimatedTimeText;
        [SerializeField] private Text fuelStatusText;

        [Header("按钮")]
        [SerializeField] private Button confirmButton;
        [SerializeField] private Button clearButton;
        [SerializeField] private Button undoButton;
        [SerializeField] private Button closeButton;

        [Header("地图缩放")]
        [SerializeField] private float mapToWorldScale = 1f;
        [SerializeField] private RectTransform boatMarker;
        [SerializeField] private RectTransform dockMarker;

        private List<Vector2> plannedWaypoints = new List<Vector2>();
        private BoatController cachedBoat;
        private bool isInitialized;

        private void Awake()
        {
            panelType = UIType.RoutePlanner;
            UIManager.Instance?.RegisterPanel(panelType, this);
        }

        private void Start()
        {
            InitializeButtons();
        }

        private void InitializeButtons()
        {
            if (confirmButton != null) confirmButton.onClick.AddListener(OnConfirmClicked);
            if (clearButton != null) clearButton.onClick.AddListener(OnClearClicked);
            if (undoButton != null) undoButton.onClick.AddListener(OnUndoClicked);
            if (closeButton != null) closeButton.onClick.AddListener(OnCloseClicked);
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            GameManager.Instance?.ChangeState(GameState.Paused);
            cachedBoat = LevelSceneManager.Instance?.Boat;
            plannedWaypoints.Clear();
            InitializeMap();
            UpdateWaypointsDisplay();
            InputController.Instance?.SetRoutePlanningMode(true);
        }

        protected override void OnClosed()
        {
            base.OnClosed();
            InputController.Instance?.SetRoutePlanningMode(false);
            if (GameManager.Instance != null && GameManager.Instance.CurrentState == GameState.Paused)
            {
                GameManager.Instance.ChangeState(GameState.Playing);
            }
        }

        private void Update()
        {
            if (!IsOpen) return;
            HandleMapClicks();
            UpdateBoatMarkerPosition();
            UpdateRouteLine();
        }

        private void InitializeMap()
        {
            if (mapContainer == null) return;

            var level = LevelSceneManager.Instance?.CurrentLevel;
            if (level != null)
            {
                float aspect = level.lakeSize.x / level.lakeSize.y;
                float size = Mathf.Min(mapContainer.rect.width, mapContainer.rect.height);
                if (mapToWorldScale < 0.01f)
                {
                    mapToWorldScale = size / Mathf.Max(level.lakeSize.x, level.lakeSize.y);
                }
            }

            UpdateMarkers();
            isInitialized = true;
        }

        private void UpdateMarkers()
        {
            var level = LevelSceneManager.Instance?.CurrentLevel;
            if (level == null) return;

            if (dockMarker != null)
            {
                dockMarker.anchoredPosition = WorldToMap(level.startDockPosition);
            }
            UpdateBoatMarkerPosition();
        }

        private void UpdateBoatMarkerPosition()
        {
            if (cachedBoat == null || boatMarker == null) return;
            boatMarker.anchoredPosition = WorldToMap(cachedBoat.GetPosition2D());
        }

        private void HandleMapClicks()
        {
            if (Input.GetMouseButtonDown(0) && mapContainer != null)
            {
                Vector2 localPoint;
                if (RectTransformUtility.ScreenPointToLocalPointInRectangle(
                    mapContainer, Input.mousePosition, null, out localPoint))
                {
                    Vector2 worldPos = MapToWorld(localPoint);
                    AddWaypoint(worldPos, localPoint);
                }
            }
        }

        private void AddWaypoint(Vector2 worldPos, Vector2 mapPos)
        {
            plannedWaypoints.Add(worldPos);

            if (waypointPrefab != null && waypointContainer != null)
            {
                var go = Instantiate(waypointPrefab, waypointContainer);
                var rt = go.GetComponent<RectTransform>();
                if (rt != null) rt.anchoredPosition = mapPos;

                var text = go.GetComponentInChildren<Text>();
                if (text != null) text.text = plannedWaypoints.Count.ToString();

                var btn = go.GetComponent<Button>();
                if (btn != null)
                {
                    int index = plannedWaypoints.Count - 1;
                    btn.onClick.AddListener(() => RemoveWaypointAt(index));
                }
            }

            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick, 0.6f);
            UpdateWaypointsDisplay();
        }

        private void RemoveWaypointAt(int index)
        {
            if (index < 0 || index >= plannedWaypoints.Count) return;
            plannedWaypoints.RemoveAt(index);

            if (waypointContainer != null)
            {
                for (int i = 0; i < waypointContainer.childCount; i++)
                {
                    Destroy(waypointContainer.GetChild(i).gameObject);
                }
            }
            foreach (var wp in plannedWaypoints)
            {
                if (waypointPrefab != null && waypointContainer != null)
                {
                    var go = Instantiate(waypointPrefab, waypointContainer);
                    var rt = go.GetComponent<RectTransform>();
                    if (rt != null) rt.anchoredPosition = WorldToMap(wp);
                    int idx = plannedWaypoints.IndexOf(wp);
                    var text = go.GetComponentInChildren<Text>();
                    if (text != null) text.text = (idx + 1).ToString();
                }
            }
            UpdateWaypointsDisplay();
        }

        private void UpdateRouteLine()
        {
            if (routeLineRenderer == null) return;

            int pointCount = 1 + plannedWaypoints.Count;
            routeLineRenderer.positionCount = pointCount;

            if (cachedBoat != null)
            {
                Vector3 start = cachedBoat.transform.position;
                start.z = -1;
                routeLineRenderer.SetPosition(0, start);
            }

            for (int i = 0; i < plannedWaypoints.Count; i++)
            {
                Vector3 pos = new Vector3(plannedWaypoints[i].x, plannedWaypoints[i].y, -1);
                routeLineRenderer.SetPosition(i + 1, pos);
            }
        }

        private void UpdateWaypointsDisplay()
        {
            if (waypointCountText != null)
            {
                waypointCountText.text = $"航点数: {plannedWaypoints.Count}";
            }

            float totalDistance = 0;
            Vector2 lastPos = cachedBoat != null ? cachedBoat.GetPosition2D() : Vector2.zero;

            foreach (var wp in plannedWaypoints)
            {
                totalDistance += Vector2.Distance(lastPos, wp);
                lastPos = wp;
            }

            if (estimatedDistanceText != null)
            {
                estimatedDistanceText.text = $"预计距离: {totalDistance:F0} m";
            }

            float estimatedFuel = 0;
            Vector2 fuelCalcPos = cachedBoat != null ? cachedBoat.GetPosition2D() : Vector2.zero;
            foreach (var wp in plannedWaypoints)
            {
                if (cachedBoat != null)
                {
                    estimatedFuel += cachedBoat.CalculateRequiredFuel(fuelCalcPos, wp);
                }
                fuelCalcPos = wp;
            }

            if (estimatedFuelText != null)
            {
                estimatedFuelText.text = $"预计耗油: {estimatedFuel:F0}";
            }

            float estSpeed = cachedBoat != null ? cachedBoat.MaxSpeed * 0.6f : 2.5f;
            float estTime = totalDistance / Mathf.Max(0.1f, estSpeed);

            if (estimatedTimeText != null)
            {
                int min = Mathf.FloorToInt(estTime / 60f);
                int sec = Mathf.FloorToInt(estTime % 60f);
                estimatedTimeText.text = $"预计用时: {min:00}:{sec:00}";
            }

            if (fuelStatusText != null && cachedBoat != null)
            {
                bool enoughFuel = estimatedFuel <= cachedBoat.CurrentFuel * 0.9f;
                fuelStatusText.text = enoughFuel ? "燃料充足" : "燃料可能不足！";
                fuelStatusText.color = enoughFuel ? Color.green : Color.red;
            }
        }

        private Vector2 WorldToMap(Vector2 worldPos)
        {
            var level = LevelSceneManager.Instance?.CurrentLevel;
            if (level == null || mapContainer == null) return worldPos;

            float normalizedX = (worldPos.x + level.lakeSize.x / 2f) / level.lakeSize.x;
            float normalizedY = (worldPos.y + level.lakeSize.y / 2f) / level.lakeSize.y;

            return new Vector2(
                (normalizedX - 0.5f) * mapContainer.rect.width,
                (normalizedY - 0.5f) * mapContainer.rect.height);
        }

        private Vector2 MapToWorld(Vector2 mapPos)
        {
            var level = LevelSceneManager.Instance?.CurrentLevel;
            if (level == null || mapContainer == null) return mapPos;

            float normalizedX = (mapPos.x / mapContainer.rect.width) + 0.5f;
            float normalizedY = (mapPos.y / mapContainer.rect.height) + 0.5f;

            return new Vector2(
                (normalizedX * level.lakeSize.x) - level.lakeSize.x / 2f,
                (normalizedY * level.lakeSize.y) - level.lakeSize.y / 2f);
        }

        private void OnConfirmClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);

            if (plannedWaypoints.Count == 0)
            {
                UIManager.Instance?.ShowNotification("请至少添加一个航点", 1.5f);
                return;
            }

            cachedBoat?.PlanRoute(new List<Vector2>(plannedWaypoints));
            cachedBoat?.SetSail();
            Close();
        }

        private void OnClearClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            plannedWaypoints.Clear();
            if (waypointContainer != null)
            {
                for (int i = waypointContainer.childCount - 1; i >= 0; i--)
                {
                    Destroy(waypointContainer.GetChild(i).gameObject);
                }
            }
            UpdateWaypointsDisplay();
        }

        private void OnUndoClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            if (plannedWaypoints.Count > 0)
            {
                RemoveWaypointAt(plannedWaypoints.Count - 1);
            }
        }

        private void OnCloseClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
        }
    }
}
