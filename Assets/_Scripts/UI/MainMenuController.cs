using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace LightShadowPlatformer.UI
{
    public class MainMenuController : MonoBehaviour
    {
        [Header("Buttons")]
        public Button newGameButton;
        public Button continueButton;
        public Button settingsButton;
        public Button quitButton;

        [Header("Labels")]
        public TMP_Text titleText;
        public TMP_Text subtitleText;
        public TMP_Text versionText;

        [Header("Animation")]
        public CanvasGroup titleGroup;
        public CanvasGroup buttonsGroup;
        public float titleFloatSpeed = 1.5f;
        public float titleFloatAmount = 10f;
        public float enterDuration = 0.6f;

        private Vector2 _titleOriginalPos;

        private void Awake()
        {
            if (titleText != null)
                _titleOriginalPos = titleText.rectTransform.anchoredPosition;
        }

        private void Start()
        {
            SetupButtons();
            UpdateContinueButton();

            if (versionText != null)
                versionText.text = $"v{Application.version}";

            PlayEnterAnimation();
        }

        private void OnEnable()
        {
            UpdateContinueButton();
        }

        private void Update()
        {
            if (titleText != null)
            {
                float y = Mathf.Sin(Time.unscaledTime * titleFloatSpeed) * titleFloatAmount;
                titleText.rectTransform.anchoredPosition = _titleOriginalPos + new Vector2(0, y);
            }
        }

        private void SetupButtons()
        {
            if (newGameButton != null)
                newGameButton.onClick.AddListener(OnNewGameClicked);
            if (continueButton != null)
                continueButton.onClick.AddListener(OnContinueClicked);
            if (settingsButton != null)
                settingsButton.onClick.AddListener(OnSettingsClicked);
            if (quitButton != null)
                quitButton.onClick.AddListener(OnQuitClicked);
        }

        private void UpdateContinueButton()
        {
            if (continueButton == null) return;
            bool hasSave = LightShadowPlatformer.Core.SaveManager.Instance != null &&
                           LightShadowPlatformer.Core.SaveManager.Instance.HasSaveData();
            continueButton.interactable = hasSave;
            TMP_Text btnText = continueButton.GetComponentInChildren<TMP_Text>();
            if (btnText != null)
                btnText.color = hasSave ? Color.white : new Color(1, 1, 1, 0.4f);
        }

        private void PlayEnterAnimation()
        {
            if (titleGroup != null)
            {
                StartCoroutine(AnimateGroup(titleGroup, 0f, 1f, 0f, enterDuration));
            }
            if (buttonsGroup != null)
            {
                StartCoroutine(AnimateGroup(buttonsGroup, 0f, 1f, 0.2f, enterDuration));
            }
        }

        private System.Collections.IEnumerator AnimateGroup(CanvasGroup group, float from, float to, float delay, float duration)
        {
            yield return new WaitForSecondsRealtime(delay);
            float elapsed = 0f;
            group.alpha = from;
            RectTransform rt = group.GetComponent<RectTransform>();
            Vector2 start = rt != null ? rt.anchoredPosition : Vector2.zero;
            Vector2 offset = new Vector2(0, -30f);

            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = 1f - Mathf.Pow(1f - elapsed / duration, 3f);
                group.alpha = Mathf.Lerp(from, to, t);
                if (rt != null) rt.anchoredPosition = start + offset * (1f - t);
                yield return null;
            }
            group.alpha = to;
        }

        private void OnNewGameClicked()
        {
            UIManager.Instance?.PlayButtonClick();
            LightShadowPlatformer.Core.GameManager.Instance?.StartNewGame();
        }

        private void OnContinueClicked()
        {
            UIManager.Instance?.PlayButtonClick();
            LightShadowPlatformer.Core.GameManager.Instance?.ContinueGame();
        }

        private void OnSettingsClicked()
        {
            UIManager.Instance?.PlayButtonClick();
            UIManager.Instance?.ShowSettingsMenu();
        }

        private void OnQuitClicked()
        {
            UIManager.Instance?.PlayButtonClick();
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#else
            Application.Quit();
#endif
        }
    }
}
