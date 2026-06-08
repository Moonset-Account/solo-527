using UnityEngine;
using UnityEngine.UI;
using TMPro;
using RainAlley.Core;
using RainAlley.GameFlow;
using RainAlley.Leaderboard;
using System.Collections.Generic;

namespace RainAlley.UI
{
    public class ResultsPageUI : MonoBehaviour
    {
        [Header("页面")]
        public GameObject ResultsRoot;

        [Header("关卡信息")]
        public TMP_Text LevelNameText;
        public TMP_Text LevelNumberText;

        [Header("分数与评级")]
        public TMP_Text ScoreText;
        public TMP_Text GradeText;
        public Image GradeBackground;
        public TMP_Text AccuracyText;
        public TMP_Text RankText;

        [Header("判定统计 (核心需求：完美拍/早拍/晚拍)")]
        public TMP_Text PerfectCountText;
        public TMP_Text EarlyCountText;
        public TMP_Text LateCountText;
        public TMP_Text MissCountText;

        [Header("判定条形图 (可视化分布)")]
        public Image PerfectBar;
        public Image EarlyBar;
        public Image LateBar;
        public Image MissBar;

        [Header("问题分析")]
        public TMP_Text ProblemAnalysisText;
        public TMP_Text SuggestionText;

        [Header("连击")]
        public TMP_Text MaxComboText;

        [Header("排行榜列表")]
        public RectTransform LeaderboardContainer;
        public GameObject LeaderboardEntryPrefab;
        public int DisplayTopN = 5;

        [Header("按钮")]
        public Button RetryBtn;
        public Button NextLevelBtn;
        public Button ToMenuBtn;

        [Header("评级颜色")]
        public Color GradeSColor = new Color(1f, 0.85f, 0.3f);
        public Color GradeAColor = new Color(0.4f, 0.9f, 1f);
        public Color GradeBColor = new Color(0.5f, 1f, 0.5f);
        public Color GradeCColor = new Color(1f, 0.7f, 0.3f);
        public Color GradeDColor = new Color(1f, 0.5f, 0.5f);
        public Color GradeFColor = new Color(0.5f, 0.5f, 0.5f);

        private GameManager _game;

        private void Start()
        {
            _game = GameManager.Instance;

            if (RetryBtn != null) RetryBtn.onClick.AddListener(() => _game.RestartLevel());
            if (NextLevelBtn != null) NextLevelBtn.onClick.AddListener(OnNextLevel);
            if (ToMenuBtn != null) ToMenuBtn.onClick.AddListener(() => _game.ExitToMenu());

            if (_game != null)
                _game.OnStateChanged += HandleStateChanged;

            if (ResultsRoot != null) ResultsRoot.SetActive(false);
        }

        private void OnDestroy()
        {
            if (_game != null) _game.OnStateChanged -= HandleStateChanged;
        }

        private void HandleStateChanged(GameState oldState, GameState newState)
        {
            if (newState == GameState.Results) ShowResults();
            else if (ResultsRoot != null && ResultsRoot.activeSelf) ResultsRoot.SetActive(false);
        }

        public void ShowResults()
        {
            if (_game == null || _game.CurrentLevel == null) return;

            var level = _game.CurrentLevel;
            var stats = _game.CurrentStats;

            if (ResultsRoot != null) ResultsRoot.SetActive(true);

            if (LevelNameText != null) LevelNameText.text = level.LevelName;
            if (LevelNumberText != null) LevelNumberText.text = $"第 {level.LevelNumber} 关";

            int total = Mathf.Max(1, stats.TotalObstacles);
            if (ScoreText != null) ScoreText.text = stats.TotalScore.ToString("N0");
            if (AccuracyText != null) AccuracyText.text = $"{(stats.Accuracy * 100):F2}%";

            string grade = ComputeGrade(stats.Accuracy, stats.MissCount, total);
            if (GradeText != null) GradeText.text = grade;
            if (GradeBackground != null)
                GradeBackground.color = GetGradeColor(grade);

            int rank = _game.Leaderboard.GetRankForScore(level.LevelId, stats.TotalScore, stats.Accuracy);
            int totalEntries = _game.Leaderboard.GetEntriesForLevel(level.LevelId).Count;
            if (RankText != null)
                RankText.text = totalEntries > 0 ? $"当前排名：#{rank} / {totalEntries}" : "首次通关！";

            if (PerfectCountText != null)
                PerfectCountText.text = stats.PerfectCount.ToString();
            if (EarlyCountText != null)
                EarlyCountText.text = stats.EarlyCount.ToString();
            if (LateCountText != null)
                LateCountText.text = stats.LateCount.ToString();
            if (MissCountText != null)
                MissCountText.text = stats.MissCount.ToString();

            UpdateBarChart(stats);
            AnalyzeProblems(stats, level);

            if (MaxComboText != null)
                MaxComboText.text = stats.MaxCombo.ToString();

            PopulateLeaderboard(level.LevelId);

            bool canNext = level.LevelNumber < 4;
            if (NextLevelBtn != null)
                NextLevelBtn.interactable = canNext && stats.Accuracy >= 0.6;
        }

        private void UpdateBarChart(GameStats stats)
        {
            int total = Mathf.Max(1, stats.TotalObstacles);
            if (PerfectBar != null)
                SetBarHeight(PerfectBar, (float)stats.PerfectCount / total);
            if (EarlyBar != null)
                SetBarHeight(EarlyBar, (float)stats.EarlyCount / total);
            if (LateBar != null)
                SetBarHeight(LateBar, (float)stats.LateCount / total);
            if (MissBar != null)
                SetBarHeight(MissBar, (float)stats.MissCount / total);
        }

