using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using PuppetTheater.Data;

namespace PuppetTheater.Core
{
    public class AnimationFeedback : MonoBehaviour
    {
        [Header("Judgment Feedback")]
        [SerializeField] private float perfectFlashDuration = 0.15f;
        [SerializeField] private float perfectRingDuration = 0.4f;
        [SerializeField] private float perfectRingMaxScale = 3f;
        [SerializeField] private float cameraShakeDuration = 0.12f;
        [SerializeField] private float cameraShakeMagnitude = 0.15f;
        [SerializeField] private float greatFlashDuration = 0.2f;
        [SerializeField] private float goodFlashDuration = 0.2f;
        [SerializeField] private float goodFlashMaxAlpha = 0.3f;
        [SerializeField] private float earlyLatePulseDuration = 0.2f;
        [SerializeField] private float missDimDuration = 0.3f;
        [SerializeField] private float missDimAlpha = 0.4f;

        [Header("Combo Feedback")]
        [SerializeField] private float glowPulseDuration = 0.5f;
        [SerializeField] private float glowMaxAlpha = 0.2f;
        [SerializeField] private float screenEdgeGlowDuration = 0.6f;
        [SerializeField] private float screenEdgeGlowAlpha = 0.35f;
        [SerializeField] private float stageLightPulseDuration = 0.8f;
        [SerializeField] private float stageLightPulseIntensity = 2f;

        [Header("Audience Feedback")]
        [SerializeField] private float audienceTransitionDuration = 0.4f;
        [SerializeField] private float swayDuration = 1.5f;
        [SerializeField] private float swayAngle = 8f;
        [SerializeField] private float projectileLifetime = 1.2f;

        [Header("Puppet Feedback")]
        [SerializeField] private float puppetActionDuration = 0.6f;
        [SerializeField] private float puppetFailDuration = 1.0f;

        [Header("Fail Feedback")]
        [SerializeField] private float flickerDuration = 1.5f;
        [SerializeField] private float flickerInterval = 0.1f;
        [SerializeField] private float curtainDropDuration = 0.8f;
        [SerializeField] private float spotlightSwingDuration = 1.0f;
        [SerializeField] private float spotlightSwingAngle = 60f;

        [Header("Beat Approaching")]
        [SerializeField] private float beatPulseMinAlpha = 0.05f;
        [SerializeField] private float beatPulseMaxAlpha = 0.25f;
        [SerializeField] private float beatPulseDuration = 0.3f;

        [Header("References")]
        [SerializeField] private RectTransform flashOverlay;
        [SerializeField] private RectTransform expandingRing;
        [SerializeField] private RectTransform leftPulsePanel;
        [SerializeField] private RectTransform rightPulsePanel;
        [SerializeField] private RectTransform dimOverlay;
        [SerializeField] private RectTransform comboGlowPanel;
        [SerializeField] private RectTransform screenEdgeGlowPanel;
        [SerializeField] private RectTransform stageLightOverlay;
        [SerializeField] private RectTransform beatPulseIndicator;
        [SerializeField] private RectTransform audienceContainer;
        [SerializeField] private RectTransform curtainPanel;
        [SerializeField] private Transform cameraTransform;
        [SerializeField] private ParticleSystem comboParticles;
        [SerializeField] private RectTransform[] audienceSlots;
        [SerializeField] private Transform[] puppetSlots;
        [SerializeField] private Sprite audienceSittingSprite;
        [SerializeField] private Sprite audienceStandingSprite;
        [SerializeField] private Sprite audienceLookingAwaySprite;
        [SerializeField] private GameObject projectilePrefab;

        private readonly List<Coroutine> _activeCoroutines = new List<Coroutine>();
        private Vector3 _cameraOriginalPos;
        private int _currentComboTier;
        private bool _comboGlowActive;
        private bool _screenEdgeGlowActive;
        private bool _stageLightPulseActive;

