using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using KitchenChaos.Core;
using KitchenChaos.Config;
using KitchenChaos.Persistence;
using KitchenChaos.Leaderboards;
using KitchenChaos.Achievements;

namespace KitchenChaos.UI
{
    public class MainMenuPanel : MonoBehaviour
    {
        [Header("Pages")]
        [SerializeField] GameObject _mainRoot;
        [SerializeField] GameObject _levelSelectRoot;
        [SerializeField] GameObject _settingsRoot;
        [SerializeField] GameObject _leaderboardRoot;
        [SerializeField] GameObject _dailyRoot;
        [SerializeField] GameObject _achievementRoot;

        [Header("Main")]
        [SerializeField] Button _startButton;
        [SerializeField] Button _leaderboardButton;
        [SerializeField] Button _dailyButton;
        [SerializeField] Button _achievementButton;
        [SerializeField] Button _settingsButton;
        [SerializeField] Button _exitButton;
        [SerializeField] Toggle _singlePlayerToggle;
        [SerializeField] TMP_Text _playerNameText;
        [SerializeField] TMP_Text _totalStarsText;
        [SerializeField] TMP_Text _totalCoinsText;

        [Header("Level Select")]
        [SerializeField] Transform _levelListParent;
        [SerializeField] Button _levelBackButton;
        [SerializeField] GameObject _levelItemPrefab;

        [Header("Level Preview")]
        [SerializeField] GameObject _previewRoot;
        [SerializeField] TMP_Text _previewLevelName;
        [SerializeField] TMP_Text _previewDuration;
        [SerializeField] TMP_Text _previewRecipes;
        [SerializeField] TMP_Text _previewTips;
        [SerializeField] TMP_Text _previewBest;
        [SerializeField] Image[] _previewStars;
        [SerializeField] Button _previewStart;
        [SerializeField] Button _previewCancel;
        LevelConfig _selectedLevel;

        [Header("Daily")]
        [SerializeField] TMP_Text _dailyTitle;
        [SerializeField] TMP_Text _dailyBest;
        [SerializeField] TMP_Text _dailyStatus;
        [SerializeField] Button _dailyStart;
        [SerializeField] Button _dailyBack;

        [Header("Leaderboard")]
        [SerializeField] Transform _lbEntries;
        [SerializeField] Button _lbBack;

        [Header("Achievements")]
        [SerializeField] Transform _achEntries;
        [SerializeField] Button _achBack;

        [Header("Settings")]
        [SerializeField] TMP_InputField _nameInput;
        [SerializeField] Slider _volumeSlider;
        [SerializeField] Toggle _fullscreenToggle;
        [SerializeField] Button _settingsBack;
        [SerializeField] Button _resetSaveButton;

        void OnEnable()
        {
            BindMain();
            BindLevelSelect();
            BindPreview();
            BindDaily();
            BindLeaderboard();
            BindAchievements();
            BindSettings();
            ShowMain();
            UpdateSummary();
        }

        void OnDisable()
        {
            if (_startButton) _startButton.onClick.RemoveListener(OnStart);
            if (_leaderboardButton) _leaderboardButton.onClick.RemoveListener(ShowLeaderboard);
            if (_dailyButton) _dailyButton.onClick.RemoveListener(ShowDaily);
            if (_achievementButton) _achievementButton.onClick.RemoveListener(ShowAchievements);
            if (_settingsButton) _settingsButton.onClick.RemoveListener(ShowSettings);
            if (_exitButton) _exitButton.onClick.RemoveListener(OnExit);
        }

        void BindMain()
        {
            if (_startButton) _startButton.onClick.AddListener(OnStart);
            if (_leaderboardButton) _leaderboardButton.onClick.AddListener(ShowLeaderboard);
            if (_dailyButton) _dailyButton.onClick.AddListener(ShowDaily);
            if (_achievementButton) _achievementButton.onClick.AddListener(ShowAchievements);
            if (_settingsButton) _settingsButton.onClick.AddListener(ShowSettings);
            if (_exitButton) _exitButton.onClick.AddListener(OnExit);
            if (_singlePlayerToggle) _singlePlayerToggle.onValueChanged.AddListener(v =>
            {
                var gm = ServiceLocator.Get<GameManager>();
                gm?.SetSinglePlayerMode(v);
            });
        }

