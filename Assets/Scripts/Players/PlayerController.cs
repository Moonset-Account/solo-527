using System;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Core.Abstractions;
using KitchenChaos.Input;
using KitchenChaos.Ingredients;

namespace KitchenChaos.Players
{
    public enum PlayerAnimState
    {
        Idle = 0, Walk, PickUp, Chop, Cook, Serve, Wash, Throw, Carry
    }

    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(Collider2D))]
    public class PlayerController : MonoBehaviour, IPlayer
    {
        [Header("Identity")]
        [SerializeField] int _playerId = -1;
        [SerializeField] string _characterName = "Chef";
        [SerializeField] Color _characterColor = Color.red;

        [Header("Movement")]
        [SerializeField] float _moveSpeed = 4f;
        [SerializeField] float _interactionRange = 1.5f;
        [SerializeField] LayerMask _interactableLayer = ~0;

        [Header("Visual")]
        [SerializeField] SpriteRenderer _bodyRenderer;
        [SerializeField] Transform _carryAnchor;
        [SerializeField] ParticleSystem _dustParticles;

        Rigidbody2D _rb;
        Collider2D _collider;
        Vector2 _moveInput;
        Vector2 _facing = Vector2.down;
        IngredientItem _carrying;
        IInteractable _nearbyInteractable;
        PlayerAnimState _anim = PlayerAnimState.Idle;
        bool _isProcessing;
        float _processTimer, _processDuration;
        Action _processCompleteCallback;
        bool _interactEdgePending, _secondaryEdgePending, _dropEdgePending;

        public int PlayerId => _playerId;
        public Vector2 Facing => _facing;
        public bool HasItem => _carrying != null;
        public object CarryingRaw => _carrying;
        public IngredientItem Carrying => _carrying;
        public Transform CarryAnchor => EnsureCarryAnchor();
        public Vector2 Position => transform.position;
        public PlayerAnimState AnimationState => _anim;
        public bool IsProcessing => _isProcessing;
        public float ProcessProgress => _isProcessing ? Mathf.Clamp01(_processTimer / _processDuration) : 0f;
        public bool InteractPressed => _interactEdgePending;
        public bool SecondaryPressed => _secondaryEdgePending;
        public IInteractable Nearby => _nearbyInteractable;
        public IInteractable NearbyStation => _nearbyInteractable;

        public event Action<PlayerAnimState> OnAnimChanged;

        void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _collider = GetComponent<Collider2D>();
            _rb.freezeRotation = true;
            _rb.gravityScale = 0;
            _rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            EnsureBody();
        }

        SpriteRenderer EnsureBody()
        {
            if (_bodyRenderer == null)
            {
                _bodyRenderer = GetComponent<SpriteRenderer>();
                if (_bodyRenderer == null)
                {
                    _bodyRenderer = gameObject.AddComponent<SpriteRenderer>();
                    _bodyRenderer.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 64, 64), new Vector2(0.5f, 0.5f), 64);
                    _bodyRenderer.sortingOrder = 10;
                }
            }
            _bodyRenderer.color = _characterColor;
            return _bodyRenderer;
        }

        Transform EnsureCarryAnchor()
        {
            if (_carryAnchor != null) return _carryAnchor;
            var t = transform.Find("Carry");
            if (t == null)
            {
                var go = new GameObject("Carry");
                go.transform.SetParent(transform, false);
                go.transform.localPosition = new Vector3(0, 0.55f, 0);
                t = go.transform;
            }
            _carryAnchor = t;
            return _carryAnchor;
        }

        public void BindInput(int playerId, float moveSpeed = 4f, float range = 1.5f)
        {
            _playerId = playerId;
            _moveSpeed = moveSpeed;
            _interactionRange = range;
            enabled = true;
        }

        public void ReleaseInput()
        {
            _playerId = -1;
            _moveInput = Vector2.zero;
        }

        public void ConsumeInputFrame(ref IInputMapping map)
        {
            _interactEdgePending = map.InteractPressed;
            _secondaryEdgePending = map.SecondaryPressed;
            _dropEdgePending = map.DropPressed;

            if (!_isProcessing)
            {
                _moveInput = map.Move;
                if (_moveInput.sqrMagnitude > 0.01f) _facing = _moveInput.normalized;
            }
            else _moveInput = Vector2.zero;
        }

        void FixedUpdate()
        {
            if (_rb == null) return;
            _rb.velocity = _moveInput * _moveSpeed;
            DetectNearby();
            var state = HasItem
                ? (_moveInput.sqrMagnitude > 0.01f ? PlayerAnimState.Carry : PlayerAnimState.Carry)
                : (_moveInput.sqrMagnitude > 0.01f ? PlayerAnimState.Walk : PlayerAnimState.Idle);
            if (!_isProcessing) SetAnim(state);

            if (_dustParticles != null)
            {
                bool shouldPlay = !_isProcessing && _moveInput.sqrMagnitude > 0.1f;
                if (shouldPlay && !_dustParticles.isPlaying) _dustParticles.Play();
                else if (!shouldPlay && _dustParticles.isPlaying) _dustParticles.Stop();
            }
        }

        void DetectNearby()
        {
            _nearbyInteractable = null;
            var hits = Physics2D.OverlapCircleAll(transform.position, _interactionRange, _interactableLayer);
            float best = float.MaxValue;
            foreach (var h in hits)
            {
                if (h == _collider) continue;
                var inter = h.GetComponentInParent<IInteractable>();
                if (inter == null) continue;
                var d = Vector2.Distance(transform.position, h.transform.position);
                if (d < best) { best = d; _nearbyInteractable = inter; }
            }
        }

        public bool TryInteract()
        {
            if (_isProcessing) return false;
            if (_nearbyInteractable != null)
            {
                EventBus.Raise(new StationInteractEvent { PlayerId = _playerId, StationName = _nearbyInteractable.StationName });
                return _nearbyInteractable.Interact(this);
            }
            return TryPickFromGround();
        }

        public bool TrySecondaryInteract()
        {
            if (_isProcessing || _nearbyInteractable == null) return false;
            return _nearbyInteractable.SecondaryInteract(this);
        }

        public bool TryDrop()
        {
            if (_carrying == null) return false;
            var name = _carrying.Definition.Name;
            _carrying.Drop(transform.position, _facing * 3f);
            _carrying = null;
            SetAnim(PlayerAnimState.Throw);
            EventBus.Raise(new IngredientDroppedEvent { PlayerId = _playerId, IngredientName = name });
            return true;
        }

        bool TryPickFromGround()
        {
            if (HasItem) return false;
            var hits = Physics2D.OverlapCircleAll(transform.position, _interactionRange * 0.8f, ~0);
            foreach (var h in hits)
            {
                if (h == _collider) continue;
                var it = h.GetComponent<IngredientItem>();
                if (it == null || it.InStation || it.IsCarried) continue;
                PickUp(it);
                return true;
            }
            return false;
        }

        public bool PickUpRaw(object item)
        {
            if (item is IngredientItem ing) { PickUp(ing); return true; }
            return false;
        }

        public void PickUp(IngredientItem item)
        {
            if (HasItem) return;
            _carrying = item;
            item.SetCarried(EnsureCarryAnchor());
            SetAnim(PlayerAnimState.PickUp);
            EventBus.Raise(new IngredientPickedUpEvent { PlayerId = _playerId, IngredientName = item.Definition.Name, State = item.State });
        }

        public object ReleaseCarryingRaw()
        {
            var r = _carrying;
            _carrying = null;
            r?.Detach();
            return r;
        }

        public void DropCarryingRaw() => TryDrop();

        public void StartProcessRaw(float duration, Action onComplete, PlayerAnimHint hint)
        {
            if (_isProcessing) return;
            _isProcessing = true;
            _processTimer = 0f;
            _processDuration = Mathf.Max(0.01f, duration);
            _processCompleteCallback = onComplete;
            _moveInput = Vector2.zero;
            _rb.velocity = Vector2.zero;
            SetAnim(hint switch
            {
                PlayerAnimHint.Chop => PlayerAnimState.Chop,
                PlayerAnimHint.Cook => PlayerAnimState.Cook,
                PlayerAnimHint.Wash => PlayerAnimState.Wash,
                PlayerAnimHint.Throw => PlayerAnimState.Throw,
                PlayerAnimHint.PickUp => PlayerAnimState.PickUp,
                PlayerAnimHint.Serve => PlayerAnimState.Serve,
                _ => PlayerAnimState.Idle
            });
        }

        void Update()
        {
            if (_isProcessing)
            {
                _processTimer += Time.deltaTime;
                if (_processTimer >= _processDuration)
                {
                    _isProcessing = false;
                    SetAnim(HasItem ? PlayerAnimState.Carry : PlayerAnimState.Idle);
                    _processCompleteCallback?.Invoke();
                }
            }
        }

        public void LateTickInput()
        {
            if (_interactEdgePending) { _interactEdgePending = false; TryInteract(); }
            if (_secondaryEdgePending) { _secondaryEdgePending = false; TrySecondaryInteract(); }
            if (_dropEdgePending) { _dropEdgePending = false; TryDrop(); }
        }

        void SetAnim(PlayerAnimState s)
        {
            if (_anim == s) return;
            _anim = s;
            OnAnimChanged?.Invoke(s);
            if (_bodyRenderer != null)
            {
                var pulse = s == PlayerAnimState.Chop || s == PlayerAnimState.Cook || s == PlayerAnimState.Wash;
                _bodyRenderer.transform.localScale = pulse ? new Vector3(1.05f, 0.95f, 1) : Vector3.one;
            }
        }

        void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(transform.position, _interactionRange);
        }
    }
}
