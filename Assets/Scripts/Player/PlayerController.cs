using System;
using System.Collections;
using BeatRunner.Core;
using BeatRunner.Input;
using UnityEngine;

namespace BeatRunner.Player
{
    public enum PlayerState
    {
        Idle,
        Running,
        Jumping,
        Sliding,
        Dead
    }

    public class PlayerController : MonoBehaviour
    {
        [SerializeField] private Rigidbody _rb;
        [SerializeField] private CapsuleCollider _collider;
        [SerializeField] private Transform _visualRoot;

        [Header("Movement")]
        [SerializeField] private int _currentTrackIndex = 1;
        public int CurrentTrackIndex => _currentTrackIndex;

        [Header("State")]
        [SerializeField] private PlayerState _state = PlayerState.Running;
        public PlayerState State => _state;

        public bool IsGrounded { get; private set; } = true;
        public bool IsJumping => _state == PlayerState.Jumping;
        public bool IsSliding => _state == PlayerState.Sliding;

        private GameSettings _settings;

        private Vector3 _targetPosition;
        private float _jumpStartY;
        private float _jumpElapsed;
        private float _slideElapsed;
        private float _originalColliderHeight;
        private Vector3 _originalColliderCenter;
        private Coroutine _jumpCoroutine;
        private Coroutine _slideCoroutine;

        public event Action<int> OnTrackChanged;
        public event Action<PlayerState> OnStateChanged;
        public event Action OnDeath;

        private void Awake()
        {
            if (_collider != null)
            {
                _originalColliderHeight = _collider.height;
                _originalColliderCenter = _collider.center;
            }
        }

        private void Start()
        {
            ServiceLocator.TryGet(out _settings);

            if (InputManager.Instance != null)
            {
                InputManager.Instance.OnLeft += HandleLeft;
                InputManager.Instance.OnRight += HandleRight;
                InputManager.Instance.OnJump += HandleJump;
                InputManager.Instance.OnSlide += HandleSlide;
            }

            float centerX = 0f;
            if (_settings != null)
            {
                centerX = GetTrackX(_currentTrackIndex);
            }
            var pos = transform.position;
            pos.x = centerX;
            transform.position = pos;
            _targetPosition = pos;
        }

        private void OnDestroy()
        {
            if (InputManager.Instance != null)
            {
                InputManager.Instance.OnLeft -= HandleLeft;
                InputManager.Instance.OnRight -= HandleRight;
                InputManager.Instance.OnJump -= HandleJump;
                InputManager.Instance.OnSlide -= HandleSlide;
            }
        }

        private void Update()
        {
            UpdateTrackMovement();
            UpdateForwardMovement();
        }

        private void FixedUpdate()
        {
            ApplyGroundCheck();
        }

        private float GetTrackX(int trackIndex)
        {
            if (_settings == null) return 0f;
            int mid = _settings.trackCount / 2;
            return (trackIndex - mid) * _settings.trackWidth;
        }

        private void UpdateTrackMovement()
        {
            if (_settings == null) return;

            var pos = transform.position;
            pos.x = Mathf.MoveTowards(pos.x, _targetPosition.x,
                _settings.trackSwitchSpeed * Time.deltaTime);
            transform.position = pos;
        }

        private void UpdateForwardMovement()
        {
            if (_settings == null || _state == PlayerState.Dead) return;

            var pos = transform.position;
            pos.z += _settings.playerForwardSpeed * Time.deltaTime;
            transform.position = pos;

            if (_targetPosition.z < pos.z) _targetPosition.z = pos.z;
        }

        private void ApplyGroundCheck()
        {
            bool wasGrounded = IsGrounded;
            IsGrounded = Physics.Raycast(transform.position + Vector3.up * 0.1f,
                Vector3.down, 0.2f, ~0, QueryTriggerInteraction.Ignore);

            if (!wasGrounded && IsGrounded && _state == PlayerState.Jumping)
            {
                ChangeState(PlayerState.Running);
            }
        }

        public void HandleLeft()
        {
            if (_state == PlayerState.Dead) return;
            if (_settings == null) return;
            if (_currentTrackIndex > 0)
            {
                _currentTrackIndex--;
                _targetPosition.x = GetTrackX(_currentTrackIndex);
                OnTrackChanged?.Invoke(_currentTrackIndex);
            }
        }

