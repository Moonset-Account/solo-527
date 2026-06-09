using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using KitchenChaos.Core;

namespace KitchenChaos.UI
{
    public class ResultPanel : MonoBehaviour
    {
        [Header("Victory")]
        [SerializeField] GameObject _victoryRoot;
        [SerializeField] TMP_Text _victoryTitle;
        [SerializeField] TMP_Text _victoryScore;
        [SerializeField] Image[] _victoryStars;
        [SerializeField] Transform _rewardListParent;
        [SerializeField] TMP_Text _rewardSummary;

        [Header("Failure")]
        [SerializeField] GameObject _failureRoot;
        [SerializeField] TMP_Text _failureTitle;
        [SerializeField] TMP_Text _failureReason;
        [SerializeField] TMP_Text _failureScore;
        [SerializeField] Transform _tipsParent;

        [Header("Buttons")]
        [SerializeField] Button _retryButton;
        [SerializeField] Button _nextButton;
        [SerializeField] Button _menuButton;
        [SerializeField] Button _reviewButton;

        bool _subscribed;

        void OnEnable()
        {
            AutoBuildUI();
            if (!_subscribed)
            {
                EventBus.Subscribe<LevelEndedEvent>(OnLevelEnded);
                _subscribed = true;
            }
            if (_retryButton != null) _retryButton.onClick.AddListener(OnRetry);
            if (_nextButton != null) _nextButton.onClick.AddListener(OnNext);
            if (_menuButton != null) _menuButton.onClick.AddListener(OnMenu);
            if (_reviewButton != null) _reviewButton.onClick.AddListener(OnReview);
            HideAll();
        }

        void AutoBuildUI()
        {
            var root = (RectTransform)transform;
            EnsureOverlayPanel(ref _victoryRoot, root, "Victory", out var vicContent, new Color(0.15f, 0.35f, 0.2f, 0.96f));
            EnsureOverlayPanel(ref _failureRoot, root, "Failure", out var failContent, new Color(0.4f, 0.15f, 0.15f, 0.96f));

            BuildVictory(vicContent);
            BuildFailure(failContent);
            BuildSharedButtons(root);
        }

        static void EnsureOverlayPanel(ref GameObject field, RectTransform parent, string name, out RectTransform content, Color bg)
        {
            if (field == null)
            {
                var go = new GameObject(name, typeof(RectTransform), typeof(Image));
                go.transform.SetParent(parent, false);
                var rt = (RectTransform)go.transform;
                rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one;
                rt.offsetMin = Vector2.zero; rt.offsetMax = Vector2.zero;
                go.GetComponent<Image>().color = bg;
                field = go;
            }
            content = (RectTransform)field.transform;
            if (content.childCount == 0)
            {
                var inner = new GameObject("Content", typeof(RectTransform));
                inner.transform.SetParent(content, false);
                var irt = (RectTransform)inner.transform;
                irt.anchorMin = new Vector2(0.15f, 0.1f); irt.anchorMax = new Vector2(0.85f, 0.9f);
                irt.offsetMin = Vector2.zero; irt.offsetMax = Vector2.zero;
                content = irt;
            }
        }

