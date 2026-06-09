using System;
using System.Collections.Generic;
using UnityEngine;

namespace PixelPlantLab
{
    public class DexManager : MonoBehaviour
    {
        public static DexManager Instance { get; private set; }

        private readonly Dictionary<string, DexEntry> _entries = new Dictionary<string, DexEntry>();

        public event Action<string, DexEntry> OnPlantDiscovered;
        public event Action<string> OnDexUpdated;

        public int TotalPlants => PlantDatabase.AllPlants.Count;
        public int DiscoveredCount
        {
            get
            {
                int count = 0;
                foreach (var e in _entries.Values) if (e.IsDiscovered) count++;
                return count;
            }
        }

        public int FailureDiscovered
        {
            get
            {
                int count = 0;
                foreach (var p in PlantDatabase.GetPlantsByRarity(Rarity.Failure))
                {
                    if (_entries.ContainsKey(p.Id) && _entries[p.Id].IsDiscovered) count++;
                }
                return count;
            }
        }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            InitializeDex();
        }

        private void InitializeDex()
        {
            _entries.Clear();
            foreach (var plant in PlantDatabase.AllPlants)
            {
                _entries[plant.Id] = new DexEntry(plant.Id);
            }
        }

        public bool RecordDiscovery(PlantMutation plant, ExperimentParams parameters, out bool isFirstTime)
        {
            isFirstTime = false;
            if (plant == null || !_entries.ContainsKey(plant.Id)) return false;

            var entry = _entries[plant.Id];
            int prevCount = entry.DiscoveryCount;

            entry.RecordDiscovery(parameters);

            if (prevCount == 0)
            {
                isFirstTime = true;
                OnPlantDiscovered?.Invoke(plant.Id, entry);
            }

            OnDexUpdated?.Invoke(plant.Id);
            return true;
        }

        public DexEntry GetEntry(string plantId)
        {
            return _entries.ContainsKey(plantId) ? _entries[plantId] : null;
        }

        public bool IsDiscovered(string plantId)
        {
            return _entries.ContainsKey(plantId) && _entries[plantId].IsDiscovered;
        }

        public List<DexEntry> GetAllEntries()
        {
            return new List<DexEntry>(_entries.Values);
        }

        public List<DexEntry> GetEntriesByRarity(Rarity rarity)
        {
            var result = new List<DexEntry>();
            var plants = PlantDatabase.GetPlantsByRarity(rarity);
            foreach (var p in plants)
            {
                if (_entries.ContainsKey(p.Id)) result.Add(_entries[p.Id]);
            }
            return result;
        }

        public List<DexEntry> GetEntriesWithTrait(MutationTrait trait)
        {
            var result = new List<DexEntry>();
            var plants = PlantDatabase.GetPlantsWithTrait(trait);
            foreach (var p in plants)
            {
                if (_entries.ContainsKey(p.Id)) result.Add(_entries[p.Id]);
            }
            return result;
        }

        public List<PlantMutation> GetUndiscoveredPlants()
        {
            var result = new List<PlantMutation>();
            foreach (var p in PlantDatabase.AllPlants)
            {
                if (!_entries.ContainsKey(p.Id) || !_entries[p.Id].IsDiscovered)
                    result.Add(p);
            }
            return result;
        }

        public string GetDiscoveryProgressString()
        {
            return $"图鉴: {DiscoveredCount}/{TotalPlants} (含失败 {FailureDiscovered} 种)";
        }
    }
}
