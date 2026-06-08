using System;
using System.Collections;
using UnityEngine;
using DecorMatch3.Audio;

namespace DecorMatch3.UI
{
    public abstract class UIViewBase : MonoBehaviour
    {
        [Header("View Settings")]
        [SerializeField] protected UIView viewType = UIView.None;
        [SerializeField] protected GameObject contentPanel;
        [SerializeField] protected CanvasGroup canvasGroup;
        [SerializeField] protected bool useAnimation = true;

        [Header("Animation")]
        [SerializeField] protected float openDuration = 0.3f;
        [SerializeField] protected float closeDuration = 0.2f;
        [SerializeField] protected AnimationType openAnimation = AnimationType.Scale;
        [SerializeField] protected AnimationType closeAnimation = AnimationType.Scale;

        public enum AnimationType
        {
            None,
            Fade,
            Scale,
            SlideFromTop,
            SlideFromBottom,
            SlideFromLeft,
            SlideFromRight
        }

        public UIView ViewType => viewType;
        public bool IsOpen { get; protected set; }
        public bool IsAnimating { get; protected set; }

        public event Action OnOpened;
        public event Action OnClosed;

        public virtual void Initialize()
        {
            if (canvasGroup == null)
            {
                canvasGroup = GetComponent<CanvasGroup>();
                if (canvasGroup == null)
                {
                    canvasGroup = gameObject.AddComponent<CanvasGroup>();
                }
            }

            if (contentPanel == null)
            {
                contentPanel = gameObject;
            }

            IsOpen = false;
            IsAnimating = false;
        }

        public virtual void Open()
        {
            if (IsOpen || IsAnimating) return;

            gameObject.SetActive(true);

            if (useAnimation)
            {
                StartCoroutine(OpenCoroutine());
            }
            else
            {
                SetOpenState();
            }

            AudioManager.Instance?.PlaySFX(SFXType.Popup);
        }

        public virtual void Close(bool animate = true)
        {
            if (!IsOpen && !IsAnimating) return;

            if (animate && useAnimation)
            {
                StartCoroutine(CloseCoroutine());
            }
            else
            {
                SetClosedState();
            }
        }

        protected virtual IEnumerator OpenCoroutine()
        {
            IsAnimating = true;
            PrepareOpenAnimation();

            float timer = 0f;
            while (timer < openDuration)
            {
                timer += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(timer / openDuration);
                t = EaseOutBack(t);
                ApplyOpenAnimation(t);
                yield return null;
            }

            SetOpenState();
            IsAnimating = false;
        }

        protected virtual IEnumerator CloseCoroutine()
        {
            IsAnimating = true;

            float timer = 0f;
            while (timer < closeDuration)
            {
                timer += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(timer / closeDuration);
                ApplyCloseAnimation(t);
                yield return null;
            }

            SetClosedState();
            IsAnimating = false;
        }

        protected virtual void PrepareOpenAnimation()
        {
            switch (openAnimation)
            {
                case AnimationType.Fade:
                    canvasGroup.alpha = 0f;
                    break;
                case AnimationType.Scale:
                    contentPanel.transform.localScale = Vector3.zero;
                    canvasGroup.alpha = 0f;
                    break;
                case AnimationType.SlideFromTop:
                    RectTransform rt = contentPanel.GetComponent<RectTransform>();
                    if (rt != null)
                    {
                        rt.anchoredPosition = new Vector2(rt.anchoredPosition.x, 1000);
                    }
                    canvasGroup.alpha = 0f;
                    break;
                case AnimationType.SlideFromBottom:
                    RectTransform rb = contentPanel.GetComponent<RectTransform>();
                    if (rb != null)
                    {
                        rb.anchoredPosition = new Vector2(rb.anchoredPosition.x, -1000);
                    }
                    canvasGroup.alpha = 0f;
                    break;
                case AnimationType.SlideFromLeft:
                    RectTransform rl = contentPanel.GetComponent<RectTransform>();
                    if (rl != null)
                    {
                        rl.anchoredPosition = new Vector2(-1000, rl.anchoredPosition.y);
                    }
                    canvasGroup.alpha = 0f;
                    break;
                case AnimationType.SlideFromRight:
                    RectTransform rr = contentPanel.GetComponent<RectTransform>();
                    if (rr != null)
                    {
                        rr.anchoredPosition = new Vector2(1000, rr.anchoredPosition.y);
                    }
                    canvasGroup.alpha = 0f;
                    break;
            }
        }

