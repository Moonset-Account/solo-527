using System;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class Enemy : IDisposable
    {
        public string InstanceId { get; private set; }
        public EnemyConfig Config { get; private set; }

        private float _currentHealth;
        private float _distanceAlongPath;
        private float _baseMoveSpeed;
        private Vector3 _position;
        private bool _isAlive;
        private bool _reachedEnd;

        private float _slowEffectValue;
        private float _slowEffectDuration;
        private float _poisonDamagePerSecond;
        private float _poisonEffectDuration;
        private float _burnDamagePerSecond;
        private float _burnEffectDuration;

        private PathManager _pathManager;

        public float CurrentHealth => _currentHealth;
        public float MaxHealth => Config.baseHealth * _healthMultiplier;
        public float DistanceAlongPath => _distanceAlongPath;
        public Vector3 Position => _position;
        public bool IsAlive => _isAlive;
        public bool ReachedEnd => _reachedEnd;
        public float NormalizedProgress => _pathManager?.GetNormalizedProgress(_distanceAlongPath) ?? 0;

        public event Action<Enemy> OnDied;
        public event Action<Enemy> OnReachedEnd;
        public event Action<Enemy, float> OnDamaged;
        public event Action<Enemy, string, float> OnStatusApplied;

        private float _healthMultiplier = 1f;
        private float _speedMultiplier = 1f;
        private int _waveNumber;

        public Enemy(EnemyConfig config, PathManager pathManager, int waveNumber, float healthMultiplier = 1f)
        {
            InstanceId = Guid.NewGuid().ToString();
            Config = config;
            _pathManager = pathManager;
            _waveNumber = waveNumber;
            _healthMultiplier = healthMultiplier;
            _baseMoveSpeed = config.moveSpeed;
            _currentHealth = MaxHealth;
            _position = pathManager.GetStartPoint();
            _isAlive = true;
            _reachedEnd = false;
        }

        public void Update(float deltaTime)
        {
            if (!_isAlive) return;

            UpdateEffects(deltaTime);

            float currentSpeed = GetEffectiveSpeed();
            _distanceAlongPath += currentSpeed * deltaTime;
            _position = _pathManager.GetPointAtDistance(_distanceAlongPath);

            if (_distanceAlongPath >= _pathManager.TotalLength)
            {
                _reachedEnd = true;
                _isAlive = false;
                OnReachedEnd?.Invoke(this);
            }
        }

        private void UpdateEffects(float deltaTime)
        {
            if (_slowEffectDuration > 0)
            {
                _slowEffectDuration -= deltaTime;
                if (_slowEffectDuration <= 0) _slowEffectValue = 0;
            }

            if (_poisonEffectDuration > 0)
            {
                _poisonEffectDuration -= deltaTime;
                TakeDamage(_poisonDamagePerSecond * deltaTime, DamageType.Poison);
            }

            if (_burnEffectDuration > 0)
            {
                _burnEffectDuration -= deltaTime;
                TakeDamage(_burnDamagePerSecond * deltaTime, DamageType.Fire);
            }
        }

        public float GetEffectiveSpeed()
        {
            float speed = _baseMoveSpeed * _speedMultiplier;
            if (_slowEffectValue > 0)
            {
                speed *= (1f - Mathf.Clamp01(_slowEffectValue));
            }
            return Mathf.Max(0.1f, speed);
        }

        public void SetSpeedMultiplier(float multiplier)
        {
            _speedMultiplier = multiplier;
        }

        public void TakeDamage(float damage, DamageType damageType = DamageType.Physical)
        {
            if (!_isAlive) return;

            float actualDamage = ApplyResistances(damage, damageType);
            _currentHealth -= actualDamage;
            OnDamaged?.Invoke(this, actualDamage);

            if (_currentHealth <= 0)
            {
                _currentHealth = 0;
                _isAlive = false;
                OnDied?.Invoke(this);
            }
        }

        private float ApplyResistances(float damage, DamageType damageType)
        {
            float resistance = 0f;
            switch (damageType)
            {
                case DamageType.Fire:
                    resistance = Config.fireResistance;
                    break;
                case DamageType.Ice:
                    resistance = Config.iceResistance;
                    break;
                case DamageType.Poison:
                    resistance = Config.poisonResistance;
                    break;
            }
            return damage * (1f - Mathf.Clamp01(resistance));
        }

        public void ApplySlowEffect(float value, float duration)
        {
            if (value > _slowEffectValue || duration > _slowEffectDuration)
            {
                _slowEffectValue = Mathf.Max(_slowEffectValue, value);
                _slowEffectDuration = Mathf.Max(_slowEffectDuration, duration);
                OnStatusApplied?.Invoke(this, "slow", value);
            }
        }

        public void ApplyPoisonEffect(float dps, float duration)
        {
            _poisonDamagePerSecond = Mathf.Max(_poisonDamagePerSecond, dps);
            _poisonEffectDuration = Mathf.Max(_poisonEffectDuration, duration);
            OnStatusApplied?.Invoke(this, "poison", dps);
        }

        public void ApplyBurnEffect(float dps, float duration)
        {
            _burnDamagePerSecond = Mathf.Max(_burnDamagePerSecond, dps);
            _burnEffectDuration = Mathf.Max(_burnEffectDuration, duration);
            OnStatusApplied?.Invoke(this, "burn", dps);
        }

        public bool HasAnyEffect()
        {
            return _slowEffectDuration > 0 || _poisonEffectDuration > 0 || _burnEffectDuration > 0;
        }

        public void Dispose()
        {
            OnDied = null;
            OnReachedEnd = null;
            OnDamaged = null;
            OnStatusApplied = null;
        }
    }

    public enum DamageType
    {
        Physical,
        Fire,
        Ice,
        Poison
    }
}
