using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;
using LakeSailing.Gameplay;
using LakeSailing.Data;

namespace LakeSailing.UI
{
    public class RoutePlannerPanel : UIPanelBase
    {
        private RectTransform mapArea;
        private RawImage mapImage;
        private Text distText, fuelText, timeText, waypointCountText;
        private Text hintText, warningText;
        private Button confirmBtn, clearBtn, undoBtn, closeBtn;
        private Button supplyBtn;
        private GameObject waypointMarkerPrefab;
        private GameObject routeLinePrefab;
        private RectTransform markersRoot;
        private List<RectTransform> waypointMarkers = new List<RectTransform>();
        private List<RectTransform> routeLines = new List<RectTransform>();
        private Vector2[] supplyStationPositions = new Vector2[]
        {
            new Vector2(-30f, -20f), new Vector2(40f, 30f), new Vector2(0f, 50f)
        };
        private bool uiBuilt;
        private BoatController cachedBoat;
        private Vector2 lastBoatPos;

        private void Awake()
        {
            panelType = UIType.RoutePlanner;
            UIManager.Instance?.RegisterPanel(panelType, this);
        }
        private void Start() { BuildUI(); }

        private void BuildUI()
        {
            if (uiBuilt || panelContent == null) return;
            uiBuilt = true;
            RuntimeUIBuilder.EnsureEventSystem();
            var root = panelContent.transform;

            var overlay = new GameObject("Overlay").AddComponent<Image>();
            overlay.transform.SetParent(root, false);
            RuntimeUIBuilder.StretchFull(overlay.rectTransform);
            overlay.color = new Color(0, 0, 0, 0.55f);

            var panel = new GameObject("Panel").AddComponent<Image>();
            panel.transform.SetParent(root, false);
            var pr = panel.rectTransform;
            pr.sizeDelta = new Vector2(1200, 760);
            pr.anchoredPosition = Vector2.zero;
            panel.color = new Color(0.08f, 0.1f, 0.15f, 0.97f);
            panel.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            panel.type = Image.Type.Sliced;

            var title = RuntimeUIBuilder.CreateTitle(panel.transform, "🗺 路线规划", 48, 1100, 60);
            title.rectTransform.anchoredPosition = new Vector2(0, 325);

            var desc = RuntimeUIBuilder.CreateLabel(panel.transform, "点击湖面设置航点 → 确认后自动航行  |  蓝色方块为补给站（经过自动补满）", 18, TextAnchor.MiddleCenter, 1100, 30);
            desc.rectTransform.anchoredPosition = new Vector2(0, 280);
            desc.color = new Color(0.8f, 0.9f, 1f);

            closeBtn = RuntimeUIBuilder.CreateButton(panel, "✕", new Vector2(48, 48), OnClose, 24, new Color(0.85f, 0.25f, 0.25f));
            closeBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(555, 325);

            var mapBg = new GameObject("MapBg").AddComponent<Image>();
            mapBg.transform.SetParent(panel.transform, false);
            var mbr = mapBg.rectTransform;
            mbr.sizeDelta = new Vector2(760, 560);
            mbr.anchorMin = new Vector2(0, 0.5f); mbr.anchorMax = new Vector2(0, 0.5f);
            mbr.pivot = new Vector2(0, 0.5f); mbr.anchoredPosition = new Vector2(30, -20);
            mapBg.color = new Color(0.12f, 0.3f, 0.5f, 1f);

            markersRoot = new GameObject("Markers").AddComponent<RectTransform>();
            markersRoot.SetParent(mapBg.transform, false);
            RuntimeUIBuilder.StretchFull(markersRoot);
            mapArea = mapBg.rectTransform;

            for (int i = 0; i < supplyStationPositions.Length; i++)
            {
                var sup = new GameObject($"Supply_{i}").AddComponent<Image>();
                sup.transform.SetParent(markersRoot, false);
                sup.rectTransform.sizeDelta = new Vector2(26, 26);
                var mp = WorldToMapUI(supplyStationPositions[i]);
                sup.rectTransform.anchoredPosition = mp;
                sup.color = new Color(0.2f, 0.6f, 1f);
                var lbl = RuntimeUIBuilder.CreateLabel(sup.transform, "⛽", 14, TextAnchor.MiddleCenter, 40, 20);
                lbl.rectTransform.anchoredPosition = new Vector2(0, 18);
            }

            if (LevelSceneManager.Instance != null && TaskSystem.Instance != null)
            {
                int idx = 0;
                foreach (var t in TaskSystem.Instance.ActiveTasks)
                {
                    var td = TaskSystem.Instance.GetTaskData(t.taskId); if (td == null) continue;
                    var tgt = new GameObject($"Tgt_{idx}").AddComponent<Image>();
                    tgt.transform.SetParent(markersRoot, false);
                    tgt.rectTransform.sizeDelta = new Vector2(20, 20);
                    tgt.rectTransform.anchoredPosition = WorldToMapUI(td.targetPosition);
                    tgt.color = GetRarityCol(td.targetRarity);
                    var r = tgt.gameObject.AddComponent<Outline>(); r.effectColor = Color.white; r.effectDistance = new Vector2(2, -2);
                    var lbl = RuntimeUIBuilder.CreateLabel(tgt.transform, td.targetName, 12, TextAnchor.MiddleCenter, 80, 16);
                    lbl.rectTransform.anchoredPosition = new Vector2(0, 18);
                    lbl.color = tgt.color;
                    idx++;
                }
                var boat = LevelSceneManager.Instance.Boat;
                if (boat != null)
                {
                    cachedBoat = boat; lastBoatPos = boat.GetPosition2D();
                    var bp = new GameObject("BoatMarker").AddComponent<Image>();
                    bp.transform.SetParent(markersRoot, false);
                    bp.rectTransform.sizeDelta = new Vector2(30, 30);
                    bp.rectTransform.anchoredPosition = WorldToMapUI(lastBoatPos);
                    bp.color = Color.yellow;
                    var lbl = RuntimeUIBuilder.CreateLabel(bp.transform, "⛵", 18, TextAnchor.MiddleCenter, 50, 24);
                    lbl.rectTransform.anchoredPosition = new Vector2(0, 18);
                }
            }

            var infoPanel = new GameObject("Info").AddComponent<Image>();
            infoPanel.transform.SetParent(panel.transform, false);
            var ipr = infoPanel.rectTransform;
            ipr.anchorMin = new Vector2(1, 0.5f); ipr.anchorMax = new Vector2(1, 0.5f);
            ipr.pivot = new Vector2(1, 0.5f); ipr.anchoredPosition = new Vector2(-30, 60);
            ipr.sizeDelta = new Vector2(340, 440);
            infoPanel.color = new Color(0.12f, 0.15f, 0.2f, 0.95f);

            RuntimeUIBuilder.CreateLabel(infoPanel.transform, "📊 航行预估", 24, TextAnchor.MiddleCenter, 300, 36).rectTransform.anchoredPosition = new Vector2(0, 190);
            waypointCountText = RuntimeUIBuilder.CreateLabel(infoPanel.transform, "航点: 0", 18, TextAnchor.MiddleLeft, 300, 26);
            waypointCountText.rectTransform.anchoredPosition = new Vector2(-20, 140);
            distText = RuntimeUIBuilder.CreateLabel(infoPanel.transform, "总距离: 0 m", 18, TextAnchor.MiddleLeft, 300, 26);
            distText.rectTransform.anchoredPosition = new Vector2(-20, 100);
            fuelText = RuntimeUIBuilder.CreateLabel(infoPanel.transform, "预估燃料: 0 / 100", 18, TextAnchor.MiddleLeft, 300, 26);
            fuelText.rectTransform.anchoredPosition = new Vector2(-20, 60);
            timeText = RuntimeUIBuilder.CreateLabel(infoPanel.transform, "预估时间: 00:00", 18, TextAnchor.MiddleLeft, 300, 26);
            timeText.rectTransform.anchoredPosition = new Vector2(-20, 20);

            hintText = RuntimeUIBuilder.CreateLabel(infoPanel.transform, "💡 提示：先去补给站再去远距离目标", 14, TextAnchor.UpperLeft, 300, 40);
            hintText.rectTransform.anchoredPosition = new Vector2(-140, -30);
            hintText.color = new Color(0.7f, 0.85f, 1f);
            warningText = RuntimeUIBuilder.CreateLabel(infoPanel.transform, "", 14, TextAnchor.UpperLeft, 300, 40);
            warningText.rectTransform.anchoredPosition = new Vector2(-140, -80);
            warningText.color = new Color(1f, 0.6f, 0.4f);

            RuntimeUIBuilder.CreateLabel(infoPanel.transform, "────────────", 14, TextAnchor.MiddleCenter, 300, 20).rectTransform.anchoredPosition = new Vector2(0, -130);
            RuntimeUIBuilder.CreateLabel(infoPanel.transform, "🛠 操作", 20, TextAnchor.MiddleLeft, 300, 26).rectTransform.anchoredPosition = new Vector2(-20, -165);

            undoBtn = RuntimeUIBuilder.CreateButton(infoPanel, "↶ 撤销航点", new Vector2(145, 42), OnUndo, 16, new Color(0.5f, 0.5f, 0.6f));
            undoBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(-73, -210);
            clearBtn = RuntimeUIBuilder.CreateButton(infoPanel, "✕ 清除全部", new Vector2(145, 42), OnClear, 16, new Color(0.8f, 0.35f, 0.35f));
            clearBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(73, -210);
            supplyBtn = RuntimeUIBuilder.CreateButton(infoPanel, "⛽ 优先补给", new Vector2(145, 42), OnAddNearestSupply, 16, new Color(0.2f, 0.6f, 0.9f));
            supplyBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(-73, -260);
            confirmBtn = RuntimeUIBuilder.CreateButton(infoPanel, "✓ 确认启航", new Vector2(300, 50), OnConfirm, 22, new Color(0.2f, 0.75f, 0.4f));
            confirmBtn.GetComponent<RectTransform>().anchoredPosition = new Vector2(0, -320);

            gameObject.SetActive(false);
        }

