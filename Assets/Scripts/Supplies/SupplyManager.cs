using UnityEngine;
using System;
using System.Collections.Generic;

namespace LakeNavigation
{
    public class SupplyManager : MonoBehaviour
    {
        public event Action<SupplyType> OnSupplyDepleted;
        public event Action<SupplyType, float, float> OnSupplyChanged;
        public event Action<SupplyType, float> OnCriticalSupply;

        private const float CriticalThreshold = 0.2f;

        private Dictionary<SupplyType, SupplyAmount> _supplies = new Dictionary<SupplyType, SupplyAmount>();
        private HashSet<SupplyType> _depletedNotified = new HashSet<SupplyType>();
        private HashSet<SupplyType> _criticalNotified = new HashSet<SupplyType>();
        private GameConfig _gameConfig;

        private void Start()
        {
            ServiceLocator.Instance.TryGet(out _gameConfig);
        }

        public void Initialize(Dictionary<SupplyType, SupplyAmount> initialSupplies)
        {
            _supplies.Clear();
            _depletedNotified.Clear();
            _criticalNotified.Clear();

            foreach (var kvp in initialSupplies)
            {
                _supplies[kvp.Key] = kvp.Value;
            }
        }

        public void Consume(SupplyType type, float amount)
        {
            if (!_supplies.ContainsKey(type)) return;

            var supply = _supplies[type];
            supply.Current = Mathf.Clamp(supply.Current - amount, 0f, supply.Max);
            _supplies[type] = supply;

            OnSupplyChanged?.Invoke(type, supply.Current, supply.Max);

            if (supply.Current <= 0f && !_depletedNotified.Contains(type))
            {
                _depletedNotified.Add(type);
                OnSupplyDepleted?.Invoke(type);
            }

            float percentage = supply.Current / supply.Max;
            if (percentage <= CriticalThreshold && !_criticalNotified.Contains(type))
            {
                _criticalNotified.Add(type);
                OnCriticalSupply?.Invoke(type, percentage);
            }
        }

        public void ConsumeOverTime(float deltaTime)
        {
            if (deltaTime <= 0f) return;

            bool boatMoving = false;
            Vector2 moveDirection = Vector2.zero;

            var boat = FindObjectOfType<BoatController>();
            if (boat != null && boat.CurrentState == BoatState.Moving)
            {
                boatMoving = true;
                moveDirection = boat.transform.up;
            }

            float baseFuelDrainRate = _gameConfig != null ? _gameConfig.BaseFuelDrainRate : 1f;
            float baseFoodDrainRate = _gameConfig != null ? _gameConfig.BaseFoodDrainRate : 0.5f;
            float baseBatteryDrainRate = _gameConfig != null ? _gameConfig.BaseBatteryDrainRate : 2f;

            if (boatMoving && _supplies.ContainsKey(SupplyType.Fuel))
            {
                float fuelMultiplier = 1f;
                if (WeatherSystem.Instance != null)
                {
                    var wind = WeatherSystem.Instance.CurrentWind;
                    Vector2 windDir = WeatherSystem.WindDirectionToVector2(wind.Direction);
                    fuelMultiplier = WindEffect.GetFuelConsumptionMultiplier(moveDirection, windDir, wind.Speed);
                }
                float fuelDrain = baseFuelDrainRate * fuelMultiplier * deltaTime;
                Consume(SupplyType.Fuel, fuelDrain);
            }

            Consume(SupplyType.Food, baseFoodDrainRate * deltaTime);
            Consume(SupplyType.Battery, baseBatteryDrainRate * deltaTime);
        }

        public void Replenish(SupplyType type, float amount)
        {
            if (!_supplies.ContainsKey(type)) return;

            var supply = _supplies[type];
            supply.Current = Mathf.Clamp(supply.Current + amount, 0f, supply.Max);
            _supplies[type] = supply;

            if (supply.Current > 0f)
            {
                _depletedNotified.Remove(type);
            }

            float percentage = supply.Current / supply.Max;
            if (percentage > CriticalThreshold)
            {
                _criticalNotified.Remove(type);
            }

            OnSupplyChanged?.Invoke(type, supply.Current, supply.Max);
        }

        public float GetCurrent(SupplyType type)
        {
            return _supplies.ContainsKey(type) ? _supplies[type].Current : 0f;
        }

        public float GetMax(SupplyType type)
        {
            return _supplies.ContainsKey(type) ? _supplies[type].Max : 0f;
        }

        public float GetPercentage(SupplyType type)
        {
            if (!_supplies.ContainsKey(type)) return 0f;
            var supply = _supplies[type];
            return supply.Max > 0f ? supply.Current / supply.Max : 0f;
        }

        public bool IsDepleted(SupplyType type)
        {
            return _supplies.ContainsKey(type) && _supplies[type].Current <= 0f;
        }

        public void Reset()
        {
            _supplies.Clear();
            _depletedNotified.Clear();
            _criticalNotified.Clear();
        }

        public Dictionary<SupplyType, SupplyAmount> GetSupplyData()
        {
            return new Dictionary<SupplyType, SupplyAmount>(_supplies);
        }
    }
}