        void BindLevelSelect()
        {
            if (_levelBackButton) _levelBackButton.onClick.AddListener(ShowMain);
        }

        void BindPreview()
        {
            if (_previewStart) _previewStart.onClick.AddListener(StartSelectedLevel);
            if (_previewCancel) _previewCancel.onClick.AddListener(HidePreview);
        }

        void BindDaily()
        {
            if (_dailyBack) _dailyBack.onClick.AddListener(ShowMain);
            if (_dailyStart) _dailyStart.onClick.AddListener(StartDaily);
        }

        void BindLeaderboard()
        {
            if (_lbBack) _lbBack.onClick.AddListener(ShowMain);
        }

        void BindAchievements()
        {
            if (_achBack) _achBack.onClick.AddListener(ShowMain);
        }

        void BindSettings()
        {
            if (_settingsBack) _settingsBack.onClick.AddListener(ShowMain);
            if (_nameInput) _nameInput.onEndEdit.AddListener(v =>
            {
                var save = ServiceLocator.Get<SaveSystem>();
                save?.SetPlayerName(v);
                UpdateSummary();
            });
            if (_volumeSlider) _volumeSlider.onValueChanged.AddListener(v => AudioListener.volume = v);
            if (_fullscreenToggle) _fullscreenToggle.onValueChanged.AddListener(v => Screen.fullScreen = v);
            if (_resetSaveButton) _resetSaveButton.onClick.AddListener(ResetSave);
        }

        void UpdateSummary()
        {
            var save = ServiceLocator.Get<SaveSystem>();
            if (save == null) return;
            if (_playerNameText) _playerNameText.text = $"👨‍🍳 {save.Data.PlayerName}";
            if (_totalStarsText) _totalStarsText.text = $"⭐ {save.TotalStarsEarned()}";
            if (_totalCoinsText) _totalCoinsText.text = $"💰 {save.Data.TotalCoins}";
            if (_nameInput) _nameInput.text = save.Data.PlayerName;
        }

        void HideAll()
        {
            if (_mainRoot) _mainRoot.SetActive(false);
            if (_levelSelectRoot) _levelSelectRoot.SetActive(false);
            if (_settingsRoot) _settingsRoot.SetActive(false);
            if (_leaderboardRoot) _leaderboardRoot.SetActive(false);
            if (_dailyRoot) _dailyRoot.SetActive(false);
            if (_achievementRoot) _achievementRoot.SetActive(false);
            if (_previewRoot) _previewRoot.SetActive(false);
        }

        public void ShowMain()
        {
            HideAll();
            if (_mainRoot) _mainRoot.SetActive(true);
            UpdateSummary();
            var gm = ServiceLocator.Get<GameManager>();
            gm?.ChangeState(GameState.MainMenu);
        }

        void OnStart()
        {
            HideAll();
            if (_levelSelectRoot) _levelSelectRoot.SetActive(true);
            BuildLevelList();
            var gm = ServiceLocator.Get<GameManager>();
            gm?.ChangeState(GameState.LevelSelect);
        }

        void BuildLevelList()
        {
            if (_levelListParent == null) return;
            for (int i = _levelListParent.childCount - 1; i >= 0; i--) Destroy(_levelListParent.GetChild(i).gameObject);
            var gm = ServiceLocator.Get<GameManager>();
            if (gm?.Config == null) return;
            var save = ServiceLocator.Get<SaveSystem>();
            for (int i = 0; i < gm.Config.Levels.Length; i++)
            {
                var lvl = gm.Config.Levels[i];
                var go = _levelItemPrefab != null
                    ? Instantiate(_levelItemPrefab, _levelListParent)
                    : CreateFallbackLevelItem(_levelListParent);
                var btn = go.GetComponent<Button>() ?? go.AddComponent<Button>();
                int idx = i;
                btn.onClick.AddListener(() => SelectLevel(idx));
                PopulateLevelItem(go, lvl, i, save?.GetLevelResult(i));
            }
        }

        GameObject CreateFallbackLevelItem(Transform parent)
        {
            var go = new GameObject("LevelItem", typeof(RectTransform), typeof(Image), typeof(Button));
            go.transform.SetParent(parent, false);
            var img = go.GetComponent<Image>();
            img.color = new Color(0.2f, 0.25f, 0.3f, 0.95f);
            var rt = (RectTransform)go.transform;
            rt.sizeDelta = new Vector2(280, 100);
            return go;
        }

