using System;
using System.Collections.Generic;

namespace PixelPlantLab
{
    [Serializable]
    public class DexEntry
    {
        public string PlantId;
        public bool IsDiscovered;
        public DateTime FirstDiscoveredAt;
        public ExperimentParams FirstDiscoveryParams;
        public int DiscoveryCount;
        public List<DateTime> DiscoveryDates;
        public List<string> DiscoveryParamHistory;

        public DexEntry(string plantId)
        {
            PlantId = plantId;
            IsDiscovered = false;
            DiscoveryCount = 0;
            DiscoveryDates = new List<DateTime>();
            DiscoveryParamHistory = new List<string>();
        }

        public void RecordDiscovery(ExperimentParams parameters)
        {
            if (!IsDiscovered)
            {
                IsDiscovered = true;
                FirstDiscoveredAt = DateTime.Now;
                FirstDiscoveryParams = parameters.Clone();
            }
            DiscoveryCount++;
            DiscoveryDates.Add(DateTime.Now);
            DiscoveryParamHistory.Add(parameters.ToParamString());
        }
    }

    [Serializable]
    public class ExperimentLogEntry
    {
        public string LogId;
        public DateTime Timestamp;
        public ExperimentParams Parameters;
        public string ResultPlantId;
        public Rarity ResultRarity;
        public MutationTrait ResultTraits;
        public ExperimentStatus Status;
        public string Notes;
        public bool IsFirstDiscovery;
        public int ResourcesSpent;
        public int ResourcesRefunded;

        public ExperimentLogEntry()
        {
            LogId = Guid.NewGuid().ToString("N").Substring(0, 8);
            Timestamp = DateTime.Now;
        }

        public bool HasTrait(MutationTrait trait)
        {
            return (ResultTraits & trait) != 0;
        }
    }
}
