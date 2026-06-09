using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Core.Abstractions;
using KitchenChaos.Ingredients;

namespace KitchenChaos.Stations
{
    public class CuttingStation : BaseStation
    {
        float _progress;
        bool _processing;

        public override float ProcessProgress => _processing ? _progress / _processDuration : 0f;

        protected override bool HandleInteract(IPlayer player)
        {
            if (HasItem)
            {
                if (!_storedItem.Definition.CanBeChopped || _storedItem.State == IngredientState.Chopped)
                {
                    if (!PlayerHasIngredient(player))
                    {
                        player.PickUpRaw(TakeStored());
                        return true;
                    }
                    return false;
                }
                if (_processing) return false;

                var def = _storedItem.Definition;
                _processing = true;
                _progress = 0f;
                StartProcessOn(player, def.ChopTime > 0 ? def.ChopTime : _processDuration, () =>
                {
                    var prev = _storedItem.State;
                    _storedItem.State = IngredientState.Chopped;
                    _processing = false;
                    EventBus.Raise(new IngredientProcessedEvent
                    {
                        StationName = _stationName,
                        IngredientName = _storedItem.Definition.Name,
                        FromState = prev,
                        ToState = IngredientState.Chopped
                    });
                }, PlayerAnimHint.Chop);
                return true;
            }

            if (PlayerHasIngredient(player))
            {
                var pc = PlayerCarryAsIngredient(player);
                if (pc.Definition.CanBeChopped && (int)pc.State < (int)IngredientState.Chopped)
                {
                    Store((IngredientItem)player.ReleaseCarryingRaw());
                    _progress = 0f;
                    return true;
                }
            }
            return false;
        }

        void Update()
        {
            if (_processing) _progress += Time.deltaTime;
        }
    }
}
