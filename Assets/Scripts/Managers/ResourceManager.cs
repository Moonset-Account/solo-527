using System;
using UnityEngine;

namespace PixelPlantLab
{
    public class ResourceManager : MonoBehaviour
    {
        public static ResourceManager Instance { get; private set; }

        [Header("初始资源")]
        public int InitialSeeds = 20;
        public int InitialNutrients = 15;
        public int InitialCredits = 100;

        [Header("单次实验消耗")]
        public int SeedCostPerExperiment = 1;
        public int NutrientCostPerExperiment = 1;
        public int CreditCostPerExperiment = 5;

        [Header("资源返还比例")]
        [Range(0f, 1f)] public float AbortRefundRate = 0.5f;
        [Range(0f, 1f)] public float SuccessRefundRate = 0f;
        [Range(0f, 1f)] public float FailureRefundRate = 0.2f;

        [Header("发现奖励")]
        public int FirstDiscoveryCreditBonus = 20;
        public int RareDiscoveryCreditBonus = 10;
        public int LegendaryDiscoveryCreditBonus = 50;

        public ResourceData CurrentResources { get; private set; }

        public event Action<ResourceData, ResourceData> OnResourcesChanged;

        private void Awake()
        {
            InitializeSingleton();
        }

        public void InitializeSingleton()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            CurrentResources = new ResourceData(InitialSeeds, InitialNutrients, InitialCredits);
        }

        public ResourceData GetExperimentCost(ExperimentParams parameters)
        {
            float nutrientMultiplier = 1f + (parameters.SoilNitrogen + parameters.SoilPhosphorus + parameters.SoilPotassium) * 0.3f;
            float timeMultiplier = 1f + parameters.CultureTime * 0.5f;

            return new ResourceData(
                SeedCostPerExperiment,
                Mathf.CeilToInt(NutrientCostPerExperiment * nutrientMultiplier),
                Mathf.CeilToInt(CreditCostPerExperiment * timeMultiplier)
            );
        }

        public int GetTotalCostValue(ResourceData cost)
        {
            return cost.Seeds * 10 + cost.Nutrients * 8 + cost.Credits;
        }

        public bool CanAffordExperiment(ExperimentParams parameters, out ResourceData cost)
        {
            cost = GetExperimentCost(parameters);
            return CurrentResources.CanAfford(cost);
        }

        public bool DeductExperimentCost(ExperimentParams parameters, out ResourceData deducted, out ResourceData cost)
        {
            cost = GetExperimentCost(parameters);
            if (!CurrentResources.CanAfford(cost))
            {
                deducted = new ResourceData();
                return false;
            }
            var before = CurrentResources;
            CurrentResources = CurrentResources - cost;
            deducted = cost;
            OnResourcesChanged?.Invoke(before, CurrentResources);
            return true;
        }

        public ResourceData RefundResources(ExperimentStatus status, ResourceData originalCost, float progressRatio = 0f)
        {
            float rate = status switch
            {
                ExperimentStatus.Completed => SuccessRefundRate,
                ExperimentStatus.Failed => FailureRefundRate,
                ExperimentStatus.Aborted => AbortRefundRate * Mathf.Max(0.3f, 1f - progressRatio),
                _ => 0f
            };

            var refund = originalCost.Scale(rate);
            if (refund.Seeds == 0 && refund.Nutrients == 0 && refund.Credits == 0) return refund;

            var before = CurrentResources;
            CurrentResources = CurrentResources + refund;
            OnResourcesChanged?.Invoke(before, CurrentResources);
            return refund;
        }

        public ResourceData GrantDiscoveryBonus(PlantMutation plant, bool isFirstDiscovery)
        {
            var bonus = new ResourceData();
            if (plant == null) return bonus;

            if (isFirstDiscovery)
                bonus.Credits += FirstDiscoveryCreditBonus;

            switch (plant.Rarity)
            {
                case Rarity.Rare:
                    bonus.Credits += RareDiscoveryCreditBonus;
                    bonus.Nutrients += 2;
                    break;
                case Rarity.Legendary:
                    bonus.Credits += LegendaryDiscoveryCreditBonus;
                    bonus.Seeds += 3;
                    bonus.Nutrients += 5;
                    break;
                case Rarity.Failure:
                    bonus.Credits += 2;
                    break;
            }

            if (bonus.Seeds == 0 && bonus.Nutrients == 0 && bonus.Credits == 0) return bonus;

            var before = CurrentResources;
            CurrentResources = CurrentResources + bonus;
            OnResourcesChanged?.Invoke(before, CurrentResources);
            return bonus;
        }

        public void AddResources(ResourceData amount, string reason = "")
        {
            var before = CurrentResources;
            CurrentResources = CurrentResources + amount;
            OnResourcesChanged?.Invoke(before, CurrentResources);
        }

        public bool SpendResources(ResourceData amount)
        {
            if (!CurrentResources.CanAfford(amount)) return false;
            var before = CurrentResources;
            CurrentResources = CurrentResources - amount;
            OnResourcesChanged?.Invoke(before, CurrentResources);
            return true;
        }

        public void ResetToInitial()
        {
            var before = CurrentResources;
            CurrentResources = new ResourceData(InitialSeeds, InitialNutrients, InitialCredits);
            OnResourcesChanged?.Invoke(before, CurrentResources);
        }
    }
}
