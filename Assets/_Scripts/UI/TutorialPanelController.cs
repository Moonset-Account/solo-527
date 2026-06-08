using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace LightShadowPlatformer.UI
{
    public class TutorialPanelController : MonoBehaviour
    {
        [Header("References")]
        public CanvasGroup panelGroup;
        public TMP_Text messageText;
        public Image iconImage;
        public Button dismissButton;
        public GameObject keyHintContainer;
        public TMP_Text keyHintText;

        [Header("Animation")]
        public float enterDuration = 0.3f;
        public float stayDuration = 5f;
        public float exitDuration = 0.25f;
        public AnimationCurve enterCurve;
        public AnimationCurve exitCurve;

        [Header("Visual")]
        public Color backgroundColor = new Color(0, 0, 0, 0.8f);
        public Color textColor = Color.white;

        private Coroutine _showCoroutine;
        private bool _isVisible;

        private void Awake()
        {
            if (dismissButton != null)
                dismissButton.onClick.AddListener(OnDismissClicked);

            if (panelGroup != null)
            {
                panelGroup.alpha = 0f;
                panelGroup.gameObject.SetActive(false);
            }
        }

        public void ShowTutorial(string message, string keyHint = "", float customDuration = -1)
        {
            if (panelGroup == null) return;

            if (_showCoroutine != null) StopCoroutine(_showCoroutine);

            if (messageText != null) messageText.text = message;

            if (keyHintContainer != null)
            {
                bool showHint = !string.IsNullOrEmpty(keyHint);
                keyHintContainer.SetActive(showHint);
                if (showHint && keyHintText != null)
                    keyHintText.text = keyHint;
            }

            _showCoroutine = StartCoroutine(ShowRoutine(
                customDuration > 0 ? customDuration : stayDuration));
        }

        private IEnumerator ShowRoutine(float duration)
        {
            _isVisible = true;
            panelGroup.gameObject.SetActive(true);

            float elapsed = 0f;
            RectTransform rt = panelGroup.GetComponent<RectTransform>();
            Vector2 start = rt != null ? rt.anchoredPosition : Vector2.zero;
            Vector2 offset = new Vector2(0, 100f);

            while (elapsed < enterDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = enterCurve != null ? enterCurve.Evaluate(elapsed / enterDuration)
                                            : elapsed / enterDuration;
                panelGroup.alpha = Mathf.Lerp(0f, 1f, t);
                if (rt != null) rt.anchoredPosition = Vector2.Lerp(start + offset, start, t);
                yield return null;
            }
            panelGroup.alpha = 1f;

            elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                if (Input.anyKeyDown) break;
                yield return null;
            }

            Hide();
        }

        public void Hide()
        {
            if (!_isVisible || panelGroup == null) return;
            if (_showCoroutine != null) StopCoroutine(_showCoroutine);
            _showCoroutine = StartCoroutine(HideRoutine());
        }

        private IEnumerator HideRoutine()
        {
            float elapsed = 0f;
            RectTransform rt = panelGroup != null ? panelGroup.GetComponent<RectTransform>() : null;
            Vector2 start = rt != null ? rt.anchoredPosition : Vector2.zero;
            Vector2 offset = new Vector2(0, 100f);

            while (elapsed < exitDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = exitCurve != null ? exitCurve.Evaluate(elapsed / exitDuration)
                                           : elapsed / exitDuration;
                if (panelGroup != null)
                {
                    panelGroup.alpha = Mathf.Lerp(1f, 0f, t);
                    if (rt != null) rt.anchoredPosition = Vector2.Lerp(start, start - offset, t);
                }
                yield return null;
            }
            if (panelGroup != null)
            {
                panelGroup.alpha = 0f;
                panelGroup.gameObject.SetActive(false);
            }
            _isVisible = false;
        }

        private void OnDismissClicked()
        {
            UIManager.Instance?.PlayUICancel();
            Hide();
        }
    }
}
