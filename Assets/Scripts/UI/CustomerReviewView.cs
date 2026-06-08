using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Audio;
using DecorMatch3.Gameplay.Customer;

namespace DecorMatch3.UI
{
    public class CustomerReviewView : UIViewBase
    {
        [Header("Stars")]
        [SerializeField] private Image[] starImages;
        [SerializeField] private Sprite starFilledSprite;
        [SerializeField] private Sprite starEmptySprite;

        [Header("Customer Info")]
        [SerializeField] private TextMeshProUGUI customerNameText;
        [SerializeField] private TextMeshProUGUI feedbackText;
        [SerializeField] private Image customerAvatar;
        [SerializeField] private Image customerMoodImage;

        [Header("Score Breakdown")]
        [SerializeField] private TextMeshProUGUI totalScoreText;
        [SerializeField] private TextMeshProUGUI percentageText;
        [SerializeField] private Transform breakdownContainer;
        [SerializeField] private GameObject breakdownItemPrefab;

        [Header("Positive/Negative Points")]
        [SerializeField] private Transform positivePointsContainer;
        [SerializeField] private Transform negativePointsContainer;
        [SerializeField] private GameObject pointItemPrefab;

        [Header("Rewards")]
        [SerializeField] private TextMeshProUGUI coinsRewardText;
        [SerializeField] private TextMeshProUGUI xpRewardText;
        [SerializeField] private Transform bonusMaterialsContainer;
        [SerializeField] private GameObject bonusMaterialPrefab;

        [Header("Buttons")]
        [SerializeField] private Button nextOrderButton;
        [SerializeField] private Button retryButton;
        [SerializeField] private Button mainMenuButton;
        [SerializeField] private Button shareButton;

        private CustomerReviewResult _reviewResult;

        protected override void Awake()
        {
            base.Awake();
            viewType = UIView.CustomerReview;
        }

        public override void Initialize()
        {
            base.Initialize();

            if (nextOrderButton != null)
                nextOrderButton.onClick.AddListener(OnNextOrderClicked);
            if (retryButton != null)
                retryButton.onClick.AddListener(OnRetryClicked);
            if (mainMenuButton != null)
                mainMenuButton.onClick.AddListener(OnMainMenuClicked);
            if (shareButton != null)
                shareButton.onClick.AddListener(OnShareClicked);

            EventBus.Subscribe<CustomerReviewedEvent>(OnCustomerReviewed);
        }

        private void OnCustomerReviewed(CustomerReviewedEvent e)
        {
            _reviewResult = e.Review;
            UIManager.Instance.OpenView(UIView.CustomerReview, true, false);
            StartCoroutine(PlayReviewSequence(e.Review));
        }

        private IEnumerator PlayReviewSequence(CustomerReviewResult review)
        {
            yield return new WaitForSeconds(0.2f);

            UpdateCustomerInfo(review);
            UpdateScoreDisplay(review);
            UpdateBreakdownDisplay(review);
            UpdatePointsDisplay(review);
            UpdateRewardsDisplay(review);

            yield return new WaitForSeconds(0.3f);
            yield return StartCoroutine(AnimateStars(review.Stars));
        }

        private void UpdateCustomerInfo(CustomerReviewResult review)
        {
            if (customerNameText != null)
                customerNameText.text = review.CustomerName;
            if (feedbackText != null)
                feedbackText.text = review.FeedbackMessage;
            if (customerMoodImage != null)
                customerMoodImage.color = review.IsPositive ? new Color(0.3f, 0.85f, 0.4f) : new Color(0.95f, 0.5f, 0.4f);
        }

        private void UpdateScoreDisplay(CustomerReviewResult review)
        {
            if (totalScoreText != null)
                totalScoreText.text = $"{review.TotalScore} / {review.MaxScore}";
            if (percentageText != null)
                percentageText.text = $"{review.Percentage:F0}%";
        }

        private void UpdateBreakdownDisplay(CustomerReviewResult review)
        {
            if (breakdownContainer == null || breakdownItemPrefab == null) return;

            foreach (Transform child in breakdownContainer)
                Destroy(child.gameObject);

            AddBreakdownItem("配色适配", review.ColorScore, review.ColorMaxScore);
            AddBreakdownItem("家具选择", review.FurnitureScore, review.FurnitureMaxScore);
            AddBreakdownItem("品质评分", review.QualityScore, review.QualityMaxScore);
            AddBreakdownItem("预算控制", review.BudgetScore, review.BudgetMaxScore);
            AddBreakdownItem("完整程度", review.CompletenessScore, review.CompletenessMaxScore);
        }

        private void AddBreakdownItem(string name, int score, int maxScore)
        {
            GameObject itemGO = Instantiate(breakdownItemPrefab, breakdownContainer);
            var texts = itemGO.GetComponentsInChildren<TextMeshProUGUI>();
            if (texts.Length >= 2)
            {
                texts[0].text = name;
                texts[1].text = $"{score}/{maxScore}";
            }

            var images = itemGO.GetComponentsInChildren<Image>();
            foreach (var img in images)
            {
                if (img.name == "Fill")
                {
                    img.fillAmount = maxScore > 0 ? (float)score / maxScore : 0;
                    img.color = score >= maxScore * 0.7f
                        ? new Color(0.3f, 0.85f, 0.4f)
                        : score >= maxScore * 0.4f
                        ? new Color(0.95f, 0.85f, 0.3f)
                        : new Color(0.95f, 0.4f, 0.3f);
                    break;
                }
            }
        }

