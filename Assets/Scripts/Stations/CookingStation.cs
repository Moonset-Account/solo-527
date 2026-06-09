using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Core.Abstractions;
using KitchenChaos.Ingredients;

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

        protected override bool HandleInteract(IPlayer player)
        {
            if (HasItem)
            {
                if (_phase == CookPhase.Cooking) return false;
                if (!PlayerHasIngredient(player))
                {
                    player.PickUpRaw(TakeStored());
                    _phase = CookPhase.Idle;
                    _timer = 0f;
                    UpdateVisuals();
                    return true;
                }
                return false;
            }
            if (PlayerHasIngredient(player))
            {
                var pc = PlayerCarryAsIngredient(player);
                if (!pc.Definition.CanBeCooked) return false;
                if ((int)pc.State >= (int)IngredientState.Cooked && pc.Definition.CanBeBurned == false) return false;
                if (pc.State == IngredientState.Burned) return false;

                Store((IngredientItem)player.ReleaseCarryingRaw());
                _phase = CookPhase.Cooking;
                _timer = 0f;
                UpdateVisuals();
                StartProcessOn(player, 0.4f, () => { }, PlayerAnimHint.Cook);
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
            if (_fireRenderer == null)
            {
                var t = transform.Find("Fire");
                if (t == null)
                {
                    var go = new GameObject("Fire");
                    go.transform.SetParent(transform, false);
                    go.transform.localPosition = new Vector3(0, 0.3f, 0);
                    go.transform.localScale = new Vector3(0.5f, 0.5f, 1);
                    _fireRenderer = go.AddComponent<SpriteRenderer>();
                    _fireRenderer.sprite = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 32, 32), new Vector2(0.5f, 0.5f), 32);
                    _fireRenderer.sortingOrder = 3;
                }
                else _fireRenderer = t.GetComponent<SpriteRenderer>();
            }
            _fireRenderer.enabled = _phase == CookPhase.Cooking || _phase == CookPhase.Burning;
            _fireRenderer.color = _phase == CookPhase.Burning ? new Color(1f, 0.2f, 0.1f) : new Color(1f, 0.6f, 0.1f);
        }
    }
}
