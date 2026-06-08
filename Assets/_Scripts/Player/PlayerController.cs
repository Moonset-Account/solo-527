using System.Collections;
using UnityEngine;

namespace LightShadowPlatformer.Player
{
    public enum PlayerState { Idle, Running, Jumping, Falling, Landing, Crouching, Dying, Spawning }
    public enum FacingDirection { Left, Right }

    public class PlayerController : MonoBehaviour
    {
        [Header("Movement Settings")]
        public float moveSpeed = 7f;
        public float acceleration = 25f;
        public float deceleration = 30f;
        public float airControl = 0.7f;
        public float maxFallSpeed = -18f;

        [Header("Jump Settings")]
        public float jumpForce = 14f;
        public float jumpCutMultiplier = 0.5f;
        public float coyoteTime = 0.1f;
        public float jumpBufferTime = 0.12f;
        public int maxJumpCount = 1;
        public float jumpPressDelay = 0.05f;

        [Header("Ground Check")]
        public Transform groundCheck;
        public float groundCheckRadius = 0.2f;
        public LayerMask groundLayer;
        public LayerMask platformLayer;

        [Header("Knockback")]
        public float knockbackForce = 8f;
        public float knockbackDuration = 0.2f;
        public float deathRespawnDelay = 1f;

        [Header("References")]
        public Rigidbody2D rb;
        public SpriteRenderer bodyRenderer;
        public Animator animator;
        public ParticleSystem dustParticles;
        public ParticleSystem landParticles;

        public PlayerState CurrentState { get; private set; } = PlayerState.Idle;
        public FacingDirection Facing { get; private set; } = FacingDirection.Right;
        public bool IsGrounded { get; private set; }
        public bool CanMove { get; set; } = true;
        public Vector2 CurrentVelocity => rb.velocity;

        private float _horizontalInput;
        private float _verticalInput;
        private bool _jumpInput;
        private bool _jumpHeld;
        private float _coyoteTimer;
        private float _jumpBufferTimer;
        private float _lastJumpPressTime;
        private int _jumpCount;
        private bool _isKnockedBack;
        private Coroutine _knockbackCoroutine;
        private bool _wasGrounded;

        private Vector2 _spawnPosition;

        private void Awake()
        {
            if (rb == null) rb = GetComponent<Rigidbody2D>();
            if (bodyRenderer == null) bodyRenderer = GetComponent<SpriteRenderer>();
        }

        private void Start()
        {
            _spawnPosition = transform.position;
            LightShadowPlatformer.Core.EventManager.Instance.OnLevelLoaded += OnLevelLoaded;
            LightShadowPlatformer.Core.EventManager.Instance.OnPlayerSpawn += Respawn;
        }

        private void OnDestroy()
        {
            LightShadowPlatformer.Core.EventManager.Instance.OnLevelLoaded -= OnLevelLoaded;
            LightShadowPlatformer.Core.EventManager.Instance.OnPlayerSpawn -= Respawn;
        }

        private void OnLevelLoaded(int levelIndex)
        {
            _spawnPosition = transform.position;
            CanMove = true;
            ChangeState(PlayerState.Spawning);
            Invoke(nameof(FinishSpawn), 0.5f);
        }

        private void FinishSpawn()
        {
            ChangeState(PlayerState.Idle);
            LightShadowPlatformer.Core.EventManager.Instance.TriggerPlayerSpawn();
        }

        public void SetSpawnPosition(Vector2 position)
        {
            _spawnPosition = position;
        }

        public Vector2 GetSpawnPosition()
        {
            return _spawnPosition;
        }

        private void Update()
        {
            if (!CanMove || CurrentState == PlayerState.Dying || CurrentState == PlayerState.Spawning)
            {
                _horizontalInput = 0;
                _verticalInput = 0;
                _jumpInput = false;
                _jumpHeld = false;
                return;
            }

            HandleInput();
            UpdateTimers();
            CheckGround();
            HandleJumpLogic();
            UpdateState();
        }

        private void FixedUpdate()
        {
            if (!CanMove || CurrentState == PlayerState.Dying || CurrentState == PlayerState.Spawning) return;

            HandleMovement();
            ApplyGravityClamp();
        }