        void BuildVictory(RectTransform c)
        {
            _victoryTitle = MakeText(c, "VTitle", "🎉 关卡完成！", 42, 0.92f, new Color(1f, 0.95f, 0.5f));
            _victoryScore = MakeText(c, "VScore", "总分：0", 28, 0.78f);
            var starsGo = new GameObject("Stars", typeof(RectTransform));
            starsGo.transform.SetParent(c, false);
            var srt = (RectTransform)starsGo.transform;
            srt.anchorMin = new Vector2(0.25f, 0.58f); srt.anchorMax = new Vector2(0.75f, 0.72f);
            srt.offsetMin = Vector2.zero; srt.offsetMax = Vector2.zero;
            _victoryStars = new Image[3];
            for (int i = 0; i < 3; i++)
            {
                var sg = new GameObject($"S{i}", typeof(RectTransform), typeof(Image));
                sg.transform.SetParent(starsGo.transform, false);
                var s = (RectTransform)sg.transform;
                s.anchorMin = new Vector2((float)i / 3, 0); s.anchorMax = new Vector2((float)(i + 1) / 3, 1);
                s.offsetMin = new Vector2(10, 0); s.offsetMax = new Vector2(-10, 0);
                var img = sg.GetComponent<Image>();
                img.color = new Color(1, 1, 1, 0.3f);
                var t = sg.AddComponent<TextMeshProUGUI>();
                t.text = "⭐"; t.fontSize = 56; t.alignment = TextAlignmentOptions.Center;
                _victoryStars[i] = img;
            }
            var rewardsGo = new GameObject("Rewards", typeof(RectTransform));
            rewardsGo.transform.SetParent(c, false);
            var rrt = (RectTransform)rewardsGo.transform;
            rrt.anchorMin = new Vector2(0.1f, 0.35f); rrt.anchorMax = new Vector2(0.9f, 0.55f);
            rrt.offsetMin = Vector2.zero; rrt.offsetMax = Vector2.zero;
            var svg = rewardsGo.AddComponent<VerticalLayoutGroup>();
            svg.childControlHeight = true; svg.childControlWidth = true;
            svg.childForceExpandHeight = false; svg.childForceExpandWidth = true;
            svg.spacing = 8;
            _rewardListParent = rewardsGo.transform;
            _rewardSummary = MakeText(c, "VSummary", "你做到了！", 18, 0.30f, new Color(0.85f, 1f, 0.9f));
        }

        void BuildFailure(RectTransform c)
        {
            _failureTitle = MakeText(c, "FTitle", "💥 关卡失败", 40, 0.88f, new Color(1f, 0.6f, 0.6f));
            _failureScore = MakeText(c, "FScore", "最终得分：0", 26, 0.75f);
            _failureReason = MakeText(c, "FReason", "原因未明", 22, 0.65f, new Color(1f, 0.85f, 0.5f));
            var tipsGo = new GameObject("Tips", typeof(RectTransform));
            tipsGo.transform.SetParent(c, false);
            var trt = (RectTransform)tipsGo.transform;
            trt.anchorMin = new Vector2(0.1f, 0.35f); trt.anchorMax = new Vector2(0.9f, 0.60f);
            trt.offsetMin = Vector2.zero; trt.offsetMax = Vector2.zero;
            var tlg = tipsGo.AddComponent<VerticalLayoutGroup>();
            tlg.childControlHeight = true; tlg.childControlWidth = true;
            tlg.childForceExpandHeight = false; tlg.childForceExpandWidth = true;
            tlg.spacing = 6;
            _tipsParent = tipsGo.transform;
        }

        void BuildSharedButtons(RectTransform root)
        {
            if (_retryButton == null)
            {
                _retryButton = MakeOverlayBtn(root, "🔄  重 试 关 卡", new Vector2(0.5f, 0.18f), new Vector2(340, 64), new Color(0.25f, 0.6f, 0.25f));
                _retryButton.transform.SetAsLastSibling();
            }
            if (_nextButton == null)
            {
                _nextButton = MakeOverlayBtn(root, "➡  下 一 关", new Vector2(0.8f, 0.18f), new Vector2(240, 64), new Color(0.2f, 0.45f, 0.75f));
                _nextButton.transform.SetAsLastSibling();
            }
            if (_menuButton == null)
            {
                _menuButton = MakeOverlayBtn(root, "🏠  主 菜 单", new Vector2(0.2f, 0.18f), new Vector2(240, 64), new Color(0.5f, 0.35f, 0.6f));
                _menuButton.transform.SetAsLastSibling();
            }
        }

