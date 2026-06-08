using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Events;
using UnityEngine.EventSystems;
using System;
using System.Collections.Generic;

namespace LakeNavigation
{
    public class PlanningPanel : IPanel
    {
        private RoutePlanner _routePlanner;
        private LevelManager _levelManager;
        private GameConfig _gameConfig;
        private LevelData _currentLevel;

        private Font _font;
        private Sprite _circleSprite;
        private RectTransform _gridContentRect;
        private RectTransform _gridContainerRect;
        private float _pixelScale;
        private int _gridCols = 20;
        private int _gridRows = 15;

        private readonly List<GameObject> _routeLineObjects = new List<GameObject>();
        private readonly List<GameObject> _waypointMarkerObjects = new List<GameObject>();
        private readonly List<GameObject> _gridMarkerObjects = new List<GameObject>();
        private readonly List<GameObject> _gridLineObjects = new List<GameObject>();

        private Text _waypointCountText;
        private Transform _forecastContainer;
        private Transform _supplyContainer;
        private Button _setSailButton;

        public override void Setup(Transform parent)
        {
            _font = UIHelper.DefaultFont;
            _circleSprite = CreateCircleSprite(64);

            _panelObject = new GameObject("PlanningPanel");
            _panelObject.transform.SetParent(parent, false);

            var rect = _panelObject.AddComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            var bg = _panelObject.AddComponent<Image>();
            bg.color = new Color32(18, 24, 40, 245);

            CreateTitle();
            CreateGridArea();
            CreateSupplyPanel();
            CreateForecastPanel();
            CreateBottomBar();
        }

        public override void Show()
        {
            _routePlanner = FindObjectOfType<RoutePlanner>();
            _levelManager = FindObjectOfType<LevelManager>();
            ServiceLocator.Instance.TryGet(out _gameConfig);

            if (_levelManager != null && GameManager.Instance.CurrentLevelIndex >= 0)
            {
                _levelManager.LoadLevel(GameManager.Instance.CurrentLevelIndex);
            }

            _currentLevel = _levelManager?.CurrentLevel;
            if (_gameConfig != null)
            {
                _gridCols = _gameConfig.GridWidth;
                _gridRows = _gameConfig.GridHeight;
            }

            IsVisible = true;
            _panelObject.SetActive(true);

            CalculateGridScale();
            DrawGridLines();
            DrawGridMarkers();
            UpdateForecastDisplay();
            UpdateSupplyDisplay();
            if (_routePlanner != null) _routePlanner.ClearRoute();
            DrawRoute();
            UpdateWaypointCount();

            SubscribeEvents();
        }

        public override void Hide()
        {
            IsVisible = false;
            _panelObject.SetActive(false);
            UnsubscribeEvents();
        }

        private void OnDestroy()
        {
            UnsubscribeEvents();
        }

        private void SubscribeEvents()
        {
            if (_routePlanner != null)
            {
                _routePlanner.OnWaypointAdded += OnWaypointAdded;
                _routePlanner.OnWaypointRemoved += OnWaypointRemoved;
                _routePlanner.OnRouteCleared += OnRouteCleared;
            }
        }

        private void UnsubscribeEvents()
        {
            if (_routePlanner != null)
            {
                _routePlanner.OnWaypointAdded -= OnWaypointAdded;
                _routePlanner.OnWaypointRemoved -= OnWaypointRemoved;
                _routePlanner.OnRouteCleared -= OnRouteCleared;
            }
        }

        private void OnWaypointAdded(Vector2 position)
        {
            DrawRoute();
            UpdateWaypointCount();
        }

        private void OnWaypointRemoved(int index)
        {
            DrawRoute();
            UpdateWaypointCount();
        }

        private void OnRouteCleared()
        {
            DrawRoute();
            UpdateWaypointCount();
        }

