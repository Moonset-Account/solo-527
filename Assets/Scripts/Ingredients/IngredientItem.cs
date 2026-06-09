using UnityEngine;
using KitchenChaos.Core;

namespace KitchenChaos.Ingredients
{
    public class IngredientItem : MonoBehaviour
    {
        [SerializeField] IngredientDefinition _definition;
        [SerializeField] IngredientState _state;
        [SerializeField] SpriteRenderer _renderer;
        [SerializeField] Sprite[] _stateSprites;
        [SerializeField] Rigidbody2D _rb;
        [SerializeField] Collider2D _collider;

        bool _carried;
        bool _inStation;

        public IngredientDefinition Definition
        {
            get => _definition;
            set { _definition = value; UpdateVisual(); }
        }
        public IngredientState State
        {
            get => _state;
            set { _state = value; UpdateVisual(); }
        }

        public bool InStation => _inStation;
        public bool IsCarried => _carried;

        public void SetDefinition(IngredientDefinition def)
        {
            _definition = def;
            State = def.InitialState;
            UpdateVisual();
        }

        void UpdateVisual()
        {
            if (_renderer == null)
            {
                _renderer = GetComponent<SpriteRenderer>();
                if (_renderer == null) _renderer = gameObject.AddComponent<SpriteRenderer>();
            }
            int idx = Mathf.Clamp((int)_state, 0, _stateSprites != null ? _stateSprites.Length - 1 : 0);
            if (_stateSprites != null && _stateSprites.Length > idx && _stateSprites[idx] != null)
                _renderer.sprite = _stateSprites[idx];
            else
            {
                _renderer.color = _state switch
                {
                    IngredientState.Raw => new Color(0.9f, 0.5f, 0.3f),
                    IngredientState.Chopped => new Color(0.8f, 0.4f, 0.2f),
                    IngredientState.Cooked => new Color(0.6f, 0.3f, 0.15f),
                    IngredientState.Burned => Color.black,
                    IngredientState.Plated => new Color(0.95f, 0.9f, 0.7f),
                    IngredientState.Dirty => new Color(0.3f, 0.2f, 0.1f),
                    _ => Color.white
                };
                _renderer.drawMode = SpriteDrawMode.Simple;
                if (_renderer.sprite == null)
                    _renderer.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 64, 64), new Vector2(0.5f, 0.5f), 64);
            }
            gameObject.name = $"Ingredient_{Definition?.Name ?? "NULL"}[{State}]";
        }

        public void SetCarried(Transform anchor)
        {
            _carried = true;
            _inStation = false;
            if (_rb) { _rb.velocity = Vector2.zero; _rb.simulated = false; }
            if (_collider) _collider.enabled = false;
            transform.SetParent(anchor, false);
            transform.localPosition = Vector3.zero;
            transform.localRotation = Quaternion.identity;
        }

        public void Detach()
        {
            _carried = false;
            transform.SetParent(null, true);
        }

        public void Drop(Vector2 worldPos, Vector2 velocity)
        {
            Detach();
            transform.position = worldPos;
            if (_rb) { _rb.simulated = true; _rb.velocity = velocity; }
            if (_collider) _collider.enabled = true;
        }

        public void PlaceInStation(Transform stationAnchor)
        {
            _inStation = true;
            _carried = false;
            if (_rb) { _rb.simulated = false; _rb.velocity = Vector2.zero; }
            if (_collider) _collider.enabled = false;
            transform.SetParent(stationAnchor, false);
            transform.localPosition = Vector3.zero;
            transform.localRotation = Quaternion.identity;
        }

        public void TakeFromStation()
        {
            _inStation = false;
            transform.SetParent(null, true);
        }

        public bool IsSame(IngredientItem other)
        {
            if (other == null) return false;
            if (Definition == null || other.Definition == null) return false;
            return Definition.Name == other.Definition.Name && State == other.State;
        }

        public IngredientItem Clone()
        {
            var go = Instantiate(gameObject);
            var clone = go.GetComponent<IngredientItem>();
            clone.SetDefinition(Definition);
            clone.State = State;
            return clone;
        }
    }
}
