using UnityEngine;
using UnityEngine.UI;
using System;
using PuppetTheater.Data;

namespace PuppetTheater.UI
{
    public class ResultScreen : MonoBehaviour
    {
        [Header("Container")]
        [SerializeField] private GameObject _resultContainer;

        [Header("Breakdown")]
        [SerializeField] private Text _perfectCountText;
        [SerializeField] private Text _greatCountText;
        [SerializeField] private Text _goodCountText;
        [SerializeField] private Text _earlyCountText;
        [SerializeField] private Text _lateCountText;
        [SerializeField] private Text _missCountText;

        [Header("Summary")]
        [SerializeField] private Text _accuracyText;
        [SerializeField] private Text _maxComboText;
        [SerializeField] private Text _totalScoreText;
        [SerializeField] private Text _storyBranchText;
        [SerializeField] private Text _audienceEmotionText;
        [SerializeField] private Text _gradeText;

        [Header("Status")]
        [SerializeField] private GameObject _completedGroup;
        [SerializeField] private GameObject _failedGroup;
        [SerializeField] private Text _failReasonText;

        [Header("Tips")]
        [SerializeField] private Text _improvementTipText;
        [SerializeField] private Text _earlyLateSummaryText;

        [Header("Buttons")]
        [SerializeField] private Button _restartButton;
        [SerializeField] private Button _returnToMenuButton;
        [SerializeField] private Button _retryButton;

        public event Action OnRestart;
        public event Action OnReturnToMenu;
        public event Action OnRetry;

        private bool _listenersAttached;

        private void Awake()
        {
            TryAttachListeners();
        }

        private void TryAttachListeners()
        {
            if (_listenersAttached) return;

            if (_restartButton != null && _returnToMenuButton != null && _retryButton != null)
            {
                _restartButton.onClick.AddListener(OnRestartPressed);
                _returnToMenuButton.onClick.AddListener(OnReturnToMenuPressed);
                _retryButton.onClick.AddListener(OnRetryPressed);
                _listenersAttached = true;
            }
        }

        private void OnDestroy()
        {
            if (_restartButton != null) _restartButton.onClick.RemoveListener(OnRestartPressed);
            if (_returnToMenuButton != null) _returnToMenuButton.onClick.RemoveListener(OnReturnToMenuPressed);
            if (_retryButton != null) _retryButton.onClick.RemoveListener(OnRetryPressed);
        }

        public void DisplayResults(PerformanceStats stats)
        {
            TryAttachListeners();

            gameObject.SetActive(true);

            if (_resultContainer != null)
                _resultContainer.SetActive(true);

            _perfectCountText.text = stats.PerfectCount.ToString();
            _greatCountText.text = stats.GreatCount.ToString();
            _goodCountText.text = stats.GoodCount.ToString();
            _earlyCountText.text = stats.EarlyCount.ToString();
            _lateCountText.text = stats.LateCount.ToString();
            _missCountText.text = stats.MissCount.ToString();

            float accuracyPercent = stats.Accuracy * 100f;
            _accuracyText.text = $"{accuracyPercent:F1}%";
            _maxComboText.text = stats.MaxCombo.ToString();
            _totalScoreText.text = stats.TotalScore.ToString("F0");
            _storyBranchText.text = GetStoryBranchName(stats.FinalBranch);
            _audienceEmotionText.text = GetAudienceEmotionName(stats.AudienceEmotionScore);

            _gradeText.text = GetPerformanceGrade(stats);
            _earlyLateSummaryText.text = GetEarlyLateSummary(stats);
            _improvementTipText.text = GetImprovementTip(stats);

            if (stats.Completed)
            {
                _completedGroup.SetActive(true);
                _failedGroup.SetActive(false);
                _failReasonText.text = GetFailReasonText(FailReason.None);
            }
            else
            {
                _completedGroup.SetActive(false);
                _failedGroup.SetActive(true);
                _failReasonText.text = GetFailReasonText(stats.FailReason);
            }
        }

        public static string GetFailReasonText(FailReason reason)
        {
            switch (reason)
            {
                case FailReason.TooManyMisses:
                    return "失误过多，观众失去了耐心";
                case FailReason.AudienceLeft:
                    return "观众情绪过低，剧场已经清场";
                case FailReason.PuppetCollapsed:
                    return "木偶倒下了，演出无法继续";
                case FailReason.StoryDeadEnd:
                    return "剧情走入死胡同，演出被迫中断";
                default:
                    return "";
            }
        }

        public static string GetEarlyLateSummary(PerformanceStats stats)
        {
            return $"早拍 {stats.EarlyCount} 次 / 晚拍 {stats.LateCount} 次 / 漏拍 {stats.MissCount} 次";
        }

        public static string GetPerformanceGrade(PerformanceStats stats)
        {
            float accuracyPercent = stats.Accuracy * 100f;

            if (accuracyPercent > 95f) return "S";
            if (accuracyPercent > 85f) return "A";
            if (accuracyPercent > 70f) return "B";
            if (accuracyPercent > 50f) return "C";
            return "D";
        }

        public static string GetImprovementTip(PerformanceStats stats)
        {
            if (stats.EarlyCount > stats.LateCount && stats.EarlyCount > stats.MissCount)
                return "你的节奏偏快，试着等节拍到了再按";
            if (stats.LateCount > stats.EarlyCount && stats.LateCount > stats.MissCount)
                return "你的节奏偏慢，试着提前一点点按下";
            if (stats.MissCount > stats.EarlyCount && stats.MissCount > stats.LateCount)
                return "专注节拍提示，先从慢速练习开始";

            if (stats.Accuracy > 0.85f)
                return "表现出色！继续挑战更高难度";

            return "继续练习，你会越来越好的！";
        }

        public void OnRestartPressed()
        {
            OnRestart?.Invoke();
        }

        public void OnReturnToMenuPressed()
        {
            OnReturnToMenu?.Invoke();
        }

        public void OnRetryPressed()
        {
            OnRetry?.Invoke();
        }

        private static string GetStoryBranchName(StoryBranch branch)
        {
            switch (branch)
            {
                case StoryBranch.Heroic: return "英雄线";
                case StoryBranch.Tragic: return "悲剧线";
                case StoryBranch.Comedic: return "喜剧线";
                case StoryBranch.Mysterious: return "悬疑线";
                default: return "默认线";
            }
        }

        private static string GetAudienceEmotionName(float score)
        {
            if (score <= 0.2f) return "狂热";
            if (score <= 0.4f) return "开心";
            if (score <= 0.6f) return "一般";
            if (score <= 0.8f) return "无聊";
            return "愤怒";
        }
    }
}