        private void CalculateGridScale()
        {
            Canvas.ForceUpdateCanvases();
            var containerRect = _gridContainerRect.rect;
            _pixelScale = Mathf.Min(containerRect.width / _gridCols, containerRect.height / _gridRows);

            float contentW = _gridCols * _pixelScale;
            float contentH = _gridRows * _pixelScale;
            float offsetX = (containerRect.width - contentW) / 2f;
            float offsetY = (containerRect.height - contentH) / 2f;

            _gridContentRect.anchorMin = Vector2.zero;
            _gridContentRect.anchorMax = Vector2.zero;
            _gridContentRect.pivot = new Vector2(0f, 0f);
            _gridContentRect.anchoredPosition = new Vector2(offsetX, offsetY);
            _gridContentRect.sizeDelta = new Vector2(contentW, contentH);
        }

        private void DrawGridLines()
        {
            ClearObjects(_gridLineObjects);
            float gw = _gridCols * _pixelScale;
            float gh = _gridRows * _pixelScale;

            for (int x = 0; x <= _gridCols; x++)
            {
                var line = MakeObj("VLine", _gridContentRect);
                var lr = line.GetComponent<RectTransform>();
                lr.anchorMin = new Vector2(0, 0);
                lr.anchorMax = new Vector2(0, 0);
                lr.pivot = new Vector2(0.5f, 0f);
                lr.anchoredPosition = new Vector2(x * _pixelScale, 0);
                lr.sizeDelta = new Vector2(1, gh);
                var img = line.AddComponent<Image>();
                img.color = new Color32(60, 75, 100, 120);
                _gridLineObjects.Add(line);
            }

            for (int y = 0; y <= _gridRows; y++)
            {
                var line = MakeObj("HLine", _gridContentRect);
                var lr = line.GetComponent<RectTransform>();
                lr.anchorMin = new Vector2(0, 0);
                lr.anchorMax = new Vector2(0, 0);
                lr.pivot = new Vector2(0f, 0.5f);
                lr.anchoredPosition = new Vector2(0, y * _pixelScale);
                lr.sizeDelta = new Vector2(gw, 1);
                var img = line.AddComponent<Image>();
                img.color = new Color32(60, 75, 100, 120);
                _gridLineObjects.Add(line);
            }
        }

