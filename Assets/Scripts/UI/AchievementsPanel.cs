using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;
using LakeSailing.Data;
using LakeSailing.Meta;

namespace LakeSailing.UI
{
    public class AchievementsPanel : UIPanelBase
    {
        [Header("组件")]
        [SerializeField] private Transform gridContainer;
        [SerializeField] private GameObject itemPrefab;
        [SerializeField] private Toggle showOnlyUnlockedToggle;
        [SerializeField] private Dropdown typeFilterDropdown;
        [SerializeField] private Text progressText;

        [Header("详情")]
        [SerializeField] private GameObject detailPanel;
        [SerializeField] private Image detailIcon;
        [SerializeField] private Text detailTitle;
        [SerializeField] private Text detailDescription;
        [SerializeField] private Text detailXPText;
        [SerializeField] private Text detailCoinText;
        [SerializeField] private GameObject lockedOverlay;
        [SerializeField] private Button detailCloseButton;

        [Header("按钮")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button checkButton;

        private List<AchievementData> filtered = new List<AchievementData>();

        private void Awake()
        {
            panelType = UIType.Achievements;
            UIManager.Instance?.RegisterPanel(panelType, this);
        }

        private void Start()
        {
            InitializeUI();
            EnsureMockData();
        }

        private void InitializeUI()
        {
            if (typeFilterDropdown != null)
            {
                typeFilterDropdown.ClearOptions();
                typeFilterDropdown.AddOptions(new List<string> { "全部类型", "拍摄类", "航行类", "进度类", "挑战类" });
                typeFilterDropdown.onValueChanged.AddListener(_ => RefreshGrid());
            }
            if (showOnlyUnlockedToggle != null)
            {
                showOnlyUnlockedToggle.onValueChanged.AddListener(_ => RefreshGrid());
            }
            if (backButton != null) backButton.onClick.AddListener(OnBackClicked);
            if (checkButton != null) checkButton.onClick.AddListener(OnCheckClicked);
            if (detailCloseButton != null) detailCloseButton.onClick.AddListener(() => { AudioManager.Instance?.PlaySfx(SfxType.ButtonClick); detailPanel?.SetActive(false); });
        }

        private void EnsureMockData()
        {
            if (AchievementSystem.Instance == null) return;
            var achievements = new List<AchievementData>();

            string[] titles = {
                "初次启航", "摄影入门", "百图斩", "千里航",
                "万里长征", "星级收藏家", "完美风暴", "毫发无损",
                "聚宝盆", "坚持不懈", "全图鉴", "七湖霸主",
                "稀有收藏", "风暴幸存者", "传奇船长"
            };
            string[] descs = {
                "完成第一次航行", "拍摄10张照片", "累计拍摄100张照片", "累计航行1000米",
                "累计航行10000米", "收集50颗任务星", "在暴风雨中完成任务", "无损伤完成任意关卡",
                "累计获得10000金币", "完成7天连续每日挑战", "解锁图鉴中所有物品", "完成所有关卡",
                "解锁所有3星及以上稀有度物品", "在5级暴风雨中存活并完成", "达成所有成就"
            };
            AchievementType[] types = {
                AchievementType.TotalPhotos, AchievementType.TotalPhotos, AchievementType.TotalPhotos,
                AchievementType.TotalDistance, AchievementType.TotalDistance, AchievementType.LevelStars,
                AchievementType.StormSurvivor, AchievementType.NoDamageClear, AchievementType.TotalCoins,
                AchievementType.DailyStreak, AchievementType.RarityCollection, AchievementType.CompleteAllLevels,
                AchievementType.RarityCollection, AchievementType.StormSurvivor, AchievementType.CompleteAllLevels
            };
            int[] reqs = { 1, 10, 100, 1000, 10000, 50, 1, 1, 10000, 7, 30, 7, 10, 1, 999 };
            int[] xps = { 50, 100, 500, 150, 800, 1000, 300, 400, 600, 500, 2000, 1500, 1200, 800, 5000 };
            int[] coins = { 30, 80, 400, 100, 600, 800, 200, 300, 500, 400, 1500, 1200, 900, 600, 3000 };

            for (int i = 0; i < titles.Length; i++)
            {
                var a = ScriptableObject.CreateInstance<AchievementData>();
                a.achievementId = $"ach_{i:D3}";
                a.title = titles[i];
                a.description = descs[i];
                a.type = types[i];
                a.requirementValue = reqs[i];
                a.xpReward = xps[i];
                a.coinReward = coins[i];
                achievements.Add(a);
            }

            AchievementSystem.Instance.Initialize(achievements);
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            GameManager.Instance?.ChangeState(GameState.Achievements);
            RefreshGrid();
            UpdateProgress();
            if (detailPanel != null) detailPanel.SetActive(false);
        }

        private void RefreshGrid()
        {
            if (gridContainer == null || AchievementSystem.Instance == null) return;
            foreach (Transform child in gridContainer) Destroy(child.gameObject);

            int typeFilter = typeFilterDropdown != null ? typeFilterDropdown.value : 0;
            bool onlyUnlocked = showOnlyUnlockedToggle != null && showOnlyUnlockedToggle.isOn;
            filtered.Clear();

            foreach (var a in AchievementSystem.Instance.AllAchievements)
            {
                bool typeMatch = typeFilter <= 0 || MatchTypeFilter(a.type, typeFilter);
                bool unlockMatch = !onlyUnlocked || AchievementSystem.Instance.IsUnlocked(a.achievementId);
                if (typeMatch && unlockMatch) filtered.Add(a);
            }

            foreach (var a in filtered)
            {
                if (itemPrefab == null) continue;
                var go = Instantiate(itemPrefab, gridContainer);
                var ui = go.GetComponent<AchievementItemUI>();
                if (ui != null) ui.Initialize(a, AchievementSystem.Instance.IsUnlocked(a.achievementId), OnItemClicked);
            }
        }

        private bool MatchTypeFilter(AchievementType type, int filter)
        {
            switch (filter)
            {
                case 1: return type == AchievementType.TotalPhotos || type == AchievementType.RarityCollection;
                case 2: return type == AchievementType.TotalDistance || type == AchievementType.StormSurvivor;
                case 3: return type == AchievementType.LevelStars || type == AchievementType.CompleteAllLevels || type == AchievementType.TotalCoins;
                case 4: return type == AchievementType.DailyStreak || type == AchievementType.NoDamageClear;
                default: return true;
            }
        }

        private void UpdateProgress()
        {
            if (progressText != null && AchievementSystem.Instance != null)
            {
                int unlocked = AchievementSystem.Instance.GetUnlocked().Count;
                int total = AchievementSystem.Instance.AllAchievements.Count;
                progressText.text = $"成就进度: {unlocked}/{total} ({AchievementSystem.Instance.GetProgress() * 100:F1}%)";
            }
        }

        private void OnItemClicked(AchievementData achievement)
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            if (detailPanel == null) return;
            detailPanel.SetActive(true);

            bool unlocked = AchievementSystem.Instance.IsUnlocked(achievement.achievementId);
            if (detailTitle != null) detailTitle.text = unlocked ? achievement.title : "??? ???";
            if (detailDescription != null) detailDescription.text = unlocked ? achievement.description : "解锁后可见";
            if (detailXPText != null) detailXPText.text = $"经验奖励: {achievement.xpReward}";
            if (detailCoinText != null) detailCoinText.text = $"金币奖励: {achievement.coinReward}";
            if (lockedOverlay != null) lockedOverlay.SetActive(!unlocked);
        }

        private void OnCheckClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            AchievementSystem.Instance?.CheckAndUnlockAchievements();
            RefreshGrid();
            UpdateProgress();
        }

        private void OnBackClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            UIManager.Instance?.OpenPanel(UIType.MainMenu, true);
        }
    }
}
