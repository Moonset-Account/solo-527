using System.Collections;
using UnityEngine;

namespace LightShadowPlatformer
{
    public class InteractableSwitch : MonoBehaviour
    {
        public enum SwitchType { Toggle, Momentary, PlayerNearby }

        [Header("Switch Settings")]
        public string switchId = "switch_01";
        public SwitchType switchType = SwitchType.Toggle;
        public bool startsActive;
        public bool isActive;
        public float momentaryDuration = 0.5f;

        [Header("References")]
        public SpriteRenderer switchRenderer;
        public SpriteRenderer indicatorRenderer;
        public Sprite onSprite;
        public Sprite offSprite;
        public Sprite onIndicatorSprite;
        public Sprite offIndicatorSprite;

        [Header("Visual Settings")]
        public Color activeColor = Color.green;
        public Color inactiveColor = Color.red;
        public float switchAnimationDuration = 0.15f;
        public float pressScale = 0.9f;

        [Header("Linked Targets")]
        public DoorController[] linkedDoors;
        public string[] linkedDoorIds;

        private bool _playerInRange;
        private Coroutine _momentaryCoroutine;
        private Vector3 _originalScale;

        private void Awake()
        {
            _originalScale = transform.localScale;
            if (switchRenderer == null) switchRenderer = GetComponent<SpriteRenderer>();
        }

        private void Start()
        {
            if (LightShadowPlatformer.Core.SaveManager.Instance != null &&
                LightShadowPlatformer.Core.SaveManager.Instance.IsSwitchActivated(switchId))
            {
                isActive = true;
            }
            else
            {
                isActive = startsActive;
            }
            UpdateVisuals(false);
            NotifyLinkedDoors(false);
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (other.CompareTag("Player"))
            {
                _playerInRange = true;

                if (switchType == SwitchType.PlayerNearby)
                {
                    SetActive(true);
                }
            }
        }

        private void OnTriggerExit2D(Collider2D other)
        {
            if (other.CompareTag("Player"))
            {
                _playerInRange = false;

                if (switchType == SwitchType.PlayerNearby)
                {
                    SetActive(false);
                }
            }
        }

        private void Update()
        {
            if (switchType == SwitchType.PlayerNearby) return;

            if (_playerInRange && Input.GetButtonDown("Interact"))
            {
                ActivateSwitch();
            }
        }

        public void ActivateSwitch()
        {
            LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(
                LightShadowPlatformer.Core.AudioManager.SfxType.Switch);

            if (switchType == SwitchType.Toggle)
            {
                SetActive(!isActive);
            }
            else if (switchType == SwitchType.Momentary)
            {
                if (_momentaryCoroutine != null) StopCoroutine(_momentaryCoroutine);
                SetActive(true);
                _momentaryCoroutine = StartCoroutine(MomentaryRoutine());
            }
            else if (switchType == SwitchType.PlayerNearby)
            {
                SetActive(true);
            }
        }

        public void SetActive(bool active)
        {
            if (isActive == active) return;

            isActive = active;

            if (switchType == SwitchType.Toggle)
            {
                LightShadowPlatformer.Core.SaveManager.Instance?.SaveSwitchState(switchId, isActive);
            }

            LightShadowPlatformer.Core.EventManager.Instance.TriggerSwitchActivated(switchId, isActive);
            UpdateVisuals(true);
            NotifyLinkedDoors(true);
        }

        private IEnumerator MomentaryRoutine()
        {
            yield return new WaitForSeconds(momentaryDuration);
            SetActive(false);
        }

        private void UpdateVisuals(bool animate)
        {
            if (switchRenderer != null)
            {
                if (isActive && onSprite != null) switchRenderer.sprite = onSprite;
                else if (!isActive && offSprite != null) switchRenderer.sprite = offSprite;
                switchRenderer.color = isActive ? activeColor : inactiveColor;
            }

            if (indicatorRenderer != null)
            {
                if (isActive && onIndicatorSprite != null) indicatorRenderer.sprite = onIndicatorSprite;
                else if (!isActive && offIndicatorSprite != null) indicatorRenderer.sprite = offIndicatorSprite;
                indicatorRenderer.color = isActive ? activeColor : inactiveColor;
            }

            if (animate)
            {
                StopAllCoroutines();
                StartCoroutine(SwitchAnimation());
            }
        }

        private IEnumerator SwitchAnimation()
        {
            Vector3 target = _originalScale * pressScale;
            float elapsed = 0f;

            while (elapsed < switchAnimationDuration * 0.5f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / (switchAnimationDuration * 0.5f);
                transform.localScale = Vector3.Lerp(_originalScale, target, t);
                yield return null;
            }

            elapsed = 0f;
            while (elapsed < switchAnimationDuration * 0.5f)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / (switchAnimationDuration * 0.5f);
                transform.localScale = Vector3.Lerp(target, _originalScale, t);
                yield return null;
            }

            transform.localScale = _originalScale;
        }

        private void NotifyLinkedDoors(bool playSound)
        {
            foreach (var door in linkedDoors)
            {
                if (door != null)
                {
                    door.SetOpen(isActive, playSound);
                }
            }

            if (linkedDoorIds != null && linkedDoorIds.Length > 0)
            {
                DoorController[] allDoors = FindObjectsOfType<DoorController>();
                foreach (var door in allDoors)
                {
                    foreach (string id in linkedDoorIds)
                    {
                        if (door.doorId == id)
                        {
                            door.SetOpen(isActive, playSound);
                        }
                    }
                }
            }
        }
    }
}