        void PopulateLevelItem(GameObject go, LevelConfig cfg, int idx, LevelResult res)
        {
            var title = new GameObject("Title", typeof(RectTransform));
            title.transform.SetParent(go.transform, false);
            var t = title.AddComponent<TextMeshProUGUI>();
            t.fontSize = 22;
            t.alignment = TextAlignmentOptions.MidlineLeft;
            t.text = $"L{idx + 1} {cfg.LevelName}";
            t.color = Color.white;
            var rt = (RectTransform)title.transform;
            rt.anchorMin = new Vector2(0, 0.5f); rt.anchorMax = new Vector2(1, 1);
            rt.offsetMin = new Vector2(12, 0); rt.offsetMax = new Vector2(-12, 0);

            var starsGo = new GameObject("Stars", typeof(RectTransform));
            starsGo.transform.SetParent(go.transform, false);
            var s = starsGo.AddComponent<TextMeshProUGUI>();
            s.fontSize = 20;
            s.alignment = TextAlignmentOptions.MidlineLeft;
            int stars = res?.Stars ?? 0;
            s.text = $"⭐ x{stars}   最高 {res?.BestScore ?? 0}";
            s.color = new Color(1f, 0.85f, 0.3f);
            var rts = (RectTransform)starsGo.transform;
            rts.anchorMin = new Vector2(0, 0); rts.anchorMax = new Vector2(1, 0.5f);
            rts.offsetMin = new Vector2(12, 0); rts.offsetMax = new Vector2(-12, 0);
        }

        void SelectLevel(int idx)
        {
            var gm = ServiceLocator.Get<GameManager>();
            if (gm?.Config == null) return;
            _selectedLevel = gm.Config.Levels[idx];
            if (_previewLevelName) _previewLevelName.text = _selectedLevel.LevelName;
            if (_previewDuration) _previewDuration.text = $"⏱ {_selectedLevel.Duration / 60f:0} 分钟   🎯 目标 {_selectedLevel.StarThresholds[0]}";
            if (_previewRecipes) _previewRecipes.text = "食谱：" + string.Join(" / ", _selectedLevel.AvailableRecipeNames ?? Array.Empty<string>());
            if (_previewTips) _previewTips.text = _selectedLevel.LevelTips != null && _selectedLevel.LevelTips.Length > 0 ? _selectedLevel.LevelTips[0] : "挑战自己的速度与配合！";
            var save = ServiceLocator.Get<SaveSystem>();
            var res = save?.GetLevelResult(idx);
            if (_previewBest) _previewBest.text = $"最佳：{res?.BestScore ?? 0}";
            int stars = res?.Stars ?? 0;
            for (int i = 0; i < 3; i++)
                if (_previewStars != null && i < _previewStars.Length)
                    _previewStars[i].color = i < stars ? Color.yellow : new Color(1f, 1f, 1f, 0.3f);
            if (_previewRoot) _previewRoot.SetActive(true);
            gm.ChangeState(GameState.PreGame);
        }

        void HidePreview()
        {
            if (_previewRoot) _previewRoot.SetActive(false);
        }

        void StartSelectedLevel()
        {
            var gm = ServiceLocator.Get<GameManager>();
            if (gm?.Config == null || _selectedLevel == null) return;
            int idx = Array.IndexOf(gm.Config.Levels, _selectedLevel);
            if (idx < 0) idx = 0;
            HideAll();
            gm.StartLevel(idx);
        }

        void ShowDaily()
        {
            HideAll();
            if (_dailyRoot) _dailyRoot.SetActive(true);
            var dm = DailyChallengeManager.Instance;
            if (_dailyTitle) _dailyTitle.text = $"每日挑战 · {DateTime.Today:yyyy/MM/dd}";
            if (_dailyBest) _dailyBest.text = $"今日最佳：{dm?.TodayBestScore ?? 0}";
            if (_dailyStatus) _dailyStatus.text = dm?.HasCompletedToday() == true ? "✅ 已完成，可继续挑战高分" : "🕒 尚未完成";
        }