        private void HandleInput()
        {
            _horizontalInput = Input.GetAxisRaw("Horizontal");
            _verticalInput = Input.GetAxisRaw("Vertical");
            _jumpInput = Input.GetButtonDown("Jump");
            _jumpHeld = Input.GetButton("Jump");

            if (_jumpInput)
                _lastJumpPressTime = Time.time;

            if (Input.GetButtonDown("SwitchLight"))
            {
                LightShadowPlatformer.Core.LightManager.Instance?.CycleLightDirection();
            }

            if (Input.GetButtonDown("Pause"))
            {
                LightShadowPlatformer.Core.GameManager.Instance?.TogglePause();
            }
        }

        private void UpdateTimers()
        {
            if (_coyoteTimer > 0) _coyoteTimer -= Time.deltaTime;
            if (_jumpBufferTimer > 0) _jumpBufferTimer -= Time.deltaTime;
        }

        private void CheckGround()
        {
            _wasGrounded = IsGrounded;
            IsGrounded = Physics2D.OverlapCircle(groundCheck.position, groundCheckRadius, groundLayer | platformLayer);

            if (IsGrounded)
            {
                _coyoteTimer = coyoteTime;
                _jumpCount = 0;
            }
        }

        private void HandleJumpLogic()
        {
            if (_jumpInput) _jumpBufferTimer = jumpBufferTime;

            if (_jumpBufferTimer > 0 && (_coyoteTimer > 0 || _jumpCount < maxJumpCount))
            {
                if (Time.time - _lastJumpPressTime < jumpPressDelay) return;

                PerformJump();
                _jumpBufferTimer = 0;
                _coyoteTimer = 0;
            }

            if (!_jumpHeld && rb.velocity.y > 0)
            {
                rb.velocity = new Vector2(rb.velocity.x, rb.velocity.y * jumpCutMultiplier);
            }
        }

        private void PerformJump()
        {
            _jumpCount++;
            float force = jumpForce;
            if (!_wasGrounded && _jumpCount > 1) force *= 0.9f;

            rb.velocity = new Vector2(rb.velocity.x, force);

            if (!_wasGrounded)
            {
                PlayDustParticles();
            }

            LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(LightShadowPlatformer.Core.AudioManager.SfxType.Jump);
        }

        private void HandleMovement()
        {
            if (_isKnockedBack) return;

            float targetSpeed = _horizontalInput * moveSpeed;
            float speedDiff = targetSpeed - rb.velocity.x;
            float accelRate = (Mathf.Abs(targetSpeed) > 0.01f) ? acceleration : deceleration;

            if (!IsGrounded) accelRate *= airControl;

            float movement = Mathf.Sign(speedDiff) * Mathf.Min(Mathf.Abs(speedDiff) * accelRate * Time.fixedDeltaTime, Mathf.Abs(speedDiff));
            rb.AddForce(movement * Vector2.right, ForceMode2D.Impulse);

            if (Mathf.Abs(_horizontalInput) > 0.01f)
            {
                SetFacing(_horizontalInput > 0 ? FacingDirection.Right : FacingDirection.Left);
            }
        }

        private void ApplyGravityClamp()
        {
            if (rb.velocity.y < maxFallSpeed)
            {
                rb.velocity = new Vector2(rb.velocity.x, maxFallSpeed);
            }
        }

        public void SetFacing(FacingDirection direction)
        {
            if (Facing == direction) return;
            Facing = direction;
            transform.localScale = new Vector3(direction == FacingDirection.Right ? 1 : -1, 1, 1);
        }

        private void UpdateState()
        {
            PlayerState newState;

            if (!IsGrounded)
            {
                newState = rb.velocity.y > 0.1f ? PlayerState.Jumping : PlayerState.Falling;
            }
            else
            {
                if (!_wasGrounded && rb.velocity.y <= 0)
                {
                    PlayLandParticles();
                    LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(LightShadowPlatformer.Core.AudioManager.SfxType.Land);
                    newState = PlayerState.Landing;
                    Invoke(nameof(ExitLanding), 0.15f);
                    return;
                }

                newState = Mathf.Abs(_horizontalInput) > 0.1f ? PlayerState.Running : PlayerState.Idle;
            }

            ChangeState(newState);
        }

        private void ExitLanding()
        {
            if (CurrentState == PlayerState.Landing)
                ChangeState(Mathf.Abs(_horizontalInput) > 0.1f ? PlayerState.Running : PlayerState.Idle);
        }

