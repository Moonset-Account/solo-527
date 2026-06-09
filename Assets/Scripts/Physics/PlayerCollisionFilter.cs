using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Players;

namespace KitchenChaos.Physics
{
    [RequireComponent(typeof(Collider2D))]
    public class PlayerCollisionFilter : MonoBehaviour
    {
        [SerializeField] LayerMask _blockingLayers;
        [SerializeField] float _collisionRadius = 0.42f;
        [SerializeField] ContactFilter2D _contactFilter;

        int _playerLayer;
        PlayerController _controller;

        void Awake()
        {
            _controller = GetComponentInParent<PlayerController>();
            _playerLayer = LayerMask.NameToLayer("Default");
            _contactFilter = new ContactFilter2D
            {
                useLayerMask = true,
                layerMask = ~(1 << _playerLayer)
            };
        }

        void FixedUpdate()
        {
            if (_controller == null) return;
            ResolveOverlaps();
        }

        void ResolveOverlaps()
        {
            var collider = GetComponent<Collider2D>();
            if (collider == null) return;
            var hits = new Collider2D[8];
            int count = Physics2D.OverlapCollider(collider, _contactFilter, hits);
            for (int i = 0; i < count; i++)
            {
                var other = hits[i];
                if (other == null || other == collider || other.isTrigger) continue;
                var dir = (Vector2)(transform.position - other.transform.position);
                if (dir.sqrMagnitude < 0.0001f) dir = Random.insideUnitCircle;
                dir.Normalize();
                float overlap = _collisionRadius * 1.2f - dir.magnitude;
                if (overlap > 0) transform.position += (Vector3)(dir * (overlap * 0.5f));
            }
        }

        void OnCollisionEnter2D(Collision2D c)
        {
            var otherPlayer = c.collider.GetComponentInParent<PlayerController>();
            if (otherPlayer != null && _controller != null)
            {
                if (_controller.HasItem && !otherPlayer.HasItem
                    && _controller.Carrying != null
                    && _controller.Carrying.Definition.Category != Ingredients.IngredientCategory.Dishware)
                {
                    if (Vector2.Dot(c.relativeVelocity, _controller.Facing) < -1f)
                    {
                        _controller.DropCarrying();
                    }
                }
            }
        }
    }
}
