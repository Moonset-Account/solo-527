using UnityEngine;

namespace LightShadowPlatformer.Player
{
    public class PlayerAnimator : MonoBehaviour
    {
        [Header("References")]
        public Animator animator;
        public PlayerController controller;
        public SpriteRenderer bodyRenderer;

        [Header("Squash & Stretch")]
        public float squashAmount = 0.2f;
        public float stretchAmount = 0.25f;
        public float animationSpeed = 8f;

        [Header("Effects")]
        public float flashDuration = 0.15f;
        public Color damageFlashColor = Color.red;
        public Color spawnFlashColor = Color.white;

        private Vector3 _originalScale;
        private Vector3 _targetScale;
        private Color _originalColor;
        private Coroutine _flashCoroutine;

        private PlayerState _lastState;

        private void Awake()
        {
            if (animator == null) animator = GetComponent<Animator>();
            if (controller == null) controller = GetComponentInParent<PlayerController>();
            if (bodyRenderer == null) bodyRenderer = GetComponent<SpriteRenderer>();

            _originalScale = transform.localScale;
            _originalColor = bodyRenderer != null ? bodyRenderer.color : Color.white;
            _targetScale = _originalScale;
        }

        private void LateUpdate()
        {
            UpdateAnimatorParameters();
            UpdateSquashAndStretch();

            if (controller.CurrentState != _lastState)
            {
                OnStateChanged(controller.CurrentState);
                _lastState = controller.CurrentState;
            }
        }

        private void UpdateAnimatorParameters()
        {
            if (animator == null || controller == null) return;

            Vector2 velocity = controller.CurrentVelocity;
            animator.SetFloat("VelocityX", Mathf.Abs(velocity.x));
            animator.SetFloat("VelocityY", velocity.y);
            animator.SetBool("IsGrounded", controller.IsGrounded);
            animator.SetInteger("PlayerState", (int)controller.CurrentState);
        }

        private void UpdateSquashAndStretch()
        {
            if (controller == null) return;

            float yVelocity = controller.CurrentVelocity.y;
            float speedX = Mathf.Abs(controller.CurrentVelocity.x);

            float verticalScale = 1f;
            float horizontalScale = 1f;

            if (!controller.IsGrounded)
            {
                if (yVelocity > 1f)
                {
                    verticalScale = 1f + stretchAmount * Mathf.Clamp01(yVelocity / 10f);
                    horizontalScale = 1f - stretchAmount * 0.6f * Mathf.Clamp01(yVelocity / 10f);
                }
                else if (yVelocity < -2f)
                {
                    verticalScale = 1f - stretchAmount * 0.6f * Mathf.Clamp01(Mathf.Abs(yVelocity) / 15f);
                    horizontalScale = 1f + stretchAmount * 0.4f * Mathf.Clamp01(Mathf.Abs(yVelocity) / 15f);
                }
            }
            else if (speedX > 0.5f)
            {
                float bobOffset = Mathf.Sin(Time.time * animationSpeed) * squashAmount * 0.2f;
                verticalScale = 1f + bobOffset;
                horizontalScale = 1f - bobOffset;
            }

            _targetScale = new Vector3(
                _originalScale.x * horizontalScale * (controller.Facing == FacingDirection.Left ? -1 : 1),
                _originalScale.y * verticalScale,
                _originalScale.z
            );

            transform.localScale = Vector3.Lerp(transform.localScale, _targetScale, Time.deltaTime * 15f);
        }

        private void OnStateChanged(PlayerState newState)
        {
            switch (newState)
            {
                case PlayerState.Jumping:
                    ApplySquash(1f - squashAmount * 0.5f, 1f + squashAmount);
                    break;
                case PlayerState.Landing:
                    ApplySquash(1f + squashAmount * 0.8f, 1f - squashAmount * 0.8f);
                    break;
                case PlayerState.Spawning:
                    Flash(spawnFlashColor, flashDuration * 2f);
                    break;
                case PlayerState.Dying:
                    Flash(damageFlashColor, flashDuration * 3f);
                    break;
            }
        }

        private void ApplySquash(float xScale, float yScale)
        {
            float facing = controller.Facing == FacingDirection.Left ? -1 : 1;
            _targetScale = new Vector3(_originalScale.x * xScale * facing, _originalScale.y * yScale, _originalScale.z);
            transform.localScale = _targetScale;
        }

        public void Flash(Color color, float duration)
        {
            if (bodyRenderer == null) return;
            if (_flashCoroutine != null) StopCoroutine(_flashCoroutine);
            StartCoroutine(FlashRoutine(color, duration));
        }

        private System.Collections.IEnumerator FlashRoutine(Color color, float duration)
        {
            float elapsed = 0f;
            bodyRenderer.color = color;

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.PingPong(elapsed / duration * 4f, 1f);
                bodyRenderer.color = Color.Lerp(_originalColor, color, t);
                yield return null;
            }

            bodyRenderer.color = _originalColor;
        }
    }
}
