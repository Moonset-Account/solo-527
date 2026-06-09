using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Utils;

namespace DecorMatch3.Animation
{
    public enum AnimationType
    {
        Fade,
        Scale,
        Move,
        Rotate,
        Shake,
        Bounce,
        Punch,
        Sequential
    }

    public class AnimationRequest
    {
        public GameObject Target;
        public AnimationType Type;
        public float Duration = 0.3f;
        public float Delay = 0f;
        public Vector3 TargetValue;
        public bool UseUnscaledTime = false;
        public bool Loop = false;
        public int LoopCount = -1;
        public Action OnComplete;
        public EasingFunction Easing = EasingFunction.EaseOutQuad;
    }

    public enum EasingFunction
    {
        Linear,
        EaseInQuad,
        EaseOutQuad,
        EaseInOutQuad,
        EaseInCubic,
        EaseOutCubic,
        EaseInOutCubic,
        EaseOutBack,
        EaseInBack,
        EaseOutBounce,
        Spring
    }

    public class AnimationManager : MonoBehaviour
    {
        private static AnimationManager _instance;
        public static AnimationManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    GameObject go = new GameObject("AnimationManager");
                    _instance = go.AddComponent<AnimationManager>();
                }
                return _instance;
            }
        }

        private readonly Dictionary<int, Coroutine> _activeAnimations = new Dictionary<int, Coroutine>();
        private int _nextAnimationId = 1;

        public int Play(AnimationRequest request)
        {
            int id = _nextAnimationId++;
            Coroutine coroutine = StartCoroutine(PlayAnimationRoutine(request, id));
            _activeAnimations[id] = coroutine;
            return id;
        }

        public void Stop(int animationId)
        {
            if (_activeAnimations.TryGetValue(animationId, out Coroutine coroutine))
            {
                StopCoroutine(coroutine);
                _activeAnimations.Remove(animationId);
            }
        }

        public void StopAll(GameObject target = null)
        {
            List<int> toRemove = new List<int>();
            foreach (var kvp in _activeAnimations)
            {
                toRemove.Add(kvp.Key);
            }
            foreach (int id in toRemove)
            {
                Stop(id);
            }
        }

        private IEnumerator PlayAnimationRoutine(AnimationRequest request, int id)
        {
            if (request.Delay > 0f)
            {
                if (request.UseUnscaledTime)
                    yield return new WaitForSecondsRealtime(request.Delay);
                else
                    yield return new WaitForSeconds(request.Delay);
            }

            if (request.Target == null)
            {
                CompleteAnimation(id);
                yield break;
            }

            int currentLoop = 0;
            do
            {
                switch (request.Type)
                {
                    case AnimationType.Fade:
                        yield return FadeRoutine(request);
                        break;
                    case AnimationType.Scale:
                        yield return ScaleRoutine(request);
                        break;
                    case AnimationType.Move:
                        yield return MoveRoutine(request);
                        break;
                    case AnimationType.Rotate:
                        yield return RotateRoutine(request);
                        break;
                    case AnimationType.Shake:
                        yield return ShakeRoutine(request);
                        break;
                    case AnimationType.Bounce:
                        yield return BounceRoutine(request);
                        break;
                    case AnimationType.Punch:
                        yield return PunchRoutine(request);
                        break;
                }

                currentLoop++;
                if (request.Loop && (request.LoopCount < 0 || currentLoop < request.LoopCount))
                {
                    continue;
                }
                break;
            } while (true);

            request.OnComplete?.Invoke();
            CompleteAnimation(id);
        }

        private void CompleteAnimation(int id)
        {
            _activeAnimations.Remove(id);
        }

        private IEnumerator FadeRoutine(AnimationRequest request)
        {
            CanvasGroup cg = request.Target.GetComponent<CanvasGroup>();
            if (cg == null) cg = request.Target.AddComponent<CanvasGroup>();

            float startAlpha = cg.alpha;
            float targetAlpha = Mathf.Clamp01(request.TargetValue.x);
            float elapsed = 0f;

            while (elapsed < request.Duration)
            {
                elapsed += request.UseUnscaledTime ? Time.unscaledDeltaTime : Time.deltaTime;
                float t = Ease(request.Easing, elapsed / request.Duration);
                cg.alpha = Mathf.Lerp(startAlpha, targetAlpha, t);
                yield return null;
            }
            cg.alpha = targetAlpha;
        }

        private IEnumerator ScaleRoutine(AnimationRequest request)
        {
            Transform t = request.Target.transform;
            Vector3 startScale = t.localScale;
            Vector3 targetScale = request.TargetValue;
            float elapsed = 0f;

            while (elapsed < request.Duration)
            {
                elapsed += request.UseUnscaledTime ? Time.unscaledDeltaTime : Time.deltaTime;
                float tVal = Ease(request.Easing, elapsed / request.Duration);
                t.localScale = Vector3.LerpUnclamped(startScale, targetScale, tVal);
                yield return null;
            }
            t.localScale = targetScale;
        }

        private IEnumerator MoveRoutine(AnimationRequest request)
        {
            Transform t = request.Target.transform;
            Vector3 startPos = t.localPosition;
            Vector3 targetPos = request.TargetValue;
            float elapsed = 0f;

            while (elapsed < request.Duration)
            {
                elapsed += request.UseUnscaledTime ? Time.unscaledDeltaTime : Time.deltaTime;
                float tVal = Ease(request.Easing, elapsed / request.Duration);
                t.localPosition = Vector3.LerpUnclamped(startPos, targetPos, tVal);
                yield return null;
            }
            t.localPosition = targetPos;
        }

        private IEnumerator RotateRoutine(AnimationRequest request)
        {
            Transform t = request.Target.transform;
            Vector3 startRot = t.localEulerAngles;
            Vector3 targetRot = request.TargetValue;
            float elapsed = 0f;

            while (elapsed < request.Duration)
            {
                elapsed += request.UseUnscaledTime ? Time.unscaledDeltaTime : Time.deltaTime;
                float tVal = Ease(request.Easing, elapsed / request.Duration);
                t.localEulerAngles = Vector3.LerpUnclamped(startRot, targetRot, tVal);
                yield return null;
            }
            t.localEulerAngles = targetRot;
        }

        private IEnumerator ShakeRoutine(AnimationRequest request)
        {
            Transform t = request.Target.transform;
            Vector3 originalPos = t.localPosition;
            float intensity = request.TargetValue.x;
            float elapsed = 0f;

            while (elapsed < request.Duration)
            {
                elapsed += request.UseUnscaledTime ? Time.unscaledDeltaTime : Time.deltaTime;
                float currentIntensity = intensity * (1f - elapsed / request.Duration);
                t.localPosition = originalPos +
                    new Vector3(
                        UnityEngine.Random.Range(-currentIntensity, currentIntensity),
                        UnityEngine.Random.Range(-currentIntensity, currentIntensity),
                        UnityEngine.Random.Range(-currentIntensity, currentIntensity));
                yield return null;
            }
            t.localPosition = originalPos;
        }

        private IEnumerator BounceRoutine(AnimationRequest request)
        {
            Transform t = request.Target.transform;
            Vector3 startScale = t.localScale;
            float height = request.TargetValue.y;
            int bounces = Mathf.Max(1, Mathf.RoundToInt(request.TargetValue.x));
            float bounceDuration = request.Duration / bounces;

            for (int i = 0; i < bounces; i++)
            {
                float elapsed = 0f;
                while (elapsed < bounceDuration)
                {
                    elapsed += request.UseUnscaledTime ? Time.unscaledDeltaTime : Time.deltaTime;
                    float progress = elapsed / bounceDuration;
                    float bounceCurve = Mathf.Sin(progress * Mathf.PI) * height;
                    t.localScale = startScale + Vector3.up * bounceCurve;
                    yield return null;
                }
            }
            t.localScale = startScale;
        }

        private IEnumerator PunchRoutine(AnimationRequest request)
        {
            Transform t = request.Target.transform;
            Vector3 startScale = t.localScale;
            Vector3 punchScale = request.TargetValue;
            float elapsed = 0f;
            float punchDuration = request.Duration * 0.3f;
            float recoverDuration = request.Duration * 0.7f;

            while (elapsed < punchDuration)
            {
                elapsed += request.UseUnscaledTime ? Time.unscaledDeltaTime : Time.deltaTime;
                float tVal = elapsed / punchDuration;
                t.localScale = Vector3.Lerp(startScale, Vector3.Scale(startScale, punchScale), Ease(EasingFunction.EaseOutBack, tVal));
                yield return null;
            }

            elapsed = 0f;
            while (elapsed < recoverDuration)
            {
                elapsed += request.UseUnscaledTime ? Time.unscaledDeltaTime : Time.deltaTime;
                float tVal = elapsed / recoverDuration;
                t.localScale = Vector3.Lerp(Vector3.Scale(startScale, punchScale), startScale, Ease(EasingFunction.EaseOutBounce, tVal));
                yield return null;
            }
            t.localScale = startScale;
        }

        public static float Ease(EasingFunction function, float t)
        {
            t = Mathf.Clamp01(t);
            switch (function)
            {
                case EasingFunction.Linear: return t;
                case EasingFunction.EaseInQuad: return t * t;
                case EasingFunction.EaseOutQuad: return t * (2f - t);
                case EasingFunction.EaseInOutQuad:
                    return t < 0.5f ? 2f * t * t : -1f + (4f - 2f * t) * t;
                case EasingFunction.EaseInCubic: return t * t * t;
                case EasingFunction.EaseOutCubic:
                    t--; return t * t * t + 1f;
                case EasingFunction.EaseInOutCubic:
                    return t < 0.5f ? 4f * t * t * t : (t - 1f) * (2f * t - 2f) * (2f * t - 2f) + 1f;
                case EasingFunction.EaseOutBack:
                    const float c1 = 1.70158f;
                    const float c3 = c1 + 1f;
                    return 1f + c3 * Mathf.Pow(t - 1f, 3f) + c1 * Mathf.Pow(t - 1f, 2f);
                case EasingFunction.EaseInBack:
                    const float c2 = 1.70158f;
                    const float c4 = c2 + 1f;
                    return c4 * t * t * t - c2 * t * t;
                case EasingFunction.EaseOutBounce:
                    const float n1 = 7.5625f;
                    const float d1 = 2.75f;
                    if (t < 1f / d1) return n1 * t * t;
                    else if (t < 2f / d1) return n1 * (t -= 1.5f / d1) * t + 0.75f;
                    else if (t < 2.5f / d1) return n1 * (t -= 2.25f / d1) * t + 0.9375f;
                    else return n1 * (t -= 2.625f / d1) * t + 0.984375f;
                case EasingFunction.Spring:
                    return Mathf.Clamp01(Mathf.Sin(t * Mathf.PI * (0.2f + 2.5f * t * t * t)) * Mathf.Pow(1f - t, 2.2f) + t);
                default: return t;
            }
        }

        public int PlaySequence(GameObject target, params AnimationRequest[] requests)
        {
            int id = _nextAnimationId++;
            StartCoroutine(PlaySequenceRoutine(target, requests, id));
            return id;
        }

        private IEnumerator PlaySequenceRoutine(GameObject target, AnimationRequest[] requests, int id)
        {
            foreach (AnimationRequest req in requests)
            {
                req.Target = target;
                yield return PlayAnimationRoutine(req, -1);
            }
            CompleteAnimation(id);
        }
    }
}
