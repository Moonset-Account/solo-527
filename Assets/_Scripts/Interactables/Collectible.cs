using System.Collections;
using UnityEngine;

namespace LightShadowPlatformer
{
    public class Collectible : MonoBehaviour
    {
        public enum CollectibleType { Gem, Key, Star, Shard }

        [Header("Collectible Settings")]
        public string collectibleId = "gem_01";
        public CollectibleType type = CollectibleType.Gem;
        public int scoreValue = 1;
        public bool collected;

        [Header("Visual Settings")]
        public SpriteRenderer itemRenderer;
        public ParticleSystem collectParticles;
        public Light glowLight;
        public float bobHeight = 0.2f;
        public float bobSpeed = 2f;
        public float rotationSpeed = 90f;
        public float pulseSize = 0.1f;
        public float pulseSpeed = 3f;
        public float collectScaleMultiplier = 1.5f;
        public float collectDuration = 0.25f;

        [Header("Audio")]
        public float pitchVariation = 0.1f;

        private Vector3 _startPos;
        private int _totalCollected;
        private float _randomOffset;

        private void Awake()
        {
            _startPos = transform.position;
            _randomOffset = Random.Range(0f, Mathf.PI * 2f);
            if (itemRenderer == null) itemRenderer = GetComponent<SpriteRenderer>();
        }

        private void Start()
        {
            if (LightShadowPlatformer.Core.SaveManager.Instance != null &&
                LightShadowPlatformer.Core.SaveManager.Instance.IsCollectibleCollected(collectibleId))
            {
                MarkCollectedImmediate();
            }
        }

        private void Update()
        {
            if (collected) return;
            AnimateIdle();
        }

        private void AnimateIdle()
        {
            float t = Time.time + _randomOffset;
            transform.position = _startPos + Vector3.up * Mathf.Sin(t * bobSpeed) * bobHeight;
            transform.Rotate(Vector3.forward, rotationSpeed * Time.deltaTime);

            float scale = 1f + Mathf.Sin(t * pulseSpeed) * pulseSize;
            transform.localScale = Vector3.one * scale;
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!collected && other.CompareTag("Player"))
            {
                Collect();
            }
        }

        public void Collect()
        {
            if (collected) return;

            collected = true;
            LightShadowPlatformer.Core.SaveManager.Instance?.SaveCollectibleCollected(collectibleId);

            _totalCollected = CountCollectedInLevel();
            LightShadowPlatformer.Core.EventManager.Instance.TriggerCollectibleCollected(collectibleId, _totalCollected);

            LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(
                LightShadowPlatformer.Core.AudioManager.SfxType.Collect,
                1f, 1f + Random.Range(-pitchVariation, pitchVariation));

            if (collectParticles != null) collectParticles.Play();

            StartCoroutine(CollectAnimation());
        }

        private IEnumerator CollectAnimation()
        {
            float elapsed = 0f;
            Vector3 startScale = transform.localScale;
            Vector3 endScale = startScale * collectScaleMultiplier;
            Color startColor = itemRenderer != null ? itemRenderer.color : Color.white;
            Color endColor = new Color(startColor.r, startColor.g, startColor.b, 0f);

            Collider2D col = GetComponent<Collider2D>();
            if (col != null) col.enabled = false;

            if (glowLight != null) glowLight.enabled = false;

            while (elapsed < collectDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / collectDuration;
                transform.localScale = Vector3.Lerp(startScale, endScale, t);
                transform.position += Vector3.up * 0.5f * Time.deltaTime;
                if (itemRenderer != null)
                    itemRenderer.color = Color.Lerp(startColor, endColor, t);
                yield return null;
            }

            gameObject.SetActive(false);
        }

        private void MarkCollectedImmediate()
        {
            collected = true;
            Collider2D col = GetComponent<Collider2D>();
            if (col != null) col.enabled = false;
            gameObject.SetActive(false);
        }

        private int CountCollectedInLevel()
        {
            int count = 0;
            Collectible[] collectibles = FindObjectsOfType<Collectible>();
            foreach (var c in collectibles)
            {
                if (c.collected) count++;
            }
            return count;
        }
    }
}
