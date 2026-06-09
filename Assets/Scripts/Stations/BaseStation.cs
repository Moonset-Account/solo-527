using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Ingredients;
using KitchenChaos.Players;

namespace KitchenChaos.Stations
{
    public abstract class BaseStation : MonoBehaviour
    {
        [SerializeField] protected string _stationName = "Station";
        [SerializeField] protected Transform _anchor;
        [SerializeField] protected SpriteRenderer _highlight;
        [SerializeField] protected float _processDuration = 3f;

        IngredientItem _storedItem;
        protected int _interactingPlayerId = -1;

        public string StationName => _stationName;
        public Transform Anchor => _anchor;
        public IngredientItem StoredItem => _storedItem;
        public bool HasItem => _storedItem != null;
        public bool IsBeingUsed => _interactingPlayerId > 0;

        protected virtual void Reset()
        {
            if (_anchor == null)
            {
                var t = transform.Find("Anchor");
                _anchor = t != null ? t : transform;
            }
        }

        public virtual bool Interact(PlayerController player)
        {
            if (!CanInteract(player, out var reason)) return false;
            return HandleInteract(player);
        }

        public virtual bool SecondaryInteract(PlayerController player) => false;

        protected abstract bool HandleInteract(PlayerController player);

        protected virtual bool CanInteract(PlayerController player, out string reason)
        {
            reason = null;
            if (player == null) { reason = "无玩家"; return false; }
            return true;
        }

        protected void Store(IngredientItem item)
        {
            _storedItem = item;
            item?.PlaceInStation(_anchor);
        }

        protected IngredientItem TakeStored()
        {
            var r = _storedItem;
            _storedItem?.TakeFromStation();
            _storedItem = null;
            return r;
        }

        protected void StartProcess(PlayerController player, float duration, Action onComplete, PlayerAnimationState anim = PlayerAnimationState.Chop)
        {
            _interactingPlayerId = player.PlayerId;
            player.StartProcess(duration, () =>
            {
                _interactingPlayerId = -1;
                onComplete?.Invoke();
            }, anim);
        }

        public virtual float ProcessProgress => 0f;

        public virtual void SetHighlight(bool on)
        {
            if (_highlight != null) _highlight.enabled = on;
        }

        void OnTriggerEnter2D(Collider2D other)
        {
            var pc = other.GetComponentInParent<PlayerController>();
            if (pc != null) SetHighlight(true);
        }

        void OnTriggerExit2D(Collider2D other)
        {
            var pc = other.GetComponentInParent<PlayerController>();
            if (pc != null) SetHighlight(false);
        }
    }
}