        private void UpdatePointsDisplay(CustomerReviewResult review)
        {
            if (positivePointsContainer != null && pointItemPrefab != null)
            {
                foreach (Transform child in positivePointsContainer)
                    Destroy(child.gameObject);
                foreach (var point in review.PositivePoints)
                {
                    GameObject item = Instantiate(pointItemPrefab, positivePointsContainer);
                    TextMeshProUGUI text = item.GetComponentInChildren<TextMeshProUGUI>();
                    if (text != null)
                    {
                        text.text = $"✓ {point}";
                        text.color = new Color(0.3f, 0.85f, 0.4f);
                    }
                }
            }

            if (negativePointsContainer != null && pointItemPrefab != null)
            {
                foreach (Transform child in negativePointsContainer)
                    Destroy(child.gameObject);
                foreach (var point in review.NegativePoints)
                {
                    GameObject item = Instantiate(pointItemPrefab, negativePointsContainer);
                    TextMeshProUGUI text = item.GetComponentInChildren<TextMeshProUGUI>();
                    if (text != null)
                    {
                        text.text = $"✗ {point}";
                        text.color = new Color(0.95f, 0.4f, 0.3f);
                    }
                }
            }
        }

        private void UpdateRewardsDisplay(CustomerReviewResult review)
        {
            int coins = CustomerReviewSystem.Instance.GetRewardCoins(review);
            int xp = CustomerReviewSystem.Instance.GetRewardXP(review);

            if (coinsRewardText != null)
                coinsRewardText.text = $"+{coins}";
            if (xpRewardText != null)
                xpRewardText.text = $"+{xp}";

            if (review.IsPositive)
            {
                SaveManager.Instance.AddCoins(coins);
                SaveManager.Instance.AddXP(xp);
                SaveManager.Instance.SaveGame();
            }
        }

        private IEnumerator AnimateStars(int stars)
        {
            ResetStars();
            int earned = 0;

            for (int i = 0; i < 5; i++)
            {
                bool gotStar = i < stars;
                if (starImages != null && i < starImages.Length && starImages[i] != null)
                {
                    starImages[i].gameObject.SetActive(true);
                    yield return StartCoroutine(PopStar(starImages[i], gotStar));
                }

                if (gotStar)
                {
                    earned++;
                    AudioManager.Instance?.PlaySFX(earned >= 4 ? SFXType.CustomerHappy : SFXType.GemClear,
                        0.8f, 1f + i * 0.1f);
                }

                yield return new WaitForSeconds(0.2f);
            }
        }

        private void ResetStars()
        {
            if (starImages == null) return;
            foreach (var star in starImages)
            {
                if (star != null)
                {
                    star.gameObject.SetActive(false);
                    star.sprite = starEmptySprite;
                    star.transform.localScale = Vector3.zero;
                }
            }
        }

        private IEnumerator PopStar(Image starImage, bool earned)
        {
            starImage.transform.localScale = Vector3.zero;
            starImage.sprite = earned ? starFilledSprite : starEmptySprite;

            float timer = 0f;
            while (timer < 0.25f)
            {
                timer += Time.deltaTime;
                float t = timer / 0.25f;
                t = 1 - Mathf.Pow(1 - t, 3);
                starImage.transform.localScale = Vector3.one * (1 + 0.3f * Mathf.Sin(t * Mathf.PI));
                yield return null;
            }

            starImage.transform.localScale = Vector3.one;
        }

        private void OnNextOrderClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();

            int currentOrderId = LevelManager.Instance?.CurrentOrder?.OrderId ?? 1;
            int nextLevelId = currentOrderId + 1;

            OrderData nextOrder = LevelManager.Instance.GetOrder(nextLevelId);
            LevelData nextLevel = LevelManager.Instance.GetLevel(nextLevelId);

            if (nextLevel != null)
            {
                if (nextOrder != null)
                {
                    LevelManager.Instance.StartOrder(nextOrder.OrderId);
                }
                LevelManager.Instance.StartLevel(nextLevelId);
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

        private void OnRetryClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();
            GameStateManager.Instance.ChangeState(GameState.Decorating);
            DecorationSystem.Instance.ResetDecoration();
            UIManager.Instance.OpenView(UIView.DecorationHUD);
        }

        private void OnMainMenuClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
            Close();
            GameStateManager.Instance.ChangeState(GameState.MainMenu);
            SceneLoader.Instance.LoadScene(SceneType.MainMenu);
        }

        private void OnShareClicked()
        {
            AudioManager.Instance?.PlaySFX(SFXType.ButtonClick);
        }

        private void OnDestroy()
        {
            if (nextOrderButton != null)
                nextOrderButton.onClick.RemoveListener(OnNextOrderClicked);
            if (retryButton != null)
                retryButton.onClick.RemoveListener(OnRetryClicked);
            if (mainMenuButton != null)
                mainMenuButton.onClick.RemoveListener(OnMainMenuClicked);
            if (shareButton != null)
                shareButton.onClick.RemoveListener(OnShareClicked);
            EventBus.Unsubscribe<CustomerReviewedEvent>(OnCustomerReviewed);
        }
    }
}
