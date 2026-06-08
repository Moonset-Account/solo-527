using System.Collections;
using UnityEngine;

namespace LightShadowPlatformer
{
    public class DoorController : MonoBehaviour
    {
        public enum DoorType { VerticalSlide, HorizontalSlide, Swing, Disappear }

        [Header("Door Settings")]
        public string doorId = "door_01";
        public DoorType doorType = DoorType.VerticalSlide;
        public bool startsOpen;
        public bool isOpen;
        public float moveDistance = 3f;
        public float openDuration = 0.6f;
        public AnimationCurve openEaseCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);

        [Header("References")]
        public SpriteRenderer doorRenderer;
        public Collider2D doorCollider;
        public ParticleSystem openParticles;
        public ParticleSystem closeParticles;

        [Header("Visual Settings")]
        public Color openColor = new Color(0.5f, 1f, 0.5f, 0.3f);
        public Color closedColor = Color.white;

        private Vector3 _closedPosition;
        private Vector3 _openPosition;
        private Coroutine _moveCoroutine;
        private Quaternion _closedRotation;
        private Quaternion _openRotation;

        private void Awake()
        {
            _closedPosition = transform.position;

            switch (doorType)
            {
                case DoorType.VerticalSlide:
                    _openPosition = _closedPosition + Vector3.up * moveDistance;
                    break;
                case DoorType.HorizontalSlide:
                    _openPosition = _closedPosition + Vector3.right * moveDistance;
                    break;
                case DoorType.Swing:
                    _closedRotation = transform.rotation;
                    _openRotation = Quaternion.Euler(0, 0, -90f) * _closedRotation;
                    break;
                case DoorType.Disappear:
                    _openPosition = _closedPosition;
                    break;
            }
        }

        private void Start()
        {
            isOpen = startsOpen;
            if (isOpen)
            {
                ApplyOpenStateImmediate();
            }
            else
            {
                ApplyClosedStateImmediate();
            }
        }

        public void SetOpen(bool open, bool playSound = true)
        {
            if (isOpen == open) return;

            isOpen = open;

            if (_moveCoroutine != null) StopCoroutine(_moveCoroutine);
            _moveCoroutine = StartCoroutine(MoveRoutine(open, playSound));

            LightShadowPlatformer.Core.EventManager.Instance.TriggerDoorStateChanged(doorId, isOpen);

            if (playSound)
            {
                LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(
                    open ? LightShadowPlatformer.Core.AudioManager.SfxType.DoorOpen
                         : LightShadowPlatformer.Core.AudioManager.SfxType.DoorClose);
            }
        }

        public void Toggle(bool playSound = true)
        {
            SetOpen(!isOpen, playSound);
        }

        private IEnumerator MoveRoutine(bool open, bool playSound)
        {
            float elapsed = 0f;
            Vector3 startPos = transform.position;
            Vector3 endPos = open ? _openPosition : _closedPosition;
            Quaternion startRot = transform.rotation;
            Quaternion endRot = open ? _openRotation : _closedRotation;

            if (open && openParticles != null) openParticles.Play();
            if (!open && closeParticles != null) closeParticles.Play();

            if (doorCollider != null && doorType != DoorType.Swing)
            {
                doorCollider.enabled = !open;
            }

            while (elapsed < openDuration)
            {
                elapsed += Time.deltaTime;
                float t = openEaseCurve.Evaluate(Mathf.Clamp01(elapsed / openDuration));

                if (doorType == DoorType.Swing)
                {
                    transform.rotation = Quaternion.Lerp(startRot, endRot, t);
                }
                else if (doorType == DoorType.Disappear)
                {
                    if (doorRenderer != null)
                    {
                        Color c = doorRenderer.color;
                        c.a = Mathf.Lerp(1f, 0f, t);
                        doorRenderer.color = c;
                    }
                }
                else
                {
                    transform.position = Vector3.Lerp(startPos, endPos, t);
                }

                if (doorRenderer != null && doorType != DoorType.Disappear)
                {
                    doorRenderer.color = Color.Lerp(closedColor, openColor, t);
                }

                yield return null;
            }

            if (open) ApplyOpenStateImmediate();
            else ApplyClosedStateImmediate();
        }

        private void ApplyOpenStateImmediate()
        {
            switch (doorType)
            {
                case DoorType.VerticalSlide:
                case DoorType.HorizontalSlide:
                    transform.position = _openPosition;
                    break;
                case DoorType.Swing:
                    transform.rotation = _openRotation;
                    break;
                case DoorType.Disappear:
                    if (doorRenderer != null)
                    {
                        Color c = doorRenderer.color;
                        c.a = 0f;
                        doorRenderer.color = c;
                    }
                    break;
            }

            if (doorCollider != null) doorCollider.enabled = false;
            if (doorRenderer != null) doorRenderer.color = openColor;
        }

        private void ApplyClosedStateImmediate()
        {
            transform.position = _closedPosition;
            transform.rotation = _closedRotation;

            if (doorCollider != null) doorCollider.enabled = true;
            if (doorRenderer != null)
            {
                Color c = closedColor;
                c.a = 1f;
                doorRenderer.color = c;
            }
        }
    }
}
