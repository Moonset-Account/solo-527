using System;
using System.Collections;
using System.Collections.Generic;
using Kitchen.Config;
using Kitchen.Core;
using Kitchen.Gameplay;
using UnityEngine;

namespace Kitchen.Levels
{
    public class LevelManager : MonoBehaviour
    {
        public static LevelManager Instance { get; private set; }

        [Header("References")]
        public Transform stationSpawnRoot;
        public GameObject[] stationPrefabs;
        public Transform hazardVisualRoot;

        [Header("Runtime")]
        [SerializeField] private List<GameObject> spawnedStations = new List<GameObject>();
        [SerializeField] private List<ActiveHazard> activeHazards = new List<ActiveHazard>();
        [SerializeField] private float difficultyTimeMultiplier = 1f;
        [SerializeField] private int currentComplexityLevel = 0;

        public event Action<LevelHazard> OnHazardTriggered;
        public event Action<LevelHazard> OnHazardEnded;
        public event Action<int> OnComplexityChanged;

        private LevelConfig currentLevel;

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        private void OnEnable()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnStateChanged += HandleStateChanged;
                GameManager.Instance.OnTimerTick += HandleTimerTick;
            }
        }

        private void OnDisable()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnStateChanged -= HandleStateChanged;
                GameManager.Instance.OnTimerTick -= HandleTimerTick;
            }
        }

        private void HandleStateChanged(GameManager.GameState oldS, GameManager.GameState newS)
        {
            if (newS == GameManager.GameState.Countdown && GameManager.Instance.currentLevelConfig != null)
            {
                SetupLevel(GameManager.Instance.currentLevelConfig);
            }
            else if (newS == GameManager.GameState.Playing)
            {
                StartCoroutine(ProcessHazards());
            }
            else if (newS == GameManager.GameState.LevelComplete || newS == GameManager.GameState.LevelFailed)
            {
                CleanupLevel();
            }
        }

        private void HandleTimerTick(float remaining)
        {
            if (GameManager.Instance?.CurrentState != GameManager.GameState.Playing) return;
            float elapsed = currentLevel != null ? currentLevel.levelDurationSeconds - remaining : 0f;
            UpdateComplexity(elapsed);
        }

        public void SetupLevel(LevelConfig config)
        {
            currentLevel = config;
            ClearStations();

            foreach (var stationCfg in config.stations)
            {
                SpawnStation(stationCfg);
            }

            difficultyTimeMultiplier = 1f;
            currentComplexityLevel = 0;
        }

        private void SpawnStation(StationConfig config)
        {
            int prefabIdx = (int)config.type;
            if (stationPrefabs == null || prefabIdx < 0 || prefabIdx >= stationPrefabs.Length) return;

            GameObject prefab = stationPrefabs[prefabIdx];
            if (prefab == null) return;

            GameObject stationObj = Instantiate(prefab, stationSpawnRoot != null ? stationSpawnRoot.position + config.position : config.position, Quaternion.identity);
            if (stationSpawnRoot != null) stationObj.transform.SetParent(stationSpawnRoot);

            StationBase station = stationObj.GetComponent<StationBase>();
            if (station != null)
            {
                station.stationId = config.id;
                station.interactionRadius = config.interactionRadius;
            }

            IngredientBox box = stationObj.GetComponent<IngredientBox>();
            if (box != null) box.storedIngredient = config.storedIngredient;

            spawnedStations.Add(stationObj);
        }

        private void ClearStations()
        {
            foreach (var s in spawnedStations) if (s != null) Destroy(s);
            spawnedStations.Clear();
            activeHazards.Clear();
        }

        private void UpdateComplexity(float elapsed)
        {
            if (currentLevel == null) return;
            float progress = elapsed / currentLevel.levelDurationSeconds;
            int complexity = Mathf.FloorToInt(progress * currentLevel.difficultyCurve.maxComplexityIncrease);

            if (complexity != currentComplexityLevel)
            {
                currentComplexityLevel = complexity;
                OnComplexityChanged?.Invoke(complexity);
                difficultyTimeMultiplier = 1f - (complexity * 0.02f);
                difficultyTimeMultiplier = Mathf.Max(0.7f, difficultyTimeMultiplier);
            }
        }

        private IEnumerator ProcessHazards()
        {
            if (currentLevel == null) yield break;

            float startTime = Time.time;
            List<LevelHazard> triggered = new List<LevelHazard>();

            while (GameManager.Instance?.CurrentState == GameManager.GameState.Playing)
            {
                float elapsed = Time.time - startTime;

                foreach (var hz in currentLevel.hazards)
                {
                    if (triggered.Contains(hz)) continue;
                    if (elapsed >= hz.triggerTime)
                    {
                        triggered.Add(hz);
                        StartCoroutine(RunHazard(hz));
                    }
                }

                yield return null;
            }
        }

        private IEnumerator RunHazard(LevelHazard hazard)
        {
            ActiveHazard active = new ActiveHazard { config = hazard, startTime = Time.time };
            activeHazards.Add(active);
            OnHazardTriggered?.Invoke(hazard);
            ApplyHazardEffect(hazard, true);

            float endTime = Time.time + hazard.duration;
            while (Time.time < endTime)
            {
                UpdateHazardVisual(hazard);
                yield return null;
            }

            ApplyHazardEffect(hazard, false);
            activeHazards.Remove(active);
            OnHazardEnded?.Invoke(hazard);
        }

        private void ApplyHazardEffect(LevelHazard hazard, bool isStart)
        {
            switch (hazard.type)
            {
                case HazardType.Fire:
                    if (isStart) SpawnFireHazard(hazard.magnitude);
                    break;
                case HazardType.MovingTable:
                    StartCoroutine(MoveTables(hazard.duration, hazard.magnitude));
                    break;
                case HazardType.PowerOutage:
                    SetLightsEnabled(!isStart);
                    break;
                case HazardType.CrowdedSpace:
                    SetNarrowPathVisuals(isStart);
                    break;
                case HazardType.SlipperyFloor:
                    SetSlippery(isStart);
                    break;
                case HazardType.ConveyorSpeed:
                    AdjustConveyorSpeed(isStart ? hazard.magnitude : 1f);
                    break;
            }
        }

        private void SpawnFireHazard(float magnitude)
        {
            Stove[] stoves = FindObjectsOfType<Stove>();
            foreach (var s in stoves)
            {
                if (UnityEngine.Random.value < magnitude * 0.3f)
                {
                    ParticleSystem ps = s.GetComponentInChildren<ParticleSystem>();
                    if (ps != null) { var main = ps.main; main.startColor = Color.red; ps.Play(); }
                }
            }
        }

        private IEnumerator MoveTables(float duration, float magnitude)
        {
            Vector3[] originalPos = new Vector3[spawnedStations.Count];
            for (int i = 0; i < spawnedStations.Count; i++)
                if (spawnedStations[i] != null) originalPos[i] = spawnedStations[i].transform.position;

            float t = 0f;
            while (t < duration)
            {
                t += Time.deltaTime;
                for (int i = 0; i < spawnedStations.Count; i++)
                {
                    if (spawnedStations[i] == null) continue;
                    Vector3 offset = new Vector3(Mathf.Sin(t * 2 + i) * magnitude * 0.3f, 0, 0);
                    spawnedStations[i].transform.position = originalPos[i] + offset;
                }
                yield return null;
            }

            for (int i = 0; i < spawnedStations.Count; i++)
                if (spawnedStations[i] != null) spawnedStations[i].transform.position = originalPos[i];
        }

        private void SetLightsEnabled(bool enabled)
        {
            Light[] lights = FindObjectsOfType<Light>();
            foreach (var l in lights) l.enabled = enabled;
        }

        private void SetNarrowPathVisuals(bool enabled)
        {
        }

        private void SetSlippery(bool slippery)
        {
            PlayerController[] players = FindObjectsOfType<PlayerController>();
            foreach (var p in players)
            {
                Rigidbody rb = p.GetComponent<Rigidbody>();
                if (rb != null) rb.drag = slippery ? 0.1f : 3f;
            }
        }

        private void AdjustConveyorSpeed(float speedMultiplier)
        {
        }

        private void UpdateHazardVisual(LevelHazard hazard)
        {
        }

        private void CleanupLevel()
        {
            StopAllCoroutines();
        }

        public bool IsHazardActive(HazardType type)
        {
            foreach (var h in activeHazards)
                if (h.config.type == type) return true;
            return false;
        }

        public int GetActiveHazardCount()
        {
            return activeHazards.Count;
        }

        private class ActiveHazard
        {
            public LevelHazard config;
            public float startTime;
        }
    }
}
