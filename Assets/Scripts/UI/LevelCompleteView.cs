using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Audio;

namespace DecorMatch3.UI
{
    public class LevelCompleteView : UIViewBase
    {
        [Header("Stars")]
        [SerializeField] private Image[] starImages;
        [SerializeField] private Sprite starFilledSprite;
        [SerializeField] private Sprite starEmptySprite;
        [SerializeField] private GameObject starBurstEffect;

        [Header("Info")]
        [SerializeField] private TextMeshProUGUI scoreText;
        [SerializeField] private TextMeshProUGUI targetScoreText;
        [SerializeField] private TextMeshProUGUI levelTitleText;

        [Header("Rewards")]
        [SerializeField] private TextMeshProUGUI coinsRewardText;
        [SerializeField] private TextMeshProUGUI xpRewardText;
        [SerializeField] private Transform materialsContainer;
        [SerializeField] private GameObject materialRewardPrefab;

        [Header("Buttons")]
        [SerializeField] private Button continueButton;
        [SerializeField] private Button retryButton;
        [SerializeField] private Button mainMenuButton;

        private LevelCompletedEvent _lastEvent;
        private int _starsEarned = 0;

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.LevelComplete;
        }

        public override void Initialize()
        {
            base.Initialize();

            if (continueButton != null)
                continueButton.onClick.AddListener(OnContinueClicked);
            if (retryButton != null)
                retryButton.onClick.AddListener(OnRetryClicked);
            if (mainMenuButton != null)
                mainMenuButton.onClick.AddListener(OnMainMenuClicked);

            EventBus.Subscribe<LevelCompletedEvent>(OnLevelCompleted);
        }

        public override void Open()
        {
            base.Open();
            _starsEarned = 0;
            ResetStars();
        }

        private void OnLevelCompleted(LevelCompletedEvent e)
        {
            _lastEvent = e;
            UpdateDisplay(e);
            UIManager.Instance.OpenView(UIView.LevelComplete, true, false);
            StartCoroutine(PlayVictorySequence(e.StarsEarned));
        }

        private void UpdateDisplay(LevelCompletedEvent e)
        {
            if (scoreText != null)
                scoreText.text = e.FinalScore.ToString();
            if (targetScoreText != null)
                targetScoreText.text = $"目标: {e.LevelData.TargetScore}";
            if (levelTitleText != null)
                levelTitleText.text = $"{e.LevelData.LevelName} 完成！";

            if (coinsRewardText != null)
                coinsRewardText.text = $"+{e.LevelData.CoinReward}";
            if (xpRewardText != null)
                xpRewardText.text = $"+{e.LevelData.XpReward}";

            if (materialsContainer != null && materialRewardPrefab != null)
            {
                foreach (Transform child in materialsContainer)
                {
                    Destroy(child.gameObject);
                }

                foreach (var reward in e.LevelData.MaterialRewards)
                {
                    GameObject rewardObj = Instantiate(materialRewardPrefab, materialsContainer);
                    var rewardUI = rewardObj.GetComponent<MaterialRewardUI>();
                    if (rewardUI != null)
                    {
                        rewardUI.SetReward(reward.MaterialType, reward.Amount);
                    }
                    else
                    {
                        TextMeshProUGUI text = rewardObj.GetComponentInChildren<TextMeshProUGUI>();
                        if (text != null)
                            text.text = $"{reward.MaterialType}: +{reward.Amount}";
                    }
                }
            }
        }

        private void ResetStars()
        {
            if (starImages == null) return;

            foreach (var star in starImages)
            {
                if (star != null && starEmptySprite != null)
                {
                    star.sprite = starEmptySprite;
                    star.gameObject.SetActive(false);
                }
            }
        }

        private IEnumerator PlayVictorySequence(int stars)
        {
            yield return new WaitForSeconds(0.3f);

            _starsEarned = 0;
            for (int i = 0; i < 3; i++)
            {
                bool earned = i < stars;
                if (starImages != null && i < starImages.Length && starImages[i] != null)
                {
                    starImages[i].gameObject.SetActive(true);
                    StartCoroutine(AnimateStar(starImages[i], earned));
                }

                if (earned)
                {
                    _starsEarned++;
                    AudioManager.Instance?.PlaySFX(SFXType.GemClear, 0.8f, 1f + i * 0.15f);
                    if (starBurstEffect != null)
                    {
                        Instantiate(starBurstEffect, starImages[i].transform.position, Quaternion.identity, starImages[i].transform.parent);
                    }
                }

                yield return new WaitForSeconds(0.35f);
            }

            if (_starsEarned >= 3)
            {
                AudioManager.Instance?.PlaySFX(SFXType.Combo, 1f, 1.2f);
            }
        }

