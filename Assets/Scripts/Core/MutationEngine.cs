using System;
using System.Collections.Generic;
using UnityEngine;

namespace PixelPlantLab
{
    public static class MutationEngine
    {
        [Serializable]
        public class MutationResult
        {
            public PlantMutation Plant;
            public float MatchScore;
            public Dictionary<string, float> DebugWeights;
            public bool IsLuckyRoll;
        }

        [Serializable]
        public class RecipeRunStats
        {
            public string RecipeHash;
            public int TotalRuns;
            public Dictionary<string, int> OutcomeCounts;
            public Dictionary<Rarity, int> RarityCounts;

            public RecipeRunStats()
            {
                TotalRuns = 0;
                OutcomeCounts = new Dictionary<string, int>();
                RarityCounts = new Dictionary<Rarity, int>();
                foreach (Rarity r in Enum.GetValues(typeof(Rarity)))
                {
                    RarityCounts[r] = 0;
                }
            }

            public void RecordResult(string plantId, Rarity rarity)
            {
                TotalRuns++;
                if (!OutcomeCounts.ContainsKey(plantId)) OutcomeCounts[plantId] = 0;
                OutcomeCounts[plantId]++;
                RarityCounts[rarity]++;
            }

            public float GetOutcomeProbability(string plantId)
            {
                if (TotalRuns == 0) return 0f;
                return OutcomeCounts.ContainsKey(plantId)
                    ? (float)OutcomeCounts[plantId] / TotalRuns
                    : 0f;
            }

            public float GetRarityProbability(Rarity rarity)
            {
                if (TotalRuns == 0) return 0f;
                return (float)RarityCounts[rarity] / TotalRuns;
            }
        }

        private static readonly Dictionary<string, RecipeRunStats> _recipeHistory = new Dictionary<string, RecipeRunStats>();

        public static IReadOnlyDictionary<string, RecipeRunStats> RecipeHistory => _recipeHistory;

        public static string GetRecipeHash(ExperimentParams p)
        {
            return $"{Mathf.RoundToInt(p.LightLevel * 10)}_{Mathf.RoundToInt(p.WaterLevel * 10)}_" +
                   $"{Mathf.RoundToInt(p.SoilNitrogen * 10)}_{Mathf.RoundToInt(p.SoilPhosphorus * 10)}_" +
                   $"{Mathf.RoundToInt(p.SoilPotassium * 10)}_{Mathf.RoundToInt(p.CultureTime * 10)}";
        }

        public static RecipeRunStats GetOrCreateStats(ExperimentParams p)
        {
            string hash = GetRecipeHash(p);
            if (!_recipeHistory.ContainsKey(hash))
            {
                _recipeHistory[hash] = new RecipeRunStats();
            }
            return _recipeHistory[hash];
        }

        public static MutationResult GenerateMutation(ExperimentParams parameters, System.Random rng = null)
        {
            if (rng == null) rng = new System.Random();

            var result = new MutationResult
            {
                DebugWeights = new Dictionary<string, float>()
            };

            float failureThreshold = CalculateFailureThreshold(parameters);
            float rareBoost = CalculateRareBoost(parameters);

            float roll = (float)rng.NextDouble();

            if (roll < failureThreshold)
            {
                result.Plant = PickFailurePlant(parameters, rng);
                result.MatchScore = 1f - failureThreshold;
                result.IsLuckyRoll = false;
            }
            else
            {
                float adjustedRoll = (roll - failureThreshold) / (1f - failureThreshold);
                float rareThreshold = 0.15f + rareBoost;
                float legendaryThreshold = rareThreshold + 0.03f + (rareBoost * 0.2f);

                if (adjustedRoll < rareThreshold)
                {
                    result.Plant = PickRarePlant(parameters, rng);
                    result.MatchScore = CalculateMatchScore(parameters, result.Plant);
                    result.IsLuckyRoll = adjustedRoll > (rareThreshold * 0.7f);
                }
                else if (adjustedRoll < legendaryThreshold)
                {
                    var legendaryCandidates = PlantDatabase.GetPlantsByRarity(Rarity.Legendary)
                        .FindAll(p => IsParamCompatible(parameters, p));

                    if (legendaryCandidates.Count > 0 && rng.NextDouble() < 0.6f)
                    {
                        result.Plant = legendaryCandidates[rng.Next(legendaryCandidates.Count)];
                        result.IsLuckyRoll = true;
                    }
                    else
                    {
                        result.Plant = PickRarePlant(parameters, rng);
                        result.IsLuckyRoll = true;
                    }
                    result.MatchScore = CalculateMatchScore(parameters, result.Plant);
                }
                else
                {
                    result.Plant = PickCommonPlant(parameters, rng);
                    result.MatchScore = CalculateMatchScore(parameters, result.Plant);
                    result.IsLuckyRoll = false;
                }
            }

            string hash = GetRecipeHash(parameters);
            GetOrCreateStats(parameters).RecordResult(result.Plant.Id, result.Plant.Rarity);

            return result;
        }

