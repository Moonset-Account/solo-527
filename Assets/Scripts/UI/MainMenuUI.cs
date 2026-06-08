using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using RainAlley.Core;
using RainAlley.GameFlow;

namespace RainAlley.UI
{
    public class MainMenuUI : MonoBehaviour
    {
        public GameObject MenuRoot;
        public RectTransform LevelButtonContainer;
        public GameObject LevelButtonPrefab;

        private GameObject _levelInfoPanel;
        private Text _levelTitleText;
        private Text _levelDescText;
        private Text _levelBPMText;
        private Text _levelFeaturesText;
        private Text _bestScoreText;
        private Button _startLevelBtn;
        private Button _closeInfoBtn;

        private GameManager _game;
        private List<LevelConfig> _levels;
        private LevelConfig _selectedLevel;
        private bool _initialized = false;

        public void Init(GameObject root)
        {
            MenuRoot = root;
            _game = GameManager.Instance;
            _levels = LevelConfig.GetAllDefaultLevels();

            BuildLevelInfoPanel();
            BuildAndBind();

            _initialized = true;

            if (_game != null) _game.OnStateChanged += HandleGameState;
            HandleGameState(GameState.Menu, GameState.Menu);
        }

        private void OnDestroy()
        {
            if (_game != null) _game.OnStateChanged -= HandleGameState;
        }

        private void BuildLevelInfoPanel()
        {
            _levelInfoPanel = UIUtils.NewPanel("LevelInfoPanel", transform, new Color(0.05f, 0.08f, 0.15f, 0.98f));
            UIUtils.SetAnchors(_levelInfoPanel.GetComponent<RectTransform>(),
                new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                new Vector2(700, 420), Vector2.zero);
            _levelInfoPanel.SetActive(false);

            _levelTitleText = UIUtils.NewText("Title", _levelInfoPanel.transform, "", 30,
                TextAnchor.UpperLeft, new Color(1f, 0.92f, 0.75f)).GetComponent<Text>();
            UIUtils.SetAnchors(_levelTitleText.rectTransform,
                new Vector2(0, 1f), new Vector2(1f, 1f),
                new Vector2(20, -70), new Vector2(-20, -20), new Vector2(0.5f, 1f));

            _levelDescText = UIUtils.NewText("Desc", _levelInfoPanel.transform, "", 18,
                TextAnchor.UpperLeft, new Color(0.85f, 0.9f, 1f)).GetComponent<Text>();
            _levelDescText.horizontalOverflow = HorizontalWrapMode.Wrap;
            _levelDescText.verticalOverflow = VerticalWrapMode.Truncate;
            _levelDescText.rectTransform.anchorMin = new Vector2(0, 0.65f);
            _levelDescText.rectTransform.anchorMax = new Vector2(1f, 0.82f);
            _levelDescText.rectTransform.offsetMin = new Vector2(20, 0);
            _levelDescText.rectTransform.offsetMax = new Vector2(-20, 0);

            _levelBPMText = UIUtils.NewText("BPM", _levelInfoPanel.transform, "", 20,
                TextAnchor.MiddleLeft, new Color(0.75f, 0.95f, 0.85f)).GetComponent<Text>();
            UIUtils.SetAnchors(_levelBPMText.rectTransform,
                new Vector2(0, 0.55f), new Vector2(1f, 0.55f),
                new Vector2(20, -17.5f), new Vector2(-20, 17.5f), new Vector2(0, 0.5f));

            _levelFeaturesText = UIUtils.NewText("Features", _levelInfoPanel.transform, "", 18,
                TextAnchor.MiddleLeft, new Color(0.85f, 0.8f, 1f)).GetComponent<Text>();
            UIUtils.SetAnchors(_levelFeaturesText.rectTransform,
                new Vector2(0, 0.45f), new Vector2(1f, 0.45f),
                new Vector2(20, -15), new Vector2(-20, 15), new Vector2(0, 0.5f));

            _bestScoreText = UIUtils.NewText("Best", _levelInfoPanel.transform, "", 22,
                TextAnchor.MiddleLeft, new Color(1f, 0.92f, 0.55f)).GetComponent<Text>();
            UIUtils.SetAnchors(_bestScoreText.rectTransform,
                new Vector2(0, 0.32f), new Vector2(1f, 0.32f),
                new Vector2(20, -19), new Vector2(-20, 19), new Vector2(0, 0.5f));

            _startLevelBtn = UIUtils.NewButton("StartBtn", _levelInfoPanel.transform, "▶ 开始关卡",
                new Vector2(0.5f, 0), new Vector2(1f, 0),
                new Vector2(20, 20), new Vector2(-20, 90),
                new Color(0.25f, 0.6f, 0.4f)).GetComponent<Button>();
            _startLevelBtn.onClick.AddListener(OnStartSelected);

            _closeInfoBtn = UIUtils.NewButton("CloseBtn", _levelInfoPanel.transform, "关闭",
                new Vector2(0, 0), new Vector2(0.5f, 0),
                new Vector2(20, 20), new Vector2(-20, 90),
                new Color(0.45f, 0.35f, 0.45f)).GetComponent<Button>();
            _closeInfoBtn.onClick.AddListener(() =>
            {
                if (_levelInfoPanel != null) _levelInfoPanel.SetActive(false);
            });
        }

