using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Core.Abstractions;
using KitchenChaos.Ingredients;

namespace KitchenChaos.Stations
{
    public class IngredientBox : BaseStation
    {
        [SerializeField] IngredientDefinition[] _providedIngredients;
        [SerializeField] int _maxConcurrentSpawns = 5;
        readonly List<IngredientItem> _spawned = new();
        int _cycleIndex;

        public IReadOnlyList<IngredientDefinition> Provided => _providedIngredients;

        protected override bool HandleInteract(IPlayer player)
        {
            if (PlayerHasIngredient(player)) return false;
            if (_providedIngredients == null || _providedIngredients.Length == 0) return false;
            var def = _providedIngredients[_cycleIndex % _providedIngredients.Length];
            _cycleIndex++;
            var item = Spawn(def);
            if (item == null) return false;
            player.PickUpRaw(item);
            EventBus.Raise(new IngredientPickedUpEvent { PlayerId = player.PlayerId, IngredientName = def.Name, State = def.InitialState });
            return true;
        }

        public override bool SecondaryInteract(IPlayer player)
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

            var go = new GameObject($"Ingredient_{def.Name}");
            go.transform.position = Anchor.position;
            go.layer = 0;
            var col = go.AddComponent<CircleCollider2D>();
            col.isTrigger = true;
            col.radius = 0.28f;
            var rb = go.AddComponent<Rigidbody2D>();
            rb.gravityScale = 0;
            rb.bodyType = RigidbodyType2D.Kinematic;
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sortingOrder = 5;
            sr.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 32, 32), new Vector2(0.5f, 0.5f), 32);
            go.transform.localScale = new Vector3(0.5f, 0.5f, 1);

            var item = go.AddComponent<IngredientItem>();
            item.SetDefinition(def);
            _spawned.Add(item);
            return item;
        }

        public void SetProvidedIngredients(params IngredientDefinition[] defs) => _providedIngredients = defs;
    }
}