        private static readonly Dictionary<LightColor, Color> ColorMap = new Dictionary<LightColor, Color>
        {
            { LightColor.Red,    new Color(1f, 0.2f, 0.2f) },
            { LightColor.Blue,   new Color(0.2f, 0.4f, 1f) },
            { LightColor.Green,  new Color(0.2f, 1f, 0.4f) },
            { LightColor.Yellow, new Color(1f, 0.8f, 0.2f) },
            { LightColor.Purple, new Color(0.8f, 0.2f, 1f) },
            { LightColor.White,  Color.white }
        };

        private void Awake()
        {
            if (cameraTransform != null)
                _cameraOriginalPos = cameraTransform.localPosition;

            SetOverlayAlpha(flashOverlay, 0f);
            SetOverlayAlpha(leftPulsePanel, 0f);
            SetOverlayAlpha(rightPulsePanel, 0f);
            SetOverlayAlpha(dimOverlay, 0f);
            SetOverlayAlpha(comboGlowPanel, 0f);
            SetOverlayAlpha(screenEdgeGlowPanel, 0f);
            SetOverlayAlpha(stageLightOverlay, 0f);
            SetOverlayAlpha(beatPulseIndicator, 0f);

            if (expandingRing != null)
                expandingRing.gameObject.SetActive(false);

            if (comboParticles != null)
                comboParticles.Stop();

            if (curtainPanel != null)
                curtainPanel.anchorMax = new Vector2(1f, 0f);
        }

        public void TriggerJudgmentFeedback(JudgmentGrade grade, LightColor color)
        {
            Color unityColor = ResolveColor(color);

            switch (grade)
            {
                case JudgmentGrade.Perfect:
                    StartTracked(PerfectFeedbackRoutine(unityColor));
                    break;
                case JudgmentGrade.Great:
                    StartTracked(GreatFeedbackRoutine(unityColor));
                    break;
                case JudgmentGrade.Good:
                    StartTracked(GoodFeedbackRoutine());
                    break;
                case JudgmentGrade.Early:
                    StartTracked(EarlyFeedbackRoutine());
                    break;
                case JudgmentGrade.Late:
                    StartTracked(LateFeedbackRoutine());
                    break;
                case JudgmentGrade.Miss:
                    StartTracked(MissFeedbackRoutine());
                    break;
            }
        }

        public void TriggerComboFeedback(int combo)
        {
            int tier = combo >= 50 ? 4 : combo >= 25 ? 3 : combo >= 10 ? 2 : combo >= 5 ? 1 : 0;

            if (tier <= _currentComboTier) return;

            int previousTier = _currentComboTier;
            _currentComboTier = tier;

            if (tier >= 1 && !_comboGlowActive)
            {
                _comboGlowActive = true;
                StartTracked(ComboGlowRoutine());
            }

            if (tier >= 2 && previousTier < 2)
            {
                if (comboParticles != null && !comboParticles.isPlaying)
                    comboParticles.Play();
            }

            if (tier >= 3 && !_screenEdgeGlowActive)
            {
                _screenEdgeGlowActive = true;
                StartTracked(ScreenEdgeGlowRoutine());
            }

            if (tier >= 4 && !_stageLightPulseActive)
            {
                _stageLightPulseActive = true;
                StartTracked(StageLightPulseRoutine());
            }
        }

        public void TriggerAudienceFeedback(AudienceEmotion emotion)
        {
            StartTracked(AudienceFeedbackRoutine(emotion));
        }

        public void TriggerPuppetFeedback(int positionIndex, PuppetActionType action, bool success)
        {
            StartTracked(PuppetFeedbackRoutine(positionIndex, action, success));
        }

