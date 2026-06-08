using UnityEngine;

namespace InkMountainBridge
{
    public class ScoreCalculator : MonoBehaviour
    {
        [SerializeField] private int baseCompletionScore;
        [SerializeField] private float materialEfficiencyWeight;
        [SerializeField] private float timeBonusWeight;
        [SerializeField] private float structuralIntegrityWeight;
        [SerializeField] private int maxTimeBonus;

        public int CalculateScore(LevelResult result)
        {
            float materialEfficiency = GetMaterialEfficiency(result.materialsUsed, result.totalBudget);
            int timeBonus = GetTimeBonus(result.completionTime, 0f);
            float structuralIntegrity = GetStructuralIntegrity(result.maxStressRatio);

            int score = baseCompletionScore
                + Mathf.RoundToInt(materialEfficiency * materialEfficiencyWeight)
                + Mathf.RoundToInt(timeBonus * timeBonusWeight)
                + Mathf.RoundToInt(structuralIntegrity * structuralIntegrityWeight);

            return score;
        }

        public float GetMaterialEfficiency(int usedMaterials, int totalBudget)
        {
            if (totalBudget <= 0) return 0f;
            return 1f - (float)usedMaterials / totalBudget;
        }

        public int GetTimeBonus(float completionTime, float timeLimit)
        {
            if (timeLimit <= 0f) return 0;
            float ratio = 1f - (completionTime / timeLimit);
            if (ratio <= 0f) return 0;
            return Mathf.RoundToInt(ratio * maxTimeBonus);
        }

        public float GetStructuralIntegrity(float maxStressRatio)
        {
            return 1f - Mathf.Clamp01(maxStressRatio);
        }
    }
}
