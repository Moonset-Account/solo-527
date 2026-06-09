using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Audio;
using LakeSailing.Data;

namespace LakeSailing.UI
{
    public class LevelSelectPanel : UIPanelBase
    {
        [Header("关卡列表")]
        [SerializeField] private Transform levelGridContainer;
        [SerializeField] private GameObject levelCardPrefab;
        [SerializeField] private List<LevelCardUI> levelCards = new List<LevelCardUI>();

        [Header("关卡详情")]
        [SerializeField] private GameObject detailPanel;
        [SerializeField] private Text detailLevelName;
        [SerializeField] private Text detailDescription;
        [SerializeField] private Text detailDifficulty;
        [SerializeField] private Text detailTaskCount;
        [SerializeField] private Text detailTimeLimit;
        [SerializeField] private Text detailBestScore;
        [SerializeField] private Image[] detailStars;
        [SerializeField] private Button startButton;
        [SerializeField] private Button backButton;

        [Header("筛选")]
        [SerializeField] private Toggle showAllToggle;
        [SerializeField] private Toggle showUnlockedToggle;
        [SerializeField] private Toggle showCompletedToggle;

        private LevelConfigData selectedLevel;
        private List<LevelConfigData> allLevels = new List<LevelConfigData>();

        private void Awake()
        {
            panelType = UIType.LevelSelect;
            UIManager.Instance?.RegisterPanel(panelType, this);
        }

        private void Start()
        {
            InitializeButtons();
            LoadAllLevels();
        }

        private void InitializeButtons()
        {
            if (startButton) startButton.onClick.AddListener(OnStartClicked);
            if (backButton) backButton.onClick.AddListener(OnBackClicked);
            if (showAllToggle) showAllToggle.onValueChanged.AddListener(_ => RefreshLevelList());
            if (showUnlockedToggle) showUnlockedToggle.onValueChanged.AddListener(_ => RefreshLevelList());
            if (showCompletedToggle) showCompletedToggle.onValueChanged.AddListener(_ => RefreshLevelList());
        }

        private void LoadAllLevels()
        {
            allLevels.Clear();

            allLevels.Add(CreateMockLevel("tutorial_01", "新手教程：平静之湖", 1,
                "学习基本操作，完成一次简单的拍摄任务。平静的湖面最适合新手。"));
            allLevels.Add(CreateMockLevel("level_01", "翠湖春晓", 1,
                "春天的翠湖生机勃勃，各种鸟类聚集于此。抓住好天气，记录下春日美景。"));
            allLevels.Add(CreateMockLevel("level_02", "迷雾仙踪", 2,
                "清晨的湖面弥漫着神秘的雾气，传说中的稀有生物只在此时出现。注意能见度！"));
            allLevels.Add(CreateMockLevel("level_03", "风暴航线", 2,
                "天气预报显示午后有暴风雨。你必须在那之前完成所有拍摄并返航。"));
            allLevels.Add(CreateMockLevel("level_04", "金秋秘境", 3,
                "秋天的湖区色彩斑斓，但天气多变。合理规划路线是取得高分的关键。"));
            allLevels.Add(CreateMockLevel("level_05", "极寒挑战", 3,
                "冰封前的最后一次航行，补给极其稀缺。每一次决策都至关重要！"));
            allLevels.Add(CreateMockLevel("level_06", "终极试炼", 4,
                "综合所有挑战的终极关卡，只有真正的船长才能征服这片湖泊！"));
        }

        private LevelConfigData CreateMockLevel(string id, string name, int diff, string desc)
        {
            var level = ScriptableObject.CreateInstance<LevelConfigData>();
            level.levelId = id;
            level.levelName = name;
            level.difficulty = diff;
            level.levelDescription = desc;
            level.seed = id.GetHashCode();
            level.timeLimitSeconds = 480f + diff * 60f;
            level.minStarsScore = 500 * diff;
            level.twoStarsScore = 1500 * diff;
            level.threeStarsScore = 3000 * diff;

            int taskCount = 2 + diff;
            level.photoTasks = new PhotoTaskData[taskCount];
            for (int i = 0; i < taskCount; i++)
            {
                level.photoTasks[i] = new PhotoTaskData
                {
                    taskId = $"{id}_task_{i}",
                    targetName = GetTargetName(i),
                    description = GetTaskDescription(i),
                    targetPosition = new Vector2(Random.Range(-50f, 50f), Random.Range(-30f, 30f)),
                    detectionRadius = 10f,
                    optimalDistance = 5f,
                    basePoints = 100 * diff,
                    targetRarity = (i % 3) + 1
                };
            }

            return level;
        }

        private string GetTargetName(int index)
        {
            string[] names = { "白鹭", "水杉倒影", "日落湖面", "睡莲", "鸳鸯", "湖心岛", "彩虹桥", "渔舟唱晚" };
            return names[index % names.Length];
        }