        private static Color GetRarityCol(int r) => r switch
        {
            1 => new Color(0.75f, 0.75f, 0.75f),
            2 => new Color(0.3f, 0.85f, 0.45f),
            3 => new Color(0.3f, 0.6f, 1f),
            4 => new Color(0.85f, 0.35f, 0.95f),
            _ => new Color(1f, 0.78f, 0.15f)
        };

        private Vector2 WorldToMapUI(Vector2 worldPos)
        {
            if (mapArea == null) return Vector2.zero;
            float mapW = 760f, mapH = 560f;
            float worldSize = 200f;
            float x = (worldPos.x / worldSize) * (mapW * 0.42f);
            float y = (worldPos.y / worldSize) * (mapH * 0.42f);
            return new Vector2(x, y);
        }

        public override void Open()
        {
            base.Open();
            gameObject.SetActive(true);
            if (cachedBoat != null) lastBoatPos = cachedBoat.GetPosition2D();
            RefreshRouteUI();
        }

        public override void Close()
        {
            base.Close();
            gameObject.SetActive(false);
        }

        private void Update()
        {
            if (!gameObject.activeSelf) return;
            if (Input.GetMouseButtonDown(0) && mapArea != null)
            {
                Vector2 lp;
                if (RectTransformUtility.ScreenPointToLocalPointInRectangle(mapArea, Input.mousePosition, null, out lp))
                {
                    if (lp.x > -370 && lp.x < 370 && lp.y > -270 && lp.y < 270)
                    {
                        AddWaypointByUIPos(lp);
                    }
                }
            }
        }

