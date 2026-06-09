using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using KitchenChaos.Core;
using KitchenChaos.Players;
using KitchenChaos.Stations;
using KitchenChaos.OrderSystem;
using KitchenChaos.Config;

namespace KitchenChaos.DebugTools
{
    public class DebugPanel : MonoBehaviour
    {
        [SerializeField] KeyCode _toggleKey = KeyCode.BackQuote;
        [SerializeField] bool _startOpen;

        GameObject _root;
        RectTransform _panel;
        TMP_Text _logArea;
        Vector2 _scroll;
        readonly List<string> _logs = new();
        bool _visible;

        int _maxLogs = 80;
        float _refreshTimer;
        float _fpsTimer;
        int _fpsCount;
        int _currentFps;

        void Awake()
        {
            BuildUI();
            Application.logMessageReceived += OnUnityLog;
            Log("⚙ Debug Panel 初始化完毕");
        }

        void Start()
        {
            var gm = ServiceLocator.Get<GameManager>();
            if (gm != null && gm.Config != null && !gm.Config.EnableDebugPanel)
            {
                gameObject.SetActive(false);
                return;
            }
            if (_startOpen) Show();
            else Hide();
        }

        void OnDestroy()
        {
            Application.logMessageReceived -= OnUnityLog;
        }

        void Update()
        {
            _fpsTimer += Time.unscaledDeltaTime;
            _fpsCount++;
            if (_fpsTimer >= 0.5f)
            {
                _currentFps = Mathf.RoundToInt(_fpsCount / _fpsTimer);
                _fpsTimer = 0; _fpsCount = 0;
            }
            if (UnityEngine.Input.GetKeyDown(_toggleKey))
            {
                if (_visible) Hide(); else Show();
            }
            if (!_visible) return;

            _refreshTimer += Time.unscaledDeltaTime;
            if (_refreshTimer >= 0.25f)
            {
                _refreshTimer = 0;
                RefreshStats();
            }
        }

        void OnUnityLog(string msg, string stack, LogType type)
        {
            if (type == LogType.Log || type == LogType.Warning || type == LogType.Error)
                Log($"{type.ToString()[0]}: {msg}");
        }

        public void Log(string msg)
        {
            _logs.Add($"[{Time.frameCount:D5}] {msg}");
            if (_logs.Count > _maxLogs) _logs.RemoveRange(0, _logs.Count - _maxLogs);
            if (_logArea != null) UpdateLogView();
        }

        void BuildUI()
        {
            var canvas = GetComponent<Canvas>();
            if (canvas == null)
            {
                canvas = gameObject.AddComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvas.sortingOrder = 32000;
                gameObject.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                gameObject.AddComponent<GraphicRaycaster>();
            }

            _root = new GameObject("DebugRoot", typeof(RectTransform));
            _root.transform.SetParent(transform, false);
            _root.AddComponent<Image>().color = new Color(0, 0, 0, 0.55f);
            _panel = (RectTransform)_root.transform;
            _panel.anchorMin = new Vector2(0, 0);
            _panel.anchorMax = new Vector2(0.38f, 1);
            _panel.offsetMin = Vector2.zero;
            _panel.offsetMax = Vector2.zero;

            BuildHeader();
            BuildActions();
            BuildStatsArea();
            BuildLogArea();
        }

        void BuildHeader()
        {
            var go = new GameObject("Header", typeof(RectTransform));
            go.transform.SetParent(_root.transform, false);
            go.AddComponent<Image>().color = new Color(0.1f, 0.4f, 0.8f, 0.8f);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = new Vector2(0, 1); rt.anchorMax = new Vector2(1, 1);
            rt.pivot = new Vector2(0.5f, 1);
            rt.offsetMin = new Vector2(0, -40); rt.offsetMax = new Vector2(0, 0);

            var t = go.AddComponent<TextMeshProUGUI>();
            t.fontSize = 20;
            t.fontStyle = FontStyles.Bold;
            t.color = Color.white;
            t.alignment = TextAlignmentOptions.Midline;
            t.text = $"🛠 Debug Panel  [按 ` 隐藏]";
        }

