using System.Collections;
using UnityEngine;

namespace LightShadowPlatformer
{
    public class Checkpoint : MonoBehaviour
    {
        [Header("Checkpoint Settings")]
        public string checkpointId = "cp_01";
        public bool isActivated;
        public float activationRadius = 1.5f;
        public Transform respawnPoint;

        [Header("Visual Settings")]
        public SpriteRenderer flagRenderer;
        public SpriteRenderer poleRenderer;
        public SpriteRenderer baseRenderer;
        public Sprite flagInactiveSprite;
        public Sprite flagActiveSprite;
        public Color inactiveColor = new Color(0.7f, 0.4f, 0.4f);
        public Color activeColor = new Color(0.4f, 1f, 0.4f);
        public Light activationLight;
        public ParticleSystem activateParticles;
        public float flagRaiseDuration = 0.6f;
        public float idlePulseSpeed = 2f;
        public float idlePulseAmount = 0.1f;

        [Header("Audio")]
        public float activationDelay = 0.15f;

        private bool _playerInRange;
        private Vector3 _flagOriginalPos;
        private Vector3 _flagOriginalScale;

        private void Awake()
        {
            if (respawnPoint == null) respawnPoint = transform;
            if (flagRenderer != null)
            {
                _flagOriginalPos = flagRenderer.transform.localPosition;
                _flagOriginalScale = flagRenderer.transform.localScale;
            }
        }

        private void Start()
        {
            if (LightShadowPlatformer.Core.SaveManager.Instance != null &&
                LightShadowPlatformer.Core.SaveManager.Instance.IsCheckpointActivated(checkpointId))
            {
                isActivated = true;
                ApplyActivatedVisualsImmediate();
            }
            else
            {
                ApplyDeactivatedVisualsImmediate();
            }
        }

        private void Update()
        {
            if (isActivated)
            {
                IdlePulseAnimation();
            }

            if (_playerInRange && !isActivated)
            {
                ActivateCheckpoint();
            }
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (other.CompareTag("Player"))
            {
                _playerInRange = true;
            }
        }

        private void OnTriggerExit2D(Collider2D other)
        {
            if (other.CompareTag("Player"))
            {
                _playerInRange = false;
            }
        }

        public void ActivateCheckpoint()
        {
            if (isActivated) return;

            isActivated = true;
            LightShadowPlatformer.Core.SaveManager.Instance?.SaveCheckpointActivation(checkpointId);
            LightShadowPlatformer.Core.EventManager.Instance.TriggerCheckpointActivated(checkpointId);

            StartCoroutine(ActivateAnimationRoutine());
        }

        private IEnumerator ActivateAnimationRoutine()
        {
            yield return new WaitForSeconds(activationDelay);

            LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(
                LightShadowPlatformer.Core.AudioManager.SfxType.Checkpoint);

            if (activateParticles != null) activateParticles.Play();
            if (activationLight != null)
            {
                activationLight.enabled = true;
                StartCoroutine(LightFadeRoutine());
            }

            float elapsed = 0f;
            Vector3 startPos = _flagOriginalPos + Vector3.down * 1.5f;
            Vector3 endPos = _flagOriginalPos;
            Color startColor = inactiveColor;
            Color endColor = activeColor;

            if (flagRenderer != null)
            {
                flagRenderer.enabled = true;
                if (flagInactiveSprite != null) flagRenderer.sprite = flagInactiveSprite;
                flagRenderer.transform.localPosition = startPos;
            }

            while (elapsed < flagRaiseDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / flagRaiseDuration;
                float eased = 1f - Mathf.Pow(1f - t, 3f);

                if (flagRenderer != null)
                {
                    flagRenderer.transform.localPosition = Vector3.Lerp(startPos, endPos, eased);
                    flagRenderer.color = Color.Lerp(startColor, endColor, t);
                    if (t > 0.5f && flagActiveSprite != null)
                        flagRenderer.sprite = flagActiveSprite;
                }

                if (baseRenderer != null)
                    baseRenderer.color = Color.Lerp(inactiveColor, activeColor, t);
                if (poleRenderer != null)
                    poleRenderer.color = Color.Lerp(inactiveColor * 0.7f, activeColor * 0.7f, t);

                yield return null;
            }

            ApplyActivatedVisualsImmediate();
        }

        private IEnumerator LightFadeRoutine()
        {
            float elapsed = 0f;
            float duration = 1.5f;
            float startIntensity = 2f;
            float endIntensity = 0.8f;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                activationLight.intensity = Mathf.Lerp(startIntensity, endIntensity, t);
                yield return null;
            }
        }

        private void IdlePulseAnimation()
        {
            float t = Mathf.Sin(Time.time * idlePulseSpeed) * idlePulseAmount;

            if (flagRenderer != null)
            {
                flagRenderer.transform.localScale = _flagOriginalScale + Vector3.one * t;
            }

            if (activationLight != null)
            {
                activationLight.intensity = 0.8f + t * 0.5f;
            }
        }

        private void ApplyActivatedVisualsImmediate()
        {
            if (flagRenderer != null)
            {
                flagRenderer.enabled = true;
                if (flagActiveSprite != null) flagRenderer.sprite = flagActiveSprite;
                flagRenderer.color = activeColor;
                flagRenderer.transform.localPosition = _flagOriginalPos;
                flagRenderer.transform.localScale = _flagOriginalScale;
            }
            if (baseRenderer != null) baseRenderer.color = activeColor;
            if (poleRenderer != null) poleRenderer.color = activeColor * 0.7f;
            if (activationLight != null)
            {
                activationLight.enabled = true;
                activationLight.color = activeColor;
                activationLight.intensity = 0.8f;
            }
        }

        private void ApplyDeactivatedVisualsImmediate()
        {
            if (flagRenderer != null)
            {
                flagRenderer.enabled = true;
                if (flagInactiveSprite != null) flagRenderer.sprite = flagInactiveSprite;
                flagRenderer.color = inactiveColor;
                flagRenderer.transform.localPosition = _flagOriginalPos + Vector3.down * 1.5f;
                flagRenderer.transform.localScale = _flagOriginalScale;
            }
            if (baseRenderer != null) baseRenderer.color = inactiveColor;
            if (poleRenderer != null) poleRenderer.color = inactiveColor * 0.7f;
            if (activationLight != null) activationLight.enabled = false;
        }

        public Vector2 GetRespawnPosition()
        {
            return respawnPoint != null ? (Vector2)respawnPoint.position : (Vector2)transform.position;
        }
    }
}
