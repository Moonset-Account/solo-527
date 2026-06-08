using UnityEngine;
using ShadowPlatformer.Core;
using ShadowPlatformer.Light;

namespace ShadowPlatformer.Player
{
    [RequireComponent(typeof(Rigidbody2D), typeof(Collider2D), typeof(PlayerInput))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement")]
        public float moveSpeed = 6f;
        public float acceleration = 40f;
        public float deceleration = 60f;

        [Header("Jump")]
        public float jumpForce = 12f;
        public float fallMultiplier = 2.5f;
        public float lowJumpMultiplier = 2f;
        public float coyoteTime = 0.12f;
        public float jumpBufferTime = 0.1f;

        [Header("Ground Check")]
        public Transform groundCheckPoint;
        public Vector2 groundCheckSize = new Vector2(0.6f, 0.05f);
        public LayerMask groundLayer;

        private Rigidbody2D _rb;
        private PlayerInput _input;
        private Animator _anim;
        private float _coyoteTimer;
        private float _jumpBufferTimer;
        private bool _isGrounded;
        private bool _isFacingRight = true;
        private Vector2 _spawnPosition;
        private bool _isDead;

        public bool IsGrounded => _isGrounded;
        public bool IsDead => _isDead;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _input = GetComponent<PlayerInput>();
            _anim = GetComponent<Animator>();
            _spawnPosition = transform.position;
        }

        private void OnEnable()
        {
            _input.OnJumpPressed += HandleJump;
            _input.OnLightSwitchPressed += HandleLightSwitch;
            _input.OnPausePressed += HandlePause;
        }

        private void OnDisable()
        {
            _input.OnJumpPressed -= HandleJump;
            _input.OnLightSwitchPressed -= HandleLightSwitch;
            _input.OnPausePressed -= HandlePause;
        }

        private void Update()
        {
            if (_isDead) return;

            CheckGround();
            UpdateTimers();
            UpdateFacing();
            UpdateAnimator();
        }

        private void FixedUpdate()
        {
            if (_isDead) return;
            HandleMovement();
            ApplyGravityModifier();
        }

        private void CheckGround()
        {
            _isGrounded = Physics2D.OverlapBox(
                groundCheckPoint.position,
                groundCheckSize,
                0f,
                groundLayer
            );
        }

        private void UpdateTimers()
        {
            if (_isGrounded)
                _coyoteTimer = coyoteTime;
            else
                _coyoteTimer -= Time.deltaTime;

            _jumpBufferTimer -= Time.deltaTime;
        }

        private void HandleMovement()
        {
            float targetVelX = _input.MoveInput.x * moveSpeed;
            float currentVelX = _rb.velocity.x;

            float accel = Mathf.Abs(targetVelX) > 0.01f ? acceleration : deceleration;
            float newVelX = Mathf.MoveTowards(currentVelX, targetVelX, accel * Time.fixedDeltaTime);

            _rb.velocity = new Vector2(newVelX, _rb.velocity.y);
        }

        private void HandleJump()
        {
            if (_isDead) return;
            _jumpBufferTimer = jumpBufferTime;

            if (_coyoteTimer > 0f)
            {
                _rb.velocity = new Vector2(_rb.velocity.x, jumpForce);
                _coyoteTimer = 0f;
                _jumpBufferTimer = 0f;
            }
        }

        private void ApplyGravityModifier()
        {
            if (_rb.velocity.y < 0f)
            {
                _rb.velocity += Vector2.up * Physics2D.gravity.y * (fallMultiplier - 1f) * Time.fixedDeltaTime;
            }
            else if (_rb.velocity.y > 0f && !_input.JumpHeld)
            {
                _rb.velocity += Vector2.up * Physics2D.gravity.y * (lowJumpMultiplier - 1f) * Time.fixedDeltaTime;
            }
        }

        private void HandleLightSwitch()
        {
            if (_isDead) return;
            if (LightManager.Instance != null)
            {
                LightManager.Instance.CycleDirection();
                EventBus.Instance.RaiseLightSwitched();
            }
        }

        private void HandlePause()
        {
            GameManager.Instance.TogglePause();
            EventBus.Instance.RaisePauseToggled();
        }

        private void UpdateFacing()
        {
            float x = _input.MoveInput.x;
            if (x > 0.01f && !_isFacingRight) Flip();
            else if (x < -0.01f && _isFacingRight) Flip();
        }

        private void Flip()
        {
            _isFacingRight = !_isFacingRight;
            Vector3 s = transform.localScale;
            s.x *= -1;
            transform.localScale = s;
        }

        private void UpdateAnimator()
        {
            if (_anim == null) return;
            _anim.SetBool("Grounded", _isGrounded);
            _anim.SetFloat("SpeedX", Mathf.Abs(_rb.velocity.x));
            _anim.SetFloat("VelocityY", _rb.velocity.y);
        }

        public void Die()
        {
            if (_isDead) return;
            _isDead = true;
            _rb.velocity = Vector2.zero;
            _rb.isKinematic = true;
            if (_anim != null) _anim.SetTrigger("Die");
            EventBus.Instance.RaisePlayerDeath();
        }

        public void Respawn()
        {
            _isDead = false;
            _rb.isKinematic = false;
            transform.position = _spawnPosition;
            _rb.velocity = Vector2.zero;
            if (_anim != null) _anim.SetTrigger("Respawn");
            EventBus.Instance.RaisePlayerRespawn();
        }

        public void SetSpawnPoint(Vector2 pos)
        {
            _spawnPosition = pos;
        }

        private void OnDrawGizmosSelected()
        {
            if (groundCheckPoint != null)
            {
                Gizmos.color = Color.green;
                Gizmos.DrawWireCube(groundCheckPoint.position, groundCheckSize);
            }
        }
    }
}