        private void AddWaypointByUIPos(Vector2 uiPos)
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            float mapW = 760f, mapH = 560f; float worldSize = 200f;
            Vector2 worldPos = new Vector2(uiPos.x / (mapW * 0.42f) * worldSize, uiPos.y / (mapH * 0.42f) * worldSize);
            if (cachedBoat != null) { cachedBoat.AddWaypoint(worldPos); }
            else if (BoatController.Instance != null) { BoatController.Instance.AddWaypoint(worldPos); }
            AddWaypointMarker(uiPos);
            RefreshRouteUI();
        }

        private void AddWaypointMarker(Vector2 uiPos)
        {
            var go = new GameObject($"Waypoint_{waypointMarkers.Count}").AddComponent<Image>();
            go.transform.SetParent(markersRoot, false);
            go.rectTransform.sizeDelta = new Vector2(18, 18);
            go.rectTransform.anchoredPosition = uiPos;
            go.color = new Color(1f, 0.85f, 0.1f);
            go.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f));
            var txt = RuntimeUIBuilder.CreateLabel(go.transform, (waypointMarkers.Count + 1).ToString(), 13,
                TextAnchor.MiddleCenter, 30, 18);
            txt.color = Color.black;
            txt.fontStyle = FontStyle.Bold;
            waypointMarkers.Add(go.rectTransform);
        }

        private void RefreshRouteUI()
        {
            if (cachedBoat == null && BoatController.Instance != null) cachedBoat = BoatController.Instance;
            if (cachedBoat == null) return;
            var wps = cachedBoat.GetPlannedWaypoints();
            if (waypointCountText != null) waypointCountText.text = $"航点: {wps.Count}";
            float dist = 0f;
            Vector2 prev = lastBoatPos;
            foreach (var wp in wps) { dist += Vector2.Distance(prev, wp); prev = wp; }
            if (distText != null) distText.text = $"总距离: {dist:F1} m";
            float fuelPerMeter = 0.2f;
            float estFuel = dist * fuelPerMeter * (WeatherSystem.Instance?.GetFuelConsumptionModifier() ?? 1f);
            if (fuelText != null)
            {
                fuelText.text = $"预估燃料: {estFuel:F1} / {cachedBoat.CurrentFuel:F0}";
                fuelText.color = estFuel > cachedBoat.CurrentFuel ? Color.red : Color.white;
            }
            if (warningText != null)
            {
                if (estFuel > cachedBoat.CurrentFuel) warningText.text = "⚠ 燃料不足，请先经过补给站！";
                else if (dist > 180f) warningText.text = "⚠ 路线较长，建议拆分多次任务";
                else warningText.text = "";
            }
            float speed = (cachedBoat.Speed > 0.01f) ? cachedBoat.Speed * 2.2f : 5f;
            float t = dist / speed;
            int m = Mathf.FloorToInt(t / 60f), s = Mathf.FloorToInt(t % 60f);
            if (timeText != null) timeText.text = $"预估时间: {m:00}:{s:00}";

            for (int i = routeLines.Count - 1; i >= 0; i--) { Destroy(routeLines[i].gameObject); }
            routeLines.Clear();
            Vector2 p = WorldToMapUI(lastBoatPos);
            for (int i = 0; i < wps.Count; i++)
            {
                Vector2 c = waypointMarkers.Count > i ? waypointMarkers[i].anchoredPosition : WorldToMapUI(wps[i]);
                DrawLine(p, c);
                p = c;
            }
        }

        private void DrawLine(Vector2 a, Vector2 b)
        {
            var go = new GameObject("Line").AddComponent<Image>();
            go.transform.SetParent(markersRoot, false);
            go.transform.SetAsFirstSibling();
            Vector2 d = b - a; float len = d.magnitude;
            go.rectTransform.sizeDelta = new Vector2(len, 3);
            go.rectTransform.anchorMin = go.rectTransform.anchorMax = new Vector2(0.5f, 0.5f);
            go.rectTransform.anchoredPosition = (a + b) * 0.5f;
            float ang = Mathf.Atan2(d.y, d.x) * Mathf.Rad2Deg;
            go.rectTransform.rotation = Quaternion.Euler(0, 0, ang);
            go.color = new Color(1f, 0.85f, 0.15f, 0.85f);
            routeLines.Add(go.rectTransform);
        }

        private void OnUndo()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            if (cachedBoat != null) { cachedBoat.UndoWaypoint(); }
            if (waypointMarkers.Count > 0) { Destroy(waypointMarkers[waypointMarkers.Count - 1].gameObject); waypointMarkers.RemoveAt(waypointMarkers.Count - 1); }
            RefreshRouteUI();
        }

        private void OnClear()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            if (cachedBoat != null) { cachedBoat.ClearWaypoints(); }
            foreach (var m in waypointMarkers) Destroy(m.gameObject);
            waypointMarkers.Clear();
            RefreshRouteUI();
        }

        private void OnAddNearestSupply()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Vector2 cur = cachedBoat != null ? cachedBoat.GetPosition2D() : Vector2.zero;
            int idx = 0; float best = float.MaxValue;
            for (int i = 0; i < supplyStationPositions.Length; i++)
            {
                float d = Vector2.Distance(cur, supplyStationPositions[i]);
                if (d < best) { best = d; idx = i; }
            }
            if (cachedBoat != null) cachedBoat.AddWaypoint(supplyStationPositions[idx]);
            AddWaypointMarker(WorldToMapUI(supplyStationPositions[idx]));
            RefreshRouteUI();
        }

        private void OnConfirm()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            if (cachedBoat == null || cachedBoat.GetPlannedWaypoints().Count == 0)
            {
                UIManager.Instance?.ShowNotification("请至少设置1个航点", 1.6f); return;
            }
            cachedBoat.PlanRoute();
            UIManager.Instance?.ShowNotification($"已规划 {cachedBoat.GetPlannedWaypoints().Count} 个航点，开始自动航行", 2f);
            Close();
        }

        private void OnClose()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
        }
    }
}