        private void BuildAndBind()
        {
            var calibBtn = transform.Find("CalibrationBtn");
            if (calibBtn != null) calibBtn.GetComponent<Button>().onClick.AddListener(OpenCalibration);
            var quickBtn = transform.Find("QuickPlayBtn");
            if (quickBtn != null) quickBtn.GetComponent<Button>().onClick.AddListener(QuickPlay);
            var lbBtn = transform.Find("LeaderboardBtn");
            if (lbBtn != null) lbBtn.GetComponent<Button>().onClick.AddListener(ShowLeaderboards);
            PopulateLevelButtons();
        }

        public void OpenCalibration()
        {
            var calib = FindObjectOfType<CalibrationPageUI>();
            if (calib != null) calib.OpenPage();
            if (_game != null) _game.ChangeStatePublic(GameState.Calibration);
        }

        public void QuickPlay()
        {
            if (_levels.Count > 0)
            {
                ShowLevelInfo(_levels[0]);
                StartCoroutine(DelayedStart());
            }
        }

        private System.Collections.IEnumerator DelayedStart()
        {
            yield return new WaitForSeconds(0.4f);
            OnStartSelected();
        }

        public void ShowLeaderboards()
        {
            if (_game == null) return;
            string msg = "────── 本地排行榜 ──────\n";
            foreach (var level in _levels)
            {
                var entries = _game.Leaderboard.GetEntriesForLevel(level.LevelId);
                msg += $"\n【第{level.LevelNumber}关 {level.LevelName}】\n";
                if (entries.Count == 0) msg += "  暂无通关记录\n";
                for (int i = 0; i < Mathf.Min(5, entries.Count); i++)
                {
                    var e = entries[i];
                    msg += $"  #{i + 1}.  {e.Score,8:N0}分   准确率 {(e.Accuracy * 100):F1}%   {e.FormattedDate}\n";
                }
            }
            Debug.Log(msg);
            _game.ShowHintPublic("本地排行榜", "完整内容已输出到Console窗口");
        }

        private void HandleGameState(GameState oldState, GameState newState)
        {
            if (!_initialized) return;
            if (MenuRoot == null) return;
            bool show = newState == GameState.Menu;
            MenuRoot.SetActive(show);
            if (show && _game != null) PopulateLevelButtons();
        }