        private static float CalculateFailureThreshold(ExperimentParams p)
        {
            float threshold = 0.05f;

            if (p.LightLevel < 0.1f) threshold += 0.15f + (0.1f - p.LightLevel);
            if (p.LightLevel > 0.95f) threshold += 0.2f + (p.LightLevel - 0.95f);

            if (p.WaterLevel < 0.05f) threshold += 0.3f + (0.05f - p.WaterLevel) * 2f;
            if (p.WaterLevel > 0.95f) threshold += 0.25f + (p.WaterLevel - 0.95f) * 2f;

            float nutrientTotal = p.SoilNitrogen + p.SoilPhosphorus + p.SoilPotassium;
            if (nutrientTotal < 0.3f) threshold += 0.2f;
            if (nutrientTotal > 2.7f) threshold += 0.1f;

            if (p.SoilNitrogen > 0.9f || p.SoilPhosphorus > 0.9f || p.SoilPotassium > 0.9f)
                threshold += 0.1f;

            if (p.CultureTime < 0.2f) threshold += 0.15f;
            if (p.CultureTime > 0.98f) threshold += 0.05f;

            return Mathf.Clamp01(threshold);
        }

        private static float CalculateRareBoost(ExperimentParams p)
        {
            float boost = 0f;

            float nutrientBalance = 1f - (Mathf.Abs(p.SoilNitrogen - p.SoilPhosphorus) +
                                          Mathf.Abs(p.SoilPhosphorus - p.SoilPotassium) +
                                          Mathf.Abs(p.SoilPotassium - p.SoilNitrogen)) / 2f;
            boost += nutrientBalance * 0.2f;

            if (p.LightLevel > 0.4f && p.LightLevel < 0.7f) boost += 0.05f;
            if (p.WaterLevel > 0.3f && p.WaterLevel < 0.7f) boost += 0.05f;
            if (p.CultureTime > 0.5f) boost += Mathf.Min(p.CultureTime, 1f) * 0.05f;

            return boost;
        }

        private static PlantMutation PickFailurePlant(ExperimentParams p, System.Random rng)
        {
            var failures = PlantDatabase.GetPlantsByRarity(Rarity.Failure);
            var weighted = new Dictionary<PlantMutation, float>();

            foreach (var f in failures)
            {
                float weight = 1f;
                if (f.HasTrait(MutationTrait.Withered))
                {
                    if (p.WaterLevel < 0.15f) weight += 3f;
                    if (p.LightLevel > 0.85f) weight += 2f;
                }
                if (f.HasTrait(MutationTrait.Moldy))
                {
                    if (p.WaterLevel > 0.85f) weight += 4f;
                    if (p.LightLevel < 0.2f) weight += 1.5f;
                }
                if (f.HasTrait(MutationTrait.Stunted))
                {
                    float nutrient = p.SoilNitrogen + p.SoilPhosphorus + p.SoilPotassium;
                    if (nutrient < 0.5f) weight += 4f;
                }
                weighted[f] = weight;
            }

            return WeightedPick(weighted, rng);
        }

        private static PlantMutation PickCommonPlant(ExperimentParams p, System.Random rng)
        {
            var commons = PlantDatabase.GetPlantsByRarity(Rarity.Common);
            var weighted = new Dictionary<PlantMutation, float>();

            foreach (var c in commons)
            {
                float weight = 1f + CalculateMatchScore(p, c) * 3f;

                if (c.Id == "cactus_small" && p.WaterLevel < 0.35f) weight += 2f;
                if (c.Id == "moss_cluster" && p.WaterLevel > 0.65f) weight += 2f;
                if (c.Id == "sunny_bloom" && p.LightLevel > 0.65f) weight += 2f;

                weighted[c] = weight;
            }

            return WeightedPick(weighted, rng);
        }

