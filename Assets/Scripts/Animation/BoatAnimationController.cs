using UnityEngine;
using System;
using System.Collections;

namespace LakeNavigation
{
    public class BoatAnimationController : MonoBehaviour
    {
        public SpriteRenderer boatRenderer;
        public GameObject wakeEffect;
        public GameObject damageEffect;
        public GameObject anchorEffect;

        private BoatState currentState = BoatState.Idle;
        private Transform _boatTransform;
        private Color _originalColor;
        private Coroutine _sinkingCoroutine;
        private Coroutine _damageFlashCoroutine;
        private Coroutine _stormShakeCoroutine;

        public void Initialize(Transform boatTransform)
        {
            _boatTransform = boatTransform;

            GameObject boatBody = new GameObject("BoatBody");
            boatBody.transform.SetParent(_boatTransform);
            boatBody.transform.localPosition = Vector3.zero;
            boatRenderer = boatBody.AddComponent<SpriteRenderer>();
            boatRenderer.color = GameConstants.Colors.BoatColor;
            boatRenderer.sortingLayerName = GameConstants.SortingLayers.Boat;
            _originalColor = boatRenderer.color;

            wakeEffect = new GameObject("WakeEffect");
            wakeEffect.transform.SetParent(_boatTransform);
            wakeEffect.transform.localPosition = new Vector3(0f, -0.4f, 0f);
            SpriteRenderer wakeRenderer = wakeEffect.AddComponent<SpriteRenderer>();
            wakeRenderer.color = Color.white;
            wakeRenderer.sortingLayerName = GameConstants.SortingLayers.Effects;
            wakeEffect.SetActive(false);

            damageEffect = new GameObject("DamageEffect");
            damageEffect.transform.SetParent(_boatTransform);
            damageEffect.transform.localPosition = Vector3.zero;
            SpriteRenderer damageRenderer = damageEffect.AddComponent<SpriteRenderer>();
            damageRenderer.color = new Color(1f, 0f, 0f, 0.5f);
            damageRenderer.sortingLayerName = GameConstants.SortingLayers.Effects;
            damageEffect.SetActive(false);

            anchorEffect = new GameObject("AnchorEffect");
            anchorEffect.transform.SetParent(_boatTransform);
            anchorEffect.transform.localPosition = new Vector3(0f, -0.3f, 0f);
            SpriteRenderer anchorRenderer = anchorEffect.AddComponent<SpriteRenderer>();
            anchorRenderer.color = Color.gray;
            anchorRenderer.sortingLayerName = GameConstants.SortingLayers.Effects;
            anchorEffect.SetActive(false);

            BoatController boatController = _boatTransform.GetComponent<BoatController>();
            if (boatController != null)
            {
                boatController.OnBoatStateChanged += UpdateState;
            }

            if (WeatherSystem.Instance != null)
            {
                WeatherSystem.Instance.OnWeatherChanged += OnWeatherChanged;
            }
        }

        private void OnDestroy()
        {
            if (_boatTransform != null)
            {
                BoatController boatController = _boatTransform.GetComponent<BoatController>();
                if (boatController != null)
                {
                    boatController.OnBoatStateChanged -= UpdateState;
                }
            }

            if (WeatherSystem.Instance != null)
            {
                WeatherSystem.Instance.OnWeatherChanged -= OnWeatherChanged;
            }
        }