        private void DrawGridMarkers()
        {
            ClearObjects(_gridMarkerObjects);
            if (_currentLevel == null) return;

            foreach (var target in _currentLevel.PhotoTargets)
            {
                float markerSize = _pixelScale * 0.7f;
                var marker = MakeObj("Target_" + target.DisplayName, _gridContentRect);
                var mr = marker.GetComponent<RectTransform>();
                mr.anchorMin = Vector2.zero;
                mr.anchorMax = Vector2.zero;
                mr.pivot = new Vector2(0.5f, 0.5f);
                mr.anchoredPosition = GridToUI(target.GridPosition);
                mr.sizeDelta = new Vector2(markerSize, markerSize);
                var mImg = marker.AddComponent<Image>();
                mImg.sprite = _circleSprite;
                mImg.color = new Color32(230, 150, 30, 230);
                _gridMarkerObjects.Add(marker);

                var label = CreateText(marker.transform, target.DisplayName, 10, Color.white);
                var lr = label.GetComponent<RectTransform>();
                lr.anchorMin = new Vector2(0.5f, 0);
                lr.anchorMax = new Vector2(0.5f, 0);
                lr.pivot = new Vector2(0.5f, 1f);
                lr.anchoredPosition = new Vector2(0, -3);
                lr.sizeDelta = new Vector2(markerSize + 20, 14);
                label.alignment = TextAnchor.MiddleCenter;
                _gridMarkerObjects.Add(label.gameObject);
            }

            foreach (var obs in _currentLevel.ObstaclePositions)
            {
                float markerSize = _pixelScale * 0.6f;
                var marker = MakeObj("Obstacle", _gridContentRect);
                var mr = marker.GetComponent<RectTransform>();
                mr.anchorMin = Vector2.zero;
                mr.anchorMax = Vector2.zero;
                mr.pivot = new Vector2(0.5f, 0.5f);
                mr.anchoredPosition = GridToUI(obs);
                mr.sizeDelta = new Vector2(markerSize, markerSize);
                var mImg = marker.AddComponent<Image>();
                mImg.color = new Color32(120, 75, 40, 220);
                _gridMarkerObjects.Add(marker);
            }

            if (_currentLevel.DockPositions != null && _currentLevel.DockPositions.Count > 0)
            {
                var dockPos = _currentLevel.DockPositions[0];
                float markerSize = _pixelScale * 0.8f;
                var marker = MakeObj("Dock", _gridContentRect);
                var mr = marker.GetComponent<RectTransform>();
                mr.anchorMin = Vector2.zero;
                mr.anchorMax = Vector2.zero;
                mr.pivot = new Vector2(0.5f, 0.5f);
                mr.anchoredPosition = GridToUI(dockPos);
                mr.sizeDelta = new Vector2(markerSize, markerSize);
                var mImg = marker.AddComponent<Image>();
                mImg.sprite = _circleSprite;
                mImg.color = new Color32(60, 180, 200, 240);
                _gridMarkerObjects.Add(marker);

                var label = CreateText(marker.transform, "DOCK", 10, new Color32(60, 180, 200, 255));
                var lr = label.GetComponent<RectTransform>();
                lr.anchorMin = new Vector2(0.5f, 1);
                lr.anchorMax = new Vector2(0.5f, 1);
                lr.pivot = new Vector2(0.5f, 0f);
                lr.anchoredPosition = new Vector2(0, 3);
                lr.sizeDelta = new Vector2(markerSize + 10, 14);
                label.alignment = TextAnchor.MiddleCenter;
                _gridMarkerObjects.Add(label.gameObject);
            }
            else if (_currentLevel.BoatStartPosition != Vector2.zero)
            {
                float markerSize = _pixelScale * 0.8f;
                var marker = MakeObj("Start", _gridContentRect);
                var mr = marker.GetComponent<RectTransform>();
                mr.anchorMin = Vector2.zero;
                mr.anchorMax = Vector2.zero;
                mr.pivot = new Vector2(0.5f, 0.5f);
                mr.anchoredPosition = GridToUI(_currentLevel.BoatStartPosition);
                mr.sizeDelta = new Vector2(markerSize, markerSize);
                var mImg = marker.AddComponent<Image>();
                mImg.sprite = _circleSprite;
                mImg.color = new Color32(60, 180, 200, 240);
                _gridMarkerObjects.Add(marker);

                var label = CreateText(marker.transform, "START", 10, new Color32(60, 180, 200, 255));
                var lr = label.GetComponent<RectTransform>();
                lr.anchorMin = new Vector2(0.5f, 1);
                lr.anchorMax = new Vector2(0.5f, 1);
                lr.pivot = new Vector2(0.5f, 0f);
                lr.anchoredPosition = new Vector2(0, 3);
                lr.sizeDelta = new Vector2(markerSize + 10, 14);
                label.alignment = TextAnchor.MiddleCenter;
                _gridMarkerObjects.Add(label.gameObject);
            }
        }

        private void DrawRoute()
        {
            ClearObjects(_routeLineObjects);
            ClearObjects(_waypointMarkerObjects);

            if (_routePlanner == null) return;
            var waypoints = _routePlanner.PlannedRoute;
            if (waypoints == null || waypoints.Count == 0) return;

            for (int i = 0; i < waypoints.Count; i++)
            {
                if (i > 0)
                    DrawRouteSegment(waypoints[i - 1], waypoints[i]);

                bool isLast = (i == waypoints.Count - 1);
                CreateWaypointMarker(waypoints[i], i, isLast);
            }
        }

        private void DrawRouteSegment(Vector2 from, Vector2 to)
        {
            var uiFrom = GridToUI(from);
            var uiTo = GridToUI(to);

            var lineObj = MakeObj("RouteLine", _gridContentRect);
            var lr = lineObj.GetComponent<RectTransform>();
            lr.anchorMin = Vector2.zero;
            lr.anchorMax = Vector2.zero;
            lr.pivot = new Vector2(0f, 0.5f);

            Vector2 delta = uiTo - uiFrom;
            float distance = delta.magnitude;
            float angle = Mathf.Atan2(delta.y, delta.x) * Mathf.Rad2Deg;

            lr.anchoredPosition = uiFrom;
            lr.sizeDelta = new Vector2(distance, 3f);
            lr.localEulerAngles = new Vector3(0, 0, angle);

            var img = lineObj.AddComponent<Image>();
            img.color = new Color32(80, 210, 100, 220);
            _routeLineObjects.Add(lineObj);
        }

