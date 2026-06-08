using UnityEngine;
using ShadowPlatformer.Player;

namespace ShadowPlatformer.Core
{
    public class CameraController : MonoBehaviour
    {
        public Transform target;
        public float followSpeed = 5f;
        public Vector2 offset = new Vector2(2f, 1.5f);
        public bool lookAhead = true;
        public float lookAheadDistance = 2f;
        public float lookAheadSpeed = 3f;

        private float _lookAheadX;
        private float _prevTargetX;

        private void LateUpdate()
        {
            if (target == null)
            {
                var player = FindObjectOfType<PlayerController>();
                if (player != null) target = player.transform;
                return;
            }

            float directionX = target.localScale.x > 0 ? 1f : -1f;

            if (lookAhead)
            {
                float currentX = target.position.x;
                float delta = currentX - _prevTargetX;
                if (Mathf.Abs(delta) > 0.01f)
                    _lookAheadX = Mathf.MoveTowards(_lookAheadX, lookAheadDistance * directionX, lookAheadSpeed * Time.deltaTime);
                else
                    _lookAheadX = Mathf.MoveTowards(_lookAheadX, 0f, lookAheadSpeed * Time.deltaTime);
                _prevTargetX = currentX;
            }

            Vector3 targetPos = new Vector3(
                target.position.x + offset.x * directionX + _lookAheadX,
                target.position.y + offset.y,
                transform.position.z
            );

            transform.position = Vector3.Lerp(transform.position, targetPos, followSpeed * Time.deltaTime);
        }
    }
}
