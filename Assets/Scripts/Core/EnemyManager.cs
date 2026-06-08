using System;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class EnemyManager
    {
        private List<Enemy> _activeEnemies;
        private Queue<Enemy> _deadEnemyPool;
        private Dictionary<string, EnemyConfig> _enemyConfigs;
        private PathManager _pathManager;
        private int _currentWave;
        private float _waveHealthMultiplier;

        public int ActiveEnemyCount => _activeEnemies.Count;
        public int TotalKilled { get; private set; }
        public int TotalPassed { get; private set; }
        public int TotalDamageToBase { get; private set; }

        public event Action<Enemy> OnEnemySpawned;
        public event Action<Enemy> OnEnemyDied;
        public event Action<Enemy> OnEnemyReachedEnd;

        public EnemyManager(PathManager pathManager)
        {
            _pathManager = pathManager;
            _activeEnemies = new List<Enemy>();
            _deadEnemyPool = new Queue<Enemy>();
            _enemyConfigs = new Dictionary<string, EnemyConfig>();
        }

        public void SetEnemyConfigs(List<EnemyConfig> configs)
        {
            _enemyConfigs.Clear();
            foreach (var config in configs)
                _enemyConfigs[config.id] = config;
        }

        public void StartNewWave(int waveNumber)
        {
            _currentWave = waveNumber;
            _waveHealthMultiplier = 1f + (waveNumber - 1) * 0.1f;
        }

        public Enemy SpawnEnemy(string enemyId)
        {
            if (!_enemyConfigs.TryGetValue(enemyId, out var config))
            {
                Debug.LogError($"Enemy config not found: {enemyId}");
                return null;
            }

            Enemy enemy;
            if (_deadEnemyPool.Count > 0)
            {
                enemy = _deadEnemyPool.Dequeue();
                ResetEnemy(enemy, config);
            }
            else
            {
                enemy = new Enemy(config, _pathManager, _currentWave, _waveHealthMultiplier);
                enemy.OnDied += HandleEnemyDied;
                enemy.OnReachedEnd += HandleEnemyReachedEnd;
            }

            _activeEnemies.Add(enemy);
            OnEnemySpawned?.Invoke(enemy);
            return enemy;
        }

        private void ResetEnemy(Enemy enemy, EnemyConfig config)
        {
            typeof(Enemy).GetField("<Config>k__BackingField",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(enemy, config);

            typeof(Enemy).GetField("<InstanceId>k__BackingField",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(enemy, Guid.NewGuid().ToString());

            enemy.GetType().GetField("_currentHealth",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(enemy, config.baseHealth * (1f + (_currentWave - 1) * 0.1f));

            enemy.GetType().GetField("_distanceAlongPath",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(enemy, 0f);

            enemy.GetType().GetField("_isAlive",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(enemy, true);

            enemy.GetType().GetField("_reachedEnd",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)
                ?.SetValue(enemy, false);
        }

        private void HandleEnemyDied(Enemy enemy)
        {
            TotalKilled++;
            OnEnemyDied?.Invoke(enemy);
        }

        private void HandleEnemyReachedEnd(Enemy enemy)
        {
            TotalPassed++;
            TotalDamageToBase += enemy.Config.damageToBase;
            OnEnemyReachedEnd?.Invoke(enemy);
        }

        public void Update(float deltaTime)
        {
            for (int i = _activeEnemies.Count - 1; i >= 0; i--)
            {
                var enemy = _activeEnemies[i];
                enemy.Update(deltaTime);

                if (!enemy.IsAlive)
                {
                    _activeEnemies.RemoveAt(i);
                    if (_deadEnemyPool.Count < 50)
                        _deadEnemyPool.Enqueue(enemy);
                }
            }
        }

        public List<Enemy> GetActiveEnemies()
        {
            return _activeEnemies;
        }

        public void ApplyWeatherSpeedModifier(float modifier)
        {
            foreach (var enemy in _activeEnemies)
            {
                enemy.SetSpeedMultiplier(modifier);
            }
        }

        public void Reset()
        {
            foreach (var enemy in _activeEnemies)
            {
                enemy.OnDied -= HandleEnemyDied;
                enemy.OnReachedEnd -= HandleEnemyReachedEnd;
                enemy.Dispose();
            }
            _activeEnemies.Clear();
            _deadEnemyPool.Clear();
            TotalKilled = 0;
            TotalPassed = 0;
            TotalDamageToBase = 0;
            _currentWave = 0;
        }

        public int GetTotalDamageDealtEstimate()
        {
            int estimate = 0;
            foreach (var config in _enemyConfigs.Values)
            {
                estimate += config.baseHealth;
            }
            return estimate * Mathf.Max(1, TotalKilled / 5);
        }
    }
}
