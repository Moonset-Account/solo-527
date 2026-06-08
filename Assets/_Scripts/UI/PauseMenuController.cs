using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace LightShadowPlatformer.UI
{
    public class PauseMenuController : MonoBehaviour
    {
        [Header("Buttons")]
        public Button resumeButton;
        public Button restartButton;
        public Button settingsButton;
        public Button mainMenuButton;

        [Header("Labels")]
        public TMP_Text titleText;
        public TMP_Text currentLevelText;
        public TMP_Text playTimeText;

        [Header("Animation")]
        public CanvasGroup panelGroup;
        public float openDuration = 0.25f;

        public void OnOpen()
        {
            UpdateInfo();
            PlayOpenAnimation();
            SetupButtons();
        }

        private void SetupButtons()
        {
            resumeButton?.onClick.RemoveAllListeners();
            restartButton?.onClick.RemoveAllListeners();
            settingsButton?.onClick.RemoveAllListeners();
            mainMenuButton?.onClick.RemoveAllListeners();

            if (resumeButton != null)
                resumeButton.onClick.AddListener(OnResumeClicked);
            if (restartButton != null)
                restartButton.onClick.AddListener(OnRestartClicked);
            if (settingsButton != null)
                settingsButton.onClick.AddListener(OnSettingsClicked);
            if (mainMenuButton != null)
                mainMenuButton.onClick.AddListener(OnMainMenuClicked);
        }

        private void UpdateInfo()
        {
            var gm = LightShadowPlatformer.Core.GameManager.Instance;
            if (gm != null && currentLevelText != null)
            {
                currentLevelText.text = $"当前关卡: {gm.currentLevelIndex + 1} / {gm.totalLevels}";
            }

            var sm = LightShadowPlatformer.Core.SaveManager.Instance;
            if (sm != null && playTimeText != null)
            {
                float time = sm.GetCurrentSave().playTime + (Time.realtimeSinceStartup % 10000);
                int minutes = (int)(time / 60);
                int seconds = (int)(time % 60);
                playTimeText.text = $"游玩时间: {minutes:D2}:{seconds:D2}";
            }
        }

        private void PlayOpenAnimation()
        {
            if (panelGroup == null) return;
            StopAllCoroutines();
            StartCoroutine(OpenAnim());
        }

        private System.Collections.IEnumerator OpenAnim()
        {
            float elapsed = 0f;
            panelGroup.alpha = 0f;
            RectTransform rt = panelGroup.GetComponent<RectTransform>();
            Vector3 originalScale = rt != null ? rt.localScale : Vector3.one;
            Vector3 startScale = originalScale * 0.85f;

            while (elapsed < openDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = 1f - Mathf.Pow(1f - elapsed / openDuration, 3f);
                panelGroup.alpha = t;
                if (rt != null) rt.localScale = Vector3.Lerp(startScale, originalScale, t);
                yield return null;
            }
            panelGroup.alpha = 1f;
            if (rt != null) rt.localScale = originalScale;
        }

        private void OnResumeClicked()
        {
            UIManager.Instance?.PlayButtonClick();
            UIManager.Instance?.HidePauseMenu();
            LightShadowPlatformer.Core.GameManager.Instance?.TogglePause();
        }

        private void OnRestartClicked()
        {
            UIManager.Instance?.PlayButtonClick();
            UIManager.Instance?.HidePauseMenu();
            LightShadowPlatformer.Core.GameManager.Instance?.RestartLevel();
        }

        private void OnSettingsClicked()
        {
            UIManager.Instance?.PlayButtonClick();
            UIManager.Instance?.ShowSettingsMenu();
        }

        private void OnMainMenuClicked()
        {
            UIManager.Instance?.PlayButtonClick();
            UIManager.Instance?.HidePauseMenu();
            LightShadowPlatformer.Core.GameManager.Instance?.ReturnToMainMenu();
        }
    }
}