        public void TriggerFailFeedback(FailReason reason)
        {
            switch (reason)
            {
                case FailReason.TooManyMisses:
                    StartTracked(FlickerAndDarkRoutine());
                    break;
                case FailReason.AudienceLeft:
                    StartTracked(AudienceLeaveRoutine());
                    break;
                case FailReason.PuppetCollapsed:
                    StartTracked(SpotlightSwingAndCutRoutine());
                    break;
                case FailReason.StoryDeadEnd:
                    StartTracked(CurtainDropRoutine());
                    break;
            }
        }

        public void TriggerBeatApproachingFeedback(int beatIndex, double timeUntilMs)
        {
            float urgency = Mathf.Clamp01(1f - (float)(timeUntilMs / 500.0));
            StartTracked(BeatApproachingPulseRoutine(urgency));
        }

        public void StopAllFeedback()
        {
            foreach (Coroutine c in _activeCoroutines)
            {
                if (c != null)
                    StopCoroutine(c);
            }
            _activeCoroutines.Clear();

            _currentComboTier = 0;
            _comboGlowActive = false;
            _screenEdgeGlowActive = false;
            _stageLightPulseActive = false;

            if (comboParticles != null && comboParticles.isPlaying)
                comboParticles.Stop();

            if (cameraTransform != null)
                cameraTransform.localPosition = _cameraOriginalPos;

            SetOverlayAlpha(flashOverlay, 0f);
            SetOverlayAlpha(leftPulsePanel, 0f);
            SetOverlayAlpha(rightPulsePanel, 0f);
            SetOverlayAlpha(dimOverlay, 0f);
            SetOverlayAlpha(comboGlowPanel, 0f);
            SetOverlayAlpha(screenEdgeGlowPanel, 0f);
            SetOverlayAlpha(stageLightOverlay, 0f);
            SetOverlayAlpha(beatPulseIndicator, 0f);
        }

        public void ResetComboTier()
        {
            _currentComboTier = 0;
            _comboGlowActive = false;
            _screenEdgeGlowActive = false;
            _stageLightPulseActive = false;

            if (comboParticles != null && comboParticles.isPlaying)
                comboParticles.Stop();

            SetOverlayAlpha(comboGlowPanel, 0f);
            SetOverlayAlpha(screenEdgeGlowPanel, 0f);
            SetOverlayAlpha(stageLightOverlay, 0f);
        }

        private void StartTracked(IEnumerator routine)
        {
            Coroutine c = StartCoroutine(routine);
            _activeCoroutines.Add(c);
        }

        private IEnumerator PerfectFeedbackRoutine(Color color)
        {
            Coroutine flash = StartCoroutine(FlashOverlayRoutine(flashOverlay, color, 1f, perfectFlashDuration));
            Coroutine ring = StartCoroutine(ExpandingRingRoutine(color));
            Coroutine shake = StartCoroutine(CameraShakeRoutine());

            yield return flash;
            yield return ring;
            yield return shake;

            RemoveCompletedCoroutines();
        }

        private IEnumerator GreatFeedbackRoutine(Color color)
        {
            yield return FlashOverlayRoutine(flashOverlay, color, 0.85f, greatFlashDuration);
            RemoveCompletedCoroutines();
        }

        private IEnumerator GoodFeedbackRoutine()
        {
            yield return FlashOverlayRoutine(flashOverlay, Color.white, goodFlashMaxAlpha, goodFlashDuration);
            RemoveCompletedCoroutines();
        }

        private IEnumerator EarlyFeedbackRoutine()
        {
            yield return FlashOverlayRoutine(leftPulsePanel, Color.red, 0.7f, earlyLatePulseDuration);
            RemoveCompletedCoroutines();
        }

        private IEnumerator LateFeedbackRoutine()
        {
            yield return FlashOverlayRoutine(rightPulsePanel, Color.red, 0.7f, earlyLatePulseDuration);
            RemoveCompletedCoroutines();
        }

