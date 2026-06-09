using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using DecorMatch3.Core;
using DecorMatch3.Match3;
using DecorMatch3.Decoration;
using DecorMatch3.Data;
using DecorMatch3.UI;
using DecorMatch3.GameFlow;
using DecorMatch3.Progression;

namespace DecorMatch3.Scenes
{
    public class MainMenuSceneController : MonoBehaviour
    {
        [SerializeField] private Transform _contentRoot;
        [SerializeField] private GameObject _levelSelectPanel;
        [SerializeField] private GameObject _orderPanel;
        [SerializeField] private GameObject _achievementPanel;
        [SerializeField] private GameObject _dailyPanel;
        [SerializeField] private GameObject _leaderboardPanel;

        private Canvas _canvas;

        private void Awake()
        {
            EnsureUIStructure();
            BuildMainMenu();
        }

        private void Start()
        {
            GameManager.Instance?.ChangeState(GameState.MainMenu);
            UIManager.Instance?.UpdateCurrencyDisplay();
        }

        private void EnsureUIStructure()
        {
            if (FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
            {
                GameObject es = new GameObject("EventSystem");
                es.AddComponent<UnityEngine.EventSystems.EventSystem>();
                es.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
            }

            _canvas = FindObjectOfType<Canvas>();
            if (_canvas == null)
            {
                GameObject canvasGO = new GameObject("MainCanvas");
                _canvas = canvasGO.AddComponent<Canvas>();
                _canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                CanvasScaler scaler = canvasGO.AddComponent<CanvasScaler>();
                scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                scaler.referenceResolution = new Vector2(1920, 1080);
                GraphicRaycaster raycaster = canvasGO.AddComponent<GraphicRaycaster>();

                if (UIManager.Instance != null)
                {
                    UIManager.Instance.SetMainCanvas(_canvas);
                }
            }

            if (_contentRoot == null)
            {
                GameObject rootGO = new GameObject("MainMenuContent");
                rootGO.transform.SetParent(_canvas.transform, false);
                RectTransform rt = rootGO.AddComponent<RectTransform>();
                rt.anchorMin = Vector2.zero;
                rt.anchorMax = Vector2.one;
                rt.offsetMin = new Vector2(0, 80);
                rt.offsetMax = Vector2.zero;
                _contentRoot = rt;
            }
        }

        private void BuildMainMenu()
        {
            GameObject bgGO = new GameObject("Background");
            bgGO.transform.SetParent(_contentRoot, false);
            Image bgImage = bgGO.AddComponent<Image>();
            bgImage.color = new Color(0.98f, 0.97f, 0.95f);
            RectTransform bgRT = bgGO.GetComponent<RectTransform>();
            bgRT.anchorMin = Vector2.zero;
            bgRT.anchorMax = Vector2.one;
            bgRT.offsetMin = Vector2.zero;
            bgRT.offsetMax = Vector2.zero;

            GameObject titleGO = new GameObject("GameTitle");
            titleGO.transform.SetParent(_contentRoot, false);
            Text titleText = titleGO.AddComponent<Text>();
            titleText.text = "🎨 装修配色三消";
            titleText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            titleText.fontSize = 64;
            titleText.fontStyle = FontStyle.Bold;
            titleText.color = new Color(0.25f, 0.35f, 0.55f);
            titleText.alignment = TextAnchor.MiddleCenter;
            RectTransform titleRT = titleGO.GetComponent<RectTransform>();
            titleRT.anchorMin = new Vector2(0.5f, 0.85f);
            titleRT.anchorMax = new Vector2(0.5f, 0.85f);
            titleRT.pivot = new Vector2(0.5f, 0.5f);
            titleRT.sizeDelta = new Vector2(800, 100);

            GameObject subtitleGO = new GameObject("Subtitle");
            subtitleGO.transform.SetParent(_contentRoot, false);
            Text subtitleText = subtitleGO.AddComponent<Text>();
            subtitleText.text = "三消收集材料 · 装修客户房间 · 收获五星好评";
            subtitleText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            subtitleText.fontSize = 26;
            subtitleText.color = new Color(0.5f, 0.55f, 0.65f);
            subtitleText.alignment = TextAnchor.MiddleCenter;
            RectTransform subtitleRT = subtitleGO.GetComponent<RectTransform>();
            subtitleRT.anchorMin = new Vector2(0.5f, 0.78f);
            subtitleRT.anchorMax = new Vector2(0.5f, 0.78f);
            subtitleRT.pivot = new Vector2(0.5f, 0.5f);
            subtitleRT.sizeDelta = new Vector2(900, 50);

            CreateButton("🎮 快速开始 - 十分钟体验", new Vector2(0.5f, 0.62f), new Vector2(500, 90),
                new Color(0.3f, 0.75f, 0.45f), () => { StartQuickPlay(); });

            CreateButton("📋 订单列表", new Vector2(0.5f, 0.5f), new Vector2(400, 70),
                new Color(0.4f, 0.6f, 0.95f), () => { ShowOrderList(); });

            CreateButton("🏆 每日挑战", new Vector2(0.5f, 0.4f), new Vector2(400, 70),
                new Color(0.95f, 0.65f, 0.25f), () => { ShowDailyChallenges(); });

            CreateButton("🎯 成就系统", new Vector2(0.28f, 0.28f), new Vector2(280, 60),
                new Color(0.6f, 0.45f, 0.85f), () => { ShowAchievements(); });

            CreateButton("📊 排行榜", new Vector2(0.5f, 0.28f), new Vector2(280, 60),
                new Color(0.3f, 0.7f, 0.8f), () => { ShowLeaderboard(); });

            CreateButton("⚙ 设置", new Vector2(0.72f, 0.28f), new Vector2(280, 60),
                new Color(0.6f, 0.6f, 0.7f), () => { ShowSettings(); });

            GameObject tipGO = new GameObject("TipText");
            tipGO.transform.SetParent(_contentRoot, false);
            Text tipText = tipGO.AddComponent<Text>();
            tipText.text = "💡 提示：先选订单→三消收集材料→装修设计→赚金币解锁更多内容";
            tipText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            tipText.fontSize = 20;
            tipText.color = new Color(0.55f, 0.55f, 0.6f);
            tipText.alignment = TextAnchor.MiddleCenter;
            RectTransform tipRT = tipGO.GetComponent<RectTransform>();
            tipRT.anchorMin = new Vector2(0.5f, 0.12f);
            tipRT.anchorMax = new Vector2(0.5f, 0.12f);
            tipRT.pivot = new Vector2(0.5f, 0.5f);
            tipRT.sizeDelta = new Vector2(900, 40);
        }

        private void CreateButton(string text, Vector2 anchor, Vector2 size, Color color, Action onClick)
        {
            GameObject btnGO = new GameObject($"Button_{text.Substring(0, Math.Min(6, text.Length))}");
            btnGO.transform.SetParent(_contentRoot, false);
            Image btnImage = btnGO.AddComponent<Image>();
            btnImage.color = color;
            btnImage.sprite = GetSprite();
            btnImage.type = Image.Type.Sliced;
            Button btn = btnGO.AddComponent<Button>();
            ColorBlock cb = btn.colors;
            cb.normalColor = color;
            cb.highlightedColor = color * 1.1f;
            cb.pressedColor = color * 0.85f;
            btn.colors = cb;
            btn.onClick.AddListener(() => { onClick?.Invoke(); });
            RectTransform btnRT = btnGO.GetComponent<RectTransform>();
            btnRT.anchorMin = anchor;
            btnRT.anchorMax = anchor;
            btnRT.pivot = new Vector2(0.5f, 0.5f);
            btnRT.sizeDelta = size;

            GameObject textGO = new GameObject("Text");
            textGO.transform.SetParent(btnGO.transform, false);
            Text btnText = textGO.AddComponent<Text>();
            btnText.text = text;
            btnText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            btnText.fontSize = 26;
            btnText.fontStyle = FontStyle.Bold;
            btnText.color = Color.white;
            btnText.alignment = TextAnchor.MiddleCenter;
            RectTransform textRT = textGO.GetComponent<RectTransform>();
            textRT.anchorMin = Vector2.zero;
            textRT.anchorMax = Vector2.one;
            textRT.offsetMin = Vector2.zero;
            textRT.offsetMax = Vector2.zero;
        }

        private Sprite GetSprite()
        {
            return Resources.GetBuiltinResource<Sprite>("UI/Skin/UISprite.psd");
        }

        private void StartQuickPlay()
        {
            DecorationOrder firstOrder = null;
            foreach (DecorationOrder order in DataManager.Instance.Orders)
            {
                if (order.MinLevelRequirement <= 1 || order.RequiredLevelIds == null || order.RequiredLevelIds.Length == 0
                    || (order.RequiredLevelIds.Length > 0 && order.RequiredLevelIds[0] == 1))
                {
                    firstOrder = order;
                    break;
                }
            }

            if (firstOrder == null && DataManager.Instance.Orders.Count > 0)
            {
                firstOrder = DataManager.Instance.Orders[0];
            }

            if (firstOrder == null)
            {
                UIManager.Instance?.ShowToast("暂无可用订单，请先生成数据");
                return;
            }

            UIManager.Instance?.ShowToast($"选择订单：{firstOrder.OrderTitle}");
            GameFlowController.Instance?.SelectOrder(firstOrder.OrderId);
        }

        private void ShowOrderList()
        {
            string orderList = "📋 可接订单：\n\n";
            foreach (DecorationOrder order in DataManager.Instance.Orders)
            {
                string status = GetOrderStatus(order);
                orderList += $"【{order.OrderTitle}】\n";
                orderList += $"   客户：{order.Customer?.CustomerName ?? "未知"}\n";
                orderList += $"   类型：{order.Category} · {order.RoomSize}\n";
                orderList += $"   预算：${order.BudgetMin}~${order.BudgetMax}\n";
                orderList += $"   状态：{status}\n\n";
            }

            UIManager.Instance?.ShowDialog("订单列表", orderList,
                "选择第一个订单", "关闭",
                () => { StartQuickPlay(); });
        }

        private string GetOrderStatus(DecorationOrder order)
        {
            if (SaveSystem.Instance == null) return "🆕 可接取";
            if (SaveSystem.Instance.CurrentSave.CompletedOrderIds.Contains(order.OrderId)) return "✅ 已完成";
            if (SaveSystem.Instance.CurrentSave.ActiveOrderIds.Contains(order.OrderId)) return "⏳ 进行中";
            if (order.MinLevelRequirement > 0 && SaveSystem.Instance.CurrentSave.HighestLevel < order.MinLevelRequirement)
                return $"🔒 需要通关第{order.MinLevelRequirement}关";
            return "🆕 可接取";
        }

        private void ShowDailyChallenges()
        {
            DailyChallengeManager mgr = GameFlowController.Instance?.DailyChallengeManager;
            if (mgr == null) return;

            string info = "🏆 今日挑战：\n\n";
            int idx = 1;
            foreach (var kvp in mgr.TodaysChallenges)
            {
                var c = kvp.Value;
                string status = c.IsCompleted ? "✅" : $"⏳ ({c.CurrentProgress}/{c.Data.TargetValue})";
                info += $"{idx++}. {c.Data.Title} {status}\n";
                info += $"   {c.Data.Description}\n";
                info += $"   奖励：💰{c.Data.CoinReward} 💎{c.Data.GemReward}\n\n";
            }

            info += $"\n已完成：{mgr.GetCompletedCount()}/{mgr.TodaysChallenges.Count}";
            if (mgr.AreAllChallengesCompleted()) info += "\n🎉 今日全部完成！";

            UIManager.Instance?.ShowDialog("每日挑战", info, "好的");
        }

        private void ShowAchievements()
        {
            AchievementManager mgr = AchievementManager.Instance;
            if (mgr == null) return;

            string info = "🎯 成就进度：\n\n";
            int unlocked = 0;
            foreach (AchievementData ach in mgr.AllAchievements)
            {
                AchievementProgress progress = mgr.GetProgress(ach.AchievementId);
                bool isUnlocked = progress?.IsUnlocked ?? false;
                if (isUnlocked) unlocked++;
                string icon = isUnlocked ? "✅" : "⬜";
                float pct = progress?.GetProgressPercentage(ach.TargetValue) ?? 0f;
                info += $"{icon} {ach.Name} - {Mathf.RoundToInt(pct * 100)}%\n";
            }

            info += $"\n\n已解锁：{unlocked}/{mgr.AllAchievements.Count} ({Mathf.RoundToInt(mgr.GetOverallProgress() * 100)}%)";

            UIManager.Instance?.ShowDialog("成就系统", info, "好的");
        }

        private void ShowLeaderboard()
        {
            LeaderboardManager mgr = GameFlowController.Instance?.LeaderboardManager;
            if (mgr == null) return;

            string info = "📊 全球排行榜：\n\n";
            var entries = mgr.GetLeaderboard(LeaderboardType.GlobalScore, 10);
            for (int i = 0; i < entries.Count; i++)
            {
                var e = entries[i];
                string me = e.IsCurrentPlayer ? " 👈 你" : "";
                info += $"{i + 1}. {e.PlayerName} - 分数:{e.Score:N0} - 关卡:{e.Level}{me}\n";
            }

            int myRank = mgr.GetPlayerRankNumber(LeaderboardType.GlobalScore);
            if (myRank > 0) info += $"\n你的排名：第 {myRank} 名";

            UIManager.Instance?.ShowDialog("排行榜", info, "好的");
        }

        private void ShowSettings()
        {
            string info = "⚙ 设置（将在正式版本完善）\n\n" +
                          "音量：通过AudioManager调整\n" +
                          "震动：通过AudioManager调整\n" +
                          "语言：中文(简体)\n\n" +
                          "存档位置：\n" +
                          Application.persistentDataPath;

            UIManager.Instance?.ShowDialog("设置", info, "清除存档", "关闭",
                () => {
                    UIManager.Instance?.ShowDialog("确认清除", "确定要清除所有存档吗？此操作不可撤销！",
                        "确认删除", "取消",
                        () => {
                            SaveSystem.Instance?.DeleteSave();
                            UIManager.Instance?.ShowToast("存档已清除，重新进入游戏生效");
                        });
                });
        }
    }
}