        void BuildActions()
        {
            var area = new GameObject("Actions", typeof(RectTransform));
            area.transform.SetParent(_root.transform, false);
            var rt = (RectTransform)area.transform;
            rt.anchorMin = new Vector2(0, 1); rt.anchorMax = new Vector2(1, 1);
            rt.pivot = new Vector2(0.5f, 1);
            rt.offsetMin = new Vector2(8, -180); rt.offsetMax = new Vector2(-8, -44);

            var grid = area.AddComponent<GridLayoutGroup>();
            grid.cellSize = new Vector2(110, 30);
            grid.spacing = new Vector2(6, 6);
            grid.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
            grid.constraintCount = 2;

            AddButton(area.transform, "暂停/继续", () => ServiceLocator.Get<GameManager>()?.TogglePause());
            AddButton(area.transform, "跳过10秒", () => SkipTime(10));
            AddButton(area.transform, "立即完成订单", ForceCompleteOrder);
            AddButton(area.transform, "加 500 分", () => ServiceLocator.Get<ScoreManager>()?.AddBonus(500));
            AddButton(area.transform, "重置连击", () => ServiceLocator.Get<ScoreManager>()?.ResetCombo());
            AddButton(area.transform, "重生玩家", RespawnPlayers);
            AddButton(area.transform, "切角色", () => ServiceLocator.Get<PlayerManager>()?.SwitchSinglePlayerCharacter());
            AddButton(area.transform, "重开本关", () => ServiceLocator.Get<GameManager>()?.RestartLevel());
            AddButton(area.transform, "胜利结算", () => ForceEnd(true));
            AddButton(area.transform, "失败结算", () => ForceEnd(false));
        }

