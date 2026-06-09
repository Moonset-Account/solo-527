using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Ingredients;
using KitchenChaos.Players;

namespace KitchenChaos.Stations
{
    public class WashingStation : BaseStation
    {
        float _progress;
        bool _washing;

        public override float ProcessProgress => _washing ? _progress / _processDuration : 0f;

        protected override bool HandleInteract(PlayerController player)
        {
            if (HasItem && _storedItem.State == IngredientState.Dirty)
            {
                if (_washing) return false;
                _washing = true;
                _progress = 0f;
                var def = _storedItem.Definition;
                StartProcess(player, def.WashTime > 0 ? def.WashTime : _processDuration, () =>
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
                }, PlayerAnimationState.Wash);
                return true;
            }

            if (HasItem)
            {
                if (!player.HasItem)
                {
                    player.PickUp(TakeStored());
                    return true;
                }
                return false;
            }

            if (player.HasItem && player.Carrying.State == IngredientState.Dirty)
            {
                Store(player.ReleaseCarrying());
                return true;
            }
            return false;
        }

        void Update()
        {
            if (_washing) _progress += Time.deltaTime;
        }
    }
}