        private IEnumerator MissFeedbackRoutine()
        {
            if (dimOverlay == null) yield break;

            SetOverlayColor(dimOverlay, Color.gray);
            yield return FadeOverlayRoutine(dimOverlay, 0f, missDimAlpha, missDimDuration * 0.5f);
            yield return FadeOverlayRoutine(dimOverlay, missDimAlpha, 0f, missDimDuration * 0.5f);
            RemoveCompletedCoroutines();
        }

        private IEnumerator FlashOverlayRoutine(RectTransform overlay, Color color, float peakAlpha, float duration)
        {
            if (overlay == null) yield break;

            SetOverlayColor(overlay, color);
            float half = duration * 0.5f;
            yield return FadeOverlayRoutine(overlay, 0f, peakAlpha, half);
            yield return FadeOverlayRoutine(overlay, peakAlpha, 0f, half);
        }

        private IEnumerator ExpandingRingRoutine(Color color)
        {
            if (expandingRing == null) yield break;

            expandingRing.gameObject.SetActive(true);
            SetOverlayColor(expandingRing, color);
            SetOverlayAlpha(expandingRing, 0.8f);

            Vector3 startScale = Vector3.one;
            Vector3 endScale = Vector3.one * perfectRingMaxScale;
            float elapsed = 0f;

            while (elapsed < perfectRingDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / perfectRingDuration;
                expandingRing.localScale = Vector3.Lerp(startScale, endScale, t);
                SetOverlayAlpha(expandingRing, Mathf.Lerp(0.8f, 0f, t));
                yield return null;
            }

            expandingRing.gameObject.SetActive(false);
            expandingRing.localScale = Vector3.one;
        }

        private IEnumerator CameraShakeRoutine()
        {
            if (cameraTransform == null) yield break;

            float elapsed = 0f;

            while (elapsed < cameraShakeDuration)
            {
                elapsed += Time.deltaTime;
                Vector2 offset = UnityEngine.Random.insideUnitCircle * cameraShakeMagnitude;
                cameraTransform.localPosition = _cameraOriginalPos + new Vector3(offset.x, offset.y, 0f);
                yield return null;
            }

            cameraTransform.localPosition = _cameraOriginalPos;
        }

        private IEnumerator ComboGlowRoutine()
        {
            if (comboGlowPanel == null) yield break;

            while (_comboGlowActive)
            {
                yield return FadeOverlayRoutine(comboGlowPanel, 0f, glowMaxAlpha, glowPulseDuration * 0.5f);
                if (!_comboGlowActive) break;
                yield return FadeOverlayRoutine(comboGlowPanel, glowMaxAlpha, 0f, glowPulseDuration * 0.5f);
            }

            SetOverlayAlpha(comboGlowPanel, 0f);
            RemoveCompletedCoroutines();
        }

        private IEnumerator ScreenEdgeGlowRoutine()
        {
            if (screenEdgeGlowPanel == null) yield break;

            SetOverlayColor(screenEdgeGlowPanel, Color.white);

            while (_screenEdgeGlowActive)
            {
                yield return FadeOverlayRoutine(screenEdgeGlowPanel, 0f, screenEdgeGlowAlpha, screenEdgeGlowDuration * 0.5f);
                if (!_screenEdgeGlowActive) break;
                yield return FadeOverlayRoutine(screenEdgeGlowPanel, screenEdgeGlowAlpha, 0f, screenEdgeGlowDuration * 0.5f);
            }

            SetOverlayAlpha(screenEdgeGlowPanel, 0f);
            RemoveCompletedCoroutines();
        }

        private IEnumerator StageLightPulseRoutine()
        {
            if (stageLightOverlay == null) yield break;

            SetOverlayColor(stageLightOverlay, new Color(1f, 0.95f, 0.8f));

            while (_stageLightPulseActive)
            {
                float elapsed = 0f;
                while (elapsed < stageLightPulseDuration && _stageLightPulseActive)
                {
                    elapsed += Time.deltaTime;
                    float t = elapsed / stageLightPulseDuration;
                    float alpha = Mathf.Sin(t * Mathf.PI) * 0.5f;
                    SetOverlayAlpha(stageLightOverlay, alpha);
                    yield return null;
                }
            }

            SetOverlayAlpha(stageLightOverlay, 0f);
            RemoveCompletedCoroutines();
        }

