using System;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class TowerManager
    {
        private Dictionary<string, Tower> _towers;
        private Dictionary<string, TowerSlot> _towerSlots;
        private Dictionary<string, TowerConfig> _towerConfigs;
        private EnemyManager _enemyManager;
        private WeatherSystem _weatherSystem;
        private ResourceManager _resourceManager;

        public int TowerCount => _towers.Count;
        public int UnlockedSlotCount { get; private set; }

        public event Action<Tower> OnTowerPlaced;
        public event Action<Tower> OnTowerRemoved;
        public event Action<Tower> OnTowerUpgraded;
        public event Action<string> OnSlotUnlocked;

        public TowerManager(EnemyManager enemyManager, WeatherSystem weatherSystem, ResourceManager resourceManager)
        {
            _towers = new Dictionary<string, Tower>();
            _towerSlots = new Dictionary<string, TowerSlot>();
            _towerConfigs = new Dictionary<string, TowerConfig>();
            _enemyManager = enemyManager;
            _weatherSystem = weatherSystem;
            _resourceManager = resourceManager;
        }

        public void SetTowerConfigs(List<TowerConfig> configs)
        {
            _towerConfigs.Clear();
            foreach (var config in configs)
                _towerConfigs[config.id] = config;
        }

        public void SetTowerSlots(List<TowerSlot> slots)
        {
            _towerSlots.Clear();
            UnlockedSlotCount = 0;
            foreach (var slot in slots)
            {
                _towerSlots[slot.slotId] = slot;
                if (slot.isUnlocked) UnlockedSlotCount++;
            }
        }

        public bool CanPlaceTower(string slotId, string towerId)
        {
            if (!_towerSlots.TryGetValue(slotId, out var slot)) return false;
            if (!slot.isUnlocked) return false;
            if (_towers.ContainsKey(slotId)) return false;
            if (!_towerConfigs.ContainsKey(towerId)) return false;

            var config = _towerConfigs[towerId];
            return _resourceManager.CanAfford(config.baseCost);
        }

        public Tower PlaceTower(string slotId, string towerId)
        {
            if (!CanPlaceTower(slotId, towerId)) return null;

            var slot = _towerSlots[slotId];
            var config = _towerConfigs[towerId];

            if (!_resourceManager.SpendGold(config.baseCost)) return null;

            var tower = new Tower(config, slot, this, _enemyManager, _weatherSystem);
            _towers[slotId] = tower;
            OnTowerPlaced?.Invoke(tower);
            return tower;
        }

        public bool RemoveTower(string slotId)
        {
            if (!_towers.TryGetValue(slotId, out var tower)) return false;

            int refund = tower.GetSellValue();
            _resourceManager.AddGold(refund);

            tower.Dispose();
            _towers.Remove(slotId);
            OnTowerRemoved?.Invoke(tower);
            return true;
        }

        public bool CanUpgradeTower(string slotId)
        {
            if (!_towers.TryGetValue(slotId, out var tower)) return false;
            if (!tower.CanUpgrade) return false;
            return _resourceManager.CanAfford(tower.GetUpgradeCost());
        }

        public bool UpgradeTower(string slotId)
        {
            if (!CanUpgradeTower(slotId)) return false;

            var tower = _towers[slotId];
            int cost = tower.GetUpgradeCost();

            if (!_resourceManager.SpendGold(cost)) return false;

            tower.Upgrade();
            OnTowerUpgraded?.Invoke(tower);
            return true;
        }

        public bool CanUnlockSlot(string slotId)
        {
            if (!_towerSlots.TryGetValue(slotId, out var slot)) return false;
            if (slot.isUnlocked) return false;
            return _resourceManager.CanAfford(slot.unlockCost);
        }

        public bool UnlockSlot(string slotId)
        {
            if (!CanUnlockSlot(slotId)) return false;

            var slot = _towerSlots[slotId];
            if (!_resourceManager.SpendGold(slot.unlockCost)) return false;

            slot.isUnlocked = true;
            UnlockedSlotCount++;
            OnSlotUnlocked?.Invoke(slotId);
            return true;
        }

        public Tower GetTower(string slotId)
        {
            _towers.TryGetValue(slotId, out var tower);
            return tower;
        }

        public TowerSlot GetSlot(string slotId)
        {
            _towerSlots.TryGetValue(slotId, out var slot);
            return slot;
        }

        public List<Tower> GetAllTowers()
        {
            return new List<Tower>(_towers.Values);
        }

        public List<TowerSlot> GetAllSlots()
        {
            return new List<TowerSlot>(_towerSlots.Values);
        }

        public Dictionary<string, int> GetTowerTypeCounts()
        {
            var counts = new Dictionary<string, int>();
            foreach (var tower in _towers.Values)
            {
                string type = tower.Config.type.ToString();
                counts[type] = counts.ContainsKey(type) ? counts[type] + 1 : 1;
            }
            return counts;
        }

        public int GetTotalDPS()
        {
            int totalDps = 0;
            foreach (var tower in _towers.Values)
            {
                float damage = tower.GetEffectiveDamage();
                float fireRate = 1f / tower.GetEffectiveFireRate();
                totalDps += Mathf.FloorToInt(damage * fireRate);
            }
            return totalDps;
        }

        public int GetAverageTowerLevel()
        {
            if (_towers.Count == 0) return 0;
            int sum = 0;
            foreach (var tower in _towers.Values)
                sum += tower.CurrentLevel;
            return Mathf.RoundToInt((float)sum / _towers.Count);
        }

        public void Update(float deltaTime)
        {
            foreach (var tower in _towers.Values)
            {
                tower.Update(deltaTime);
            }
        }

        public void Reset()
        {
            foreach (var tower in _towers.Values)
            {
                tower.Dispose();
            }
            _towers.Clear();
        }
    }
}