        public void HandleRight()
        {
            if (_state == PlayerState.Dead) return;
            if (_settings == null) return;
            if (_currentTrackIndex < _settings.trackCount - 1)
            {
                _currentTrackIndex++;
                _targetPosition.x = GetTrackX(_currentTrackIndex);
                OnTrackChanged?.Invoke(_currentTrackIndex);
            }
        }

        public void HandleJump()
        {
            if (_state == PlayerState.Dead) return;
            if (_state == PlayerState.Jumping) return;
            if (_settings == null) return;

            if (_slideCoroutine != null)
            {
                StopCoroutine(_slideCoroutine);
                _slideCoroutine = null;
                ResetCollider();
            }

            ChangeState(PlayerState.Jumping);
            _jumpElapsed = 0f;
            _jumpStartY = transform.position.y;

            if (_jumpCoroutine != null) StopCoroutine(_jumpCoroutine);
            _jumpCoroutine = StartCoroutine(JumpRoutine());
        }

        public void HandleSlide()
        {
            if (_state == PlayerState.Dead) return;
            if (_state == PlayerState.Sliding) return;
            if (_settings == null) return;

            if (_jumpCoroutine != null)
            {
                StopCoroutine(_jumpCoroutine);
                _jumpCoroutine = null;
                var pos = transform.position;
                pos.y = _jumpStartY;
                transform.position = pos;
            }

            ChangeState(PlayerState.Sliding);
            _slideElapsed = 0f;

            if (_collider != null)
            {
                _collider.height = _settings.slideColliderHeight;
                _collider.center = new Vector3(0, _settings.slideColliderHeight * 0.5f, 0);
            }

            if (_visualRoot != null)
            {
                var scale = _visualRoot.localScale;
                scale.y = 0.5f;
                _visualRoot.localScale = scale;
            }

            if (_slideCoroutine != null) StopCoroutine(_slideCoroutine);
            _slideCoroutine = StartCoroutine(SlideRoutine());
        }

        private IEnumerator JumpRoutine()
        {
            float duration = _settings.jumpDuration;
            float height = _settings.jumpHeight;

            while (_jumpElapsed < duration)
            {
                _jumpElapsed += Time.deltaTime;
                float t = _jumpElapsed / duration;
                float jumpY = Mathf.Sin(t * Mathf.PI) * height;

                var pos = transform.position;
                pos.y = _jumpStartY + jumpY;
                transform.position = pos;

                yield return null;
            }

            var endPos = transform.position;
            endPos.y = _jumpStartY;
            transform.position = endPos;

            if (_state == PlayerState.Jumping)
            {
                ChangeState(PlayerState.Running);
            }
            IsGrounded = true;
        }

        private IEnumerator SlideRoutine()
        {
            float duration = _settings.slideDuration;
            while (_slideElapsed < duration)
            {
                _slideElapsed += Time.deltaTime;
                yield return null;
            }

            ResetCollider();

            if (_state == PlayerState.Sliding)
            {
                ChangeState(PlayerState.Running);
            }
        }

        private void ResetCollider()
        {
            if (_collider != null)
            {
                _collider.height = _originalColliderHeight;
                _collider.center = _originalColliderCenter;
            }
            if (_visualRoot != null)
            {
                var scale = _visualRoot.localScale;
                scale.y = 1f;
                _visualRoot.localScale = scale;
            }
        }

        public void ChangeState(PlayerState newState)
        {
            if (_state == newState) return;
            var old = _state;
            _state = newState;
            Debug.Log($"Player state: {old} -> {newState}");
            OnStateChanged?.Invoke(newState);
        }

        public void Die()
        {
            if (_state == PlayerState.Dead) return;
            ChangeState(PlayerState.Dead);
            OnDeath?.Invoke();
        }

        public void Revive()
        {
            ChangeState(PlayerState.Running);
            _currentTrackIndex = _settings != null ? _settings.trackCount / 2 : 1;
            _targetPosition.x = GetTrackX(_currentTrackIndex);
            var pos = transform.position;
            pos.x = _targetPosition.x;
            pos.y = _jumpStartY;
            transform.position = pos;
        }
    }
}
