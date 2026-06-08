using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace LightShadowPlatformer.UI
{
    public class HUDController : MonoBehaviour
    {
        [Header("Level & Progress")]
        public TMP_Text levelText;
        public TMP_Text checkpointText;

        [Header("Collectibles")]
        public TMP_Text collectibleText;
        public Image collectibleIcon;
        public int totalCollectiblesInLevel;

        [Header("Light Direction")]
        public Image lightDirectionIndicator;
        public TMP_Text lightDirectionText;
        public Sprite[] directionSprites;
        public Color[] directionColors;
        public float indicatorPulseSpeed = 2f;
        public float indicatorPulseAmount = 0.15f;

        [Header("Health")]
        public Image[] heartIcons;
        public Sprite fullHeartSprite;
        public Sprite emptyHeartSprite;
        public int maxHealth = 3;
        public int currentHealth = 3;

        [Header("Death Feedback")]
        public CanvasGroup deathVignette;
        public float deathFlashDuration = 0.8f;
        public AnimationCurve deathFlashCurve;

        [Header("Transition")]
        public CanvasGroup hudGroup;
        public float transitionDuration = 0.3f;

        private int _collectedCount;
        private Coroutine _pulseCoroutine;

        private void Start()
        {
            currentHealth = maxHealth;
            UpdateHealthDisplay();
            UpdateCollectibleDisplay();

            LightShadowPlatformer.Core.EventManager.Instance.OnLightDirectionChanged += OnLightDirectionChanged;
            LightShadowPlatformer.Core.EventManager.Instance.OnCollectibleCollected += OnCollectibleCollected;
            LightShadowPlatformer.Core.EventManager.Instance.OnCheckpointActivated += OnCheckpointActivated;
        }

        private void OnDestroy()
        {
            LightShadowPlatformer.Core.EventManager.Instance.OnLightDirectionChanged -= OnLightDirectionChanged;
            LightShadowPlatformer.Core.EventManager.Instance.OnCollectibleCollected -= OnCollectibleCollected;
            LightShadowPlatformer.Core.EventManager.Instance.OnCheckpointActivated -= OnCheckpointActivated;
        }

        private void Update()
        {
            AnimateLightIndicator();
        }

        public void Refresh()
        {
            UpdateHealthDisplay();
            UpdateCollectibleDisplay();
            CountTotalCollectibles();
            UpdateLightIndicator();
            currentHealth = maxHealth;
            UpdateHealthDisplay();
        }

        public void UpdateLevelDisplay(int levelNumber)
        {
            if (levelText != null)
                levelText.text = $"关卡 {levelNumber}";
        }

        private void OnLightDirectionChanged(LightShadowPlatformer.Core.LightManager.LightDirection direction)
        {
            UpdateLightIndicator();
            if (_pulseCoroutine != null) StopCoroutine(_pulseCoroutine);
            _pulseCoroutine = StartCoroutine(PulseIndicator());
        }

        private void UpdateLightIndicator()
        {
            if (LightShadowPlatformer.Core.LightManager.Instance == null) return;
            var dir = LightShadowPlatformer.Core.LightManager.Instance.currentDirection;
            int idx = (int)dir;

            if (lightDirectionIndicator != null && directionSprites != null && idx < directionSprites.Length)
            {
                lightDirectionIndicator.sprite = directionSprites[idx];
            }
            if (lightDirectionIndicator != null && directionColors != null && idx < directionColors.Length)
            {
                lightDirectionIndicator.color = directionColors[idx];
            }
            if (lightDirectionText != null)
            {
                string[] names = { "← 左光", "→ 右光", "↑ 上光", "↓ 下光" };
                lightDirectionText.text = names[idx];
            }
        }

        private void AnimateLightIndicator()
        {
            if (lightDirectionIndicator == null) return;
            float t = 1f + Mathf.Sin(Time.unscaledTime * indicatorPulseSpeed) * indicatorPulseAmount * 0.5f;
            lightDirectionIndicator.rectTransform.localScale = Vector3.one * t;
        }

        private IEnumerator PulseIndicator()
        {
            float elapsed = 0f;
            float duration = 0.4f;
            RectTransform rt = lightDirectionIndicator != null ? lightDirectionIndicator.rectTransform : null;
            Vector3 original = Vector3.one;
            if (rt != null) original = rt.localScale;

            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / duration;
                float punch = Mathf.Sin(t * Mathf.PI * 2) * 0.3f * (1f - t);
                if (rt != null) rt.localScale = original * (1f + punch);
                yield return null;
            }
            if (rt != null) rt.localScale = original;
        }

        private void OnCollectibleCollected(string id, int total)
        {
            _collectedCount = total;
            UpdateCollectibleDisplay();
            if (collectibleText != null)
            {
                StopAllCoroutines();
                StartCoroutine(PulseText(collectibleText));
            }
        }

        public void CountTotalCollectibles()
        {
            Collectible[] collectibles = FindObjectsOfType<Collectible>();
            totalCollectiblesInLevel = collectibles.Length;
            _collectedCount = 0;
            foreach (var c in collectibles)
            {
                if (c.collected) _collectedCount++;
            }
            UpdateCollectibleDisplay();
        }

        private void UpdateCollectibleDisplay()
        {
            if (collectibleText != null)
                collectibleText.text = $"{_collectedCount} / {totalCollectiblesInLevel}";
        }

        private IEnumerator PulseText(TMP_Text text)
        {
            float elapsed = 0f;
            float duration = 0.3f;
            Vector3 original = text.rectTransform.localScale;
            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / duration;
                float s = 1f + Mathf.Sin(t * Mathf.PI) * 0.3f;
                text.rectTransform.localScale = original * s;
                yield return null;
            }
            text.rectTransform.localScale = original;
        }

        private void OnCheckpointActivated(string id)
        {
            if (checkpointText != null)
            {
                checkpointText.text = "✓ 存档点已激活";
                StopAllCoroutines();
                StartCoroutine(ShowCheckpointFeedback());
            }
        }

        private IEnumerator ShowCheckpointFeedback()
        {
            if (checkpointText == null) yield break;

            float elapsed = 0f;
            float duration = 2.5f;
            CanvasGroup cg = checkpointText.GetComponent<CanvasGroup>();
            if (cg == null) cg = checkpointText.gameObject.AddComponent<CanvasGroup>();

            cg.alpha = 0f;
            while (elapsed < 0.5f)
            {
                elapsed += Time.unscaledDeltaTime;
                cg.alpha = elapsed / 0.5f;
                yield return null;
            }

            yield return new WaitForSecondsRealtime(1.5f);

            elapsed = 0f;
            while (elapsed < 0.5f)
            {
                elapsed += Time.unscaledDeltaTime;
                cg.alpha = 1f - elapsed / 0.5f;
                yield return null;
            }
            cg.alpha = 0f;
        }

        public void UpdateHealthDisplay()
        {
            if (heartIcons == null) return;
            for (int i = 0; i < heartIcons.Length; i++)
            {
                if (heartIcons[i] == null) continue;
                if (i < currentHealth)
                {
                    heartIcons[i].sprite = fullHeartSprite;
                    heartIcons[i].color = Color.white;
                }
                else
                {
                    heartIcons[i].sprite = emptyHeartSprite;
                    heartIcons[i].color = new Color(1, 1, 1, 0.4f);
                }
            }
        }

        public void TakeDamage(int amount = 1)
        {
            currentHealth = Mathf.Max(0, currentHealth - amount);
            UpdateHealthDisplay();
            StartCoroutine(DamageHeartFlash());
        }

        private IEnumerator DamageHeartFlash()
        {
            if (heartIcons == null || currentHealth < heartIcons.Length) yield break;
            int idx = Mathf.Max(0, currentHealth);
            if (idx < heartIcons.Length && heartIcons[idx] != null)
            {
                float elapsed = 0f;
                while (elapsed < 0.4f)
                {
                    elapsed += Time.unscaledDeltaTime;
                    heartIcons[idx].color = Color.Lerp(Color.red, Color.white, elapsed / 0.4f);
                    yield return null;
                }
                heartIcons[idx].color = Color.white;
            }
        }

        public void ShowDeathFeedback()
        {
            if (deathVignette != null)
            {
                StopAllCoroutines();
                StartCoroutine(DeathFlashRoutine());
            }
            TakeDamage(maxHealth);
        }

        private IEnumerator DeathFlashRoutine()
        {
            float elapsed = 0f;
            deathVignette.alpha = 0f;

            while (elapsed < deathFlashDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = deathFlashCurve != null ? deathFlashCurve.Evaluate(elapsed / deathFlashDuration)
                                                  : Mathf.Sin(elapsed / deathFlashDuration * Mathf.PI);
                deathVignette.alpha = t;
                yield return null;
            }
            deathVignette.alpha = 0f;
        }

        public void Show()
        {
            if (hudGroup == null)
            {
                gameObject.SetActive(true);
                return;
            }
            StopAllCoroutines();
            StartCoroutine(FadeGroup(0f, 1f));
        }

        public void Hide()
        {
            if (hudGroup == null)
            {
                gameObject.SetActive(false);
                return;
            }
            StopAllCoroutines();
            StartCoroutine(FadeGroup(1f, 0f));
        }

        private IEnumerator FadeGroup(float from, float to)
        {
            float elapsed = 0f;
            hudGroup.alpha = from;
            while (elapsed < transitionDuration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = elapsed / transitionDuration;
                hudGroup.alpha = Mathf.Lerp(from, to, t);
                yield return null;
            }
            hudGroup.alpha = to;
            gameObject.SetActive(to > 0.01f);
        }
    }
}
