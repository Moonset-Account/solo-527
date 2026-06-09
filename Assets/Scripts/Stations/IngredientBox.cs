using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Ingredients;
using KitchenChaos.Players;

namespace KitchenChaos.Stations
{
    public class IngredientBox : BaseStation
    {
        [SerializeField] IngredientDefinition[] _providedIngredients;
        [SerializeField] int _maxConcurrentSpawns = 5;
        [SerializeField] GameObject _ingredientPrefab;
        readonly List<IngredientItem> _spawned = new();

        public IReadOnlyList<IngredientDefinition> Provided => _providedIngredients;
        int _cycleIndex;

        protected override bool HandleInteract(PlayerController player)
        {
            if (player.HasItem) return false;
            if (_providedIngredients == null || _providedIngredients.Length == 0) return false;
            var def = _providedIngredients[_cycleIndex % _providedIngredients.Length];
            _cycleIndex++;

            var item = Spawn(def);
            if (item == null) return false;
            player.PickUp(item);
            return true;
        }

        public override bool SecondaryInteract(PlayerController player)
        {
            if (_providedIngredients == null || _providedIngredients.Length == 0) return false;
            _cycleIndex = (_cycleIndex + 1) % Mathf.Max(1, _providedIngredients.Length);
            return true;
        }

        public IngredientItem Spawn(IngredientDefinition def)
        {
            if (_spawned.Count >= _maxConcurrentSpawns)
            {
                var old = _spawned[0];
                _spawned.RemoveAt(0);
                if (old) Destroy(old.gameObject);
            }

            GameObject go;
            if (_ingredientPrefab != null)
                go = Instantiate(_ingredientPrefab, _anchor.position, Quaternion.identity);
            else
            {
                go = new GameObject($"Ingredient_{def.Name}");
                go.transform.position = _anchor.position;
                go.AddComponent<CircleCollider2D>().isTrigger = true;
                var rb = go.AddComponent<Rigidbody2D>();
                rb.gravityScale = 0;
                rb.bodyType = RigidbodyType2D.Kinematic;
                var sr = go.AddComponent<SpriteRenderer>();
                sr.sortingOrder = 5;
                go.layer = LayerMask.NameToLayer("Default");
            }

            var item = go.GetComponent<IngredientItem>() ?? go.AddComponent<IngredientItem>();
            item.SetDefinition(def);
            _spawned.Add(item);
            return item;
        }

        public void SetProvidedIngredients(params IngredientDefinition[] defs) => _providedIngredients = defs;
    }
}
