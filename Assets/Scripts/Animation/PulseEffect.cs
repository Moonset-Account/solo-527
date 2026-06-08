using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace YouthTrainingManagement.Animation
{
    public class PulseEffect : MonoBehaviour
    {
        public RectTransform TargetRect;
        public Graphic TargetGraphic;
        public float PulseScale = 1.08f;
        public float PulseDuration = 0.75f;
        public Color HighlightColor = new Color(1f, 0.85f, 0.3f, 1f);
        public TweenEase EaseType = TweenEase.EaseInOut;
        public TweenLoop LoopMode = TweenLoop.PingPong;

        private Coroutine _scaleTween;
        private Coroutine _colorTween;
        private Vector3 _origScale;
        private Color _origColor;
        private bool _isPlaying;

        public bool IsPlaying => _isPlaying;

        private void Awake()
        {
            if (TargetRect == null) TargetRect = GetComponent<RectTransform>();
            if (TargetGraphic == null) TargetGraphic = GetComponent<Graphic>();
            if (TargetRect != null) _origScale = TargetRect.localScale;
            if (TargetGraphic != null) _origColor = TargetGraphic.color;
        }

        public void Play(float? scale = null, float? duration = null)
        {
            Stop();
            if (TargetRect != null)
            {
                var s = scale ?? PulseScale;
                var d = duration ?? PulseDuration;
                _scaleTween = UITweener.TweenScale(TargetRect, _origScale, _origScale * s, d,
                    EaseType, LoopMode, null, 0f);
            }
            if (TargetGraphic != null)
            {
                var d = duration ?? PulseDuration;
                _colorTween = UITweener.TweenColor(TargetGraphic, _origColor, HighlightColor, d,
                    EaseType, LoopMode, null, 0f);
            }
            _isPlaying = true;
        }

        public void Stop()
        {
            if (_scaleTween != null) UITweener.StopTween(_scaleTween);
            if (_colorTween != null) UITweener.StopTween(_colorTween);
            if (TargetRect != null) TargetRect.localScale = _origScale;
            if (TargetGraphic != null) TargetGraphic.color = _origColor;
            _isPlaying = false;
        }

        public void FlashOnce(float? duration = null, System.Action onDone = null)
        {
            Stop();
            var d = duration ?? 0.45f;
            StartCoroutine(FlashRoutine(d, onDone));
        }

        private IEnumerator FlashRoutine(float duration, System.Action onDone)
        {
            Vector3 target = _origScale * PulseScale;
            float half = duration * 0.5f;
            if (TargetRect != null)
            {
                var s1 = UITweener.TweenScale(TargetRect, _origScale, target, half, EaseType);
                yield return s1;
                var s2 = UITweener.TweenScale(TargetRect, target, _origScale, half, EaseType);
                yield return s2;
            }
            else yield return new WaitForSecondsRealtime(duration);

            if (TargetGraphic != null)
            {
                var c1 = UITweener.TweenColor(TargetGraphic, _origColor, HighlightColor, half, EaseType);
                yield return c1;
                var c2 = UITweener.TweenColor(TargetGraphic, HighlightColor, _origColor, half, EaseType);
                yield return c2;
            }
            onDone?.Invoke();
        }
    }
}
