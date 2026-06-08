using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using RainAlley.Core;
using RainAlley.GameFlow;
using RainAlley.Leaderboard;

namespace RainAlley.UI
{
    public class ResultsPageUI : MonoBehaviour
    {
        public GameObject ResultsRoot;
        public Text LevelNameText;
        public Text LevelNumberText;
        public Text ScoreText;
        public Text GradeText;
        public Image GradeBackground;
        public Text AccuracyText;
        public Text RankText;
        public Text PerfectCountText;
        public Text EarlyCountText;
        public Text LateCountText;
        public Text MissCountText;
        public Image PerfectBar;
        public Image EarlyBar;
        public Image LateBar;
        public Image MissBar;
        public Text ProblemAnalysisText;
        public Text SuggestionText;
        public Text MaxComboText;
        public RectTransform LeaderboardContainer;
        public GameObject LeaderboardEntryPrefab;
        public int DisplayTopN = 5;
        public Button RetryBtn;
        public Button NextLevelBtn;
        public Button ToMenuBtn;
        public Color GradeSColor = new Color(1f, 0.85f, 0.3f);
        public Color GradeAColor = new Color(0.4f, 0.9f, 1f);
        public Color GradeBColor = new Color(0.5f, 1f, 0.5f);
        public Color GradeCColor = new Color(1f, 0.7f, 0.3f);
        public Color GradeDColor = new Color(1f, 0.5f, 0.5f);
        public Color GradeFColor = new Color(0.55f, 0.55f, 0.55f);

        private GameManager _game;
        private bool _initialized = false;

        public void Init()
        {
            _game = GameManager.Instance;
            if (RetryBtn != null) RetryBtn.onClick.AddListener(() => _game.RestartLevel());
            if (NextLevelBtn != null) NextLevelBtn.onClick.AddListener(OnNextLevel);
            if (ToMenuBtn != null) ToMenuBtn.onClick.AddListener(() => _game.ExitToMenu());
            if (_game != null) _game.OnStateChanged += HandleStateChanged;
            if (ResultsRoot != null) ResultsRoot.SetActive(false);
            _initialized = true;
        }

        private void OnDestroy()
        {
            if (_game != null) _game.OnStateChanged -= HandleStateChanged;
        }

        private void HandleStateChanged(GameState oldState, GameState newState)
        {
            if (!_initialized) return;
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
            if (AccuracyText != null) AccuracyText.text = $"准确率 {(stats.Accuracy * 100):F2}%";

            string grade = ComputeGrade(stats.Accuracy, stats.MissCount, total);
            if (GradeText != null) GradeText.text = grade;
            if (GradeBackground != null) GradeBackground.color = GetGradeColor(grade);

            int rank = _game.Leaderboard.GetRankForScore(level.LevelId, stats.TotalScore, stats.Accuracy);
            int totalEntries = _game.Leaderboard.GetEntriesForLevel(level.LevelId).Count;
            if (RankText != null)
                RankText.text = totalEntries > 0 ? $"当前排名：#{rank} / {totalEntries}" : "首次通关！已记录到排行榜";

            if (PerfectCountText != null) PerfectCountText.text = stats.PerfectCount.ToString();
            if (EarlyCountText != null) EarlyCountText.text = stats.EarlyCount.ToString();
            if (LateCountText != null) LateCountText.text = stats.LateCount.ToString();
            if (MissCountText != null) MissCountText.text = stats.MissCount.ToString();
            UpdateBarChart(stats);
            AnalyzeProblems(stats, level);

            if (MaxComboText != null) MaxComboText.text = stats.MaxCombo.ToString();
            PopulateLeaderboard(level.LevelId);

            bool canNext = level.LevelNumber < 4;
            if (NextLevelBtn != null)
                NextLevelBtn.interactable = canNext && stats.Accuracy >= 0.6;
        }

        private void UpdateBarChart(GameStats stats)
        {
            int total = Mathf.Max(1, stats.TotalObstacles);
            if (PerfectBar != null) SetBarWidth(PerfectBar, (float)stats.PerfectCount / total);
            if (EarlyBar != null) SetBarWidth(EarlyBar, (float)stats.EarlyCount / total);
            if (LateBar != null) SetBarWidth(LateBar, (float)stats.LateCount / total);
            if (MissBar != null) SetBarWidth(MissBar, (float)stats.MissCount / total);
        }

        private static void SetBarWidth(Image bar, float ratio)
        {
            if (bar == null || bar.rectTransform == null) return;
            bar.rectTransform.anchorMax = new Vector2(Mathf.Clamp01(ratio), 1f);
        }

