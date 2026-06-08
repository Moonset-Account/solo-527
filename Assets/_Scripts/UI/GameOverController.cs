using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace LightShadowPlatformer.UI
{
    public class GameOverController : MonoBehaviour
    {
        [Header("References")]
        public TMP_Text titleText;
        public TMP_Text deathReasonText;
        public TMP_Text levelProgressText;
        public CanvasGroup panelGroup;

        [Header("Buttons")]
        public Button retryButton;
        public Button checkpointButton;
        public Button mainMenuButton;

        [Header("Animation")]
        public float enterDuration = 0.5f;
        public float shakeIntensity = 8f;
        public float shakeDuration = 0.4f;

        public void OnOpen()
        {
            SetupButtons();
            UpdateInfo();
            PlayEnterAnimation();
        }

        private void SetupButtons()
        {
            retryButton?.onClick.RemoveAllListeners();
            checkpointButton?.onClick.RemoveAllListeners();
            mainMenuButton?.onClick.RemoveAllListeners();

            if (retryButton != null)
                retryButton.onClick.AddListener(OnRetryClicked);
            if (checkpointButton != null)
                checkpointButton.onClick.AddListener(OnCheckpointClicked);
            if (mainMenuButton != null)
                mainMenuButton.onClick.AddListener(OnMainMenuClicked);

            bool hasCp = !string.IsNullOrEmpty(
                LightShadowPlatformer.Core.SaveManager.Instance?.GetActiveCheckpointId());
            if (checkpointButton != null)
                checkpointButton.interactable = hasCp;
        }

        private void UpdateInfo()
        {
            var gm = LightShadowPlatformer.Core.GameManager.Instance;
            if (gm != null && levelProgressText != null)
            {
                levelProgressText.text = $"关卡 {gm.currentLevelIndex + 1} / {gm.totalLevels}";
            }

            if (deathReasonText != null)
                deathReasonText.text = "被黑暗吞噬了...";
        }

        private void PlayEnterAnimation()
        {
            if (panelGroup == null) return;
            StopAllCoroutines();
            StartCoroutine(EnterAnim());
        }

        private System.Collections.IEnumerator EnterAnim()
        {
            float elapsed = 0f;
            panelGroup.alpha = 0f;
            RectTransform rt = panelGroup.GetComponent<RectTransform>();
            Vector3 originalScale = rt != null ? rt.localScale : Vector3.one;

            if (rt != null) rt.localScale = originalScale * 0.6f;

            while (elapsed < enterDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = 1f - Mathf.Pow(1f - elapsed / enterDuration, 4f);
                panelGroup.alpha = t;
                if (rt != null)
                {
                    float s = Mathf.Lerp(0.6f, 1f, t);
                    float shake = Mathf.Sin(elapsed * 40f) * (1f - t) * shakeIntensity * 0.1f;
                    rt.localScale = originalScale * s;
                    rt.anchoredPosition = new Vector2(shake, 0);
                }
                yield return null;
            }
            panelGroup.alpha = 1f;
            if (rt != null)
            {
                rt.localScale = originalScale;
                rt.anchoredPosition = Vector2.zero;
            }
        }

        private void OnRetryClicked()
        {
            UIManager.Instance?.PlayUIConfirm();
            LightShadowPlatformer.Core.GameManager.Instance?.RestartLevel();
        }

        private void OnCheckpointClicked()
        {
            UIManager.Instance?.PlayUIConfirm();
            LightShadowPlatformer.Core.GameManager.Instance?.ChangeState(
                LightShadowPlatformer.Core.GameManager.GameState.Playing);
            LightShadowPlatformer.Core.EventManager.Instance.TriggerPlayerSpawn();
        }

        private void OnMainMenuClicked()
        {
            UIManager.Instance?.PlayUICancel();
            LightShadowPlatformer.Core.GameManager.Instance?.ReturnToMainMenu();
        }
    }
}
