using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Ingredients;
using KitchenChaos.Players;

namespace KitchenChaos.Stations
{
    public class CuttingStation : BaseStation
    {
        float _progress;
        bool _processing;

        public override float ProcessProgress => _processing ? _progress / _processDuration : 0f;

        protected override bool HandleInteract(PlayerController player)
        {
            if (HasItem)
            {
                if (!_storedItem.Definition.CanBeChopped || _storedItem.State == IngredientState.Chopped)
                {
                    if (!player.HasItem)
                    {
                        player.PickUp(TakeStored());
                        return true;
                    }
                    return false;
                }

                if (_processing) return false;

                var def = _storedItem.Definition;
                _processing = true;
                _progress = 0f;
                StartProcess(player, def.ChopTime > 0 ? def.ChopTime : _processDuration, () =>
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
                }, PlayerAnimationState.Chop);
                return true;
            }

            if (player.HasItem)
            {
                var pc = player.Carrying;
                if (pc.Definition.CanBeChopped && pc.State < IngredientState.Chopped)
                {
                    Store(player.ReleaseCarrying());
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