        private void CreateWaypointMarker(Vector2 gridPos, int index, bool isCurrent)
        {
            float markerSize = _pixelScale * 0.4f;
            var marker = MakeObj("WP_" + index, _gridContentRect);
            var mr = marker.GetComponent<RectTransform>();
            mr.anchorMin = Vector2.zero;
            mr.anchorMax = Vector2.zero;
            mr.pivot = new Vector2(0.5f, 0.5f);
            mr.anchoredPosition = GridToUI(gridPos);
            mr.sizeDelta = new Vector2(markerSize, markerSize);

            var mImg = marker.AddComponent<Image>();
            mImg.sprite = _circleSprite;
            mImg.color = isCurrent ? new Color32(255, 230, 50, 255) : new Color32(80, 210, 100, 240);

            var outline = marker.AddComponent<Outline>();
            outline.effectColor = isCurrent ? new Color32(200, 180, 0, 200) : new Color32(50, 150, 70, 180);
            outline.effectDistance = new Vector2(1.5f, -1.5f);

            _waypointMarkerObjects.Add(marker);

            if (isCurrent)
            {
                var ring = MakeObj("WPRing", _gridContentRect);
                var rr = ring.GetComponent<RectTransform>();
                rr.anchorMin = Vector2.zero;
                rr.anchorMax = Vector2.zero;
                rr.pivot = new Vector2(0.5f, 0.5f);
                rr.anchoredPosition = GridToUI(gridPos);
                rr.sizeDelta = new Vector2(markerSize + 8, markerSize + 8);
                var rImg = ring.AddComponent<Image>();
                rImg.sprite = _circleSprite;
                rImg.color = new Color32(255, 230, 50, 80);
                _waypointMarkerObjects.Add(ring);
            }
        }

        private void OnGridClick(BaseEventData data)
        {
            var pointerData = data as PointerEventData;
            if (pointerData == null || _routePlanner == null) return;

            RectTransformUtility.ScreenPointToLocalPointInRectangle(
                _gridContentRect, pointerData.position, pointerData.pressEventCamera, out Vector2 localPos);

            Vector2 gridPos = new Vector2(localPos.x / _pixelScale, localPos.y / _pixelScale);

            if (gridPos.x >= 0 && gridPos.x <= _gridCols && gridPos.y >= 0 && gridPos.y <= _gridRows)
            {
                _routePlanner.AddWaypoint(gridPos);
            }
        }

        private void UpdateWaypointCount()
        {
            if (_routePlanner == null) return;
            int count = _routePlanner.PlannedRoute.Count;
            int max = 30;
            _waypointCountText.text = "Waypoints: " + count + "/" + max;
            if (_setSailButton != null)
                _setSailButton.interactable = count > 0;
        }

        private void UpdateForecastDisplay()
        {
            if (_forecastContainer == null) return;
            for (int i = _forecastContainer.childCount - 1; i >= 0; i--)
                Destroy(_forecastContainer.GetChild(i).gameObject);

            var schedule = _currentLevel?.WeatherSchedule;
            if (schedule == null || schedule.Count == 0) return;

            var header = CreateText(_forecastContainer, "FORECAST", 14, new Color32(180, 200, 230, 255));
            var hr = header.GetComponent<RectTransform>();
            hr.sizeDelta = new Vector2(190, 24);
            header.alignment = TextAnchor.MiddleCenter;
            header.fontStyle = FontStyle.Bold;

            for (int i = 0; i < schedule.Count; i++)
            {
                var entry = schedule[i];
                string line = FormatWeatherType(entry.Weather) + " - " + entry.Duration.ToString("F0") + "s";
                var color = GetWeatherColor(entry.Weather);
                var t = CreateText(_forecastContainer, line, 13, color);
                var tr = t.GetComponent<RectTransform>();
                tr.sizeDelta = new Vector2(190, 20);
                t.alignment = TextAnchor.MiddleLeft;
            }
        }

