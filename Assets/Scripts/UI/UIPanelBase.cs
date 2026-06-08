using System;
using UnityEngine;
using SpaceCourier.Core;
using UnityEngine.UI;

namespace SpaceCourier.UI
{
    public abstract class UIPanelBase : MonoBehaviour
    {
        [Header("Panel Settings")]
        public bool CloseOnPanelOpened = true;
        public bool UseAnimation = true;
        public float OpenAnimationDuration = 0.25f;
        public float CloseAnimationDuration = 0.2f;

        [Header("References")]
        public RectTransform panelRect;
        public CanvasGroup canvasGroup;
        public Button closeButton;

        public bool IsOpen { get; private set; } = false;

        public event Action OnPanelOpened;
        public event Action OnPanelClosed;

        protected virtual void Awake()
        {
            if (panelRect == null) panelRect = GetComponent<RectTransform>();
            if (canvasGroup == null) canvasGroup = GetComponent<CanvasGroup>();
            if (canvasGroup == null && panelRect != null) canvasGroup = panelRect.gameObject.AddComponent<CanvasGroup>();
        }

        public virtual void BindEvents()
        {
            if (closeButton != null)
            {
                closeButton.onClick.AddListener(OnCloseButtonClicked);
            }
        }

        public virtual void OpenPanel()
        {
            if (IsOpen) return;
            IsOpen = true;
            gameObject.SetActive(true);

            if (UseAnimation && Application.isPlaying)
            {
                PlayOpenAnimation();
            }
            else
            {
                SetPanelVisible(true);
            }

            OnOpened();
            OnPanelOpened?.Invoke();
        }

        public virtual void ClosePanel()
        {
            if (!IsOpen) return;
            IsOpen = false;

            if (UseAnimation && Application.isPlaying)
            {
                PlayCloseAnimation();
            }
            else
            {
                SetPanelVisible(false);
                gameObject.SetActive(false);
            }

            OnClosed();
            OnPanelClosed?.Invoke();
        }

        protected virtual void PlayOpenAnimation()
        {
            if (panelRect == null) { SetPanelVisible(true); return; }

            StopAllCoroutines();
            StartCoroutine(OpenAnimationCoroutine());
        }

        protected virtual System.Collections.IEnumerator OpenAnimationCoroutine()
        {
            SetPanelVisible(true);
            if (canvasGroup != null)
            {
                canvasGroup.alpha = 0f;
            }

            var targetScale = Vector3.one;
            var targetPos = panelRect.anchoredPosition;
            var startScale = new Vector3(0.85f, 0.85f, 1f);
            var startPos = targetPos + new Vector2(0, -100f);

            panelRect.localScale = startScale;
            panelRect.anchoredPosition = startPos;

            float elapsed = 0f;
            while (elapsed < OpenAnimationDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / OpenAnimationDuration;
                t = t * t * (3f - 2f * t);

                if (canvasGroup != null) canvasGroup.alpha = Mathf.Lerp(0f, 1f, t);
                panelRect.localScale = Vector3.Lerp(startScale, targetScale, t);
                panelRect.anchoredPosition = Vector2.Lerp(startPos, targetPos, t);
                yield return null;
            }

            if (canvasGroup != null) canvasGroup.alpha = 1f;
            panelRect.localScale = targetScale;
            panelRect.anchoredPosition = targetPos;
        }

        protected virtual void PlayCloseAnimation()
        {
            if (panelRect == null) { gameObject.SetActive(false); return; }

            StopAllCoroutines();
            StartCoroutine(CloseAnimationCoroutine());
        }

        protected virtual System.Collections.IEnumerator CloseAnimationCoroutine()
        {
            var startScale = panelRect.localScale;
            var targetScale = new Vector3(0.9f, 0.9f, 1f);
            var startPos = panelRect.anchoredPosition;
            var targetPos = startPos + new Vector2(0, -60f);

            float elapsed = 0f;
            while (elapsed < CloseAnimationDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / CloseAnimationDuration;
                t = 1f - Mathf.Pow(1f - t, 3f);

                if (canvasGroup != null) canvasGroup.alpha = Mathf.Lerp(1f, 0f, t);
                panelRect.localScale = Vector3.Lerp(startScale, targetScale, t);
                panelRect.anchoredPosition = Vector2.Lerp(startPos, targetPos, t);
                yield return null;
            }

            SetPanelVisible(false);
            gameObject.SetActive(false);
        }

        protected virtual void SetPanelVisible(bool visible)
        {
            if (canvasGroup != null)
            {
                canvasGroup.alpha = visible ? 1f : 0f;
                canvasGroup.blocksRaycasts = visible;
                canvasGroup.interactable = visible;
            }
        }

        protected virtual void OnOpened() { }

        protected virtual void OnClosed() { }

        protected virtual void OnCloseButtonClicked()
        {
            ClosePanel();
        }

        protected virtual void OnDestroy()
        {
            if (closeButton != null)
            {
                closeButton.onClick.RemoveListener(OnCloseButtonClicked);
            }
        }
    }
}