        private IEnumerator AudienceFeedbackRoutine(AudienceEmotion emotion)
        {
            switch (emotion)
            {
                case AudienceEmotion.Ecstatic:
                    yield return AudienceEcstaticRoutine();
                    break;
                case AudienceEmotion.Happy:
                    yield return AudienceSwayRoutine();
                    break;
                case AudienceEmotion.Neutral:
                    yield return AudienceNeutralRoutine();
                    break;
                case AudienceEmotion.Bored:
                    yield return AudienceBoredRoutine();
                    break;
                case AudienceEmotion.Angry:
                    yield return AudienceAngryRoutine();
                    break;
            }

            RemoveCompletedCoroutines();
        }

        private IEnumerator AudienceEcstaticRoutine()
        {
            foreach (RectTransform slot in audienceSlots)
            {
                if (slot == null) continue;
                var img = slot.GetComponent<UnityEngine.UI.Image>();
                if (img != null && audienceStandingSprite != null)
                    img.sprite = audienceStandingSprite;
            }

            yield return new WaitForSeconds(audienceTransitionDuration);
        }

        private IEnumerator AudienceSwayRoutine()
        {
            float elapsed = 0f;

            while (elapsed < swayDuration)
            {
                elapsed += Time.deltaTime;
                float angle = Mathf.Sin(elapsed * 4f) * swayAngle;

                if (audienceContainer != null)
                    audienceContainer.localRotation = Quaternion.Euler(0f, 0f, angle);

                yield return null;
            }

            if (audienceContainer != null)
                audienceContainer.localRotation = Quaternion.identity;
        }

        private IEnumerator AudienceNeutralRoutine()
        {
            if (audienceContainer != null)
                audienceContainer.localRotation = Quaternion.identity;

            foreach (RectTransform slot in audienceSlots)
            {
                if (slot == null) continue;
                var img = slot.GetComponent<UnityEngine.UI.Image>();
                if (img != null && audienceSittingSprite != null)
                    img.sprite = audienceSittingSprite;
            }

            yield return new WaitForSeconds(audienceTransitionDuration);
        }

        private IEnumerator AudienceBoredRoutine()
        {
            foreach (RectTransform slot in audienceSlots)
            {
                if (slot == null) continue;
                var img = slot.GetComponent<UnityEngine.UI.Image>();
                if (img != null && audienceLookingAwaySprite != null)
                    img.sprite = audienceLookingAwaySprite;
            }

            yield return new WaitForSeconds(audienceTransitionDuration);
        }

        private IEnumerator AudienceAngryRoutine()
        {
            int count = Mathf.Min(audienceSlots.Length, 5);
            for (int i = 0; i < count; i++)
            {
                if (audienceSlots[i] == null || projectilePrefab == null) continue;

                Vector3 spawnPos = audienceSlots[i].position;
                GameObject proj = Instantiate(projectilePrefab, spawnPos, Quaternion.identity, transform);
                Rigidbody2D rb = proj.GetComponent<Rigidbody2D>();

                if (rb != null)
                {
                    Vector2 dir = (Vector2.up * 2f + Vector2.right * UnityEngine.Random.Range(-1f, 1f)).normalized;
                    rb.linearVelocity = dir * 5f;
                }

                Destroy(proj, projectileLifetime);
                yield return new WaitForSeconds(0.1f);
            }
        }