        private void AnalyzeProblems(GameStats stats, LevelConfig level)
        {
            int early = stats.EarlyCount;
            int late = stats.LateCount;
            int miss = stats.MissCount;
            int total = Mathf.Max(1, stats.TotalObstacles);

            var issues = new List<string>();
            var suggestions = new List<string>();

            if (early > late * 2 && early >= 3)
            {
                float r = late > 0 ? (float)early / late : early;
                issues.Add($"早拍偏多（{early}次，是晚拍的{r:F1}倍）");
                suggestions.Add("稍微放慢反应速度，等障碍物更靠近判定线再操作");
                if (_game.Calibration.Settings.TotalLatencyMs < 20)
                    suggestions.Add("或在校准页把输入延迟调高 10~30ms");
            }
            else if (late > early * 2 && late >= 3)
            {
                float r = early > 0 ? (float)late / early : late;
                issues.Add($"晚拍偏多（{late}次，是早拍的{r:F1}倍）");
                suggestions.Add("提前预判节奏，稍微加快反应");
                if (_game.Calibration.Settings.TotalLatencyMs > -20)
                    suggestions.Add("或在校准页把输入延迟调低 10~30ms");
            }
            else if (early + late > total * 0.4)
            {
                issues.Add("整体节奏感偏弱，判定分布较散");
                suggestions.Add("先返回校准页重新做一次节拍校准");
                suggestions.Add("或在低BPM关卡多练习熟悉基本节拍");
            }

            if (miss >= Mathf.Max(2, level.MissThreshold))
            {
                bool anyColorErr = false;
                foreach (var o in _game.TrackMgr.AllObstacles)
                {
                    if ((o.Status == ObstacleStatus.Judged && !o.Result.ColorCorrect) ||
                         o.Status == ObstacleStatus.Missed)
                    { anyColorErr = true; break; }
                }
                if (anyColorErr && miss >= 3)
                {
                    issues.Add("颜色切换失误或速度不足");
                    suggestions.Add("尝试提前 1~2 拍预判并切换纸伞颜色");
                    if (level.AvailableColors.Count > 2)
                        suggestions.Add("键盘可用 1/2/3/4 直接选色，比循环切换更快");
                }
                else if (level.UnlockDualTrack)
                {
                    issues.Add("可能存在轨道切换失误");
                    suggestions.Add("留意灯笼门出现前的轨道指示，提前切换");
                }
            }

            if (stats.MaxCombo < total * 0.4 && total > 10)
            {
                issues.Add($"连击维持差（最大{stats.MaxCombo}，总障碍{total}）");
                suggestions.Add("降低难度从第一关开始练，先建立稳定节奏感");
            }

            if (issues.Count == 0) issues.Add("整体发挥非常稳定，继续保持！");
            if (suggestions.Count == 0) suggestions.Add("可以挑战更快速率或更高难度的关卡");

            if (ProblemAnalysisText != null)
            {
                ProblemAnalysisText.text = "• " + string.Join("\n• ", issues);
                ProblemAnalysisText.horizontalOverflow = HorizontalWrapMode.Wrap;
                ProblemAnalysisText.verticalOverflow = VerticalWrapMode.Truncate;
            }
            if (SuggestionText != null)
            {
                SuggestionText.text = "→ " + string.Join("\n→ ", suggestions);
                SuggestionText.horizontalOverflow = HorizontalWrapMode.Wrap;
                SuggestionText.verticalOverflow = VerticalWrapMode.Truncate;
            }
        }

        private static string ComputeGrade(double acc, int miss, int total)
        {
            double mr = (double)miss / total;
            if (acc >= 0.98 && mr <= 0.02) return "S+";
            if (acc >= 0.95) return "S";
            if (acc >= 0.90) return "A";
            if (acc >= 0.80) return "B";
            if (acc >= 0.70) return "C";
            if (acc >= 0.60) return "D";
            return "F";
        }

