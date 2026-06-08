using UnityEngine;
using System.Collections;

namespace InkMountainBridge
{
    public class InputFeedback : MonoBehaviour
    {
        [SerializeField] private Color placementValidColor = Color.green;
        [SerializeField] private Color placementInvalidColor = Color.red;
        [SerializeField] private float ghostAlpha = 0.5f;
        [SerializeField] private float pulseSpeed = 2f;
        [SerializeField] private Vector2 shakeAmount = new Vector2(0.1f, 0.1f);
        [SerializeField] private float shakeDuration = 0.1f;

        private GameObject previewObject;
        private SpriteRenderer previewRenderer;
        private bool isPulsing;
        private Vector3 originalCameraPosition;
        private Coroutine shakeCoroutine;
        private Coroutine pulseCoroutine;

        private void Start()
        {
            if (Camera.main != null)
                originalCameraPosition = Camera.main.transform.localPosition;
        }

        public void ShowPlacementPreview(Vector2 start, Vector2 end, bool isValid)
        {
            if (previewObject == null)
            {
                previewObject = new GameObject("PlacementPreview");
                previewRenderer = previewObject.AddComponent<SpriteRenderer>();
            }

            previewObject.SetActive(true);

            Vector2 mid = (start + end) / 2f;
            previewObject.transform.position = mid;

            Vector2 dir = end - start;
            float angle = Mathf.Atan2(dir.y, dir.x) * Mathf.Rad2Deg;
            previewObject.transform.rotation = Quaternion.Euler(0f, 0f, angle);

            if (previewRenderer != null)
            {
                Color baseColor = isValid ? placementValidColor : placementInvalidColor;
                baseColor.a = ghostAlpha;
                previewRenderer.color = baseColor;
            }

            if (!isValid)
            {
                StartCoroutine(FlashInvalid());
            }
        }

        public void HidePreview()
        {
            if (previewObject != null)
                previewObject.SetActive(false);

            if (pulseCoroutine != null)
            {
                StopCoroutine(pulseCoroutine);
                pulseCoroutine = null;
            }
        }

        public void PlayPlaceFeedback(Vector2 position)
        {
            if (shakeCoroutine != null)
                StopCoroutine(shakeCoroutine);
            shakeCoroutine = StartCoroutine(ShakeCamera());

            SpawnParticleBurst(position, placementValidColor);
        }

        public void PlayRemoveFeedback(Vector2 position)
        {
            SpawnParticleBurst(position, placementInvalidColor);
        }

        public void PulseSelectedMaterial()
        {
            if (pulseCoroutine != null)
                StopCoroutine(pulseCoroutine);
            pulseCoroutine = StartCoroutine(PulseRoutine());
        }

        private IEnumerator ShakeCamera()
        {
            Camera cam = Camera.main;
            if (cam == null) yield break;

            float elapsed = 0f;
            Vector3 origin = originalCameraPosition;

            while (elapsed < shakeDuration)
            {
                float x = Random.Range(-shakeAmount.x, shakeAmount.x);
                float y = Random.Range(-shakeAmount.y, shakeAmount.y);
                cam.transform.localPosition = origin + new Vector3(x, y, 0f);
                elapsed += Time.unscaledDeltaTime;
                yield return null;
            }

            cam.transform.localPosition = origin;
            shakeCoroutine = null;
        }

        private IEnumerator FlashInvalid()
        {
            if (previewRenderer == null) yield break;

            Color original = previewRenderer.color;
            Color flash = placementInvalidColor;
            flash.a = 1f;
            previewRenderer.color = flash;
            yield return new WaitForSeconds(0.1f);

            if (previewObject != null && previewObject.activeSelf)
                previewRenderer.color = original;
        }

        private IEnumerator PulseRoutine()
        {
            isPulsing = true;
            float time = 0f;

            while (isPulsing)
            {
                time += Time.unscaledDeltaTime * pulseSpeed;
                float scale = 1f + 0.1f * Mathf.Sin(time * Mathf.PI);
                if (previewObject != null)
                    previewObject.transform.localScale = Vector3.one * scale;
                yield return null;
            }

            if (previewObject != null)
                previewObject.transform.localScale = Vector3.one;

            pulseCoroutine = null;
        }

        private void SpawnParticleBurst(Vector2 position, Color color)
        {
            GameObject particles = new GameObject("FeedbackParticles");
            particles.transform.position = position;

            ParticleSystem ps = particles.AddComponent<ParticleSystem>();
            var main = ps.main;
            main.startColor = color;
            main.startSpeed = 2f;
            main.startLifetime = 0.5f;
            main.maxParticles = 20;

            var emission = ps.emission;
            emission.rateOverTime = 0;
            emission.SetBurst(0, new ParticleSystem.Burst(0f, 15));

            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Circle;
            shape.radius = 0.5f;

            ps.Play();
            Destroy(particles, 1f);
        }

        private void OnDestroy()
        {
            if (previewObject != null)
                Destroy(previewObject);
        }
    }
}