        protected virtual void ApplyOpenAnimation(float t)
        {
            switch (openAnimation)
            {
                case AnimationType.Fade:
                    canvasGroup.alpha = t;
                    break;
                case AnimationType.Scale:
                    contentPanel.transform.localScale = Vector3.one * t;
                    canvasGroup.alpha = t;
                    break;
                case AnimationType.SlideFromTop:
                    RectTransform rt = contentPanel.GetComponent<RectTransform>();
                    if (rt != null)
                    {
                        rt.anchoredPosition = new Vector2(rt.anchoredPosition.x, Mathf.Lerp(1000, 0, t));
                    }
                    canvasGroup.alpha = t;
                    break;
                case AnimationType.SlideFromBottom:
                    RectTransform rb = contentPanel.GetComponent<RectTransform>();
                    if (rb != null)
                    {
                        rb.anchoredPosition = new Vector2(rb.anchoredPosition.x, Mathf.Lerp(-1000, 0, t));
                    }
                    canvasGroup.alpha = t;
                    break;
                case AnimationType.SlideFromLeft:
                    RectTransform rl = contentPanel.GetComponent<RectTransform>();
                    if (rl != null)
                    {
                        rl.anchoredPosition = new Vector2(Mathf.Lerp(-1000, 0, t), rl.anchoredPosition.y);
                    }
                    canvasGroup.alpha = t;
                    break;
                case AnimationType.SlideFromRight:
                    RectTransform rr = contentPanel.GetComponent<RectTransform>();
                    if (rr != null)
                    {
                        rr.anchoredPosition = new Vector2(Mathf.Lerp(1000, 0, t), rr.anchoredPosition.y);
                    }
                    canvasGroup.alpha = t;
                    break;
            }
        }

        protected virtual void ApplyCloseAnimation(float t)
        {
            float reversed = 1f - t;

            switch (closeAnimation)
            {
                case AnimationType.Fade:
                    canvasGroup.alpha = reversed;
                    break;
                case AnimationType.Scale:
                    contentPanel.transform.localScale = Vector3.one * reversed;
                    canvasGroup.alpha = reversed;
                    break;
                case AnimationType.SlideFromTop:
                    RectTransform rt = contentPanel.GetComponent<RectTransform>();
                    if (rt != null)
                    {
                        rt.anchoredPosition = new Vector2(rt.anchoredPosition.x, Mathf.Lerp(0, -1000, t));
                    }
                    canvasGroup.alpha = reversed;
                    break;
                case AnimationType.SlideFromBottom:
                    RectTransform rb = contentPanel.GetComponent<RectTransform>();
                    if (rb != null)
                    {
                        rb.anchoredPosition = new Vector2(rb.anchoredPosition.x, Mathf.Lerp(0, 1000, t));
                    }
                    canvasGroup.alpha = reversed;
                    break;
                case AnimationType.SlideFromLeft:
                    RectTransform rl = contentPanel.GetComponent<RectTransform>();
                    if (rl != null)
                    {
                        rl.anchoredPosition = new Vector2(Mathf.Lerp(0, -1000, t), rl.anchoredPosition.y);
                    }
                    canvasGroup.alpha = reversed;
                    break;
                case AnimationType.SlideFromRight:
                    RectTransform rr = contentPanel.GetComponent<RectTransform>();
                    if (rr != null)
                    {
                        rr.anchoredPosition = new Vector2(Mathf.Lerp(0, 1000, t), rr.anchoredPosition.y);
                    }
                    canvasGroup.alpha = reversed;
                    break;
            }
        }

        protected virtual void SetOpenState()
        {
            IsOpen = true;
            canvasGroup.alpha = 1f;
            canvasGroup.blocksRaycasts = true;
            canvasGroup.interactable = true;
            contentPanel.transform.localScale = Vector3.one;
            OnOpened?.Invoke();
        }

        protected virtual void SetClosedState()
        {
            IsOpen = false;
            canvasGroup.alpha = 0f;
            canvasGroup.blocksRaycasts = false;
            canvasGroup.interactable = false;
            gameObject.SetActive(false);
            OnClosed?.Invoke();
        }

        protected float EaseOutBack(float t)
        {
            float c1 = 1.70158f;
            float c3 = c1 + 1;
            return 1 + c3 * Mathf.Pow(t - 1, 3) + c1 * Mathf.Pow(t - 1, 2);
        }

        protected float EaseInOutQuad(float t)
        {
            return t < 0.5f ? 2 * t * t : 1 - Mathf.Pow(-2 * t + 2, 2) / 2;
        }
    }
}
