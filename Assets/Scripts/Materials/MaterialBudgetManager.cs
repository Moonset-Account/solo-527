using UnityEngine;

namespace InkMountainBridge
{
    public class MaterialBudgetManager : MonoBehaviour
    {
        [SerializeField] private MaterialBudgetConfig budgetConfig;
        [SerializeField] private int usedBeams;
        [SerializeField] private int usedRopes;
        [SerializeField] private int usedPiers;
        [SerializeField] private float currentTotalWeight;

        public bool CanPlace(MaterialType type)
        {
            return GetRemaining(type) > 0;
        }

        public bool TryPlace(MaterialType type, float weight)
        {
            if (!CanPlace(type))
                return false;

            DeductUsed(type);
            currentTotalWeight += weight;
            GameEvents.RaiseMaterialUsed(type, GetRemaining(type));

            if (GetBudgetPercentage() > 1.0f)
                GameEvents.RaiseBudgetExceeded();

            return true;
        }

        public void ReturnMaterial(MaterialType type, float weight)
        {
            RefundUsed(type);
            currentTotalWeight -= weight;
            if (currentTotalWeight < 0f)
                currentTotalWeight = 0f;
            GameEvents.RaiseMaterialUsed(type, GetRemaining(type));
        }

        public int GetRemaining(MaterialType type)
        {
            switch (type)
            {
                case MaterialType.Beam:
                    return budgetConfig.beamCount - usedBeams;
                case MaterialType.Rope:
                    return budgetConfig.ropeCount - usedRopes;
                case MaterialType.StonePier:
                    return budgetConfig.pierCount - usedPiers;
                default:
                    return 0;
            }
        }

        public float GetBudgetPercentage()
        {
            if (budgetConfig == null || budgetConfig.maxTotalWeight <= 0f)
                return 0f;

            float totalBudget = budgetConfig.beamCount + budgetConfig.ropeCount + budgetConfig.pierCount;
            float totalUsed = usedBeams + usedRopes + usedPiers;
            return totalUsed / totalBudget;
        }

        public void ResetBudget(MaterialBudgetConfig newConfig)
        {
            budgetConfig = newConfig;
            usedBeams = 0;
            usedRopes = 0;
            usedPiers = 0;
            currentTotalWeight = 0f;
        }

        private void DeductUsed(MaterialType type)
        {
            switch (type)
            {
                case MaterialType.Beam:
                    usedBeams++;
                    break;
                case MaterialType.Rope:
                    usedRopes++;
                    break;
                case MaterialType.StonePier:
                    usedPiers++;
                    break;
            }
        }

        private void RefundUsed(MaterialType type)
        {
            switch (type)
            {
                case MaterialType.Beam:
                    usedBeams = Mathf.Max(0, usedBeams - 1);
                    break;
                case MaterialType.Rope:
                    usedRopes = Mathf.Max(0, usedRopes - 1);
                    break;
                case MaterialType.StonePier:
                    usedPiers = Mathf.Max(0, usedPiers - 1);
                    break;
            }
        }
    }
}
