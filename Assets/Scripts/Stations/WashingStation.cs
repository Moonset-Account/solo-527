using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Core.Abstractions;
using KitchenChaos.Ingredients;

namespace KitchenChaos.Stations
{
    public class WashingStation : BaseStation
    {
        float _progress;
        bool _washing;

        public override float ProcessProgress => _washing ? _progress / _processDuration : 0f;

        protected override bool HandleInteract(IPlayer player)
        {
            if (HasItem && _storedItem.State == IngredientState.Dirty)
            {
                if (_washing) return false;
                _washing = true;
                _progress = 0f;
                var def = _storedItem.Definition;
                StartProcessOn(player, def.WashTime > 0 ? def.WashTime : _processDuration, () =>
                {
                    _storedItem.State = IngredientState.Plated;
                    _washing = false;
                    EventBus.Raise(new IngredientProcessedEvent
                    {
                        StationName = _stationName,
                        IngredientName = def.Name,
                        FromState = IngredientState.Dirty,
                        ToState = IngredientState.Plated
                    });
                }, PlayerAnimHint.Wash);
                return true;
            }
            if (HasItem)
            {
                if (!PlayerHasIngredient(player))
                {
                    player.PickUpRaw(TakeStored());
                    return true;
                }
                return false;
            }
            if (PlayerHasIngredient(player))
            {
                var c = PlayerCarryAsIngredient(player);
                if (c.State == IngredientState.Dirty)
                {
                    Store((IngredientItem)player.ReleaseCarryingRaw());
                    return true;
                }
            }
            return false;
        }

        void Update()
        {
            if (_washing) _progress += Time.deltaTime;
        }
    }
}
