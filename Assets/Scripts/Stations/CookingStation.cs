using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Ingredients;
using KitchenChaos.Players;

namespace KitchenChaos.Stations
{
    public class CookingStation : BaseStation
    {
        enum CookPhase { Idle, Cooking, Ready, Burning }

        [SerializeField] float _burnDuration = 8f;
        [SerializeField] SpriteRenderer _fireRenderer;
        CookPhase _phase;
        float _timer;

        public override float ProcessProgress
        {
            get
            {
                if (_phase == CookPhase.Cooking && HasItem)
                    return Mathf.Clamp01(_timer / _storedItem.Definition.CookTime);
                if (_phase == CookPhase.Burning && HasItem)
                    return -Mathf.Clamp01(_timer / _burnDuration);
                return 0f;
            }
        }

        protected override bool HandleInteract(PlayerController player)
        {
            if (HasItem)
            {
                if (_phase == CookPhase.Cooking) return false;
                if (!player.HasItem)
                {
                    player.PickUp(TakeStored());
                    _phase = CookPhase.Idle;
                    _timer = 0f;
                    UpdateVisuals();
                    return true;
                }
                return false;
            }

            if (player.HasItem)
            {
                var pc = player.Carrying;
                if (!pc.Definition.CanBeCooked) return false;
                if (pc.State >= IngredientState.Cooked && pc.Definition.CanBeBurned == false) return false;
                if (pc.State == IngredientState.Burned) return false;

                Store(player.ReleaseCarrying());
                _phase = CookPhase.Cooking;
                _timer = 0f;
                UpdateVisuals();

                StartProcess(player, 0.4f, () => { }, PlayerAnimationState.Cook);
                return true;
            }
            return false;
        }

        void Update()
        {
            if (!HasItem) return;
            var def = _storedItem.Definition;
            _timer += Time.deltaTime;

            switch (_phase)
            {
                case CookPhase.Cooking:
                    if (_timer >= def.CookTime)
                    {
                        var prev = _storedItem.State;
                        _storedItem.State = IngredientState.Cooked;
                        _phase = CookPhase.Ready;
                        _timer = 0f;
                        EventBus.Raise(new IngredientProcessedEvent
                        {
                            StationName = _stationName,
                            IngredientName = def.Name,
                            FromState = prev,
                            ToState = IngredientState.Cooked
                        });
                    }
                    break;
                case CookPhase.Ready:
                    if (def.CanBeBurned && _timer >= 3f)
                    {
                        _phase = CookPhase.Burning;
                        _timer = 0f;
                    }
                    break;
                case CookPhase.Burning:
                    if (_timer >= _burnDuration)
                    {
                        var prev = _storedItem.State;
                        _storedItem.State = IngredientState.Burned;
                        _phase = CookPhase.Idle;
                        EventBus.Raise(new IngredientProcessedEvent
                        {
                            StationName = _stationName,
                            IngredientName = def.Name,
                            FromState = prev,
                            ToState = IngredientState.Burned
                        });
                    }
                    break;
            }
            UpdateVisuals();
        }

        void UpdateVisuals()
        {
            if (_fireRenderer == null) return;
            _fireRenderer.enabled = _phase == CookPhase.Cooking || _phase == CookPhase.Burning;
            _fireRenderer.color = _phase == CookPhase.Burning ? new Color(1f, 0.2f, 0.1f) : new Color(1f, 0.6f, 0.1f);
        }
    }
}