        private void ChangeState(PlayerState newState)
        {
            if (CurrentState == newState) return;
            CurrentState = newState;

            if (animator != null)
            {
                animator.SetInteger("State", (int)newState);
                animator.SetBool("IsGrounded", IsGrounded);
                animator.SetFloat("VelocityY", rb.velocity.y);
                animator.SetFloat("Speed", Mathf.Abs(rb.velocity.x));
            }
        }

        public void ApplyKnockback(Vector2 sourcePosition, float forceMultiplier = 1f)
        {
            if (_isKnockedBack || CurrentState == PlayerState.Dying) return;

            if (_knockbackCoroutine != null) StopCoroutine(_knockbackCoroutine);
            _knockbackCoroutine = StartCoroutine(KnockbackRoutine(sourcePosition, forceMultiplier));
        }

        private IEnumerator KnockbackRoutine(Vector2 sourcePosition, float forceMultiplier)
        {
            _isKnockedBack = true;
            Vector2 direction = ((Vector2)transform.position - sourcePosition).normalized;
            direction.y = Mathf.Abs(direction.y) * 0.5f + 0.5f;

            rb.velocity = direction * knockbackForce * forceMultiplier;

            yield return new WaitForSeconds(knockbackDuration);
            _isKnockedBack = false;
        }

        public void Die()
        {
            if (CurrentState == PlayerState.Dying) return;

            ChangeState(PlayerState.Dying);
            CanMove = false;
            rb.velocity = Vector2.zero;
            rb.gravityScale = 0;
            Collider2D col = GetComponent<Collider2D>();
            if (col != null) col.enabled = false;

            LightShadowPlatformer.Core.AudioManager.Instance?.PlaySfx(LightShadowPlatformer.Core.AudioManager.SfxType.PlayerDeath);
            LightShadowPlatformer.Core.EventManager.Instance.TriggerPlayerDeath();

            StartCoroutine(DeathRespawnRoutine());
        }

        private IEnumerator DeathRespawnRoutine()
        {
            yield return new WaitForSeconds(deathRespawnDelay);

            Respawn();
        }

        public void Respawn()
        {
            StopAllCoroutines();
            _isKnockedBack = false;
            rb.gravityScale = 3f;
            rb.velocity = Vector2.zero;
            Collider2D col = GetComponent<Collider2D>();
            if (col != null) col.enabled = true;

            string checkpointId = LightShadowPlatformer.Core.SaveManager.Instance?.GetActiveCheckpointId();
            Checkpoint cp = FindActiveCheckpoint(checkpointId);

            if (cp != null)
            {
                transform.position = cp.GetRespawnPosition();
            }
            else
            {
                transform.position = _spawnPosition;
            }

            CanMove = true;
            ChangeState(PlayerState.Spawning);
            Invoke(nameof(FinishSpawn), 0.5f);
        }

        private Checkpoint FindActiveCheckpoint(string id)
        {
            if (string.IsNullOrEmpty(id)) return null;
            Checkpoint[] checkpoints = FindObjectsOfType<Checkpoint>();
            foreach (var cp in checkpoints)
            {
                if (cp.checkpointId == id) return cp;
            }
            return null;
        }

        private void PlayDustParticles()
        {
            if (dustParticles != null)
            {
                dustParticles.transform.position = groundCheck.position;
                dustParticles.Play();
            }
        }

        private void PlayLandParticles()
        {
            if (landParticles != null)
            {
                landParticles.transform.position = groundCheck.position;
                landParticles.Play();
            }
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (other.CompareTag("Hazard"))
            {
                ApplyKnockback(other.transform.position, 1.5f);
                Invoke(nameof(Die), 0.3f);
            }
            else if (other.CompareTag("Goal"))
            {
                LevelGoal goal = other.GetComponent<LevelGoal>();
                goal?.OnPlayerReached();
            }
        }

        private void OnCollisionEnter2D(Collision2D collision)
        {
            if (collision.collider.CompareTag("Hazard"))
            {
                ApplyKnockback(collision.collider.transform.position, 1.5f);
                Invoke(nameof(Die), 0.3f);
            }
        }

        private void OnDrawGizmosSelected()
        {
            if (groundCheck == null) return;
            Gizmos.color = Color.green;
            Gizmos.DrawWireSphere(groundCheck.position, groundCheckRadius);
        }
    }
}
