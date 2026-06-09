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