        private void SetBarHeight(Image bar, float ratio)
        {
            if (bar == null || bar.rectTransform == null) return;
            var rect = bar.rectTransform;
            var size = rect.sizeDelta;
            size.y = Mathf.Lerp(10f, 180f, ratio);
            rect.sizeDelta = size;
        }

        private void AnalyzeProblems(GameStats stats, LevelConfig level)
        {
            int early = stats.EarlyCount;
            int late = stats.LateCount;
            int perfect = stats.PerfectCount;
            int miss = stats.MissCount;
            int total = Mathf.Max(1, stats.TotalObstacles);

            List<string> issues = new List<string>();
            List<string> suggestions = new List<string>();

            if (early > late * 2 && early >= 3)
            {
                issues.Add($"早拍偏多（{early}次，是晚拍的{(float)early / Mathf.Max(1, late):F1}倍）");
                suggestions.Add("建议稍微放慢反应速度，等障碍物更靠近判定线再行动");
                if (_game.Calibration.Settings.TotalLatencyMs < 20)
                    suggestions.Add("或在校准页将延迟调高 10~30ms");
            }
            else if (late > early * 2 && late >= 3)
            {
                issues.Add($"晚拍偏多（{late}次，是早拍的{(float)late / Mathf.Max(1, early):F1}倍）");
                suggestions.Add("建议提前预判节奏，稍微加快反应");
                if (_game.Calibration.Settings.TotalLatencyMs > -20)
                    suggestions.Add("或在校准页将延迟调低 10~30ms");
            }
            else if (early + late > total * 0.4)
            {
                issues.Add("整体节奏感偏差，判定偏散");
                suggestions.Add("建议先返回校准页重新校准");
                suggestions.Add("或在练习模式放慢BPM熟悉歌曲节拍");
            }

            if (miss >= level.MissThreshold * 2)
            {
                bool colorMiss = false;
                foreach (var o in _game.TrackMgr.AllObstacles)
                {
                    if (o.Status == RainAlley.Track.ObstacleStatus.Missed ||
                        (o.Status == RainAlley.Track.ObstacleStatus.Judged && !o.Result.ColorCorrect))
                    {
                        colorMiss = true; break;
                    }
                }
                if (colorMiss)
                {
                    issues.Add("颜色切换错误或过慢导致断连");
                    suggestions.Add("尝试提前1~2拍预判并切换纸伞颜色");
                    if (level.AvailableColors.Count > 2)
                        suggestions.Add("使用快捷键 (1/2/3/4) 直接选择颜色，比循环切换更快");
                }
                else if (level.UnlockDualTrack)
                {
                    issues.Add("可能存在轨道切换失误");
                    suggestions.Add("注意灯笼门出现前的轨道指示，提前切换");
                }
            }

            if (issues.Count == 0)
            {
                issues.Add("整体发挥非常稳定，继续保持！");
                suggestions.Add("挑战更快速率或尝试更高难度关卡");
            }

            if (ProblemAnalysisText != null)
                ProblemAnalysisText.text = "• " + string.Join("\n• ", issues);
            if (SuggestionText != null)
                SuggestionText.text = "→ " + string.Join("\n→ ", suggestions);
        }

        private string ComputeGrade(double acc, int miss, int total)
        {
            double missRate = (double)miss / total;
            if (acc >= 0.98 && missRate <= 0.02) return "S+";
            if (acc >= 0.95) return "S";
            if (acc >= 0.90) return "A";
            if (acc >= 0.80) return "B";
            if (acc >= 0.70) return "C";
            if (acc >= 0.60) return "D";
            return "F";
        }

        private Color GetGradeColor(string grade)
        {
            switch (grade)
            {
                case "S+": case "S": return GradeSColor;
                case "A": return GradeAColor;
                case "B": return GradeBColor;
                case "C": return GradeCColor;
                case "D": return GradeDColor;
                default: return GradeFColor;
            }
        }

        private void PopulateLeaderboard(string levelId)
        {
            if (LeaderboardContainer == null || LeaderboardEntryPrefab == null) return;

            for (int i = LeaderboardContainer.childCount - 1; i >= 0; i--)
                Destroy(LeaderboardContainer.GetChild(i).gameObject);

            var entries = _game.Leaderboard.GetEntriesForLevel(levelId);
            int count = Mathf.Min(DisplayTopN, entries.Count);

            for (int i = 0; i < count; i++)
            {
                var entry = entries[i];
                var go = Instantiate(LeaderboardEntryPrefab, LeaderboardContainer);
                var tmpTexts = go.GetComponentsInChildren<TMP_Text>();
                if (tmpTexts.Length >= 4)
                {
                    tmpTexts[0].text = $"#{i + 1}";
                    tmpTexts[1].text = entry.PlayerName;
                    tmpTexts[2].text = entry.Score.ToString("N0");
                    tmpTexts[3].text = $"{(entry.Accuracy * 100):F1}%";
                }
            }
        }

        private void OnNextLevel()
        {
            if (_game.CurrentLevel == null) return;
            int nextNum = _game.CurrentLevel.LevelNumber + 1;

            LevelConfig nextLevel = null;
            var defaults = LevelConfig.GetAllDefaultLevels();
            foreach (var lvl in defaults)
            {
                if (lvl.LevelNumber == nextNum) { nextLevel = lvl; break; }
            }

            if (nextLevel != null)
            {
                _game.StartLevel(nextLevel);
            }
        }
    }
}