        private IEnumerator PuppetFeedbackRoutine(int positionIndex, PuppetActionType action, bool success)
        {
            if (positionIndex < 0 || positionIndex >= puppetSlots.Length) yield break;
            Transform puppet = puppetSlots[positionIndex];
            if (puppet == null) yield break;

            float duration = success ? puppetActionDuration : puppetFailDuration;
            Vector3 originalPos = puppet.localPosition;
            Vector3 originalScale = puppet.localScale;
            Quaternion originalRot = puppet.localRotation;

            IEnumerator anim = action switch
            {
                PuppetActionType.Bow => PuppetBowRoutine(puppet, duration, success),
                PuppetActionType.Dance => PuppetDanceRoutine(puppet, duration, success),
                PuppetActionType.Spin => PuppetSpinRoutine(puppet, duration, success),
                PuppetActionType.Jump => PuppetJumpRoutine(puppet, duration, success),
                PuppetActionType.Wave => PuppetWaveRoutine(puppet, duration, success),
                PuppetActionType.Collapse => PuppetCollapseRoutine(puppet, duration, success),
                _ => PuppetIdleRoutine(puppet, duration)
            };

            yield return anim;

            puppet.localPosition = originalPos;
            puppet.localScale = originalScale;
            puppet.localRotation = originalRot;

            RemoveCompletedCoroutines();
        }

        private IEnumerator PuppetBowRoutine(Transform puppet, float duration, bool success)
        {
            float elapsed = 0f;
            float half = duration * 0.5f;
            float angle = success ? 30f : 10f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed < half ? elapsed / half : 1f - (elapsed - half) / half;
                puppet.localRotation = Quaternion.Euler(0f, 0f, t * angle);
                yield return null;
            }
        }

