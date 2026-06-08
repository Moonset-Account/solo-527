using System.Collections;
using UnityEngine;

namespace LightShadowPlatformer
{
    public class LevelGoal : MonoBehaviour
    {
        [Header("Goal Settings")]
        public int levelIndex = 0;
        public float transitionDelay = 1.2f;
        public float autoCompleteDelay = 0.3f;

        [Header("Visual Settings")]
        public SpriteRenderer portalRenderer;
        public SpriteRenderer frameRenderer;
        public ParticleSystem enterParticles;
        public ParticleSystem idleParticles;
        public Light portalLight;
        public Color portalColor = new Color(0.3f, 0.7f, 1f);
        public float idleRotationSpeed = 60f;
        public float idlePulseSpeed = 2f;
        public float idlePulseAmount = 0.1f;

        [Header("Victory UI")]
        public bool showVictoryScreen = true;

        private bool _completed;

        private void Start()
        {
            if (portalRenderer != null)
            {
                portalRenderer.color = portalColor;
            }
            if (portalLight != null)
            {
                portalLight.color = portalColor;
            }
        }

        private void Update()
        {
            IdleAnimation();
        }

        private void IdleAnimation()
        {
            float pulse = 1f + Mathf.Sin(Time.time * idlePulseSpeed) * idlePulseAmount;
            if (portalRenderer != null)
            {
                portalRenderer.transform.Rotate(Vector3.forward, idleRotationSpeed * Time.deltaTime);
                portalRenderer.transform.localScale = Vector3.one * pulse;
            }
            if (portalLight != null)
            {
                portalLight.intensity = 1.5f + Mathf.Sin(Time.time * idlePulseSpeed) * 0.5f;
            }
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (other.CompareTag("Player") && !_completed)
            {
                OnPlayerReached();
            }
        }

        public void OnPlayerReached()
        {
            if (_completed) return;
            _completed = true;

            LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(
                LightShadowPlatformer.Core.AudioManager.SfxType.LevelComplete);

            if (enterParticles != null) enterParticles.Play();

            LightShadowPlatformer.Player.PlayerController player =
                FindObjectOfType<LightShadowPlatformer.Player.PlayerController>();
            if (player != null)
            {
                player.CanMove = false;
            }

            StartCoroutine(CompleteTransitionRoutine());
        }

        private IEnumerator CompleteTransitionRoutine()
        {
            float elapsed = 0f;
            Vector3 startScale = portalRenderer != null ? portalRenderer.transform.localScale : Vector3.one;
            Vector3 endScale = startScale * 3f;
            Color startColor = portalRenderer != null ? portalRenderer.color : portalColor;
            Color endColor = new Color(1f, 1f, 1f, 0f);

            while (elapsed < transitionDelay)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / transitionDelay;
                float eased = Mathf.Pow(t, 2f);

                if (portalRenderer != null)
                {
                    portalRenderer.transform.localScale = Vector3.Lerp(startScale, endScale, eased);
                    portalRenderer.color = Color.Lerp(startColor, endColor, t);
                }
                if (portalLight != null)
                {
                    portalLight.intensity = Mathf.Lerp(1.5f, 5f, t);
                }

                yield return null;
            }

            yield return new WaitForSeconds(autoCompleteDelay);

            LightShadowPlatformer.Core.EventManager.Instance.TriggerLevelCompleted(levelIndex);

            LightShadowPlatformer.Core.GameManager gameMgr = LightShadowPlatformer.Core.GameManager.Instance;
            if (gameMgr != null)
            {
                gameMgr.CompleteLevel();
            }
        }
    }
}
