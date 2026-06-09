using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Ingredients;
using KitchenChaos.Players;

namespace KitchenChaos.Stations
{
    public class PlateStation : BaseStation
    {
        [SerializeField] int _plateCapacity = 6;
        [SerializeField] GameObject _platePrefab;
        readonly Queue<IngredientItem> _cleanPlates = new();
        readonly List<IngredientItem> _combinedOnPlate = new();

        public int CleanPlateCount => _cleanPlates.Count;

        protected override void Awake()
        {
            base.Awake();
            for (int i = 0; i < _plateCapacity; i++)
                _cleanPlates.Enqueue(MakePlate());
        }

        IngredientItem MakePlate()
        {
            GameObject go = _platePrefab != null
                ? Instantiate(_platePrefab)
                : new GameObject("Plate");
            var sr = go.GetComponent<SpriteRenderer>() ?? go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 5;
            sr.color = new Color(0.95f, 0.9f, 0.85f);
            go.AddComponent<CircleCollider2D>().isTrigger = true;
            var rb = go.AddComponent<Rigidbody2D>();
            rb.bodyType = RigidbodyType2D.Kinematic;
            rb.gravityScale = 0;

            var item = go.GetComponent<IngredientItem>() ?? go.AddComponent<IngredientItem>();
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

        protected override bool HandleInteract(PlayerController player)
        {
            if (!player.HasItem)
            {
                if (HasItem)
                {
                    player.PickUp(TakeStored());
                    _combinedOnPlate.Clear();
                    return true;
                }
                if (_cleanPlates.Count > 0)
                {
                    var plate = _cleanPlates.Dequeue();
                    plate.transform.position = _anchor.position;
                    player.PickUp(plate);
                    return true;
                }
                return false;
            }

            var carried = player.Carrying;

            if (carried.Definition.Name == "Plate" && carried.State == IngredientState.Dirty)
            {
                _cleanPlates.Enqueue(MakePlate());
                Destroy(player.ReleaseCarrying().gameObject);
                return true;
            }

            if (carried.Definition.Name == "Plate" && carried.State == IngredientState.Plated)
            {
                if (!HasItem)
                {
                    Store(player.ReleaseCarrying());
                    return true;
                }
                return false;
            }

            if (HasItem && _storedItem.Definition.Name == "Plate")
            {
                if (_combinedOnPlate.Exists(i => i.IsSame(carried))) return false;
                _combinedOnPlate.Add(carried.Clone());
                Destroy(player.ReleaseCarrying().gameObject);
                CombinePlateVisual();
                return true;
            }
            return false;
        }

        void CombinePlateVisual()
        {
            if (_storedItem == null) return;
            _storedItem.name = $"Plate_With({_combinedOnPlate.Count})";
        }

        public IngredientItem PeekCombined()
        {
            if (!HasItem) return null;
            return _storedItem;
        }

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