        private void UpdateSupplyDisplay()
        {
            if (_supplyContainer == null) return;
            for (int i = _supplyContainer.childCount - 1; i >= 0; i--)
                Destroy(_supplyContainer.GetChild(i).gameObject);

            var supplies = _currentLevel?.StartingSupplies;
            if (supplies == null || supplies.Count == 0) return;

            var header = CreateText(_supplyContainer, "SUPPLIES", 14, new Color32(180, 200, 230, 255));
            var hdr = header.GetComponent<RectTransform>();
            hdr.sizeDelta = new Vector2(160, 24);
            header.alignment = TextAnchor.MiddleCenter;
            header.fontStyle = FontStyle.Bold;

            foreach (var supply in supplies)
            {
                string line = supply.Type + ": " + supply.Max.ToString("F0");
                Color c = supply.Type switch
                {
                    SupplyType.Fuel => new Color32(255, 160, 50, 255),
                    SupplyType.Food => new Color32(80, 200, 60, 255),
                    SupplyType.Battery => new Color32(80, 140, 255, 255),
                    _ => Color.white
                };
                var t = CreateText(_supplyContainer, line, 14, c);
                var tr = t.GetComponent<RectTransform>();
                tr.sizeDelta = new Vector2(160, 22);
                t.alignment = TextAnchor.MiddleLeft;
            }
        }

        private void OnSetSailClicked()
        {
            if (_routePlanner == null) return;
            _routePlanner.ConfirmRoute();
            var route = _routePlanner.PlannedRoute;
            if (SailingController.Instance != null)
            {
                SailingController.Instance.StartSailing(route);
            }
            else
            {
                GameManager.Instance.ChangeState(GameState.Sailing);
            }
        }

        private void OnBackClicked()
        {
            GameManager.Instance.ChangeState(GameState.MainMenu);
        }

        private void OnUndoClicked()
        {
            _routePlanner?.RemoveLastWaypoint();
        }

        private void OnClearClicked()
        {
            _routePlanner?.ClearRoute();
        }

        private void CreateTitle()
        {
            var titleObj = MakeObj("Title", _panelObject.transform);
            var tr = titleObj.GetComponent<RectTransform>();
            SetAnchors(tr, new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0.5f, 1));
            tr.anchoredPosition = new Vector2(0, -20);
            tr.sizeDelta = new Vector2(500, 50);

            var title = titleObj.AddComponent<Text>();
            title.font = _font;
            title.text = "PLAN YOUR ROUTE";
            title.fontSize = 32;
            title.color = new Color32(210, 225, 245, 255);
            title.alignment = TextAnchor.MiddleCenter;
            title.fontStyle = FontStyle.Bold;
        }

        private void CreateGridArea()
        {
            var container = MakeObj("GridContainer", _panelObject.transform);
            var cr = container.GetComponent<RectTransform>();
            cr.anchorMin = new Vector2(0.1f, 0.1f);
            cr.anchorMax = new Vector2(0.9f, 0.88f);
            cr.offsetMin = Vector2.zero;
            cr.offsetMax = Vector2.zero;
            _gridContainerRect = cr;

            var bg = container.AddComponent<Image>();
            bg.color = new Color32(12, 18, 30, 220);

            var content = MakeObj("GridContent", container.transform);
            _gridContentRect = content.GetComponent<RectTransform>();

            var overlay = MakeObj("GridOverlay", content.transform);
            var or = overlay.GetComponent<RectTransform>();
            or.anchorMin = Vector2.zero;
            or.anchorMax = Vector2.one;
            or.offsetMin = Vector2.zero;
            or.offsetMax = Vector2.zero;
            var overlayImg = overlay.AddComponent<Image>();
            overlayImg.color = new Color(1f, 1f, 1f, 0.01f);

            var trigger = overlay.AddComponent<EventTrigger>();
            var entry = new EventTrigger.Entry();
            entry.eventID = EventTriggerType.PointerClick;
            entry.callback.AddListener(OnGridClick);
            trigger.triggers.Add(entry);
        }

