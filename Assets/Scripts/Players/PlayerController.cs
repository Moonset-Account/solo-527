using System;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Input;
using KitchenChaos.Stations;

namespace KitchenChaos.Players
{
    public enum PlayerAnimationState
    {
        Idle,
        Walk,
        PickUp,
        Chop,
        Cook,
        Serve,
        Wash,
        Throw,
        Carry
    }

    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(Collider2D))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Identity")]
        [SerializeField] int _playerId = -1;
        [SerializeField] string _characterName = "Chef";
        [SerializeField] Color _characterColor = Color.red;

        [Header("Movement")]
        [SerializeField] float _moveSpeed = 4f;
        [SerializeField] float _interactionRange = 1.5f;
        [SerializeField] LayerMask _stationLayer;
        [SerializeField] LayerMask _ingredientLayer;
        [SerializeField] LayerMask _deliveryLayer;

        [Header("References")]
        [SerializeField] SpriteRenderer _bodyRenderer;
        [SerializeField] SpriteRenderer _handRenderer;
        [SerializeField] Animator _animator;
        [SerializeField] Transform _carryAnchor;
        [SerializeField] ParticleSystem _dustParticles;

        Rigidbody2D _rb;
        Vector2 _moveInput;
        Vector2 _facing = Vector2.down;
        IngredientItem _carrying;
        BaseStation _nearbyStation;
        int _activeSlotHash;
        PlayerAnimationState _currentAnim = PlayerAnimationState.Idle;
        bool _isProcessing;
        float _processTimer;
        float _processDuration;
        Action _processCompleteCallback;

        public int PlayerId => _playerId;
        public bool IsControlled => _playerId > 0;
        public IngredientItem Carrying => _carrying;
        public bool HasItem => _carrying != null;
        public Vector2 Facing => _facing;
        public BaseStation NearbyStation => _nearbyStation;
        public PlayerAnimationState CurrentAnimation => _currentAnim;
        public bool IsProcessing => _isProcessing;

        void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            if (_bodyRenderer) _bodyRenderer.color = _characterColor;
        }

        void FixedUpdate()
        {
            UpdateMovement();
            UpdateNearbyDetection();
        }

        public void BindInput(int playerId)
        {
            _playerId = playerId;
            enabled = true;
        }

        public void ReleaseInput()
        {
            _playerId = -1;
            _moveInput = Vector2.zero;
        }

        public void SetMoveInput(Vector2 input)
        {
            if (_isProcessing) return;
            _moveInput = input;
            if (input.sqrMagnitude > 0.01f)
                _facing = input.normalized;
        }

        void UpdateMovement()
        {
            if (!_rb) return;
            var target = _moveInput * _moveSpeed;
            _rb.velocity = target;

            if (_moveInput.sqrMagnitude > 0.1f)
            {
                SetAnimation(HasItem ? PlayerAnimationState.Carry : PlayerAnimationState.Walk);
                if (_dustParticles && !_dustParticles.isPlaying && Mathf.Abs(_rb.velocity.x) + Mathf.Abs(_rb.velocity.y) > 0.5f)
                    _dustParticles.Play();
            }
            else
            {
                SetAnimation(HasItem ? PlayerAnimationState.Carry : PlayerAnimationState.Idle);
                if (_dustParticles && _dustParticles.isPlaying)
                    _dustParticles.Stop();
            }
        }

        void UpdateNearbyDetection()
        {
            _nearbyStation = null;
            var hits = Physics2D.OverlapCircleAll(transform.position, _interactionRange, _stationLayer);
            float closest = float.MaxValue;
            foreach (var h in hits)
            {
                var st = h.GetComponentInParent<BaseStation>();
                if (st == null) continue;
                float d = Vector2.Distance(transform.position, h.transform.position);
                if (d < closest) { closest = d; _nearbyStation = st; }
            }
        }

        public bool TryInteract()
        {
            if (_isProcessing) return false;

            if (_nearbyStation != null)
            {
                EventBus.Raise(new StationInteractEvent { PlayerId = _playerId, StationName = _nearbyStation.StationName });
                return _nearbyStation.Interact(this);
            }
            return TryPickFromGround();
        }

        public bool TrySecondaryInteract()
        {
            if (_isProcessing || _nearbyStation == null) return false;
            return _nearbyStation.SecondaryInteract(this);
        }

        public bool TryDrop()
        {
            if (_carrying == null) return false;
            DropCarrying();
            return true;
        }

        public bool TryPickFromGround()
        {
            if (HasItem) return false;
            var hit = Physics2D.OverlapCircle(transform.position, _interactionRange * 0.8f, _ingredientLayer);
            if (hit == null) return false;
            var item = hit.GetComponent<IngredientItem>();
            if (item == null || item.InStation) return false;
            PickUp(item);
            return true;
        }

        public bool TryDeliver()
        {
            if (_carrying == null) return false;
            var hit = Physics2D.OverlapCircle(transform.position, _interactionRange, _deliveryLayer);
            if (hit == null) return false;
            var del = hit.GetComponentInParent<DeliveryStation>();
            if (del == null) return false;
            return del.TryDeliver(this, _carrying);
        }

        public void PickUp(IngredientItem item)
        {
            if (HasItem) return;
            _carrying = item;
            item.SetCarried(_carryAnchor);
            SetAnimation(PlayerAnimationState.PickUp);
            EventBus.Raise(new IngredientPickedUpEvent { PlayerId = _playerId, IngredientName = item.Definition.Name, State = item.State });
        }

        public IngredientItem ReleaseCarrying()
        {
            var r = _carrying;
            _carrying = null;
            if (r != null) r.Detach();
            return r;
        }

        public void DropCarrying()
        {
            if (_carrying == null) return;
            var name = _carrying.Definition.Name;
            _carrying.Drop(transform.position, _facing * 3f);
            _carrying = null;
            SetAnimation(PlayerAnimationState.Throw);
            EventBus.Raise(new IngredientDroppedEvent { PlayerId = _playerId, IngredientName = name });
        }

        public void StartProcess(float duration, Action onComplete, PlayerAnimationState anim = PlayerAnimationState.Chop)
        {
            if (_isProcessing) return;
            _isProcessing = true;
            _processTimer = 0f;
            _processDuration = Mathf.Max(0.01f, duration);
            _processCompleteCallback = onComplete;
            _moveInput = Vector2.zero;
            _rb.velocity = Vector2.zero;
            SetAnimation(anim);
        }

        void Update()
        {
            if (_isProcessing)
            {
                _processTimer += Time.deltaTime;
                if (_processTimer >= _processDuration)
                {
                    _isProcessing = false;
                    SetAnimation(HasItem ? PlayerAnimationState.Carry : PlayerAnimationState.Idle);
                    _processCompleteCallback?.Invoke();
                }
            }
        }

        public float ProcessProgress => _isProcessing ? Mathf.Clamp01(_processTimer / _processDuration) : 0f;

        public void SetAnimation(PlayerAnimationState state)
        {
            if (_currentAnim == state) return;
            _currentAnim = state;
            if (_animator == null) return;
            _animator.SetInteger("AnimState", (int)state);
            _animator.SetFloat("MoveX", _facing.x);
            _animator.SetFloat("MoveY", _facing.y);
        }

        void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(transform.position, _interactionRange);
        }
    }
}
