using System;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class ResourceManager
    {
        private int _gold;
        private int _baseHealth;
        private int _maxBaseHealth;
        private float _elapsedTime;

        public int Gold => _gold;
        public int BaseHealth => _baseHealth;
        public int MaxBaseHealth => _maxBaseHealth;
        public float ElapsedTime => _elapsedTime;
        public bool IsBaseDestroyed => _baseHealth <= 0;

        private int _totalGoldEarned;
        private int _totalGoldSpent;
        private int _totalRepairs;
        private int _peakGold;

        public event Action<int, int> OnGoldChanged;
        public event Action<int, int> OnBaseHealthChanged;
        public event Action OnBaseDestroyed;
        public event Action<string, int> OnGoldLog;

        public ResourceManager()
        {
        }

        public void Initialize(LevelConfig levelConfig)
        {
            _gold = levelConfig.startGold;
            _maxBaseHealth = levelConfig.baseHealth;
            _baseHealth = _maxBaseHealth;
            _elapsedTime = 0;
            _totalGoldEarned = _gold;
            _totalGoldSpent = 0;
            _peakGold = _gold;
        }

        public void Update(float deltaTime)
        {
            _elapsedTime += deltaTime;
        }

        public bool CanAfford(int amount)
        {
            return _gold >= amount;
        }

        public bool SpendGold(int amount)
        {
            if (amount <= 0) return true;
            if (!CanAfford(amount)) return false;

            int oldGold = _gold;
            _gold -= amount;
            _totalGoldSpent += amount;
            OnGoldChanged?.Invoke(oldGold, _gold);
            return true;
        }

        public void AddGold(int amount, string source = "generic")
        {
            if (amount <= 0) return;

            int oldGold = _gold;
            _gold += amount;
            _totalGoldEarned += amount;
            if (_gold > _peakGold) _peakGold = _gold;
            OnGoldChanged?.Invoke(oldGold, _gold);
            OnGoldLog?.Invoke(source, amount);
        }

        public void DamageBase(int amount)
        {
            if (amount <= 0 || IsBaseDestroyed) return;

            int oldHealth = _baseHealth;
            _baseHealth = Mathf.Max(0, _baseHealth - amount);
            OnBaseHealthChanged?.Invoke(oldHealth, _baseHealth);

            if (_baseHealth <= 0)
            {
                OnBaseDestroyed?.Invoke();
            }
        }

        public void RepairBase(int amount)
        {
            if (amount <= 0 || _baseHealth >= _maxBaseHealth) return;

            int oldHealth = _baseHealth;
            _baseHealth = Mathf.Min(_maxBaseHealth, _baseHealth + amount);
            _totalRepairs++;
            OnBaseHealthChanged?.Invoke(oldHealth, _baseHealth);
        }

        public int GetTotalGoldEarned()
        {
            return _totalGoldEarned;
        }

        public int GetTotalGoldSpent()
        {
            return _totalGoldSpent;
        }

        public int GetPeakGold()
        {
            return _peakGold;
        }

        public int GetTotalRepairs()
        {
            return _totalRepairs;
        }

        public float GetGoldEfficiency()
        {
            if (_totalGoldEarned == 0) return 0f;
            return (float)_totalGoldSpent / _totalGoldEarned;
        }

        public void Reset()
        {
            _gold = 0;
            _baseHealth = 0;
            _maxBaseHealth = 0;
            _elapsedTime = 0;
            _totalGoldEarned = 0;
            _totalGoldSpent = 0;
            _peakGold = 0;
        }
    }
}
