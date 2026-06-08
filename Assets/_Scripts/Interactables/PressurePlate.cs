using System.Collections;
using UnityEngine;

namespace LightShadowPlatformer
{
    public class PressurePlate : MonoBehaviour
    {
        [Header("Plate Settings")]
        public string plateId = "plate_01";
        public float pressDepth = 0.15f;
        public float pressDuration = 0.1f;
        public bool needsPlayerOnly = true;
        public float pressWeight = 1f;

        [Header("References")]
        public SpriteRenderer plateRenderer;
        public SpriteRenderer baseRenderer;
        public Collider2D plateCollider;
        public InteractableSwitch linkedSwitch;
        public DoorController[] linkedDoors;

        [Header("Visual Settings")]
        public Color pressedColor = new Color(0.6f, 1f, 0.6f);
        public Color unpressedColor = Color.white;
        public Vector3 pressScale = new Vector3(1.05f, 0.9f, 1f);

        private bool _isPressed;
        private int _objectsOnPlate;
        private Vector3 _originalLocalPos;
        private Vector3 _originalScale;

        public bool IsPressed => _isPressed;

        private void Awake()
        {
            _originalLocalPos = transform.localPosition;
            _originalScale = transform.localScale;
            if (plateRenderer == null) plateRenderer = GetComponent<SpriteRenderer>();
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (needsPlayerOnly && !other.CompareTag("Player")) return;

            _objectsOnPlate++;
            if (_objectsOnPlate > 0 && !_isPressed)
            {
                SetPressed(true);
            }
        }

        private void OnTriggerExit2D(Collider2D other)
        {
            if (needsPlayerOnly && !other.CompareTag("Player")) return;

            _objectsOnPlate = Mathf.Max(0, _objectsOnPlate - 1);
            if (_objectsOnPlate == 0 && _isPressed)
            {
                SetPressed(false);
            }
        }

        private void SetPressed(bool pressed)
        {
            if (_isPressed == pressed) return;

            _isPressed = pressed;
            StopAllCoroutines();
            StartCoroutine(PressAnimation(pressed));

            if (linkedSwitch != null)
            {
                if (pressed) linkedSwitch.ActivateSwitch();
                else
                {
                    if (linkedSwitch.switchType == InteractableSwitch.SwitchType.Momentary ||
                        linkedSwitch.switchType == InteractableSwitch.SwitchType.PlayerNearby)
                    {
                        linkedSwitch.SetActive(false);
                    }
                }
            }

            foreach (var door in linkedDoors)
            {
                if (door != null) door.SetOpen(pressed);
            }

            LightShadowPlatformer.Core.EventManager.Instance.TriggerSwitchActivated(plateId, pressed);
            LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(
                pressed ? LightShadowPlatformer.Core.AudioManager.SfxType.PlateDown
                       : LightShadowPlatformer.Core.AudioManager.SfxType.PlateUp);
        }

        private IEnumerator PressAnimation(bool pressed)
        {
            float elapsed = 0f;
            Vector3 startPos = transform.localPosition;
            Vector3 endPos = pressed ? _originalLocalPos + Vector3.down * pressDepth : _originalLocalPos;
            Vector3 startScale = transform.localScale;
            Vector3 endScale = pressed ? Vector3.Scale(_originalScale, pressScale) : _originalScale;
            Color startColor = plateRenderer.color;
            Color endColor = pressed ? pressedColor : unpressedColor;

            while (elapsed < pressDuration)
            {
                elapsed += Time.deltaTime;
                float t = elapsed / pressDuration;
                transform.localPosition = Vector3.Lerp(startPos, endPos, t);
                transform.localScale = Vector3.Lerp(startScale, endScale, t);
                if (plateRenderer != null)
                    plateRenderer.color = Color.Lerp(startColor, endColor, t);
                yield return null;
            }

            transform.localPosition = endPos;
            transform.localScale = endScale;
            if (plateRenderer != null) plateRenderer.color = endColor;
        }
    }
}
