using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Audio;

namespace DecorMatch3.UI
{
    public class LevelSelectView : UIViewBase
    {
        [Header("Level Grid")]
        [SerializeField] private Transform levelsContainer;
        [SerializeField] private GameObject levelItemPrefab;
        [SerializeField] private ScrollRect levelsScrollRect;

        [Header("Info")]
        [SerializeField] private TextMeshProUGUI titleText;
        [SerializeField] private TextMeshProUGUI playerLevelText;
        [SerializeField] private TextMeshProUGUI coinsText;
        [SerializeField] private TextMeshProUGUI completedLevelsText;

        [Header("Buttons")]
        [SerializeField] private Button backButton;

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.LevelSelect;
        }

        public override void Initialize()
        {
            base.Initialize();
            if (backButton != null)
                backButton.onClick.AddListener(OnBackClicked);
        }

        public override void Open()
        {
            base.Open();
            UpdateInfo();
            PopulateLevels();
        }

        private void UpdateInfo()
        {
            var progress = SaveManager.Instance?.CurrentSave.Progress;
            if (progress == null) return;

            if (playerLevelText != null)
                playerLevelText.text = $"Lv.{progress.PlayerLevel}";
            if (coinsText != null)
                coinsText.text = progress.Coins.ToString();
            if (completedLevelsText != null)
                completedLevelsText.text = $"已完成: {progress.CompletedLevels.Count}";
        }

        private void PopulateLevels()
        {
            if (levelsContainer == null) return;

            foreach (Transform child in levelsContainer)
                Destroy(child.gameObject);

            List<LevelData> levels = LevelManager.Instance.GetAllLevels();
            var progress = SaveManager.Instance?.CurrentSave.Progress;

            foreach (var level in levels)
            {
                if (levelItemPrefab == null) continue;

                GameObject levelGO = Instantiate(levelItemPrefab, levelsContainer);
                LevelSelectItem item = levelGO.GetComponent<LevelSelectItem>();
                if (item == null) item = levelGO.AddComponent<LevelSelectItem>();

                bool isUnlocked = progress != null && level.LevelId <= progress.HighestUnlockedLevel;
                bool isCompleted = progress != null && progress.CompletedLevels.Contains(level.LevelId);

                item.SetLevel(level, isUnlocked, isCompleted);
                item.OnLevelSelected += HandleLevelSelected;
            }

            if (levelsScrollRect != null)
            {
                levelsScrollRect.normalizedPosition = new Vector2(0, 1);
            }
        }

        private void HandleLevelSelected(LevelData level)
        {
            var progress = SaveManager.Instance?.CurrentSave.Progress;
            if (progress == null || level.LevelId > progress.HighestUnlockedLevel)
            {
                AudioManager.Instance?.PlaySFX(SFXType.Error);
                return;
            }

            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();

            OrderData order = LevelManager.Instance.GetOrderForLevel(level.LevelId);
            if (order != null)
            {
                LevelManager.Instance.StartOrder(order.OrderId);
            }

            LevelManager.Instance.StartLevel(level.LevelId);
            SceneLoader.Instance.LoadScene(SceneType.Match3Level, false, () =>
            {
                GameStateManager.Instance.ChangeState(GameState.PlayingMatch3);
            });
        }

        private void OnBackClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();
            UIManager.Instance.GoBack();
        }

        private void OnDestroy()
        {
            if (backButton != null)
                backButton.onClick.RemoveListener(OnBackClicked);
        }
    }

    public class LevelSelectItem : MonoBehaviour
    {
        [SerializeField] private TextMeshProUGUI levelNumberText;
        [SerializeField] private TextMeshProUGUI levelNameText;
        [SerializeField] private TextMeshProUGUI difficultyText;
        [SerializeField] private Image[] starImages;
        [SerializeField] private Sprite starFilledSprite;
        [SerializeField] private Sprite starEmptySprite;
        [SerializeField] private Image lockOverlay;
        [SerializeField] private Button selectButton;
        [SerializeField] private Image backgroundImage;

        private LevelData _level;

        public event System.Action<LevelData> OnLevelSelected;

        public void SetLevel(LevelData level, bool isUnlocked, bool isCompleted)
        {
            _level = level;

            if (levelNumberText != null)
                levelNumberText.text = level.LevelId.ToString();
            if (levelNameText != null)
                levelNameText.text = level.LevelName;
            if (difficultyText != null)
                difficultyText.text = new string('★', level.DifficultyRating);

            if (backgroundImage != null)
            {
                backgroundImage.color = isCompleted
                    ? new Color(0.3f, 0.7f, 0.4f)
                    : isUnlocked
                    ? new Color(0.92f, 0.85f, 0.7f)
                    : new Color(0.3f, 0.3f, 0.35f);
            }

            if (lockOverlay != null)
            {
                lockOverlay.gameObject.SetActive(!isUnlocked);
            }

            if (starImages != null)
            {
                int stars = isCompleted ? GetStars(level) : 0;
                for (int i = 0; i < 3; i++)
                {
                    if (i < starImages.Length && starImages[i] != null)
                    {
                        starImages[i].sprite = i < stars ? starFilledSprite : starEmptySprite;
                        starImages[i].color = isUnlocked ? Color.white : new Color(1, 1, 1, 0.3f);
                    }
                }
            }

            if (selectButton != null)
            {
                selectButton.onClick.RemoveAllListeners();
                selectButton.onClick.AddListener(() => OnLevelSelected?.Invoke(_level));
                selectButton.interactable = isUnlocked;
            }
        }

        private int GetStars(LevelData level)
        {
            if (SaveManager.Instance == null) return 1;
            int avgScore = level.TargetScore;
            int playerScore = Mathf.FloorToInt(avgScore * 1.5f);
            float ratio = (float)playerScore / level.TargetScore;
            if (ratio >= 2f) return 3;
            if (ratio >= 1.5f) return 2;
            return 1;
        }
    }
}
