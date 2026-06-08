using System.Collections;
using UnityEngine;

namespace LightShadowPlatformer.Camera
{
    public class CameraController : MonoBehaviour
    {
        public enum CameraMode { Follow, Fixed, LerpToPoint }

        [Header("Target")]
        public Transform target;
        public Player.PlayerController playerController;

        [Header("Follow Settings")]
        public CameraMode mode = CameraMode.Follow;
        public Vector2 offset = new Vector2(0f, 2f);
        public Vector2 lookAheadAmount = new Vector2(2f, 0.5f);
        public float followSmoothTimeX = 0.08f;
        public float followSmoothTimeY = 0.12f;
        public float maxLookAheadSpeed = 10f;

        [Header("Bounds")]
        public bool useBounds;
        public Vector2 minBounds;
        public Vector2 maxBounds;

        [Header("Shake")]
        public float defaultShakeDuration = 0.3f;
        public float defaultShakeIntensity = 0.15f;
        public float shakeDecay = 2f;

        [Header("Zoom")]
        public float targetOrthographicSize = 7f;
        public float zoomSmoothTime = 0.3f;
        public float runningZoomMultiplier = 1.08f;

        private Vector3 _velocity;
        private Vector3 _shakeOffset;
        private float _shakeIntensity;
        private float _shakeTimeRemaining;
        private Coroutine _shakeCoroutine;
        private CameraMode _previousMode;
        private Vector3 _lerpTargetPoint;
        private float _currentZoomVelocity;
        private UnityEngine.Camera _camera;

        private void Awake()
        {
            _camera = GetComponent<UnityEngine.Camera>();
            if (_camera != null)
                targetOrthographicSize = _camera.orthographicSize;
        }

        private void LateUpdate()
        {
            switch (mode)
            {
                case CameraMode.Follow:
                    FollowTarget();
                    break;
                case CameraMode.LerpToPoint:
                    LerpToPoint();
                    break;
                case CameraMode.Fixed:
                    break;
            }

            UpdateZoom();
            ApplyShake();
            ApplyBounds();
        }

        private void FollowTarget()
        {
            if (target == null) return;

            Vector3 targetPos = target.position + (Vector3)offset;

            if (playerController != null)
            {
                float speedX = Mathf.Abs(playerController.CurrentVelocity.x);
                float speedY = playerController.CurrentVelocity.y;
                float tX = Mathf.Clamp01(speedX / maxLookAheadSpeed);
                float tY = Mathf.Clamp01(Mathf.Abs(speedY) / maxLookAheadSpeed);

                int facing = playerController.Facing == Player.FacingDirection.Right ? 1 : -1;
                targetPos.x += lookAheadAmount.x * facing * tX;
                targetPos.y += lookAheadAmount.y * Mathf.Sign(speedY) * tY;
            }

            Vector3 current = transform.position - _shakeOffset;
            Vector3 smoothed = new Vector3(
                Mathf.SmoothDamp(current.x, targetPos.x, ref _velocity.x, followSmoothTimeX),
                Mathf.SmoothDamp(current.y, targetPos.y, ref _velocity.y, followSmoothTimeY),
                transform.position.z
            );
            transform.position = smoothed + _shakeOffset;
        }

        private void LerpToPoint()
        {
            Vector3 current = transform.position - _shakeOffset;
            Vector3 target = _lerpTargetPoint;
            target.z = current.z;
            transform.position = Vector3.SmoothDamp(current, target, ref _velocity, 0.5f) + _shakeOffset;
        }

        private void UpdateZoom()
        {
            if (_camera == null) return;

            float targetSize = targetOrthographicSize;

            if (mode == CameraMode.Follow && playerController != null)
            {
                float speedX = Mathf.Abs(playerController.CurrentVelocity.x);
                if (speedX > 4f)
                {
                    float t = Mathf.Clamp01((speedX - 4f) / 6f);
                    targetSize *= Mathf.Lerp(1f, runningZoomMultiplier, t);
                }
            }

            _camera.orthographicSize = Mathf.SmoothDamp(
                _camera.orthographicSize, targetSize, ref _currentZoomVelocity, zoomSmoothTime);
        }

        private void ApplyShake()
        {
            if (_shakeTimeRemaining > 0f)
            {
                _shakeTimeRemaining -= Time.unscaledDeltaTime;
                float decay = Mathf.Clamp01(_shakeTimeRemaining / defaultShakeDuration);
                _shakeOffset = new Vector3(
                    Random.Range(-1f, 1f) * _shakeIntensity * decay,
                    Random.Range(-1f, 1f) * _shakeIntensity * decay,
                    0f
                );
            }
            else
            {
                _shakeOffset = Vector3.zero;
            }
        }

        private void ApplyBounds()
        {
            if (!useBounds) return;
            Vector3 pos = transform.position;
            pos.x = Mathf.Clamp(pos.x, minBounds.x, maxBounds.x);
            pos.y = Mathf.Clamp(pos.y, minBounds.y, maxBounds.y);
            transform.position = pos;
        }

        public void Shake(float intensity = -1f, float duration = -1f)
        {
            float s = LightShadowPlatformer.Core.SettingsManager.Instance != null
                ? LightShadowPlatformer.Core.SettingsManager.Instance.CurrentSettings.cameraShakeIntensity
                : 1f;
            _shakeIntensity = (intensity < 0f ? defaultShakeIntensity : intensity) * s;
            _shakeTimeRemaining = duration < 0f ? defaultShakeDuration : duration;
        }

        public void SetTarget(Transform newTarget)
        {
            target = newTarget;
            if (newTarget != null)
            {
                playerController = newTarget.GetComponent<Player.PlayerController>();
            }
        }

        public void LerpTo(Vector3 point, float duration = 0f)
        {
            _previousMode = mode;
            mode = CameraMode.LerpToPoint;
            _lerpTargetPoint = point;
            if (duration > 0f)
            {
                StopAllCoroutines();
                StartCoroutine(ReturnToFollowAfterDelay(duration));
            }
        }

        public void SetMode(CameraMode newMode)
        {
            mode = newMode;
        }

        public void ReturnToFollow()
        {
            mode = CameraMode.Follow;
        }

        private IEnumerator ReturnToFollowAfterDelay(float delay)
        {
            yield return new WaitForSeconds(delay);
            mode = _previousMode;
        }

        public void SetZoom(float size, bool instant = false)
        {
            if (instant && _camera != null)
            {
                _camera.orthographicSize = size;
                targetOrthographicSize = size;
            }
            else
            {
                targetOrthographicSize = size;
            }
        }

        private void OnDrawGizmosSelected()
        {
            if (useBounds)
            {
                Gizmos.color = Color.yellow;
                Vector3 size = new Vector3(maxBounds.x - minBounds.x, maxBounds.y - minBounds.y, 1f);
                Vector3 center = new Vector3((minBounds.x + maxBounds.x) * 0.5f, (minBounds.y + maxBounds.y) * 0.5f, 0f);
                Gizmos.DrawWireCube(center, size);
            }
        }
    }
}
