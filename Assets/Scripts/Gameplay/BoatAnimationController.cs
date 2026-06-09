using UnityEngine;
using LakeSailing.Core;
using LakeSailing.Gameplay;
using LakeSailing.Audio;
using LakeSailing.UI;

namespace LakeSailing.Animation
{
    public enum BoatAnimationState
    {
        Idle,
        SailingForward,
        SailingTurn,
        Shooting,
        Docked,
        LowFuel,
        Damaged
    }

    public class BoatAnimationController : MonoBehaviour
    {
        [Header("引用")]
        [SerializeField] private BoatController boat;
        [SerializeField] private Animator animator;
        [SerializeField] private Transform boatVisual;
        [SerializeField] private Transform sailTransform;

        [Header("摇晃设置")]
        [SerializeField] private float idleBobAmount = 0.1f;
        [SerializeField] private float idleBobSpeed = 1.5f;
        [SerializeField] private float sailingBobAmount = 0.2f;
        [SerializeField] private float sailingBobSpeed = 3f;
        [SerializeField] private float turnTiltAmount = 5f;
        [SerializeField] private float sailLerpSpeed = 5f;

        [Header("粒子效果")]
        [SerializeField] private ParticleSystem wakeEffect;
        [SerializeField] private ParticleSystem splashEffect;

        private Vector3 initialPosition;
        private Quaternion initialVisualRotation;
        private float currentTilt;
        private float bobTimer;
        private BoatAnimationState currentState;

        private void Awake()
        {
            if (animator == null) animator = GetComponent<Animator>();
            if (boatVisual != null)
            {
                initialPosition = boatVisual.localPosition;
                initialVisualRotation = boatVisual.localRotation;
            }
        }

        private void Start()
        {
            SubscribeToEvents();
        }

        private void OnDestroy()
        {
            EventBus.Unsubscribe<BoatStateChangedEvent>(OnBoatStateChanged);
            EventBus.Unsubscribe<WindChangedEvent>(OnWindChanged);
        }

        private void SubscribeToEvents()
        {
            EventBus.Subscribe<BoatStateChangedEvent>(OnBoatStateChanged);
            EventBus.Subscribe<WindChangedEvent>(OnWindChanged);
        }

        private void Update()
        {
            if (boat == null) return;

            UpdateBobAnimation();
            UpdateTurnTilt();
            UpdateSailRotation();
            UpdateAnimationState();
            UpdateEffects();
        }

        private void UpdateBobAnimation()
        {
            if (boatVisual == null) return;

            bobTimer += Time.deltaTime;
            float speed = boat.CurrentSpeed / Mathf.Max(0.01f, boat.MaxSpeed);
            float amount = Mathf.Lerp(idleBobAmount, sailingBobAmount, speed);
            float freq = Mathf.Lerp(idleBobSpeed, sailingBobSpeed, speed);

            float bob = Mathf.Sin(bobTimer * freq) * amount;
            boatVisual.localPosition = initialPosition + new Vector3(0, bob, 0);
        }

        private void UpdateTurnTilt()
        {
            if (boatVisual == null) return;

            float targetTilt = 0;
            float horizontal = Input.GetAxis("Horizontal");
            targetTilt = -horizontal * turnTiltAmount;

            currentTilt = Mathf.Lerp(currentTilt, targetTilt, 8f * Time.deltaTime);
            boatVisual.localRotation = initialVisualRotation * Quaternion.Euler(0, 0, currentTilt);
        }

        private void UpdateSailRotation()
        {
            if (sailTransform == null || WeatherSystem.Instance == null) return;

            float windAngle = WeatherSystem.Instance.GetWindAngleDegrees();
            Quaternion targetRot = Quaternion.Euler(0, 0, windAngle);
            float windStrength = WeatherSystem.Instance.CurrentWindStrength;
            float scale = 1f + windStrength * 0.3f;

            sailTransform.rotation = Quaternion.Lerp(sailTransform.rotation, targetRot, sailLerpSpeed * Time.deltaTime);
            sailTransform.localScale = Vector3.Lerp(sailTransform.localScale, new Vector3(scale, scale, 1), 3f * Time.deltaTime);
        }

        private void UpdateAnimationState()
        {
            BoatAnimationState newState;
            float speed = boat.CurrentSpeed;

            switch (boat.CurrentState)
            {
                case BoatState.Docked:
                    newState = BoatAnimationState.Docked;
                    break;
                case BoatState.Shooting:
                    newState = BoatAnimationState.Shooting;
                    break;
                case BoatState.LowFuel:
                    newState = BoatAnimationState.LowFuel;
                    break;
                case BoatState.Damaged:
                    newState = BoatAnimationState.Damaged;
                    break;
                case BoatState.Anchored:
                    newState = BoatAnimationState.Idle;
                    break;
                default:
                    if (speed > 0.5f)
                    {
                        newState = Mathf.Abs(Input.GetAxis("Horizontal")) > 0.3f ?
                            BoatAnimationState.SailingTurn : BoatAnimationState.SailingForward;
                    }
                    else
                    {
                        newState = BoatAnimationState.Idle;
                    }
                    break;
            }

            if (newState != currentState)
            {
                currentState = newState;
                if (animator != null)
                {
                    animator.SetInteger("State", (int)currentState);
                }
            }
        }

        private void UpdateEffects()
        {
            float speed = boat != null ? boat.CurrentSpeed : 0;

            if (wakeEffect != null)
            {
                var main = wakeEffect.main;
                if (speed > 0.5f)
                {
                    wakeEffect.Play();
                    main.startSpeedMultiplier = speed;
                }
                else
                {
                    wakeEffect.Stop();
                }
            }
        }

        private void OnBoatStateChanged(BoatStateChangedEvent e)
        {
            if (e.NewState == BoatState.Docked && e.OldState != BoatState.Docked)
            {
                TriggerSplash();
            }
        }

        private void OnWindChanged(WindChangedEvent e)
        {
            if (e.Strength > 0.7f && sailTransform != null)
            {
                StartCoroutine(SailGustAnimation());
            }
        }

        private System.Collections.IEnumerator SailGustAnimation()
        {
            if (sailTransform == null) yield break;
            Vector3 originalScale = sailTransform.localScale;
            float t = 0;
            while (t < 0.5f)
            {
                t += Time.deltaTime;
                float pulse = 1f + Mathf.Sin(t * 20f) * 0.2f;
                sailTransform.localScale = originalScale * pulse;
                yield return null;
            }
            sailTransform.localScale = originalScale;
        }

        private void TriggerSplash()
        {
            if (splashEffect != null)
            {
                splashEffect.Play();
                AudioManager.Instance?.PlaySfx(SfxType.Wave);
            }
        }

        public void TriggerShootAnimation()
        {
            if (animator != null)
            {
                animator.SetTrigger("Shoot");
            }
        }
    }
}
