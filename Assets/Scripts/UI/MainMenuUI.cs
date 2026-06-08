using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using RainAlley.Core;
using RainAlley.GameFlow;

namespace RainAlley.UI
{
    public class MainMenuUI : MonoBehaviour
    {
        [Header("页面")]
        public GameObject MenuRoot;

        [Header("关卡选择")]
        public RectTransform LevelButtonContainer;
        public GameObject LevelButtonPrefab;

        [Header("按钮")]
        public Button CalibrationBtn;
        public Button LeaderboardBtn;
        public Button QuickPlayBtn;

        [Header("关卡信息面板")]
        public GameObject LevelInfoPanel;
        public TMP_Text LevelTitleText;
        public TMP_Text LevelDescText;
        public TMP_Text LevelBPMText;
        public TMP_Text LevelFeaturesText;
        public TMP_Text BestScoreText;
        public Button StartLevelBtn;
        public Button CloseInfoBtn;

        private GameManager _game;
        private List<LevelConfig> _levels;
        private LevelConfig _selectedLevel;

        private void Start()
        {
            _game = GameManager.Instance;
            _levels = LevelConfig.GetAllDefaultLevels();

            if (CalibrationBtn != null)
                CalibrationBtn.onClick.AddListener(() =>
                    FindObjectOfType<CalibrationPageUI>()?.OpenPage());

            if (QuickPlayBtn != null)
                QuickPlayBtn.onClick.AddListener(() =>
                {
                    if (_levels.Count > 0) StartCoroutine(ShowLevelInfoAndStart(_levels[0]));
                });

            if (StartLevelBtn != null)
                StartLevelBtn.onClick.AddListener(OnStartSelected);
            if (CloseInfoBtn != null)
                CloseInfoBtn.onClick.AddListener(() =>
                {
                    if (LevelInfoPanel != null) LevelInfoPanel.SetActive(false);
                });

            if (LeaderboardBtn != null)
                LeaderboardBtn.onClick.AddListener(OnShowAllLeaderboards);

            PopulateLevelButtons();

            if (_game != null)
                _game.OnStateChanged += HandleGameState;
        }

        private void OnDestroy()
        {
            if (_game != null) _game.OnStateChanged -= HandleGameState;
        }

        private void HandleGameState(GameState oldState, GameState newState)
        {
            if (MenuRoot == null) return;
            bool show = newState == GameState.Menu;
            MenuRoot.SetActive(show);
            if (show) PopulateLevelButtons();
        }

        private void PopulateLevelButtons()
        {
            if (LevelButtonContainer == null || LevelButtonPrefab == null) return;
            for (int i = LevelButtonContainer.childCount - 1; i >= 0; i--)
                Destroy(LevelButtonContainer.GetChild(i).gameObject);

            foreach (var level in _levels)
            {
                var go = Instantiate(LevelButtonPrefab, LevelButtonContainer);
                var tmpTexts = go.GetComponentsInChildren<TMP_Text>();
                if (tmpTexts.Length >= 3)
                {
                    tmpTexts[0].text = level.LevelNumber.ToString();
                    tmpTexts[1].text = level.LevelName;
                    int best = _game.Leaderboard.GetHighestScore(level.LevelId);
                    tmpTexts[2].text = best > 0 ? $"最佳: {best:N0}" : "未通关";
                }
                var btn = go.GetComponent<Button>();
                if (btn != null)
                {
                    var lvl = level;
                    btn.onClick.AddListener(() => ShowLevelInfo(lvl));
                }
            }
        }

        private void ShowLevelInfo(LevelConfig level)
        {
            _selectedLevel = level;
            if (LevelInfoPanel != null) LevelInfoPanel.SetActive(true);
            if (LevelTitleText != null)
                LevelTitleText.text = $"第 {level.LevelNumber} 关 · {level.LevelName}";
            if (LevelDescText != null)
                LevelDescText.text = level.Description;
            if (LevelBPMText != null)
                LevelBPMText.text = $"BPM: {level.BPM}  |  共 {level.TotalBeats} 拍  |  {level.Obstacles.Count} 障碍";

            List<string> features = new List<string>();
            features.Add($"颜色数: {level.AvailableColors.Count}");
            if (level.UnlockDualTrack) features.Add("双轨模式");
            else features.Add("单轨模式");
            if (LevelFeaturesText != null)
                LevelFeaturesText.text = string.Join("  ·  ", features);

            int best = _game.Leaderboard.GetHighestScore(level.LevelId);
            if (BestScoreText != null)
                BestScoreText.text = best > 0 ? $"最佳分数: {best:N0}" : "尚未通关";
        }

        private System.Collections.IEnumerator ShowLevelInfoAndStart(LevelConfig level)
        {
            ShowLevelInfo(level);
            yield return new WaitForSeconds(0.6f);
            OnStartSelected();
        }

        private void OnStartSelected()
        {
            if (_selectedLevel == null) return;
            if (LevelInfoPanel != null) LevelInfoPanel.SetActive(false);
            _game.StartLevel(_selectedLevel);
        }

        private void OnShowAllLeaderboards()
        {
            string msg = "排行榜\n";
            foreach (var level in _levels)
            {
                var entries = _game.Leaderboard.GetEntriesForLevel(level.LevelId);
                msg += $"\n【{level.LevelName}】\n";
                if (entries.Count == 0) msg += "  暂无记录\n";
                for (int i = 0; i < Mathf.Min(3, entries.Count); i++)
                {
                    var e = entries[i];
                    msg += $"  #{i + 1} {e.Score:N0} ({(e.Accuracy * 100):F1}%) {e.FormattedDate}\n";
                }
            }
            Debug.Log(msg);
        }
    }
}
