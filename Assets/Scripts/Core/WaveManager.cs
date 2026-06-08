using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TeaGardenDefense.Config;

namespace TeaGardenDefense.Core
{
    public class WaveManager
    {
        private List<WaveConfig> _waveConfigs;
        private int _currentWaveIndex;
        private bool _isWaveActive;
        private bool _isBetweenWaves;
        private float _waveTimer;
        private EnemyManager _enemyManager;

        private CoroutineRunner _coroutineRunner;
        private List<IEnumerator> _activeCoroutines;

        public int CurrentWaveNumber => _currentWaveIndex + 1;
        public int TotalWaves => _waveConfigs?.Count ?? 0;
        public bool IsWaveActive => _isWaveActive;
        public bool IsBetweenWaves => _isBetweenWaves;
        public float WaveTimer => _waveTimer;
        public bool AllWavesCompleted => _currentWaveIndex >= TotalWaves && !_isWaveActive;
        public int LastWaveReward { get; private set; }

        public event Action<int> OnWaveStarted;
        public event Action<int> OnWaveCompleted;
        public event Action<int, float> OnPreWaveCountdown;
        public event Action OnAllWavesCompleted;

        public WaveManager(EnemyManager enemyManager)
        {
            _enemyManager = enemyManager;
            _activeCoroutines = new List<IEnumerator>();
        }

        public void Initialize(List<WaveConfig> waveConfigs, MonoBehaviour coroutineHost)
        {
            _waveConfigs = waveConfigs;
            _currentWaveIndex = -1;
            _isWaveActive = false;
            _isBetweenWaves = false;
            _waveTimer = 0;
            _coroutineRunner = new CoroutineRunner(coroutineHost);
        }

        public void StartNextWave()
        {
            if (_isWaveActive) return;
            if (AllWavesCompleted) return;

            _currentWaveIndex++;
            StartWaveInternal(_currentWaveIndex);
        }

        private void StartWaveInternal(int waveIndex)
        {
            if (waveIndex >= _waveConfigs.Count) return;

            var wave = _waveConfigs[waveIndex];
            _isWaveActive = true;
            _isBetweenWaves = false;
            LastWaveReward = wave.reward;
            _enemyManager.StartNewWave(wave.waveNumber);

            OnWaveStarted?.Invoke(wave.waveNumber);

            var coroutine = RunWave(wave);
            _activeCoroutines.Add(coroutine);
            _coroutineRunner.StartCoroutine(coroutine);
        }

        private IEnumerator RunWave(WaveConfig wave)
        {
            if (wave.preDelay > 0)
            {
                _isBetweenWaves = true;
                float countdown = wave.preDelay;
                while (countdown > 0)
                {
                    OnPreWaveCountdown?.Invoke(wave.waveNumber, countdown);
                    yield return new WaitForSeconds(0.1f);
                    countdown -= 0.1f;
                }
                _isBetweenWaves = false;
            }

            List<IEnumerator> spawnCoroutines = new List<IEnumerator>();
            foreach (var spawn in wave.spawns)
            {
                var coroutine = SpawnEnemyRoutine(spawn);
                spawnCoroutines.Add(coroutine);
                _coroutineRunner.StartCoroutine(coroutine);
            }

            bool allSpawned = false;
            while (!allSpawned)
            {
                allSpawned = true;
                foreach (var spawn in wave.spawns)
                {
                    if (spawn.startDelay > 0) continue;
                }
                yield return null;

                allSpawned = true;
                foreach (var c in spawnCoroutines)
                {
                    if (c.MoveNext())
                    {
                        allSpawned = false;
                        break;
                    }
                }
                if (allSpawned) break;
            }

            while (_enemyManager.ActiveEnemyCount > 0)
            {
                yield return null;
            }

            _isWaveActive = false;
            OnWaveCompleted?.Invoke(wave.waveNumber);

            if (_currentWaveIndex >= TotalWaves - 1)
            {
                OnAllWavesCompleted?.Invoke();
            }
        }

        private IEnumerator SpawnEnemyRoutine(WaveSpawn spawn)
        {
            if (spawn.startDelay > 0)
                yield return new WaitForSeconds(spawn.startDelay);

            for (int i = 0; i < spawn.count; i++)
            {
                _enemyManager.SpawnEnemy(spawn.enemyId);
                if (i < spawn.count - 1 && spawn.interval > 0)
                    yield return new WaitForSeconds(spawn.interval);
            }
        }

        public void Update(float deltaTime)
        {
            if (_isWaveActive)
            {
                _waveTimer += deltaTime;
            }
        }

        public WaveConfig GetCurrentWave()
        {
            if (_currentWaveIndex >= 0 && _currentWaveIndex < _waveConfigs.Count)
                return _waveConfigs[_currentWaveIndex];
            return null;
        }

        public WaveConfig GetNextWave()
        {
            int nextIndex = _currentWaveIndex + 1;
            if (nextIndex >= 0 && nextIndex < _waveConfigs.Count)
                return _waveConfigs[nextIndex];
            return null;
        }

        public List<WaveConfig> GetRemainingWaves()
        {
            var remaining = new List<WaveConfig>();
            for (int i = _currentWaveIndex + 1; i < _waveConfigs.Count; i++)
            {
                remaining.Add(_waveConfigs[i]);
            }
            return remaining;
        }

        public void Reset()
        {
            foreach (var coroutine in _activeCoroutines)
            {
                _coroutineRunner.StopCoroutine(coroutine);
            }
            _activeCoroutines.Clear();
            _currentWaveIndex = -1;
            _isWaveActive = false;
            _isBetweenWaves = false;
            _waveTimer = 0;
            LastWaveReward = 0;
        }
    }

    public class CoroutineRunner
    {
        private MonoBehaviour _host;

        public CoroutineRunner(MonoBehaviour host)
        {
            _host = host;
        }

        public Coroutine StartCoroutine(IEnumerator routine)
        {
            return _host.StartCoroutine(routine);
        }

        public void StopCoroutine(IEnumerator routine)
        {
            _host.StopCoroutine(routine);
        }

        public void StopCoroutine(Coroutine coroutine)
        {
            _host.StopCoroutine(coroutine);
        }
    }
}
