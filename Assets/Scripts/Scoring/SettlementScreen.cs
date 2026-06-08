using UnityEngine;
using UnityEngine.UI;
using System.Collections;

namespace InkMountainBridge
{
    public class SettlementScreen : MonoBehaviour
    {
        [SerializeField] private Text scoreText;
        [SerializeField] private Text timeText;
        [SerializeField] private Text materialsText;
        [SerializeField] private Text integrityText;
        [SerializeField] private Image[] ratingStars;
        [SerializeField] private Button retryButton;
        [SerializeField] private Button nextLevelButton;

        public LevelResult result;

        private Coroutine scoreAnimationCoroutine;
        private Coroutine starsAnimationCoroutine;

        public void Show(LevelResult result)
        {
            this.result = result;
            gameObject.SetActive(true);

            timeText.text = result.completionTime.ToString("F1") + "s";
            materialsText.text = result.materialsUsed + " / " + result.totalBudget;
            integrityText.text = ((1f - result.maxStressRatio) * 100f).ToString("F0") + "%";

            if (scoreAnimationCoroutine != null) StopCoroutine(scoreAnimationCoroutine);
            scoreAnimationCoroutine = StartCoroutine(AnimateScoreRoutine(result.score));

            int starCount = GetStarCount(result.score);
            if (starsAnimationCoroutine != null) StopCoroutine(starsAnimationCoroutine);
            starsAnimationCoroutine = StartCoroutine(AnimateStarsRoutine(starCount));
        }

        public void Hide()
        {
            if (scoreAnimationCoroutine != null) StopCoroutine(scoreAnimationCoroutine);
            if (starsAnimationCoroutine != null) StopCoroutine(starsAnimationCoroutine);
            gameObject.SetActive(false);
        }

        public void AnimateScore(int targetScore)
        {
            if (scoreAnimationCoroutine != null) StopCoroutine(scoreAnimationCoroutine);
            scoreAnimationCoroutine = StartCoroutine(AnimateScoreRoutine(targetScore));
        }

        public void AnimateStars(int count)
        {
            if (starsAnimationCoroutine != null) StopCoroutine(starsAnimationCoroutine);
            starsAnimationCoroutine = StartCoroutine(AnimateStarsRoutine(count));
        }

        public void OnRetryClicked()
        {
            GameEvents.RaiseLevelStarted(null);
        }

        public void OnNextLevelClicked()
        {
            GameEvents.RaiseLevelCompleted(result.levelId + 1);
        }

        private IEnumerator AnimateScoreRoutine(int targetScore)
        {
            int current = 0;
            float duration = 1.5f;
            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                current = Mathf.RoundToInt(Mathf.Lerp(0, targetScore, t));
                scoreText.text = current.ToString();
                yield return null;
            }

            scoreText.text = targetScore.ToString();
            scoreAnimationCoroutine = null;
        }

        private IEnumerator AnimateStarsRoutine(int count)
        {
            for (int i = 0; i < ratingStars.Length; i++)
            {
                if (ratingStars[i] != null)
                    ratingStars[i].fillAmount = 0f;
            }

            for (int i = 0; i < count && i < ratingStars.Length; i++)
            {
                if (ratingStars[i] == null) continue;

                float elapsed = 0f;
                float duration = 0.3f;

                while (elapsed < duration)
                {
                    elapsed += Time.deltaTime;
                    ratingStars[i].fillAmount = Mathf.Clamp01(elapsed / duration);
                    yield return null;
                }

                ratingStars[i].fillAmount = 1f;
                yield return new WaitForSeconds(0.15f);
            }

            starsAnimationCoroutine = null;
        }

        private int GetStarCount(int score)
        {
            if (score >= 900) return 3;
            if (score >= 600) return 2;
            if (score > 0) return 1;
            return 0;
        }

        private void Awake()
        {
            retryButton.onClick.AddListener(OnRetryClicked);
            nextLevelButton.onClick.AddListener(OnNextLevelClicked);
        }
    }
}
