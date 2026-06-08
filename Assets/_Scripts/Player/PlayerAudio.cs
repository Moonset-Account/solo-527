using UnityEngine;

namespace LightShadowPlatformer.Player
{
    public class PlayerAudio : MonoBehaviour
    {
        [Header("Step Audio")]
        public float stepInterval = 0.35f;
        public float minSpeedForStep = 0.5f;
        public float stepVolumeVariation = 0.1f;
        public float stepPitchVariation = 0.05f;

        [Header("References")]
        public PlayerController controller;
        public AudioSource stepSource;

        private float _stepTimer;
        private PlayerState _lastState;
        private bool _wasGrounded;

        private void Awake()
        {
            if (controller == null) controller = GetComponent<PlayerController>();
        }

        private void Update()
        {
            HandleFootsteps();
            CheckStateChanges();
            _wasGrounded = controller.IsGrounded;
        }

        private void HandleFootsteps()
        {
            if (!controller.IsGrounded || controller.CurrentState == PlayerState.Dying) return;

            float speed = Mathf.Abs(controller.CurrentVelocity.x);
            if (speed < minSpeedForStep) return;

            _stepTimer += Time.deltaTime;
            float currentInterval = stepInterval * (1f - Mathf.Clamp01(speed / 10f) * 0.3f);

            if (_stepTimer >= currentInterval)
            {
                _stepTimer = 0f;
                PlayStep();
            }
        }

        private void PlayStep()
        {
            if (stepSource == null) return;

            float vol = 1f + Random.Range(-stepVolumeVariation, stepVolumeVariation);
            float pitch = 1f + Random.Range(-stepPitchVariation, stepPitchVariation);

            stepSource.volume = Mathf.Clamp01(vol) * LightShadowPlatformer.Core.SettingsManager.Instance.CurrentSettings.sfxVolume;
            stepSource.pitch = pitch;
            stepSource.Play();
        }

        private void CheckStateChanges()
        {
            if (controller.CurrentState == _lastState) return;

            var state = controller.CurrentState;

            if (!_wasGrounded && state == PlayerState.Landing)
            {
                LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(
                    LightShadowPlatformer.Core.AudioManager.SfxType.Land);
            }

            if (state == PlayerState.Jumping)
            {
                LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(
                    LightShadowPlatformer.Core.AudioManager.SfxType.Jump);
            }

            _lastState = state;
        }
    }
}