        private string GetTaskDescription(int index)
        {
            string[] descs = {
                "拍摄水边优雅的白鹭",
                "记录水杉在水中的完美倒影",
                "捕捉夕阳映照湖面的瞬间",
                "拍摄盛开的睡莲",
                "记录成双成对的鸳鸯",
                "拍摄神秘的湖心岛",
                "捕捉彩虹桥的全景",
                "记录夕阳下的归舟"
            };
            return descs[index % descs.Length];
        }

        protected override void OnOpened()
        {
            base.OnOpened();
            GameManager.Instance?.ChangeState(GameState.LevelSelect);
            RefreshLevelList();
            HideDetailPanel();
        }

        private void RefreshLevelList()
        {
            if (levelGridContainer == null) return;
            foreach (Transform child in levelGridContainer)
            {
                Destroy(child.gameObject);
            }
            levelCards.Clear();

            var filtered = FilterLevels(allLevels);
            foreach (var level in filtered)
            {
                if (levelCardPrefab != null)
                {
                    var go = Instantiate(levelCardPrefab, levelGridContainer);
                    var card = go.GetComponent<LevelCardUI>();
                    if (card != null)
                    {
                        card.Initialize(level, OnLevelSelected);
                        levelCards.Add(card);
                    }
                }
            }
        }

        private List<LevelConfigData> FilterLevels(List<LevelConfigData> input)
        {
            var result = new List<LevelConfigData>();
            var save = SaveSystem.Instance?.CurrentSave;

            foreach (var level in input)
            {
                bool isUnlocked = save != null && save.unlockedLevelIds.Contains(level.levelId);
                bool isCompleted = save != null && save.completedLevelIds.Contains(level.levelId);

                if (showUnlockedToggle != null && showUnlockedToggle.isOn && !isUnlocked) continue;
                if (showCompletedToggle != null && showCompletedToggle.isOn && !isCompleted) continue;

                result.Add(level);
            }
            return result;
        }

        private void OnLevelSelected(LevelConfigData level)
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            selectedLevel = level;
            ShowDetailPanel();
        }

        private void ShowDetailPanel()
        {
            if (detailPanel == null || selectedLevel == null) return;
            detailPanel.SetActive(true);

            var save = SaveSystem.Instance?.CurrentSave;
            bool isUnlocked = save != null && save.unlockedLevelIds.Contains(selectedLevel.levelId);
            var bestScore = SaveSystem.Instance?.GetLevelBestScore(selectedLevel.levelId) ?? new LevelScoreData();

            if (detailLevelName != null) detailLevelName.text = selectedLevel.levelName;
            if (detailDescription != null) detailDescription.text = selectedLevel.levelDescription;
            if (detailDifficulty != null) detailDifficulty.text = $"难度: {GetDifficultyStars(selectedLevel.difficulty)}";
            if (detailTaskCount != null) detailTaskCount.text = $"任务数: {selectedLevel.photoTasks?.Length ?? 0}";
            int min = Mathf.FloorToInt(selectedLevel.timeLimitSeconds / 60f);
            int sec = Mathf.FloorToInt(selectedLevel.timeLimitSeconds % 60f);
            if (detailTimeLimit != null) detailTimeLimit.text = $"时限: {min:00}:{sec:00}";
            if (detailBestScore != null) detailBestScore.text = $"最高分: {bestScore.score}";

            if (detailStars != null)
            {
                for (int i = 0; i < detailStars.Length; i++)
                {
                    if (detailStars[i] != null)
                    {
                        detailStars[i].color = i < bestScore.stars ? Color.yellow : Color.gray;
                    }
                }
            }

            if (startButton != null) startButton.interactable = isUnlocked;
        }

        private void HideDetailPanel()
        {
            if (detailPanel != null) detailPanel.SetActive(false);
            selectedLevel = null;
        }

        private string GetDifficultyStars(int diff)
        {
            return new string('★', diff) + new string('☆', Mathf.Max(0, 4 - diff));
        }

        private void OnStartClicked()
        {
            if (selectedLevel == null) return;
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);

            GameManager.Instance?.SetCurrentLevel(selectedLevel.levelId, selectedLevel.difficulty);
            GameManager.Instance?.ChangeState(GameState.Playing);
            EventBus.Trigger(new LoadLevelEvent(selectedLevel));
            Close();
        }

        private void OnBackClicked()
        {
            AudioManager.Instance?.PlaySfx(SfxType.ButtonClick);
            Close();
            UIManager.Instance?.OpenPanel(UIType.MainMenu, true);
        }
    }

    public struct LoadLevelEvent : IEvent
    {
        public readonly LevelConfigData Level;

        public LoadLevelEvent(LevelConfigData level)
        {
            Level = level;
        }
    }
}