        public void UpdateState(BoatState state)
        {
            currentState = state;

            if (_sinkingCoroutine != null)
            {
                StopCoroutine(_sinkingCoroutine);
                _sinkingCoroutine = null;
            }

            switch (state)
            {
                case BoatState.Idle:
                    wakeEffect.SetActive(false);
                    anchorEffect.SetActive(false);
                    damageEffect.SetActive(false);
                    break;
                case BoatState.Moving:
                    wakeEffect.SetActive(true);
                    anchorEffect.SetActive(false);
                    damageEffect.SetActive(false);
                    break;
                case BoatState.Anchored:
                    wakeEffect.SetActive(false);
                    anchorEffect.SetActive(true);
                    damageEffect.SetActive(false);
                    break;
                case BoatState.Damaged:
                    wakeEffect.SetActive(false);
                    anchorEffect.SetActive(false);
                    damageEffect.SetActive(true);
                    PlayDamageFlash();
                    break;
                case BoatState.Sinking:
                    wakeEffect.SetActive(false);
                    anchorEffect.SetActive(false);
                    damageEffect.SetActive(false);
                    _sinkingCoroutine = StartCoroutine(SinkingSequence());
                    break;
            }
        }

        public void SetFacingDirection(Vector2 direction)
        {
            if (direction.sqrMagnitude > 0.001f && _boatTransform != null)
            {
                _boatTransform.up = direction;
            }
        }

        public void PlayDamageFlash()
        {
            if (_damageFlashCoroutine != null)
            {
                StopCoroutine(_damageFlashCoroutine);
            }
            _damageFlashCoroutine = StartCoroutine(DamageFlashSequence());
        }

        private IEnumerator DamageFlashSequence()
        {
            damageEffect.SetActive(true);
            for (int i = 0; i < 3; i++)
            {
                damageEffect.SetActive(true);
                yield return new WaitForSeconds(0.15f);
                damageEffect.SetActive(false);
                yield return new WaitForSeconds(0.15f);
            }
            damageEffect.SetActive(false);
            _damageFlashCoroutine = null;
        }

        private IEnumerator SinkingSequence()
        {
            float duration = 2f;
            float elapsed = 0f;
            Quaternion startRotation = _boatTransform.rotation;
            Quaternion targetRotation = Quaternion.Euler(0f, 0f, 45f);

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / duration;
                _boatTransform.rotation = Quaternion.Slerp(startRotation, targetRotation, t);

                if (boatRenderer != null)
                {
                    Color c = _originalColor;
                    c.a = Mathf.Lerp(1f, 0f, t);
                    boatRenderer.color = c;
                }

                yield return null;
            }

            _boatTransform.rotation = targetRotation;
            if (boatRenderer != null)
            {
                Color c = _originalColor;
                c.a = 0f;
                boatRenderer.color = c;
            }

            _sinkingCoroutine = null;
        }

        public void PlayWeatherEffect(WeatherType weather)
        {
            if (_stormShakeCoroutine != null)
            {
                StopCoroutine(_stormShakeCoroutine);
                _stormShakeCoroutine = null;
            }

            if (boatRenderer == null) return;

            switch (weather)
            {
                case WeatherType.Foggy:
                    Color foggyColor = _originalColor;
                    foggyColor.a = 0.6f;
                    boatRenderer.color = foggyColor;
                    break;
                case WeatherType.Rainy:
                    Color rainyColor = _originalColor;
                    rainyColor.b = Mathf.Min(rainyColor.b + 0.15f, 1f);
                    boatRenderer.color = rainyColor;
                    break;
                case WeatherType.Stormy:
                    boatRenderer.color = _originalColor;
                    _stormShakeCoroutine = StartCoroutine(StormShake());
                    break;
                case WeatherType.Clear:
                case WeatherType.Cloudy:
                default:
                    boatRenderer.color = _originalColor;
                    break;
            }
        }

        private IEnumerator StormShake()
        {
            Vector3 originalPos = _boatTransform.localPosition;
            while (true)
            {
                float offsetX = UnityEngine.Random.Range(-0.05f, 0.05f);
                float offsetY = UnityEngine.Random.Range(-0.05f, 0.05f);
                _boatTransform.localPosition = originalPos + new Vector3(offsetX, offsetY, 0f);
                yield return new WaitForSeconds(0.1f);
            }
        }

        private void OnWeatherChanged(WeatherType previousWeather, WeatherType newWeather)
        {
            PlayWeatherEffect(newWeather);
        }
    }
}
