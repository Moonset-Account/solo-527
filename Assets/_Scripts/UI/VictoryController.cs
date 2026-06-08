using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace LightShadowPlatformer.UI
{
    public class VictoryController : MonoBehaviour
    {
        [Header("References")]
        public TMP_Text titleText;
        public TMP_Text subtitleText;
        public TMP_Text levelCompleteText;
        public TMP_Text collectiblesText;
        public TMP_Text playTimeText;
        public CanvasGroup panelGroup;
        public ParticleSystem fireworksParticles;
        public ParticleSystem starsParticles;

        [Header("Buttons")]
        public Button nextButton;
        public Button replayButton;
        public Button mainMenuButton;

        [Header("Animation")]
        public float enterDuration = 0.8f;
        public float cascadeDelay = 0.15f;
        public CanvasGroup[] cascadeElements;

        public void OnOpen()
        {
            SetupButtons();
            UpdateInfo();
            PlayEnterAnimation();
            PlayEffects();
        }

        private void SetupButtons()
        {
            nextButton?.onClick.RemoveAllListeners();
            replayButton?.onClick.RemoveAllListeners();
            mainMenuButton?.onClick.RemoveAllListeners();

            if (nextButton != null)
                nextButton.onClick.AddListener(OnNextClicked);
            if (replayButton != null)
                replayButton.onClick.AddListener(OnReplayClicked);
            if (mainMenuButton != null)
                mainMenuButton.onClick.AddListener(OnMainMenuClicked);

            var gm = LightShadowPlatformer.Core.GameManager.Instance;
            bool isLastLevel = gm != null && gm.currentLevelIndex >= gm.totalLevels - 1;

            if (nextButton != null)
            {
                nextButton.gameObject.SetActive(!isLastLevel);
                TMP_Text t = nextButton.GetComponentInChildren<TMP_Text>();
                if (t != null) t.text = isLastLevel ? "完成！" : "下一关 →";
            }
        }

        private void UpdateInfo()
        {
            var gm = LightShadowPlatformer.Core.GameManager.Instance;
            var sm = LightShadowPlatformer.Core.SaveManager.Instance;

            if (gm != null && levelCompleteText != null)
            {
                bool isLast = gm.currentLevelIndex >= gm.totalLevels - 1;
                levelCompleteText.text = isLast
                    ? "🎉 恭喜通关全部关卡！"
                    : $"关卡 {gm.currentLevelIndex + 1} 完成！";
            }

            if (titleText != null)
            {
                bool isLast = gm != null && gm.currentLevelIndex >= gm.totalLevels - 1;
                titleText.text = isLast ? "完美通关" : "关卡通过";
            }

            if (subtitleText != null)
            {
                subtitleText.text = "光明与影的交织中，你找到了道路";
            }

            Collectible[] collectibles = FindObjectsOfType<Collectible>();
            int collected = 0;
            int total = collectibles.Length;
            foreach (var c in collectibles) if (c.collected) collected++;
            if (collectiblesText != null)
                collectiblesText.text = $"收集品: {collected} / {total}";

            if (sm != null && playTimeText != null)
            {
                float time = sm.GetCurrentSave().playTime + (Time.realtimeSinceStartup % 10000);
                int minutes = (int)(time / 60);
                int seconds = (int)(time % 60);
                playTimeText.text = $"用时: {minutes:D2}:{seconds:D2}";
            }
        }

        private void PlayEnterAnimation()
        {
            if (panelGroup == null) return;
            StopAllCoroutines();
            StartCoroutine(EnterAnim());
        }

        private IEnumerator EnterAnim()
        {
            float elapsed = 0f;
            panelGroup.alpha = 0f;
            RectTransform rt = panelGroup.GetComponent<RectTransform>();
            Vector3 originalScale = rt != null ? rt.localScale : Vector3.one;
            if (rt != null) rt.localScale = originalScale * 0.3f;

            while (elapsed < enterDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / enterDuration;
                float eased = 1f - Mathf.Pow(1f - t, 3f);
                float bounce = Mathf.Sin(t * Mathf.PI) * 0.3f;
                panelGroup.alpha = Mathf.Lerp(0, 1, eased);
                if (rt != null) rt.localScale = originalScale * (eased * 0.7f + bounce);
                yield return null;
            }
            panelGroup.alpha = 1f;
            if (rt != null) rt.localScale = originalScale;

            if (cascadeElements != null)
            {
                for (int i = 0; i < cascadeElements.Length; i++)
                {
                    if (cascadeElements[i] != null)
                    {
                        StartCoroutine(CascadeIn(cascadeElements[i], i * cascadeDelay));
                    }
                }
            }
        }

        private IEnumerator CascadeIn(CanvasGroup element, float delay)
        {
            yield return new WaitForSecondsRealtime(delay);
            float elapsed = 0f;
            float dur = 0.35f;
            element.alpha = 0f;
            RectTransform rt = element.GetComponent<RectTransform>();
            Vector2 start = rt != null ? rt.anchoredPosition : Vector2.zero;

            while (elapsed < dur)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / dur;
                float eased = 1f - Mathf.Pow(1f - t, 3f);
                element.alpha = eased;
                if (rt != null) rt.anchoredPosition = start + new Vector2(0, -40f) * (1f - eased);
                yield return null;
            }
            element.alpha = 1f;
        }

        private void PlayEffects()
        {
            if (fireworksParticles != null) fireworksParticles.Play();
            if (starsParticles != null) starsParticles.Play();
            LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(
                LightShadowPlatformer.Core.AudioManager.SfxType.GameComplete);
        }

        private void OnNextClicked()
        {
            UIManager.Instance?.PlayUIConfirm();
            var gm = LightShadowPlatformer.Core.GameManager.Instance;
            if (gm != null)
            {
                if (gm.currentLevelIndex >= gm.totalLevels - 1)
                {
                    gm.ReturnToMainMenu();
                }
                else
                {
                    gm.CompleteLevel();
                }
            }
        }

        private void OnReplayClicked()
        {
            UIManager.Instance?.PlayButtonClick();
            LightShadowPlatformer.Core.GameManager.Instance?.RestartLevel();
        }

        private void OnMainMenuClicked()
        {
            UIManager.Instance?.PlayUICancel();
            LightShadowPlatformer.Core.GameManager.Instance?.ReturnToMainMenu();
        }
    }
}
