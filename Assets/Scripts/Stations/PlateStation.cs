using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Core.Abstractions;
using KitchenChaos.Ingredients;

namespace KitchenChaos.Stations
{
    public class PlateStation : BaseStation
    {
        [SerializeField] int _plateCapacity = 6;
        readonly Queue<IngredientItem> _cleanPlates = new();
        readonly List<IngredientItem> _combinedOnPlate = new();

        public int CleanPlateCount => _cleanPlates.Count;

        protected override void Awake()
        {
            for (int i = 0; i < _plateCapacity; i++)
                _cleanPlates.Enqueue(MakePlate());
        }

        IngredientItem MakePlate()
        {
            var go = new GameObject("Plate");
            go.transform.localScale = Vector3.one * 0.6f;
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 5;
            sr.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 64, 64), new Vector2(0.5f, 0.5f), 64);
            sr.color = new Color(0.95f, 0.92f, 0.85f);
            var col = go.AddComponent<CircleCollider2D>();
            col.isTrigger = true;
            col.radius = 0.35f;
            var rb = go.AddComponent<Rigidbody2D>();
            rb.bodyType = RigidbodyType2D.Kinematic;
            rb.gravityScale = 0;

            var item = go.AddComponent<IngredientItem>();
            item.SetDefinition(new IngredientDefinition
            {
                Name = "Plate",
                Category = IngredientCategory.Dishware,
                InitialState = IngredientState.Plated,
                BaseValue = 5
            });
            item.State = IngredientState.Plated;
            return item;
        }

        protected override bool HandleInteract(IPlayer player)
        {
            if (!PlayerHasIngredient(player))
            {
                if (HasItem)
                {
                    player.PickUpRaw(TakeStored());
                    _combinedOnPlate.Clear();
                    return true;
                }
                if (_cleanPlates.Count > 0)
                {
                    var plate = _cleanPlates.Dequeue();
                    plate.transform.position = Anchor.position;
                    player.PickUpRaw(plate);
                    return true;
                }
                return false;
            }

            var carried = PlayerCarryAsIngredient(player);

            if (carried.Definition.Name == "Plate" && carried.State == IngredientState.Dirty)
            {
                _cleanPlates.Enqueue(MakePlate());
                var released = (IngredientItem)player.ReleaseCarryingRaw();
                if (released != null) Destroy(released.gameObject);
                return true;
            }

            if (carried.Definition.Name == "Plate" && carried.State == IngredientState.Plated)
            {
                if (!HasItem)
                {
                    Store((IngredientItem)player.ReleaseCarryingRaw());
                    return true;
                }
                return false;
            }

            if (HasItem && _storedItem.Definition.Name == "Plate")
            {
                if (_combinedOnPlate.Exists(i => i.IsSame(carried))) return false;
                _combinedOnPlate.Add(carried.Clone());
                var released = (IngredientItem)player.ReleaseCarryingRaw();
                if (released != null) Destroy(released.gameObject);
                CombinePlateVisual();
                return true;
            }
            return false;
        }

        void CombinePlateVisual()
        {
            if (_storedItem == null) return;
            _storedItem.name = $"Plate_With({_combinedOnPlate.Count})";
            if (_storedItem.TryGetComponent<SpriteRenderer>(out var sr))
            {
                sr.color = Color.Lerp(sr.color, new Color(1, 0.9f, 0.8f), 0.2f);
                sr.transform.localScale = Vector3.one * (0.6f + _combinedOnPlate.Count * 0.05f);
            }
        }

        public IngredientItem PeekCombined() => HasItem ? _storedItem : null;

        public IReadOnlyList<IngredientItem> CombinedItems => _combinedOnPlate;

        public List<IngredientItem> ConsumePlate()
        {
            var list = new List<IngredientItem>(_combinedOnPlate);
            if (HasItem) Destroy(TakeStored().gameObject);
            _combinedOnPlate.Clear();
            return list;
        }
    }
}