        void BuildStatsArea()
        {
            var go = new GameObject("Stats", typeof(RectTransform));
            go.transform.SetParent(_root.transform, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = new Vector2(0, 1); rt.anchorMax = new Vector2(1, 1);
            rt.pivot = new Vector2(0.5f, 1);
            rt.offsetMin = new Vector2(8, -270); rt.offsetMax = new Vector2(-8, -184);

            _statsText = go.AddComponent<TextMeshProUGUI>();
            _statsText.fontSize = 13;
            _statsText.color = new Color(0.85f, 1f, 0.85f);
            _statsText.alignment = TextAlignmentOptions.TopLeft;
            _statsText.enableWordWrapping = true;
        }

        TMP_Text _statsText;

        void BuildLogArea()
        {
            var viewport = new GameObject("Viewport", typeof(RectTransform), typeof(RectMask2D));
            viewport.transform.SetParent(_root.transform, false);
            var vrt = (RectTransform)viewport.transform;
            vrt.anchorMin = Vector2.zero; vrt.anchorMax = Vector2.one;
            vrt.offsetMin = new Vector2(8, 8); vrt.offsetMax = new Vector2(-8, -272);

            var content = new GameObject("Content", typeof(RectTransform));
            content.transform.SetParent(viewport.transform, false);
            var crt = (RectTransform)content.transform;
            crt.anchorMin = new Vector2(0, 1); crt.anchorMax = new Vector2(1, 1);
            crt.pivot = new Vector2(0.5f, 1);
            crt.sizeDelta = new Vector2(0, 2000);

            _logArea = content.AddComponent<TextMeshProUGUI>();
            _logArea.fontSize = 13;
            _logArea.color = new Color(0.9f, 0.92f, 0.95f);
            _logArea.alignment = TextAlignmentOptions.TopLeft;
            _logArea.enableWordWrapping = true;
            _logArea.rectTransform.anchorMin = Vector2.zero;
            _logArea.rectTransform.anchorMax = Vector2.one;
            _logArea.rectTransform.offsetMin = Vector2.zero;
            _logArea.rectTransform.offsetMax = Vector2.zero;

            UpdateLogView();
        }

        void AddButton(Transform parent, string label, Action onClick)
        {
            var go = new GameObject($"Btn_{label}", typeof(RectTransform), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);
            var img = go.GetComponent<Image>();
            img.color = new Color(0.18f, 0.45f, 0.8f, 0.95f);
            var b = go.GetComponent<Button>();
            b.onClick.AddListener(() => { try { onClick?.Invoke(); Log($"▶ {label}"); } catch (Exception e) { Log($"❗ {label} 失败: {e.Message}"); } });
            var t = go.AddComponent<TextMeshProUGUI>();
            t.fontSize = 14;
            t.fontStyle = FontStyles.Bold;
            t.alignment = TextAlignmentOptions.Center;
            t.color = Color.white;
            t.text = label;
        }

        void UpdateLogView()
        {
            if (_logArea == null) return;
            var sb = new StringBuilder(_logs.Count * 80);
            for (int i = Mathf.Max(0, _logs.Count - 60); i < _logs.Count; i++)
                sb.AppendLine(_logs[i]);
            _logArea.text = sb.ToString();
        }

        void RefreshStats()
        {
            var gm = ServiceLocator.Get<GameManager>();
            var pm = ServiceLocator.Get<PlayerManager>();
            var om = ServiceLocator.Get<OrderManager>();
            var sm = ServiceLocator.Get<ScoreManager>();
            var sb = new StringBuilder();
            sb.AppendLine($"FPS: {_currentFps}    状态: {gm?.State}");
            sb.AppendLine($"关卡: {gm?.CurrentLevelConfig?.LevelName}  剩余: {gm?.TimeRemaining:0.0}s");
            sb.AppendLine($"分数: {gm?.CurrentScore}  连击: {sm?.CurrentCombo} x");
            sb.AppendLine($"玩家: {pm?.ActiveCount}   进行中订单: {om?.ActiveOrders.Count}");
            if (pm != null)
            {
                int i = 0;
                foreach (var p in pm.AllPlayers)
                {
                    if (p == null) continue;
                    i++;
                    var carry = p.Carrying?.Definition.Name ?? "空";
                    var st = p.NearbyStation?.StationName ?? "-";
                    sb.AppendLine($"  P{i} [{p.PlayerId}]: carry={carry} near={st}");
                }
            }
            if (om != null)
            {
                int idx = 0;
                foreach (var o in om.ActiveOrders)
                {
                    if (idx++ >= 3) break;
                    sb.AppendLine($"  Order {o.Index}: {o.Recipe.DisplayName} ({o.TimeRemaining:0.0}s)");
                }
            }
            if (_statsText != null) _statsText.text = sb.ToString();
        }

        void SkipTime(int secs)
        {
            var gm = ServiceLocator.Get<GameManager>();
            if (gm == null) return;
            typeof(GameManager).GetField("_timer", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(gm, Mathf.Max(1, gm.TimeRemaining - secs));
        }

        void ForceCompleteOrder()
        {
            var om = ServiceLocator.Get<OrderManager>();
            var sm = ServiceLocator.Get<ScoreManager>();
            if (om == null || om.ActiveOrders.Count == 0) return;
            var o = om.ActiveOrders[0];
            o.IsCompleted = true;
            typeof(OrderManager).GetMethod("CompleteOrder", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.Invoke(om, new object[] { o });
            int delta = o.BaseScore + 50;
            sm?.AddBonus(delta);
            EventBus.Raise(new OrderDeliveredEvent
            {
                OrderId = o.Id, ScoreGained = delta, ComboCount = sm?.CurrentCombo ?? 0, Perfect = true
            });
        }

        void RespawnPlayers()
        {
            var gm = ServiceLocator.Get<GameManager>();
            var pm = ServiceLocator.Get<PlayerManager>();
            if (gm == null || pm == null) return;
            pm.SpawnPlayersForLevel(gm.CurrentLevelConfig, gm.IsSinglePlayerMode);
        }

        void ForceEnd(bool victory)
        {
            var gm = ServiceLocator.Get<GameManager>();
            if (gm == null) return;
            if (!victory)
                typeof(GameManager).GetField("_lastFailReason", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                    ?.SetValue(gm, FailReason.ObjectiveNotMet);
            gm.EndLevel(!victory);
        }

        public void Show() { _visible = true; if (_root) _root.SetActive(true); }
        public void Hide() { _visible = false; if (_root) _root.SetActive(false); }
    }
}