        private void CreateSupplyPanel()
        {
            var panel = MakeObj("SupplyPanel", _panelObject.transform);
            var pr = panel.GetComponent<RectTransform>();
            SetAnchors(pr, new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(0, 0.5f));
            pr.anchoredPosition = new Vector2(15, 20);
            pr.sizeDelta = new Vector2(170, 300);

            var bg = panel.AddComponent<Image>();
            bg.color = new Color32(15, 22, 38, 210);

            var outline = panel.AddComponent<Outline>();
            outline.effectColor = new Color32(60, 80, 110, 80);
            outline.effectDistance = new Vector2(1, -1);

            var layout = panel.AddComponent<VerticalLayoutGroup>();
            layout.childAlignment = TextAnchor.UpperCenter;
            layout.spacing = 4f;
            layout.childControlWidth = true;
            layout.childControlHeight = false;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;
            layout.padding = new RectOffset(8, 8, 10, 10);

            _supplyContainer = panel.transform;
        }

        private void CreateForecastPanel()
        {
            var panel = MakeObj("ForecastPanel", _panelObject.transform);
            var pr = panel.GetComponent<RectTransform>();
            SetAnchors(pr, new Vector2(1, 0.5f), new Vector2(1, 0.5f), new Vector2(1, 0.5f));
            pr.anchoredPosition = new Vector2(-15, 20);
            pr.sizeDelta = new Vector2(210, 300);

            var bg = panel.AddComponent<Image>();
            bg.color = new Color32(15, 22, 38, 210);

            var outline = panel.AddComponent<Outline>();
            outline.effectColor = new Color32(60, 80, 110, 80);
            outline.effectDistance = new Vector2(1, -1);

            var layout = panel.AddComponent<VerticalLayoutGroup>();
            layout.childAlignment = TextAnchor.UpperCenter;
            layout.spacing = 2f;
            layout.childControlWidth = true;
            layout.childControlHeight = false;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;
            layout.padding = new RectOffset(8, 8, 10, 10);

            _forecastContainer = panel.transform;
        }

        private void CreateBottomBar()
        {
            var bar = MakeObj("BottomBar", _panelObject.transform);
            var br = bar.GetComponent<RectTransform>();
            br.anchorMin = new Vector2(0, 0);
            br.anchorMax = new Vector2(1, 0);
            br.pivot = new Vector2(0.5f, 0);
            br.anchoredPosition = new Vector2(0, 12);
            br.sizeDelta = new Vector2(0, 55);

            var hLayout = bar.AddComponent<HorizontalLayoutGroup>();
            hLayout.childAlignment = TextAnchor.MiddleCenter;
            hLayout.spacing = 15f;
            hLayout.childControlWidth = true;
            hLayout.childControlHeight = false;
            hLayout.childForceExpandWidth = true;
            hLayout.childForceExpandHeight = false;
            hLayout.padding = new RectOffset(30, 30, 5, 5);

            var countObj = MakeObj("WPCount", bar.transform);
            _waypointCountText = countObj.AddComponent<Text>();
            _waypointCountText.font = _font;
            _waypointCountText.text = "Waypoints: 0/30";
            _waypointCountText.fontSize = 16;
            _waypointCountText.color = new Color32(180, 200, 230, 255);
            _waypointCountText.alignment = TextAnchor.MiddleCenter;
            var cLe = countObj.AddComponent<LayoutElement>();
            cLe.preferredWidth = 170;
            cLe.preferredHeight = 40;
            cLe.minWidth = 140;

            CreateBarButton("Undo", new Color32(100, 100, 130, 220), OnUndoClicked);
            CreateBarButton("Clear Route", new Color32(160, 80, 60, 220), OnClearClicked);

            var sailBtnObj = CreateBarButton("Set Sail!", new Color32(40, 140, 80, 230), OnSetSailClicked);
            _setSailButton = sailBtnObj.GetComponent<Button>();
            _setSailButton.interactable = false;

            var sailColors = new ColorBlock
            {
                normalColor = new Color32(40, 140, 80, 230),
                highlightedColor = new Color32(60, 170, 100, 230),
                pressedColor = new Color32(30, 110, 65, 230),
                selectedColor = new Color32(60, 170, 100, 230),
                disabledColor = new Color32(80, 80, 80, 128),
                colorMultiplier = 1f,
                fadeDuration = 0.1f
            };
            _setSailButton.colors = sailColors;

            CreateBarButton("Back", new Color32(90, 90, 110, 220), OnBackClicked);
        }

