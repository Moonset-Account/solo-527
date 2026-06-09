using System;
using System.Collections.Generic;
using UnityEngine;

namespace PixelPlantLab
{
    public class ExperimentLogManager : MonoBehaviour
    {
        public static ExperimentLogManager Instance { get; private set; }

        private readonly List<ExperimentLogEntry> _logs = new List<ExperimentLogEntry>();
        private readonly Dictionary<Rarity, int> _rarityCounts = new Dictionary<Rarity, int>();
        private readonly Dictionary<MutationTrait, int> _traitCounts = new Dictionary<MutationTrait, int>();

        public event Action<ExperimentLogEntry> OnLogAdded;
        public event Action OnLogUpdated;

        public IReadOnlyList<ExperimentLogEntry> Logs => _logs;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            foreach (Rarity r in Enum.GetValues(typeof(Rarity)))
                _rarityCounts[r] = 0;
        }

        public ExperimentLogEntry AddLog(ExperimentParams parameters, PlantMutation resultPlant,
            ExperimentStatus status, bool isFirstDiscovery, int resourcesSpent, int resourcesRefunded,
            string notes = "")
        {
            var entry = new ExperimentLogEntry
            {
                Parameters = parameters.Clone(),
                ResultPlantId = resultPlant?.Id ?? "null",
                ResultRarity = resultPlant?.Rarity ?? Rarity.Failure,
                ResultTraits = resultPlant?.Traits ?? MutationTrait.None,
                Status = status,
                IsFirstDiscovery = isFirstDiscovery,
                ResourcesSpent = resourcesSpent,
                ResourcesRefunded = resourcesRefunded,
                Notes = notes
            };

            _logs.Insert(0, entry);

            if (resultPlant != null)
            {
                _rarityCounts[resultPlant.Rarity]++;
                foreach (MutationTrait t in Enum.GetValues(typeof(MutationTrait)))
                {
                    if (t != MutationTrait.None && resultPlant.HasTrait(t))
                    {
                        if (!_traitCounts.ContainsKey(t)) _traitCounts[t] = 0;
                        _traitCounts[t]++;
                    }
                }
            }

            OnLogAdded?.Invoke(entry);
            OnLogUpdated?.Invoke();
            return entry;
        }

        public List<ExperimentLogEntry> FilterByRarity(Rarity rarity)
        {
            return _logs.FindAll(l => l.ResultRarity == rarity);
        }

        public List<ExperimentLogEntry> FilterByTrait(MutationTrait trait)
        {
            return _logs.FindAll(l => l.HasTrait(trait));
        }

        public List<ExperimentLogEntry> FilterByTraits(MutationTrait traitMask)
        {
            return _logs.FindAll(l => (l.ResultTraits & traitMask) != 0);
        }

        public List<ExperimentLogEntry> FilterByStatus(ExperimentStatus status)
        {
            return _logs.FindAll(l => l.Status == status);
        }

        public List<ExperimentLogEntry> FilterByDateRange(DateTime start, DateTime end)
        {
            return _logs.FindAll(l => l.Timestamp >= start && l.Timestamp <= end);
        }

        public List<ExperimentLogEntry> FilterByFirstDiscovery()
        {
            return _logs.FindAll(l => l.IsFirstDiscovery);
        }

        public int GetRarityCount(Rarity rarity) => _rarityCounts.ContainsKey(rarity) ? _rarityCounts[rarity] : 0;
        public int GetTraitCount(MutationTrait trait) => _traitCounts.ContainsKey(trait) ? _traitCounts[trait] : 0;
        public int GetTotalExperiments => _logs.Count;
        public int GetSuccessCount => _logs.FindAll(l => l.Status == ExperimentStatus.Completed).Count;
        public int GetFailureCount => _logs.FindAll(l => l.Status == ExperimentStatus.Failed).Count;
        public int GetAbortedCount => _logs.FindAll(l => l.Status == ExperimentStatus.Aborted).Count;

        public string GetStatisticsSummary()
        {
            int total = GetTotalExperiments;
            if (total == 0) return "暂无实验记录";

            float successRate = (float)GetSuccessCount / total * 100f;
            int discoveries = FilterByFirstDiscovery().Count;
            return $"总实验: {total} | 成功率: {successRate:F1}% | 新发现: {discoveries} | " +
                   $"普通: {GetRarityCount(Rarity.Common)} 稀有: {GetRarityCount(Rarity.Rare)} " +
                   $"传说: {GetRarityCount(Rarity.Legendary)} 失败: {GetRarityCount(Rarity.Failure)}";
        }

        public void ClearAllLogs()
        {
            _logs.Clear();
            foreach (var k in new List<Rarity>(_rarityCounts.Keys)) _rarityCounts[k] = 0;
            _traitCounts.Clear();
            OnLogUpdated?.Invoke();
        }
    }
}