        private IEnumerator PuppetDanceRoutine(Transform puppet, float duration, bool success)
        {
            float elapsed = 0f;
            float speed = success ? 8f : 3f;
            float amplitude = success ? 0.15f : 0.05f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float x = Mathf.Sin(elapsed * speed) * amplitude;
                puppet.localPosition += new Vector3(x, 0f, 0f) * Time.deltaTime * speed;
                yield return null;
            }
        }

        private IEnumerator PuppetSpinRoutine(Transform puppet, float duration, bool success)
        {
            float elapsed = 0f;
            float totalRotation = success ? 360f : 90f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                puppet.localRotation = Quaternion.Euler(0f, t * totalRotation, 0f);
                yield return null;
            }
        }

        private IEnumerator PuppetJumpRoutine(Transform puppet, float duration, bool success)
        {
            float elapsed = 0f;
            float height = success ? 1.5f : 0.4f;
            Vector3 basePos = puppet.localPosition;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                float y = Mathf.Sin(t * Mathf.PI) * height;
                puppet.localPosition = basePos + new Vector3(0f, y, 0f);
                yield return null;
            }
        }

        private IEnumerator PuppetWaveRoutine(Transform puppet, float duration, bool success)
        {
            float elapsed = 0f;
            float speed = success ? 10f : 4f;
            float angle = success ? 25f : 8f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float rot = Mathf.Sin(elapsed * speed) * angle;
                puppet.localRotation = Quaternion.Euler(0f, 0f, rot);
                yield return null;
            }
        }

        private IEnumerator PuppetCollapseRoutine(Transform puppet, float duration, bool success)
        {
            float elapsed = 0f;
            float targetAngle = success ? 45f : 90f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                float eased = t * t;
                puppet.localRotation = Quaternion.Euler(0f, 0f, eased * targetAngle);
                puppet.localScale = Vector3.Lerp(Vector3.one, new Vector3(1f, 0.7f, 1f), eased);
                yield return null;
            }
        }

        private IEnumerator PuppetIdleRoutine(Transform puppet, float duration)
        {
            yield return new WaitForSeconds(duration);
        }

        private IEnumerator FlickerAndDarkRoutine()
        {
            float elapsed = 0f;
            bool lightsOn = true;

            while (elapsed < flickerDuration)
            {
                elapsed += Time.deltaTime;

                if (elapsed % flickerInterval < Time.deltaTime)
                {
                    lightsOn = !lightsOn;
                    SetOverlayAlpha(flashOverlay, lightsOn ? 0f : 0.9f);
                    SetOverlayColor(flashOverlay, Color.black);
                }

                yield return null;
            }

            SetOverlayColor(flashOverlay, Color.black);
            SetOverlayAlpha(flashOverlay, 0.95f);
            RemoveCompletedCoroutines();
        }

        private IEnumerator AudienceLeaveRoutine()
        {
            for (int i = audienceSlots.Length - 1; i >= 0; i--)
            {
                if (audienceSlots[i] == null) continue;
                audienceSlots[i].gameObject.SetActive(false);
                yield return new WaitForSeconds(0.08f);
            }

            RemoveCompletedCoroutines();
        }

        private IEnumerator SpotlightSwingAndCutRoutine()
        {
            if (cameraTransform == null) yield break;

            float elapsed = 0f;

            while (elapsed < spotlightSwingDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / spotlightSwingDuration;
                float angle = Mathf.Sin(t * Mathf.PI * 4f) * spotlightSwingAngle * (1f - t);
                cameraTransform.localRotation = Quaternion.Euler(0f, 0f, angle);
                yield return null;
            }

            cameraTransform.localRotation = Quaternion.identity;
            SetOverlayColor(flashOverlay, Color.black);
            SetOverlayAlpha(flashOverlay, 1f);
            RemoveCompletedCoroutines();
        }

        private IEnumerator CurtainDropRoutine()
        {
            if (curtainPanel == null) yield break;

            curtainPanel.gameObject.SetActive(true);
            Vector2 anchorStart = new Vector2(1f, 0f);
            Vector2 anchorEnd = new Vector2(1f, 1f);
            float elapsed = 0f;

            while (elapsed < curtainDropDuration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / curtainDropDuration);
                float eased = t * t;
                curtainPanel.anchorMax = Vector2.Lerp(anchorStart, anchorEnd, eased);
                yield return null;
            }

            curtainPanel.anchorMax = anchorEnd;
            RemoveCompletedCoroutines();
        }

        private IEnumerator BeatApproachingPulseRoutine(float urgency)
        {
            if (beatPulseIndicator == null) yield break;

            float alpha = Mathf.Lerp(beatPulseMinAlpha, beatPulseMaxAlpha, urgency);
            SetOverlayColor(beatPulseIndicator, Color.white);

            yield return FadeOverlayRoutine(beatPulseIndicator, 0f, alpha, beatPulseDuration * 0.5f);
            yield return FadeOverlayRoutine(beatPulseIndicator, alpha, 0f, beatPulseDuration * 0.5f);

            RemoveCompletedCoroutines();
        }

        private IEnumerator FadeOverlayRoutine(RectTransform overlay, float fromAlpha, float toAlpha, float duration)
        {
            if (overlay == null) yield break;

            float elapsed = 0f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                SetOverlayAlpha(overlay, Mathf.Lerp(fromAlpha, toAlpha, t));
                yield return null;
            }

            SetOverlayAlpha(overlay, toAlpha);
        }

        private void SetOverlayAlpha(RectTransform overlay, float alpha)
        {
            if (overlay == null) return;
            var group = overlay.GetComponent<CanvasGroup>();
            if (group != null)
                group.alpha = alpha;
        }

        private void SetOverlayColor(RectTransform overlay, Color color)
        {
            if (overlay == null) return;
            var img = overlay.GetComponent<UnityEngine.UI.Image>();
            if (img != null)
                img.color = color;
        }

        private Color ResolveColor(LightColor lightColor)
        {
            return ColorMap.TryGetValue(lightColor, out Color c) ? c : Color.white;
        }

        private void RemoveCompletedCoroutines()
        {
            _activeCoroutines.RemoveAll(c => c == null);
        }
    }
}