        static TMP_Text MakeText(RectTransform parent, string name, string txt, int size, float yAnchor, Color? color = null)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = new Vector2(0, yAnchor); rt.anchorMax = new Vector2(1, yAnchor);
            rt.pivot = new Vector2(0.5f, yAnchor > 0.5f ? 1 : 0);
            rt.sizeDelta = new Vector2(0, size + 20);
            var t = go.AddComponent<TextMeshProUGUI>();
            t.text = txt; t.fontSize = size; t.alignment = TextAlignmentOptions.Center;
            t.color = color ?? Color.white; t.enableWordWrapping = true;
            return t;
        }

        static Button MakeOverlayBtn(RectTransform parent, string text, Vector2 anchor, Vector2 size, Color c)
        {
            var go = new GameObject("Btn", typeof(RectTransform), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform;
            rt.anchorMin = new Vector2(anchor.x, anchor.y); rt.anchorMax = rt.anchorMin;
            rt.pivot = new Vector2(0.5f, 0.5f); rt.sizeDelta = size; rt.anchoredPosition = Vector2.zero;
            go.GetComponent<Image>().color = c;
            var btn = go.GetComponent<Button>();
            var colors = btn.colors;
            colors.highlightedColor = c * 1.15f;
            colors.pressedColor = c * 0.85f;
            btn.colors = colors;
            var tgo = new GameObject("T", typeof(RectTransform));
            tgo.transform.SetParent(go.transform, false);
            var trt = (RectTransform)tgo.transform;
            trt.anchorMin = Vector2.zero; trt.anchorMax = Vector2.one;
            trt.offsetMin = Vector2.zero; trt.offsetMax = Vector2.zero;
            var t = tgo.AddComponent<TextMeshProUGUI>();
            t.text = text; t.fontSize = Mathf.RoundToInt(size.y * 0.38f);
            t.alignment = TextAlignmentOptions.Center;
            t.color = Color.white; t.fontStyle = FontStyles.Bold;
            return btn;
        }

        void OnDisable()
        {
            EventBus.Unsubscribe<LevelEndedEvent>(OnLevelEnded);
            _subscribed = false;
            if (_retryButton != null) _retryButton.onClick.RemoveListener(OnRetry);
            if (_nextButton != null) _nextButton.onClick.RemoveListener(OnNext);
            if (_menuButton != null) _menuButton.onClick.RemoveListener(OnMenu);
            if (_reviewButton != null) _reviewButton.onClick.RemoveListener(OnReview);
        }

        void HideAll()
        {
            if (_victoryRoot) _victoryRoot.SetActive(false);
            if (_failureRoot) _failureRoot.SetActive(false);
        }

        void OnLevelEnded(LevelEndedEvent e)
        {
            gameObject.SetActive(true);
            if (e.Victory) ShowVictory(e);
            else ShowFailure(e);
        }

        void ShowVictory(LevelEndedEvent e)
        {
            if (_victoryRoot) _victoryRoot.SetActive(true);
            if (_victoryTitle) _victoryTitle.text = "🎉 关卡完成！";
            if (_victoryScore) _victoryScore.text = $"总分：{e.FinalScore}";
            for (int i = 0; i < 3; i++)
                if (_victoryStars != null && i < _victoryStars.Length)
                    if (_victoryStars[i])
                        _victoryStars[i].color = i < e.StarsEarned ? Color.yellow : new Color(1f, 1f, 1f, 0.3f);

            var gm = ServiceLocator.Get<GameManager>();
            var level = gm?.CurrentLevelConfig;
            if (_rewardListParent != null && level != null)
            {
                ClearChildren(_rewardListParent);
                int coinReward = Mathf.Max(10, e.FinalScore / 10);
                AddReward(_rewardListParent, $"💰 金币 +{coinReward}");
                if (e.StarsEarned > 0) AddReward(_rewardListParent, $"⭐ 星级 x{e.StarsEarned}");
                if (e.StarsEarned == 3) AddReward(_rewardListParent, "🏆 完美通关奖励！");
            }
            if (_rewardSummary) _rewardSummary.text = $"目标分数 {level?.StarThresholds[0] ?? 100}，你做到了！继续挑战更高分吧。";
            if (_nextButton != null) _nextButton.gameObject.SetActive(true);
        }

        void ShowFailure(LevelEndedEvent e)
        {
            if (_failureRoot) _failureRoot.SetActive(true);
            if (_failureTitle) _failureTitle.text = "💥 关卡失败";
            if (_failureScore) _failureScore.text = $"最终得分：{e.FinalScore}";
            if (_failureReason) _failureReason.text = GetFailReasonText(e.FailReason);
            if (_tipsParent != null)
            {
                ClearChildren(_tipsParent);
                foreach (var tip in GetTipsFor(e.FailReason))
                    AddTip(_tipsParent, tip);
            }
            if (_nextButton != null) _nextButton.gameObject.SetActive(false);
        }

        string GetFailReasonText(FailReason r) => r switch
        {
            FailReason.TimeUp => "⏰ 时间到！分数未达到最低要求。",
            FailReason.TooManyFailedOrders => "📋 太多订单超时了，顾客失望离去。",
            FailReason.AllPlayersDown => "😵 所有厨师都倒下了……",
            FailReason.ObjectiveNotMet => "🎯 未达成关卡目标分数。",
            _ => "未知原因，再接再厉！"
        };

        IEnumerable<string> GetTipsFor(FailReason r)
        {
            switch (r)
            {
                case FailReason.TimeUp:
                    yield return "💡 优先完成分数较高、配料较少的订单。";
                    yield return "💡 熟练使用切菜站和烹饪站的并行处理。";
                    yield return "💡 多人模式下合理分工：一人切菜一人烹饪。";
                    break;
                case FailReason.TooManyFailedOrders:
                    yield return "💡 不要同时接太多订单，保持队列 2-3 单即可。";
                    yield return "💡 订单时间不足 25% 时可考虑放弃以避免连锁失败。";
                    break;
                default:
                    yield return "💡 多练习基础操作：E 交互 / Q 副交互 / F 丢弃。";
                    yield return "💡 单人模式按 Tab 切换不同角色。";
                    break;
            }
        }

        void ClearChildren(Transform t)
        {
            if (t == null) return;
            for (int i = t.childCount - 1; i >= 0; i--) Destroy(t.GetChild(i).gameObject);
        }

        void AddReward(Transform parent, string text)
        {
            var go = new GameObject("Reward", typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var txt = go.AddComponent<TextMeshProUGUI>();
            txt.fontSize = 18;
            txt.color = new Color(1f, 0.9f, 0.4f);
            txt.text = text;
        }

        void AddTip(Transform parent, string text)
        {
            var go = new GameObject("Tip", typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var txt = go.AddComponent<TextMeshProUGUI>();
            txt.fontSize = 15;
            txt.color = new Color(0.8f, 0.9f, 1f);
            txt.enableWordWrapping = true;
            txt.text = text;
        }

        void OnRetry()
        {
            var gm = ServiceLocator.Get<GameManager>();
            gm?.RestartLevel();
            HideAll();
        }

        void OnNext()
        {
            var gm = ServiceLocator.Get<GameManager>();
            if (gm == null || gm.Config == null) return;
            int next = gm.CurrentLevelIndex + 1;
            if (next < gm.Config.Levels.Length)
            {
                gm.StartLevel(next);
            }
            else
            {
                gm.ChangeState(GameState.GameComplete);
            }
            HideAll();
        }

        void OnMenu()
        {
            var gm = ServiceLocator.Get<GameManager>();
            gm?.ExitToMenu();
            HideAll();
        }

        void OnReview()
        {
            var gm = ServiceLocator.Get<GameManager>();
            if (gm != null)
            {
                Debug.Log($"[Review] Level {gm.CurrentLevelIndex} | Score {gm.CurrentScore} | Time {gm.TimeRemaining}");
            }
        }
    }
}