        private static PlantMutation PickRarePlant(ExperimentParams p, System.Random rng)
        {
            var rares = PlantDatabase.GetPlantsByRarity(Rarity.Rare);
            var weighted = new Dictionary<PlantMutation, float>();

            foreach (var r in rares)
            {
                if (!IsParamCompatible(p, r)) continue;

                float weight = 0.5f + CalculateMatchScore(p, r) * 2.5f;

                if (r.HasTrait(MutationTrait.Glowing))
                {
                    if (p.LightLevel > 0.55f && p.SoilPhosphorus > 0.4f) weight += 2f;
                }
                if (r.HasTrait(MutationTrait.Crystalline))
                {
                    if (p.SoilPotassium > 0.55f && p.CultureTime > 0.5f) weight += 2f;
                }
                if (r.HasTrait(MutationTrait.Poisonous))
                {
                    if (p.SoilNitrogen > 0.6f && p.WaterLevel > 0.4f) weight += 2f;
                }
                if (r.HasTrait(MutationTrait.Burning))
                {
                    if (p.LightLevel > 0.75f && p.SoilPhosphorus > 0.5f) weight += 2.5f;
                }
                if (r.HasTrait(MutationTrait.Frozen))
                {
                    if (p.LightLevel < 0.35f && p.WaterLevel > 0.55f) weight += 2.5f;
                }
                if (r.HasTrait(MutationTrait.Electric))
                {
                    if (p.SoilPhosphorus > 0.65f && p.SoilPotassium > 0.55f) weight += 2.5f;
                }
                if (r.HasTrait(MutationTrait.Giant))
                {
                    float nutrient = p.SoilNitrogen + p.SoilPhosphorus + p.SoilPotassium;
                    if (nutrient > 1.8f && p.CultureTime > 0.6f) weight += 2f;
                }
                if (r.HasTrait(MutationTrait.Miniature))
                {
                    if (p.CultureTime < 0.45f && p.WaterLevel < 0.5f) weight += 2f;
                }

                weighted[r] = weight;
            }

            if (weighted.Count == 0) return PickCommonPlant(p, rng);
            return WeightedPick(weighted, rng);
        }

        private static bool IsParamCompatible(ExperimentParams p, PlantMutation plant)
        {
            if (plant.Rarity != Rarity.Legendary) return true;

            if (plant.Id == "aurora_bloom")
            {
                return p.LightLevel > 0.5f && p.LightLevel < 0.8f &&
                       p.WaterLevel > 0.4f && p.WaterLevel < 0.7f &&
                       p.SoilNitrogen > 0.3f && p.SoilPhosphorus > 0.3f && p.SoilPotassium > 0.3f &&
                       p.CultureTime > 0.7f;
            }
            if (plant.Id == "dragon_tree")
            {
                return p.SoilNitrogen > 0.7f && p.SoilPhosphorus > 0.7f && p.SoilPotassium > 0.7f &&
                       p.LightLevel > 0.6f && p.CultureTime > 0.75f;
            }
            if (plant.Id == "phoenix_rose")
            {
                return p.LightLevel > 0.8f && p.SoilPhosphorus > 0.65f &&
                       p.WaterLevel > 0.35f && p.WaterLevel < 0.65f &&
                       p.CultureTime > 0.65f;
            }
            return false;
        }

        private static float CalculateMatchScore(ExperimentParams p, PlantMutation plant)
        {
            float score = 0f;
            int checks = 0;

            float idealLight = 0.5f, idealWater = 0.5f;
            float idealN = 0.5f, idealP = 0.5f, idealK = 0.5f;

            if (plant.HasTrait(MutationTrait.Glowing)) { idealLight = 0.7f; }
            if (plant.HasTrait(MutationTrait.Burning)) { idealLight = 0.85f; }
            if (plant.HasTrait(MutationTrait.Frozen)) { idealLight = 0.25f; }
            if (plant.HasTrait(MutationTrait.Moldy)) { idealWater = 0.9f; }
            if (plant.HasTrait(MutationTrait.Withered)) { idealWater = 0.05f; }
            if (plant.HasTrait(MutationTrait.Poisonous)) { idealN = 0.75f; }
            if (plant.HasTrait(MutationTrait.Crystalline)) { idealK = 0.75f; }
            if (plant.HasTrait(MutationTrait.Electric)) { idealP = 0.75f; idealK = 0.7f; }
            if (plant.HasTrait(MutationTrait.Giant)) { idealN = 0.8f; idealP = 0.7f; idealK = 0.7f; }
            if (plant.HasTrait(MutationTrait.Miniature)) { idealN = 0.3f; }

            score += 1f - Mathf.Abs(p.LightLevel - idealLight); checks++;
            score += 1f - Mathf.Abs(p.WaterLevel - idealWater); checks++;
            score += 1f - Mathf.Abs(p.SoilNitrogen - idealN); checks++;
            score += 1f - Mathf.Abs(p.SoilPhosphorus - idealP); checks++;
            score += 1f - Mathf.Abs(p.SoilPotassium - idealK); checks++;

            return checks > 0 ? Mathf.Clamp01(score / checks) : 0.5f;
        }

        private static PlantMutation WeightedPick(Dictionary<PlantMutation, float> weights, System.Random rng)
        {
            float total = 0f;
            foreach (var kv in weights) total += kv.Value;

            float r = (float)rng.NextDouble() * total;
            float accum = 0f;
            foreach (var kv in weights)
            {
                accum += kv.Value;
                if (r <= accum) return kv.Key;
            }

            var list = new List<PlantMutation>(weights.Keys);
            return list[rng.Next(list.Count)];
        }

        public static void ClearRecipeHistory()
        {
            _recipeHistory.Clear();
        }
    }
}