        private GameObject CreateBarButton(string label, Color32 bgColor, UnityAction onClick)
        {
            var btnObj = MakeObj("Btn_" + label.Replace(" ", ""), _panelObject.transform.Find("BottomBar"));
            var img = btnObj.AddComponent<Image>();
            img.color = bgColor;

            var btn = btnObj.AddComponent<Button>();
            btn.targetGraphic = img;
            btn.colors = UIHelper.MakeColorBlock(bgColor);
            btn.onClick.AddListener(onClick);

            var txt = CreateText(btnObj.transform, label, 18, Color.white);
            var tr = txt.GetComponent<RectTransform>();
            tr.anchorMin = Vector2.zero;
            tr.anchorMax = Vector2.one;
            tr.offsetMin = Vector2.zero;
            tr.offsetMax = Vector2.zero;
            txt.alignment = TextAnchor.MiddleCenter;

            var le = btnObj.AddComponent<LayoutElement>();
            le.preferredHeight = 42;
            le.minWidth = 90;
            le.preferredWidth = label == "Set Sail!" ? 140 : 120;

            return btnObj;
        }

        private Vector2 GridToUI(Vector2 gridPos)
        {
            return new Vector2(gridPos.x * _pixelScale, gridPos.y * _pixelScale);
        }

        private GameObject MakeObj(string name, Transform parent)
        {
            var obj = new GameObject(name);
            obj.transform.SetParent(parent, false);
            obj.AddComponent<RectTransform>();
            return obj;
        }

        private Text CreateText(Transform parent, string text, int fontSize, Color color)
        {
            var obj = MakeObj("Txt", parent);
            var t = obj.AddComponent<Text>();
            t.font = _font;
            t.text = text;
            t.fontSize = fontSize;
            t.color = color;
            return t;
        }

        private void SetAnchors(RectTransform rt, Vector2 anchorMin, Vector2 anchorMax, Vector2 pivot)
        {
            rt.anchorMin = anchorMin;
            rt.anchorMax = anchorMax;
            rt.pivot = pivot;
        }

        private void ClearObjects(List<GameObject> list)
        {
            foreach (var obj in list)
            {
                if (obj != null) Destroy(obj);
            }
            list.Clear();
        }

        private Sprite CreateCircleSprite(int res)
        {
            var tex = new Texture2D(res, res);
            float c = res / 2f;
            float r = res / 2f - 1;
            for (int y = 0; y < res; y++)
            {
                for (int x = 0; x < res; x++)
                {
                    float d = Vector2.Distance(new Vector2(x, y), new Vector2(c, c));
                    tex.SetPixel(x, y, d <= r ? Color.white : Color.clear);
                }
            }
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, res, res), new Vector2(0.5f, 0.5f));
        }

        private string FormatWeatherType(WeatherType w)
        {
            return w switch
            {
                WeatherType.Clear => "Clear",
                WeatherType.Cloudy => "Cloudy",
                WeatherType.Foggy => "Foggy",
                WeatherType.Rainy => "Rainy",
                WeatherType.Stormy => "Stormy",
                _ => w.ToString()
            };
        }

        private Color GetWeatherColor(WeatherType w)
        {
            return w switch
            {
                WeatherType.Clear => new Color32(180, 210, 240, 255),
                WeatherType.Cloudy => new Color32(160, 175, 195, 255),
                WeatherType.Foggy => new Color32(190, 195, 200, 255),
                WeatherType.Rainy => new Color32(120, 150, 180, 255),
                WeatherType.Stormy => new Color32(180, 80, 80, 255),
                _ => Color.white
            };
        }
    }
}
