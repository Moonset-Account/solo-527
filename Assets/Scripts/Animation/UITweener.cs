using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace YouthTrainingManagement.Animation
{
    public enum TweenEase { Linear, EaseIn, EaseOut, EaseInOut, Bounce, Elastic }
    public enum TweenLoop { None, Loop, PingPong }

    public class UITweener : MonoBehaviour
    {
        public delegate float EaseFunc(float t);

        private static readonly Dictionary<TweenEase, EaseFunc> Eases = new Dictionary<TweenEase, EaseFunc>
        {
            { TweenEase.Linear, t => t },
            { TweenEase.EaseIn, t => t * t },
            { TweenEase.EaseOut, t => 1 - (1 - t) * (1 - t) },
            { TweenEase.EaseInOut, t => t < 0.5f ? 2*t*t : 1 - Mathf.Pow(-2*t + 2, 2)/2f },
            { TweenEase.Bounce, t => {
                float n1 = 7.5625f, d1 = 2.75f;
                if (t < 1 / d1) return n1 * t * t;
                else if (t < 2 / d1) return n1 * (t -= 1.5f / d1) * t + 0.75f;
                else if (t < 2.5 / d1) return n1 * (t -= 2.25f / d1) * t + 0.9375f;
                else return n1 * (t -= 2.625f / d1) * t + 0.984375f;
            }},
            { TweenEase.Elastic, t => {
                float c4 = (2 * Mathf.PI) / 3f;
                return t == 0 ? 0 : t == 1 ? 1 : Mathf.Pow(2, -10 * t) * Mathf.Sin((t * 10 - 0.75f) * c4) + 1;
            }}
        };

        public static UITweener Instance
        {
            get
            {
                if (_inst == null)
                {
                    var go = new GameObject("UITweener", typeof(UITweener));
                    DontDestroyOnLoad(go);
                    _inst = go.GetComponent<UITweener>();
                }
                return _inst;
            }
        }
        private static UITweener _inst;

        public static float GlobalSpeed = 1f;

        public static Coroutine TweenPosition(RectTransform rt, Vector2 from, Vector2 to, float duration,
            TweenEase ease = TweenEase.EaseOut, TweenLoop loop = TweenLoop.None,
            Action onComplete = null, float delay = 0f)
        {
            return Instance.RunTween(t =>
            {
                if (rt == null) return;
                rt.anchoredPosition = Vector2.LerpUnclamped(from, to, t);
            }, duration, ease, loop, onComplete, delay);
        }

        public static Coroutine TweenScale(RectTransform rt, Vector3 from, Vector3 to, float duration,
            TweenEase ease = TweenEase.EaseOut, TweenLoop loop = TweenLoop.None,
            Action onComplete = null, float delay = 0f)
        {
            return Instance.RunTween(t =>
            {
                if (rt == null) return;
                rt.localScale = Vector3.LerpUnclamped(from, to, t);
            }, duration, ease, loop, onComplete, delay);
        }

        public static Coroutine TweenAlpha(CanvasGroup cg, float from, float to, float duration,
            TweenEase ease = TweenEase.EaseOut, TweenLoop loop = TweenLoop.None,
            Action onComplete = null, float delay = 0f)
        {
            return Instance.RunTween(t =>
            {
                if (cg == null) return;
                cg.alpha = Mathf.LerpUnclamped(from, to, t);
            }, duration, ease, loop, onComplete, delay);
        }

        public static Coroutine TweenAlpha(Graphic img, float from, float to, float duration,
            TweenEase ease = TweenEase.EaseOut, TweenLoop loop = TweenLoop.None,
            Action onComplete = null, float delay = 0f) where Graphic : UnityEngine.UI.Graphic
        {
            return Instance.RunTween(t =>
            {
                if (img == null) return;
                var c = img.color; c.a = Mathf.LerpUnclamped(from, to, t); img.color = c;
            }, duration, ease, loop, onComplete, delay);
        }

        public static Coroutine TweenColor(UnityEngine.UI.Graphic g, Color from, Color to, float duration,
            TweenEase ease = TweenEase.EaseOut, TweenLoop loop = TweenLoop.None,
            Action onComplete = null, float delay = 0f)
        {
            return Instance.RunTween(t =>
            {
                if (g == null) return;
                g.color = Color.LerpUnclamped(from, to, t);
            }, duration, ease, loop, onComplete, delay);
        }

        public static Coroutine TweenSizeDelta(RectTransform rt, Vector2 from, Vector2 to, float duration,
            TweenEase ease = TweenEase.EaseOut, TweenLoop loop = TweenLoop.None,
            Action onComplete = null, float delay = 0f)
        {
            return Instance.RunTween(t =>
            {
                if (rt == null) return;
                rt.sizeDelta = Vector2.LerpUnclamped(from, to, t);
            }, duration, ease, loop, onComplete, delay);
        }

        public static Coroutine Sequence(params IEnumerator[] coroutines)
        {
            return Instance.StartCoroutine(RunSequence(coroutines));
        }

        private static IEnumerator RunSequence(IEnumerator[] coroutines)
        {
            foreach (var c in coroutines)
                yield return Instance.StartCoroutine(c);
        }

        public static void StopTween(Coroutine c)
        {
            if (c != null && _inst != null) _inst.StopCoroutine(c);
        }

        private Coroutine RunTween(Action<float> step, float duration, TweenEase ease, TweenLoop loop,
            Action onComplete, float delay)
        {
            return StartCoroutine(TweenRoutine(step, duration, ease, loop, onComplete, delay));
        }

        private IEnumerator TweenRoutine(Action<float> step, float duration, TweenEase ease, TweenLoop loop,
            Action onComplete, float delay)
        {
            if (delay > 0) yield return new WaitForSecondsRealtime(delay);
            float t = 0; var func = Eases[ease];
            int dir = 1;

            while (true)
            {
                t += Time.unscaledDeltaTime / Mathf.Max(0.01f, duration) * GlobalSpeed * dir;
                if (loop == TweenLoop.PingPong)
                {
                    if (t >= 1f) { t = 1f; dir = -1; }
                    else if (t <= 0f) { t = 0f; dir = 1; }
                }
                else
                {
                    t = Mathf.Clamp01(t);
                }
                step?.Invoke(func(t));

                if (loop == TweenLoop.None && t >= 1f) break;
                if (loop == TweenLoop.Loop && t >= 1f) t = 0f;
                yield return null;
            }
            onComplete?.Invoke();
        }
    }
}