        private IEnumerator AnimateStar(Image starImage, bool earned)
        {
            starImage.transform.localScale = Vector3.zero;

            float timer = 0f;
            while (timer < 0.25f)
            {
                timer += Time.deltaTime;
                float t = timer / 0.25f;
                t = 1 - Mathf.Pow(1 - t, 3);
                starImage.transform.localScale = Vector3.one * (1 + 0.3f * Mathf.Sin(t * Mathf.PI));
                yield return null;
            }

            starImage.sprite = earned ? starFilledSprite : starEmptySprite;
            starImage.transform.localScale = Vector3.one;

            if (earned)
            {
                for (int j = 0; j < 3; j++)
                {
                    starImage.transform.localScale = Vector3.one * 1.15f;
                    yield return new WaitForSeconds(0.08f);
                    starImage.transform.localScale = Vector3.one;
                    yield return new WaitForSeconds(0.08f);
                }
            }
        }

        private void OnContinueClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();

            int currentLevelId = _lastEvent.LevelData.LevelId;
            OrderData order = LevelManager.Instance.GetOrderForLevel(currentLevelId);

            if (order != null)
            {
                LevelManager.Instance.StartOrder(order.OrderId);
                SceneLoader.Instance.LoadScene(SceneType.Decoration, false, () =>
                {
                    GameStateManager.Instance.ChangeState(GameState.Decorating);
                    UIManager.Instance.OpenView(UIView.DecorationHUD);
                });
            }
            else
            {
                int nextLevel = currentLevelId + 1;
                LevelData nextLevelData = LevelManager.Instance.GetLevel(nextLevel);
                if (nextLevelData != null)
                {
                    LevelManager.Instance.StartLevel(nextLevel);
                    SceneLoader.Instance.LoadScene(SceneType.Match3Level, false, () =>
                    {
                        GameStateManager.Instance.ChangeState(GameState.PlayingMatch3);
                    });
                }
                else
                {
                    SceneLoader.Instance.LoadScene(SceneType.MainMenu);
                }
            }
        }

        private void OnRetryClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();
            Gameplay.Match3.Match3GameManager.Instance.RestartLevel();
        }

        private void OnMainMenuClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();
            Gameplay.Match3.Match3GameManager.Instance.ExitToMainMenu();
        }

        private void OnDestroy()
        {
            if (continueButton != null)
                continueButton.onClick.RemoveListener(OnContinueClicked);
            if (retryButton != null)
                retryButton.onClick.RemoveListener(OnRetryClicked);
            if (mainMenuButton != null)
                mainMenuButton.onClick.RemoveListener(OnMainMenuClicked);
            EventBus.Unsubscribe<LevelCompletedEvent>(OnLevelCompleted);
        }
    }

    public class MaterialRewardUI : MonoBehaviour
    {
        [SerializeField] private Image iconImage;
        [SerializeField] private TextMeshProUGUI amountText;
        [SerializeField] private TextMeshProUGUI nameText;

        public void SetReward(MaterialType type, int amount)
        {
            if (amountText != null)
                amountText.text = $"+{amount}";
            if (nameText != null)
                nameText.text = GetMaterialName(type);
            if (iconImage != null)
                iconImage.color = GetMaterialColor(type);
        }

        private string GetMaterialName(MaterialType type)
        {
            switch (type)
            {
                case MaterialType.Paint: return "油漆";
                case MaterialType.Fabric: return "布料";
                case MaterialType.Wood: return "木材";
                case MaterialType.Metal: return "金属";
                case MaterialType.Tile: return "瓷砖";
                case MaterialType.Wallpaper: return "壁纸";
                default: return type.ToString();
            }
        }

        private Color GetMaterialColor(MaterialType type)
        {
            switch (type)
            {
                case MaterialType.Paint: return new Color(0.95f, 0.4f, 0.4f);
                case MaterialType.Fabric: return new Color(0.4f, 0.6f, 0.95f);
                case MaterialType.Wood: return new Color(0.7f, 0.5f, 0.3f);
                case MaterialType.Metal: return new Color(0.85f, 0.85f, 0.3f);
                case MaterialType.Tile: return new Color(0.75f, 0.45f, 0.9f);
                case MaterialType.Wallpaper: return new Color(0.95f, 0.6f, 0.3f);
                default: return Color.gray;
            }
        }
    }
}