        private Color GetGradeColor(string g)
        {
            switch (g)
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
            if (LeaderboardContainer == null) return;
            for (int i = LeaderboardContainer.childCount - 1; i >= 0; i--)
                Destroy(LeaderboardContainer.GetChild(i).gameObject);

            var entries = _game.Leaderboard.GetEntriesForLevel(levelId);
            int count = Mathf.Min(DisplayTopN, entries.Count);
            float headerH = 45f;
            float rowH = 38f;
            float startY = -15f;

            var hdrGo = UIUtils.NewEmpty("Header", LeaderboardContainer);
            var hdrRT = hdrGo.GetComponent<RectTransform>();
            hdrRT.anchorMin = new Vector2(0, 1f);
            hdrRT.anchorMax = new Vector2(1, 1f);
            hdrRT.pivot = new Vector2(0.5f, 1f);
            hdrRT.sizeDelta = new Vector2(0, headerH);
            hdrRT.anchoredPosition = new Vector2(0, startY);
            UIUtils.NewText("H0", hdrGo.transform, "排名", 16, TextAnchor.MiddleLeft,
                new Color(1f, 0.92f, 0.75f)).GetComponent<RectTransform>().sizeDelta = new Vector2(80, headerH);
            UIUtils.NewText("H1", hdrGo.transform, "玩家", 16, TextAnchor.MiddleLeft,
                new Color(1f, 0.92f, 0.75f)).GetComponent<RectTransform>().sizeDelta = new Vector2(200, headerH);
            UIUtils.NewText("H2", hdrGo.transform, "分数", 16, TextAnchor.MiddleRight,
                new Color(1f, 0.92f, 0.75f)).GetComponent<RectTransform>().sizeDelta = new Vector2(150, headerH);
            UIUtils.NewText("H3", hdrGo.transform, "准确率", 16, TextAnchor.MiddleRight,
                new Color(1f, 0.92f, 0.75f)).GetComponent<RectTransform>().sizeDelta = new Vector2(120, headerH);

            for (int i = 0; i < count; i++)
            {
                var e = entries[i];
                var rowGo = UIUtils.NewEmpty("Row_" + i, LeaderboardContainer);
                var rowRT = rowGo.GetComponent<RectTransform>();
                rowRT.anchorMin = new Vector2(0, 1f);
                rowRT.anchorMax = new Vector2(1, 1f);
                rowRT.pivot = new Vector2(0.5f, 1f);
                rowRT.sizeDelta = new Vector2(0, rowH);
                rowRT.anchoredPosition = new Vector2(0, startY - headerH - i * rowH);
                Color c = i == 0 ? new Color(1f, 0.92f, 0.35f, 0.08f)
                            : (i % 2 == 0 ? new Color(1, 1, 1, 0.03f) : new Color(0, 0, 0, 0));
                var bg = rowGo.AddComponent<Image>();
                bg.color = c;

                var t0 = UIUtils.NewText("R0", rowGo.transform, $"#{i + 1}", 16,
                    TextAnchor.MiddleLeft, i == 0 ? new Color(1f, 0.92f, 0.35f) : Color.white);
                t0.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0);
                t0.GetComponent<RectTransform>().anchorMax = new Vector2(0, 1);
                t0.GetComponent<RectTransform>().sizeDelta = new Vector2(80, 0);
                t0.GetComponent<RectTransform>().offsetMin = new Vector2(12, 0);
                t0.GetComponent<RectTransform>().offsetMax = new Vector2(12 + 80, 0);

                var t1 = UIUtils.NewText("R1", rowGo.transform, e.PlayerName, 15,
                    TextAnchor.MiddleLeft, Color.white);
                t1.GetComponent<RectTransform>().anchorMin = new Vector2(0, 0);
                t1.GetComponent<RectTransform>().anchorMax = new Vector2(0, 1);
                t1.GetComponent<RectTransform>().offsetMin = new Vector2(100, 0);
                t1.GetComponent<RectTransform>().offsetMax = new Vector2(100 + 200, 0);

                var t2 = UIUtils.NewText("R2", rowGo.transform, e.Score.ToString("N0"), 15,
                    TextAnchor.MiddleRight, Color.white);
                t2.GetComponent<RectTransform>().anchorMin = new Vector2(1, 0);
                t2.GetComponent<RectTransform>().anchorMax = new Vector2(1, 1);
                t2.GetComponent<RectTransform>().offsetMin = new Vector2(-280, 0);
                t2.GetComponent<RectTransform>().offsetMax = new Vector2(-140, 0);

                var t3 = UIUtils.NewText("R3", rowGo.transform, $"{(e.Accuracy * 100):F1}%", 15,
                    TextAnchor.MiddleRight, new Color(0.75f, 0.95f, 0.85f));
                t3.GetComponent<RectTransform>().anchorMin = new Vector2(1, 0);
                t3.GetComponent<RectTransform>().anchorMax = new Vector2(1, 1);
                t3.GetComponent<RectTransform>().offsetMin = new Vector2(-130, 0);
                t3.GetComponent<RectTransform>().offsetMax = new Vector2(-12, 0);
            }

            if (count == 0)
            {
                var tipGo = UIUtils.NewEmpty("NoData", LeaderboardContainer);
                var tipRT = tipGo.GetComponent<RectTransform>();
                tipRT.anchorMin = new Vector2(0, 0.5f);
                tipRT.anchorMax = new Vector2(1f, 0.5f);
                tipRT.sizeDelta = new Vector2(0, 40);
                UIUtils.NewText("Tip", tipGo.transform, "本关暂无通关记录，加油哦！", 18,
                    TextAnchor.MiddleCenter, new Color(0.7f, 0.85f, 1f));
            }
        }

        private void OnNextLevel()
        {
            if (_game.CurrentLevel == null) return;
            int nextNum = _game.CurrentLevel.LevelNumber + 1;
            LevelConfig nextLevel = null;
            foreach (var lvl in LevelConfig.GetAllDefaultLevels())
            {
                if (lvl.LevelNumber == nextNum) { nextLevel = lvl; break; }
            }
            if (nextLevel != null) _game.StartLevel(nextLevel);
        }
    }
}
