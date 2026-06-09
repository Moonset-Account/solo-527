using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Core.Abstractions;
using KitchenChaos.Ingredients;

namespace KitchenChaos.Stations
{
    public abstract class BaseStation : MonoBehaviour, IInteractable
    {
        [SerializeField] protected string _stationName = "Station";
        [SerializeField] protected Transform _anchor;
        [SerializeField] protected SpriteRenderer _highlight;
        [SerializeField] protected float _processDuration = 3f;

        protected IngredientItem _storedItem;
        protected int _interactingPlayerId = -1;

        public string StationName => _stationName;
        public Transform Anchor
        {
            get
            {
                if (_anchor == null)
                {
                    var t = transform.Find("Anchor");
                    if (t == null)
                    {
                        var go = new GameObject("Anchor");
                        go.transform.SetParent(transform, false);
                        go.transform.localPosition = new Vector3(0, 0.7f, 0);
                        _anchor = go.transform;
                    }
                    else _anchor = t;
                }
                return _anchor;
            }
        }
        public IngredientItem StoredItem => _storedItem;
        public bool HasItem => _storedItem != null;
        public bool IsBeingUsed => _interactingPlayerId > 0;

        public virtual bool Interact(IPlayer player)
        {
            if (!CanInteract(player, out _)) return false;
            return HandleInteract(player);
        }

        public virtual bool SecondaryInteract(IPlayer player) => false;

        protected abstract bool HandleInteract(IPlayer player);

        protected virtual bool CanInteract(IPlayer player, out string reason)
        {
            reason = null;
            if (player == null) { reason = "无玩家"; return false; }
            return true;
        }

        protected void Store(IngredientItem item)
        {
            _storedItem = item;
            item?.PlaceInStation(Anchor);
        }

        protected IngredientItem TakeStored()
        {
            var r = _storedItem;
            _storedItem?.TakeFromStation();
            _storedItem = null;
            return r;
        }

        protected void StartProcessOn(IPlayer player, float duration, Action onComplete, PlayerAnimHint anim)
        {
            _interactingPlayerId = player.PlayerId;
            player.StartProcessRaw(duration, () =>
            {
                _interactingPlayerId = -1;
                onComplete?.Invoke();
            }, anim);
        }

        public virtual float ProcessProgress => 0f;

        public virtual void SetHighlight(bool on)
        {
            EnsureHighlight();
            if (_highlight != null) _highlight.enabled = on;
        }

        void EnsureHighlight()
        {
            if (_highlight != null) return;
            var existing = transform.Find("Highlight");
            if (existing != null) { _highlight = existing.GetComponent<SpriteRenderer>(); return; }
            var go = new GameObject("Highlight");
            go.transform.SetParent(transform, false);
            go.transform.localScale = Vector3.one * 1.15f;
            _highlight = go.AddComponent<SpriteRenderer>();
            _highlight.sprite = EnsureSprite();
            _highlight.color = new Color(1f, 1f, 0.35f, 0f);
            _highlight.sortingOrder = -1;
            _highlight.drawMode = SpriteDrawMode.Simple;
            _highlight.enabled = false;
        }

        static Sprite EnsureSprite()
        {
            var tex = Texture2D.whiteTexture;
            return Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), new Vector2(0.5f, 0.5f), tex.width);
        }

        void OnTriggerEnter2D(Collider2D other)
        {
            var root = other.transform;
            while (root.parent != null && root.GetComponentInParent<IPlayer>() == null)
                root = root.parent;
            var pl = root?.GetComponentInParent<IPlayer>();
            if (pl != null) SetHighlight(true);
        }

        void OnTriggerExit2D(Collider2D other)
        {
            var root = other.transform;
            while (root.parent != null && root.GetComponentInParent<IPlayer>() == null)
                root = root.parent;
            var pl = root?.GetComponentInParent<IPlayer>();
            if (pl != null) SetHighlight(false);
        }

        protected static bool PlayerHasIngredient(IPlayer p) => p?.CarryingRaw is IngredientItem;
        protected static IngredientItem PlayerCarryAsIngredient(IPlayer p) => p?.CarryingRaw as IngredientItem;
    }
}
