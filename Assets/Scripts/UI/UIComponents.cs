using UnityEngine;
using UnityEngine.UI;
using LakeSailing.Core;
using LakeSailing.Data;
using LakeSailing.Gameplay;
using LakeSailing.Meta;

namespace LakeSailing.UI
{
    public static class VisibilityExtensions
    {
        public static string GetName(this VisibilityLevel v)
        {
            switch (v)
            {
                case VisibilityLevel.Excellent: return "极佳";
                case VisibilityLevel.Good: return "良好";
                case VisibilityLevel.Moderate: return "一般";
                case VisibilityLevel.Poor: return "较差";
                case VisibilityLevel.VeryPoor: return "极差";
                case VisibilityLevel.Zero: return "无";
                default: return "未知";
            }
        }
    }

    public class TaskItemUI : MonoBehaviour
    {
        [SerializeField] private Text taskNameText;
        [SerializeField] private Text taskDescText;
        [SerializeField] private Text statusText;
        [SerializeField] private Image statusBackground;
        [SerializeField] private Image rarityMarker;
        [SerializeField] private Button focusButton;

        private PhotoTaskState taskState;
        private PhotoTaskData taskData;

        public void Initialize(PhotoTaskState state, PhotoTaskData data)
        {
            taskState = state;
            taskData = data;
            UpdateDisplay();

            if (focusButton != null)
            {
                focusButton.onClick.RemoveAllListeners();
                focusButton.onClick.AddListener(() =>
                {
                    EventBus.Trigger(new FocusTaskEvent(taskData.targetPosition));
                });
            }
        }

        private void UpdateDisplay()
        {
            if (taskNameText != null) taskNameText.text = taskData != null ? taskData.targetName : "未知目标";
            if (taskDescText != null) taskDescText.text = taskData != null ? taskData.description : "";

            if (statusText != null && statusBackground != null)
            {
                switch (taskState.status)
                {
                    case TaskStatus.Available:
                        statusText.text = $"可拍摄 ({taskState.attemptsRemaining}/3)";
                        statusBackground.color = new Color(0.2f, 0.6f, 1f);
                        break;
                    case TaskStatus.InProgress:
                        statusText.text = "拍摄中...";
                        statusBackground.color = Color.yellow;
                        break;
                    case TaskStatus.Completed:
                        statusText.text = $"已完成 ({taskState.bestScore}分)";
                        statusBackground.color = new Color(0.2f, 0.8f, 0.4f);
                        break;
                    case TaskStatus.Failed:
                        statusText.text = "拍摄失败";
                        statusBackground.color = new Color(0.8f, 0.2f, 0.2f);
                        break;
                }
            }

            if (rarityMarker != null)
            {
                Color c = Color.white;
                switch (taskData?.targetRarity ?? 1)
                {
                    case 1: c = new Color(0.7f, 0.7f, 0.7f); break;
                    case 2: c = new Color(0.2f, 0.8f, 0.4f); break;
                    case 3: c = new Color(0.2f, 0.5f, 1f); break;
                    case 4: c = new Color(0.8f, 0.3f, 0.9f); break;
                    case 5: c = new Color(1f, 0.7f, 0.1f); break;
                }
                rarityMarker.color = c;
            }
        }
    }

    public struct FocusTaskEvent : IEvent
    {
        public readonly Vector2 TargetPosition;
        public FocusTaskEvent(Vector2 pos) { TargetPosition = pos; }
    }

    public class ForecastItemUI : MonoBehaviour
    {
        [SerializeField] private Image weatherIcon;
        [SerializeField] private Text weatherNameText;
        [SerializeField] private Text windText;
        [SerializeField] private Image windArrow;
        [SerializeField] private Slider windStrengthSlider;
        [SerializeField] private Text visibilityText;
        [SerializeField] private Text timeIndexText;

        public void Initialize(WeatherForecast forecast, int index)
        {
            if (weatherNameText != null)
                weatherNameText.text = WeatherSystem.Instance != null ? WeatherSystem.Instance.GetWeatherName(forecast.weather) : forecast.weather.ToString();
            if (windText != null)
                windText.text = WeatherSystem.Instance != null ? WeatherSystem.Instance.GetWindDirectionName(forecast.windDirection) : forecast.windDirection.ToString();
            if (visibilityText != null) visibilityText.text = forecast.visibility.GetName();
            if (windStrengthSlider != null) windStrengthSlider.value = forecast.windStrength;
            if (windArrow != null) windArrow.rectTransform.rotation = Quaternion.Euler(0, 0, -(float)forecast.windDirection);
            if (timeIndexText != null) timeIndexText.text = index == 0 ? "当前" : $"T+{index}";
        }
    }

    public class LevelCardUI : MonoBehaviour
    {
        [SerializeField] private Text levelNameText;
        [SerializeField] private Text difficultyText;
        [SerializeField] private Text bestScoreText;
        [SerializeField] private Image[] stars;
        [SerializeField] private Image lockOverlay;
        [SerializeField] private Button selectButton;

        private LevelConfigData levelConfig;
        private System.Action<LevelConfigData> onSelected;