        void StartDaily()
        {
            var gm = ServiceLocator.Get<GameManager>();
            var dm = DailyChallengeManager.Instance;
            if (gm == null || dm == null) return;
            var challenge = dm.GetTodayChallenge();
            if (challenge == null) return;
            if (gm.Config.Levels == null || gm.Config.Levels.Length == 0) return;
            int idx = Mathf.Clamp(challenge.LevelIndex, 0, gm.Config.Levels.Length - 1);
            HideAll();
            gm.StartLevel(idx);
        }

        void ShowLeaderboard()
        {
            HideAll();
            if (_leaderboardRoot) _leaderboardRoot.SetActive(true);
            if (_lbEntries == null) return;
            for (int i = _lbEntries.childCount - 1; i >= 0; i--) Destroy(_lbEntries.GetChild(i).gameObject);
            var gm = ServiceLocator.Get<GameManager>();
            var lb = LeaderboardManager.Instance;
            if (gm?.Config == null || lb == null) return;
            for (int i = 0; i < gm.Config.Levels.Length; i++)
            {
                var entries = lb.GetLeaderboard($"level_{i}", 5);
                AddLbHeader($"关卡 L{i + 1} {gm.Config.Levels[i].LevelName}");
                if (entries.Count == 0) AddLbEntry(0, "暂无记录", 0, 0);
                for (int j = 0; j < entries.Count; j++)
                    AddLbEntry(j + 1, entries[j].PlayerName, entries[j].Score, entries[j].Stars);
            }
        }

        void AddLbHeader(string title)
        {
            var go = new GameObject("H", typeof(RectTransform));
            go.transform.SetParent(_lbEntries, false);
            var t = go.AddComponent<TextMeshProUGUI>();
            t.fontSize = 18;
            t.fontStyle = FontStyles.Bold;
            t.color = new Color(0.8f, 0.95f, 1f);
            t.text = title;
            var rt = (RectTransform)go.transform;
            rt.sizeDelta = new Vector2(0, 28);
        }

        void AddLbEntry(int rank, string name, int score, int stars)
        {
            var go = new GameObject($"Entry_{rank}", typeof(RectTransform));
            go.transform.SetParent(_lbEntries, false);
            var t = go.AddComponent<TextMeshProUGUI>();
            t.fontSize = 15;
            t.color = Color.white;
            t.text = $"#{rank}  {name}  -  ${score}  ⭐ x{stars}";
            var rt = (RectTransform)go.transform;
            rt.sizeDelta = new Vector2(0, 22);
        }

        void ShowAchievements()
        {
            HideAll();
            if (_achievementRoot) _achievementRoot.SetActive(true);
            if (_achEntries == null) return;
            for (int i = _achEntries.childCount - 1; i >= 0; i--) Destroy(_achEntries.GetChild(i).gameObject);
            var save = ServiceLocator.Get<SaveSystem>();
            foreach (var a in AchievementLibrary.All)
            {
                bool unlocked = save?.IsAchievementUnlocked(a.Id) == true;
                var go = new GameObject($"Ach_{a.Id}", typeof(RectTransform));
                go.transform.SetParent(_achEntries, false);
                var t = go.AddComponent<TextMeshProUGUI>();
                t.fontSize = 16;
                t.color = unlocked ? new Color(0.8f, 1f, 0.7f) : new Color(0.5f, 0.5f, 0.55f);
                t.enableWordWrapping = true;
                t.text = $"{a.Icon} {a.Name}\n{a.Description}\n奖励: 💰 {a.RewardCoins}";
                var rt = (RectTransform)go.transform;
                rt.sizeDelta = new Vector2(0, 68);
            }
        }

        void ShowSettings()
        {
            HideAll();
            if (_settingsRoot) _settingsRoot.SetActive(true);
        }

        void ResetSave()
        {
            var save = ServiceLocator.Get<SaveSystem>();
            save?.Load();
            if (save != null)
            {
                save.Data.PlayerName = "Chef";
                save.Data.TotalScore = 0;
                save.Data.TotalCoins = 0;
                save.Data.LevelResults.Clear();
                save.Data.UnlockedAchievements.Clear();
                save.SaveNow();
            }
            UpdateSummary();
        }

        void OnExit()
        {
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }
    }
}