        public void PopulateLevelButtons()
        {
            if (LevelButtonContainer == null) return;
            for (int i = LevelButtonContainer.childCount - 1; i >= 0; i--)
                Destroy(LevelButtonContainer.GetChild(i).gameObject);

            int perRow = 2;
            int count = _levels.Count;
            int rows = Mathf.CeilToInt((float)count / perRow);
            for (int i = 0; i < count; i++)
            {
                int row = i / perRow;
                int col = i % perRow;
                var level = _levels[i];
                var go = new GameObject("Level_" + i, typeof(RectTransform));
                go.transform.SetParent(LevelButtonContainer, false);
                var rt = go.GetComponent<RectTransform>();
                rt.anchorMin = new Vector2((float)col / perRow, 1f - (float)(row + 1) / rows);
                rt.anchorMax = new Vector2((float)(col + 1) / perRow, 1f - (float)row / rows);
                rt.offsetMin = new Vector2(10, 10);
                rt.offsetMax = new Vector2(-10, -10);

                var img = go.AddComponent<Image>();
                img.color = new Color(0.15f, 0.2f, 0.32f, 0.95f);
                var btn = go.AddComponent<Button>();
                var cs = btn.colors;
                cs.highlightedColor = new Color(0.25f, 0.35f, 0.5f);
                cs.pressedColor = new Color(0.1f, 0.15f, 0.25f);
                btn.colors = cs;

                var numGo = UIUtils.NewText("Num", go.transform, level.LevelNumber.ToString(), 40,
                    TextAnchor.MiddleLeft, new Color(1f, 0.92f, 0.7f));
                UIUtils.SetAnchors(numGo.GetComponent<RectTransform>(),
                    new Vector2(0, 0.5f), new Vector2(0, 0.5f),
                    new Vector2(80, 60), new Vector2(25, 0));

                UIUtils.NewText("Name", go.transform, level.LevelName, 22,
                    TextAnchor.MiddleCenter, Color.white);

                int best = _game != null ? _game.Leaderboard.GetHighestScore(level.LevelId) : 0;
                var bestGo = UIUtils.NewText("Best", go.transform, best > 0 ? $"最佳: {best:N0}" : "未通关", 15,
                    TextAnchor.MiddleRight, new Color(0.7f, 0.85f, 1f));
                UIUtils.SetAnchors(bestGo.GetComponent<RectTransform>(),
                    new Vector2(1f, 0.22f), new Vector2(1f, 0.22f),
                    new Vector2(240, 24), new Vector2(-15, 0));

                var lvlRef = level;
                btn.onClick.AddListener(() => ShowLevelInfo(lvlRef));
            }
        }

        private void ShowLevelInfo(LevelConfig level)
        {
            _selectedLevel = level;
            if (_levelInfoPanel != null) _levelInfoPanel.SetActive(true);
            if (_levelTitleText != null)
                _levelTitleText.text = $"第 {level.LevelNumber} 关 · {level.LevelName}";
            if (_levelDescText != null)
                _levelDescText.text = level.Description;
            if (_levelBPMText != null)
                _levelBPMText.text = $"BPM: {level.BPM}   共 {level.TotalBeats} 拍   {level.Obstacles.Count} 个障碍";
            var fs = new List<string>
            {
                $"颜色数: {level.AvailableColors.Count}",
                level.UnlockDualTrack ? "双轨模式" : "单轨模式"
            };
            if (_levelFeaturesText != null)
                _levelFeaturesText.text = string.Join("    ", fs);
            int bs = _game != null ? _game.Leaderboard.GetHighestScore(level.LevelId) : 0;
            if (_bestScoreText != null)
                _bestScoreText.text = bs > 0 ? $"最佳分数: {bs:N0}" : "尚未通关，加油！";
        }

        private void OnStartSelected()
        {
            if (_selectedLevel == null) return;
            if (_levelInfoPanel != null) _levelInfoPanel.SetActive(false);
            if (_game != null) _game.StartLevel(_selectedLevel);
        }
    }
}
