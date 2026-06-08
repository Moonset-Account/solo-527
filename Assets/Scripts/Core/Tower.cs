using System;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class Tower : IDisposable
    {
        public string InstanceId { get; private set; }
        public TowerConfig Config { get; private set; }
        public TowerSlot Slot { get; private set; }

        private int _currentLevel;
        private float _fireCooldown;
        private bool _isActive;
        private Vector3 _position;

        private List<Enemy> _targetsInRange;
        private Enemy _currentTarget;

        private TowerManager _towerManager;
        private EnemyManager _enemyManager;
        private WeatherSystem _weatherSystem;

        public int CurrentLevel => _currentLevel;
        public TowerLevel CurrentLevelData => Config.levels[Mathf.Min(_currentLevel - 1, Config.levels.Count - 1)];
        public Vector3 Position => _position;
        public bool IsActive => _isActive;
        public bool CanUpgrade => _currentLevel < Config.levels.Count;

        public event Action<Tower> OnLevelUp;
        public event Action<Tower, Enemy, float> OnFired;
        public event Action<Tower, Enemy> OnTargetChanged;

        public Tower(TowerConfig config, TowerSlot slot, TowerManager towerManager, EnemyManager enemyManager, WeatherSystem weatherSystem)
        {
            InstanceId = Guid.NewGuid().ToString();
            Config = config;
            Slot = slot;
            _position = new Vector3(slot.x, slot.y, slot.z);
            _towerManager = towerManager;
            _enemyManager = enemyManager;
            _weatherSystem = weatherSystem;
            _currentLevel = 1;
            _fireCooldown = 0;
            _isActive = true;
            _targetsInRange = new List<Enemy>();
        }

        public void Update(float deltaTime)
        {
            if (!_isActive) return;

            _fireCooldown -= deltaTime;
            UpdateTargetsInRange();
            SelectTarget();

            if (_fireCooldown <= 0 && _currentTarget != null && _currentTarget.IsAlive)
            {
                Fire();
                _fireCooldown = GetEffectiveFireRate();
            }
        }

        private void UpdateTargetsInRange()
        {
            _targetsInRange.Clear();
            float range = GetEffectiveRange();
            float rangeSq = range * range;

            foreach (var enemy in _enemyManager.GetActiveEnemies())
            {
                if (!enemy.IsAlive) continue;
                if ((enemy.Position - _position).sqrMagnitude <= rangeSq)
                {
                    if (!CanTargetEnemy(enemy)) continue;
                    _targetsInRange.Add(enemy);
                }
            }
        }

        private bool CanTargetEnemy(Enemy enemy)
        {
            if (enemy.Config.type == EnemyType.Flying)
            {
                return Config.type == TowerType.SingleTarget ||
                       Config.type == TowerType.Splash ||
                       Config.type == TowerType.AreaOfEffect;
            }
            return true;
        }

        private void SelectTarget()
        {
            Enemy newTarget = null;
            float bestProgress = -1f;

            foreach (var enemy in _targetsInRange)
            {
                float progress = enemy.NormalizedProgress;
                if (progress > bestProgress)
                {
                    bestProgress = progress;
                    newTarget = enemy;
                }
            }

            if (newTarget != _currentTarget)
            {
                _currentTarget = newTarget;
                OnTargetChanged?.Invoke(this, _currentTarget);
            }
        }

        private void Fire()
        {
            float damage = GetEffectiveDamage();
            TowerLevel levelData = CurrentLevelData;

            switch (Config.type)
            {
                case TowerType.SingleTarget:
                    _currentTarget.TakeDamage(damage, DamageType.Physical);
                    OnFired?.Invoke(this, _currentTarget, damage);
                    break;

                case TowerType.Splash:
                    float splashRadius = levelData.specialEffectValue;
                    _currentTarget.TakeDamage(damage, DamageType.Fire);
                    foreach (var enemy in _targetsInRange)
                    {
                        if (enemy != _currentTarget &&
                            Vector3.Distance(enemy.Position, _currentTarget.Position) <= splashRadius)
                        {
                            enemy.TakeDamage(damage * 0.6f, DamageType.Fire);
                            enemy.ApplyBurnEffect(damage * 0.2f, 2f);
                        }
                    }
                    OnFired?.Invoke(this, _currentTarget, damage);
                    break;

                case TowerType.Slow:
                    float slowValue = levelData.specialEffectValue;
                    _currentTarget.TakeDamage(damage, DamageType.Ice);
                    _currentTarget.ApplySlowEffect(slowValue, 2f);
                    OnFired?.Invoke(this, _currentTarget, damage);
                    break;

                case TowerType.Poison:
                    float poisonDps = levelData.specialEffectValue;
                    _currentTarget.TakeDamage(damage, DamageType.Poison);
                    _currentTarget.ApplyPoisonEffect(poisonDps, 5f);
                    OnFired?.Invoke(this, _currentTarget, damage);
                    break;

                case TowerType.AreaOfEffect:
                    float aoeRadius = levelData.specialEffectValue;
                    foreach (var enemy in _targetsInRange)
                    {
                        enemy.TakeDamage(damage, DamageType.Physical);
                    }
                    OnFired?.Invoke(this, _currentTarget, damage);
                    break;
            }
        }

        public float GetEffectiveRange()
        {
            float range = CurrentLevelData.range;
            range *= _weatherSystem?.GetRangeModifier() ?? 1f;
            return range;
        }

        public float GetEffectiveDamage()
        {
            float damage = CurrentLevelData.damage;
            damage *= _weatherSystem?.GetDamageModifier() ?? 1f;
            return damage;
        }

        public float GetEffectiveFireRate()
        {
            float rate = CurrentLevelData.fireRate;
            rate /= _weatherSystem?.GetFireRateModifier() ?? 1f;
            return rate;
        }

        public int GetUpgradeCost()
        {
            if (!CanUpgrade) return -1;
            return Config.levels[_currentLevel].upgradeCost;
        }

        public int GetSellValue()
        {
            int totalCost = Config.baseCost;
            for (int i = 1; i < _currentLevel; i++)
            {
                totalCost += Config.levels[i].upgradeCost;
            }
            return Mathf.FloorToInt(totalCost * 0.6f);
        }

        public bool Upgrade()
        {
            if (!CanUpgrade) return false;
            _currentLevel++;
            OnLevelUp?.Invoke(this);
            return true;
        }

        public void SetActive(bool active)
        {
            _isActive = active;
        }

        public List<Enemy> GetTargetsInRange()
        {
            return new List<Enemy>(_targetsInRange);
        }

        public Enemy GetCurrentTarget()
        {
            return _currentTarget;
        }

        public void Dispose()
        {
            OnLevelUp = null;
            OnFired = null;
            OnTargetChanged = null;
            _targetsInRange.Clear();
        }
    }
}