        public void Initialize(LevelConfigData config, System.Action<LevelConfigData> callback)
        {
            levelConfig = config;
            onSelected = callback;

            var save = SaveSystem.Instance?.CurrentSave;
            bool isUnlocked = save != null && save.unlockedLevelIds.Contains(config.levelId);
            var bestScore = SaveSystem.Instance?.GetLevelBestScore(config.levelId) ?? new LevelScoreData();

            if (levelNameText != null) levelNameText.text = config.levelName;
            if (difficultyText != null)
            {
                difficultyText.text = new string('★', config.difficulty) + new string('☆', Mathf.Max(0, 4 - config.difficulty));
                Color c;
                switch (config.difficulty)
                {
                    case 1: c = Color.green; break;
                    case 2: c = Color.yellow; break;
                    case 3: c = new Color(1f, 0.5f, 0f); break;
                    default: c = Color.red; break;
                }
                difficultyText.color = c;
            }
            if (bestScoreText != null) bestScoreText.text = isUnlocked ? $"最高: {bestScore.score}" : "未解锁";
            if (stars != null)
            {
                for (int i = 0; i < stars.Length; i++)
                {
                    if (stars[i] != null) stars[i].color = i < bestScore.stars ? Color.yellow : Color.gray;
                }
            }
            if (lockOverlay != null) lockOverlay.enabled = !isUnlocked;
            if (selectButton != null)
            {
                selectButton.interactable = isUnlocked;
                selectButton.onClick.RemoveAllListeners();
                selectButton.onClick.AddListener(() => onSelected?.Invoke(levelConfig));
            }
        }
    }

    public class GalleryItemUI : MonoBehaviour
    {
        [SerializeField] private Image previewImage;
        [SerializeField] private Text itemNameText;
        [SerializeField] private Image rarityBackground;
        [SerializeField] private Image lockedOverlay;
        [SerializeField] private Button clickButton;

        private GalleryItemData item;
        private System.Action<GalleryItemData> onClick;

        public void Initialize(GalleryItemData data, bool unlocked, System.Action<GalleryItemData> callback)
        {
            item = data;
            onClick = callback;

            if (itemNameText != null) itemNameText.text = unlocked ? data.itemName : "???";
            if (previewImage != null && !unlocked) previewImage.color = Color.gray;
            if (lockedOverlay != null) lockedOverlay.enabled = !unlocked;

            if (rarityBackground != null)
            {
                Color c;
                switch (data.rarity)
                {
                    case 1: c = new Color(0.7f, 0.7f, 0.7f, 0.3f); break;
                    case 2: c = new Color(0.2f, 0.8f, 0.4f, 0.3f); break;
                    case 3: c = new Color(0.2f, 0.5f, 1f, 0.3f); break;
                    case 4: c = new Color(0.8f, 0.3f, 0.9f, 0.3f); break;
                    case 5: c = new Color(1f, 0.7f, 0.1f, 0.3f); break;
                    default: c = Color.white; break;
                }
                rarityBackground.color = c;
            }

            if (clickButton != null)
            {
                clickButton.onClick.RemoveAllListeners();
                clickButton.onClick.AddListener(() => onClick?.Invoke(item));
            }
        }
    }

    public class AchievementItemUI : MonoBehaviour
    {
        [SerializeField] private Image icon;
        [SerializeField] private Text titleText;
        [SerializeField] private Text descText;
        [SerializeField] private Image unlockedGlow;
        [SerializeField] private Image lockedOverlay;
        [SerializeField] private Button clickButton;

        private AchievementData achievement;
        private System.Action<AchievementData> onClick;

        public void Initialize(AchievementData data, bool unlocked, System.Action<AchievementData> callback)
        {
            achievement = data;
            onClick = callback;

            if (titleText != null) titleText.text = unlocked ? data.title : "??? ???";
            if (descText != null) descText.text = unlocked ? data.description : "未解锁成就";
            if (unlockedGlow != null) unlockedGlow.enabled = unlocked;
            if (lockedOverlay != null) lockedOverlay.enabled = !unlocked;
            if (icon != null && !unlocked) icon.color = Color.gray;

            if (clickButton != null)
            {
                clickButton.onClick.RemoveAllListeners();
                clickButton.onClick.AddListener(() => onClick?.Invoke(achievement));
            }
        }
    }

    public class LeaderboardEntryUI : MonoBehaviour
    {
        [SerializeField] private Text rankText;
        [SerializeField] private Text playerNameText;
        [SerializeField] private Text scoreText;
        [SerializeField] private Text starsOrDateText;
        [SerializeField] private Image rankBackground;
        [SerializeField] private GameObject playerHighlight;

        public void InitializeGlobal(LeaderboardEntry entry)
        {
            SetupCommon(entry);
            if (starsOrDateText != null) starsOrDateText.text = $"总星数: {entry.stars} ★";
        }

        public void InitializeLevel(LeaderboardEntry entry)
        {
            SetupCommon(entry);
            if (starsOrDateText != null) starsOrDateText.text = $"{entry.stars} ★ | {entry.date}";
        }

        private void SetupCommon(LeaderboardEntry entry)
        {
            if (rankText != null) rankText.text = entry.rank.ToString();
            if (playerNameText != null) playerNameText.text = entry.playerName;
            if (scoreText != null) scoreText.text = entry.score.ToString("N0");

            if (rankBackground != null)
            {
                Color c;
                switch (entry.rank)
                {
                    case 1: c = new Color(1f, 0.8f, 0.1f, 0.5f); break;
                    case 2: c = new Color(0.75f, 0.75f, 0.8f, 0.4f); break;
                    case 3: c = new Color(0.8f, 0.5f, 0.2f, 0.4f); break;
                    default: c = new Color(1, 1, 1, 0.1f); break;
                }
                rankBackground.color = c;
            }

            if (playerHighlight != null)
            {
                var save = SaveSystem.Instance?.CurrentSave;
                playerHighlight.SetActive(save != null && entry.playerName == save.playerName);
            }
        }
    }
}
