using System;
using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3.Decoration
{
    [System.Serializable]
    public class ScoringResult
    {
        public int TotalScore;
        public int CustomerSatisfaction;
        public int Stars;
        public string CustomerReaction;

        public int StyleScore;
        public int ColorScore;
        public int MaterialScore;
        public int BudgetScore;
        public int ComfortScore;
        public int PracticalityScore;
        public int RequirementScore;

        public Dictionary<string, int> CategoryBreakdown = new Dictionary<string, int>();
        public List<string> PositiveFeedbacks = new List<string>();
        public List<string> NegativeFeedbacks = new List<string>();
        public List<string> Suggestions = new List<string>();
    }

    public class ScoringSystem
    {
        private const int Weight_Style = 25;
        private const int Weight_Color = 20;
        private const int Weight_Material = 15;
        private const int Weight_Budget = 15;
        private const int Weight_Comfort = 10;
        private const int Weight_Practicality = 10;
        private const int Weight_Requirement = 5;

        public ScoringResult Evaluate(DecorationOrder order, DecorationManager decorationManager)
        {
            ScoringResult result = new ScoringResult();
            CustomerProfile customer = order.Customer;

            result.StyleScore = EvaluateStyle(order, decorationManager, customer);
            result.ColorScore = EvaluateColors(order, decorationManager, customer);
            result.MaterialScore = EvaluateMaterials(order, decorationManager, customer);
            result.BudgetScore = EvaluateBudget(order, decorationManager);
            result.ComfortScore = EvaluateComfort(decorationManager);
            result.PracticalityScore = EvaluatePracticality(decorationManager);
            result.RequirementScore = EvaluateRequirements(order, decorationManager);

            result.CategoryBreakdown["风格"] = result.StyleScore;
            result.CategoryBreakdown["配色"] = result.ColorScore;
            result.CategoryBreakdown["材料"] = result.MaterialScore;
            result.CategoryBreakdown["预算"] = result.BudgetScore;
            result.CategoryBreakdown["舒适"] = result.ComfortScore;
            result.CategoryBreakdown["实用"] = result.PracticalityScore;
            result.CategoryBreakdown["需求"] = result.RequirementScore;

            result.TotalScore = Mathf.RoundToInt(
                result.StyleScore * (Weight_Style / 100f) +
                result.ColorScore * (Weight_Color / 100f) +
                result.MaterialScore * (Weight_Material / 100f) +
                result.BudgetScore * (Weight_Budget / 100f) +
                result.ComfortScore * (Weight_Comfort / 100f) +
                result.PracticalityScore * (Weight_Practicality / 100f) +
                result.RequirementScore * (Weight_Requirement / 100f)
            );

            result.TotalScore = Mathf.Clamp(result.TotalScore, 0, 100);

            result.CustomerSatisfaction = CalculateSatisfaction(result.TotalScore, customer.Personality);
            result.Stars = CalculateStars(result.CustomerSatisfaction);
            result.CustomerReaction = customer?.GetReactionLine(result.CustomerSatisfaction) ?? "谢谢。";

            GenerateFeedback(result, order, decorationManager);

            return result;
        }

        private int EvaluateStyle(DecorationOrder order, DecorationManager decorationManager, CustomerProfile customer)
        {
            if (customer == null) return 50;

            int totalScore = 0;
            int count = 0;

            foreach (var kvp in decorationManager.Choices)
            {
                DecorationChoice choice = kvp.Value;
                DecorationSlot slot = decorationManager.FindSlot(kvp.Key);

                if (choice.SelectedFurniture != null && choice.SelectedFurniture.StyleTags != null)
                {
                    foreach (DecorationStyle style in choice.SelectedFurniture.StyleTags)
                    {
                        totalScore += customer.GetStyleScore(style);
                        count++;
                    }
                }

                if (choice.SelectedPalette != null && choice.SelectedPalette.OverallStyleTags != null)
                {
                    foreach (DecorationStyle style in choice.SelectedPalette.OverallStyleTags)
                    {
                        totalScore += customer.GetStyleScore(style);
                        count++;
                    }
                }

                if (choice.SelectedMaterial != null && choice.SelectedMaterial.StyleTags != null)
                {
                    foreach (DecorationStyle style in choice.SelectedMaterial.StyleTags)
                    {
                        totalScore += customer.GetStyleScore(style);
                        count++;
                    }
                }

                if (slot != null && slot.PreferredStyles != null)
                {
                    foreach (DecorationStyle style in slot.PreferredStyles)
                    {
                        bool matched = false;
                        if (choice.SelectedFurniture?.StyleTags != null)
                        {
                            foreach (var fs in choice.SelectedFurniture.StyleTags)
                                if (fs == style) { matched = true; break; }
                        }
                        if (!matched && choice.SelectedPalette?.OverallStyleTags != null)
                        {
                            foreach (var ps in choice.SelectedPalette.OverallStyleTags)
                                if (ps == style) { matched = true; break; }
                        }
                        if (matched) totalScore += 20;
                        count++;
                    }
                }
            }

            return count > 0 ? Mathf.Clamp(totalScore / count, 0, 100) : 50;
        }

        private int EvaluateColors(DecorationOrder order, DecorationManager decorationManager, CustomerProfile customer)
        {
            if (customer == null) return 50;

            int totalScore = 0;
            int count = 0;

            List<Color> usedColors = new List<Color>();

            foreach (var kvp in decorationManager.Choices)
            {
                DecorationChoice choice = kvp.Value;

                if (choice.SelectedFurniture != null)
                {
                    usedColors.Add(choice.SelectedFurniture.PrimaryColor);
                    totalScore += customer.GetColorScore(choice.SelectedFurniture.PrimaryColor);
                    count++;
                }

                if (choice.SelectedPalette != null)
                {
                    usedColors.Add(choice.SelectedPalette.WallPrimary);
                    usedColors.Add(choice.SelectedPalette.FloorPrimary);
                    totalScore += customer.GetColorScore(choice.SelectedPalette.WallPrimary);
                    totalScore += customer.GetColorScore(choice.SelectedPalette.FloorPrimary);
                    count += 2;
                }

                if (choice.SelectedMaterial != null)
                {
                    usedColors.Add(choice.SelectedMaterial.MaterialColor);
                    totalScore += customer.GetColorScore(choice.SelectedMaterial.MaterialColor);
                    count++;
                }
            }

            int harmonyBonus = EvaluateColorHarmony(usedColors);
            totalScore += harmonyBonus;
            count++;

            return count > 0 ? Mathf.Clamp(totalScore / count, 0, 100) : 50;
        }

        private int EvaluateColorHarmony(List<Color> colors)
        {
            if (colors.Count < 2) return 50;

            float totalHarmony = 0;
            int pairCount = 0;

            for (int i = 0; i < colors.Count; i++)
            {
                for (int j = i + 1; j < colors.Count; j++)
                {
                    float deltaE = CalculateColorDifference(colors[i], colors[j]);

                    if (deltaE < 0.15f) totalHarmony += 90;
                    else if (deltaE < 0.3f) totalHarmony += 75;
                    else if (deltaE < 0.5f) totalHarmony += 60;
                    else if (deltaE < 0.7f) totalHarmony += 80;
                    else totalHarmony += 50;

                    pairCount++;
                }
            }

            return pairCount > 0 ? Mathf.RoundToInt(totalHarmony / pairCount) : 50;
        }

        private float CalculateColorDifference(Color a, Color b)
        {
            float rDiff = a.r - b.r;
            float gDiff = a.g - b.g;
            float bDiff = a.b - b.b;
            return Mathf.Sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
        }

        private int EvaluateMaterials(DecorationOrder order, DecorationManager decorationManager, CustomerProfile customer)
        {
            if (customer == null) return 50;

            int totalScore = 0;
            int count = 0;

            foreach (var kvp in decorationManager.Choices)
            {
                DecorationChoice choice = kvp.Value;

                if (choice.SelectedFurniture != null)
                {
                    totalScore += customer.GetMaterialScore(choice.SelectedFurniture.PrimaryMaterial);
                    count++;

                    if (choice.SelectedFurniture.SecondaryMaterial != Match3.MaterialCategory.Paint)
                    {
                        totalScore += customer.GetMaterialScore(choice.SelectedFurniture.SecondaryMaterial);
                        count++;
                    }
                }

                if (choice.SelectedMaterial != null)
                {
                    totalScore += customer.GetMaterialScore(choice.SelectedMaterial.Category);
                    count++;
                }
            }

            return count > 0 ? Mathf.Clamp(totalScore / count, 0, 100) : 50;
        }

        private int EvaluateBudget(DecorationOrder order, DecorationManager decorationManager)
        {
            int spent = decorationManager.GetTotalSpent();
            int minBudget = order.BudgetMin;
            int maxBudget = order.BudgetMax;
            int idealBudget = (minBudget + maxBudget) / 2;

            if (spent <= 0) return 30;

            if (spent < minBudget)
            {
                float ratio = (float)spent / minBudget;
                return Mathf.RoundToInt(40 + ratio * 30);
            }
            else if (spent <= idealBudget)
            {
                float ratio = (float)(spent - minBudget) / (idealBudget - minBudget);
                return Mathf.RoundToInt(70 + ratio * 30);
            }
            else if (spent <= maxBudget)
            {
                float ratio = (float)(spent - idealBudget) / (maxBudget - idealBudget);
                return Mathf.RoundToInt(100 - ratio * 30);
            }
            else
            {
                float overRatio = (float)(spent - maxBudget) / maxBudget;
                return Mathf.Max(0, Mathf.RoundToInt(70 - overRatio * 100));
            }
        }

        private int EvaluateComfort(DecorationManager decorationManager)
        {
            int total = 0;
            int count = 0;

            foreach (var kvp in decorationManager.Choices)
            {
                if (kvp.Value.SelectedFurniture != null)
                {
                    total += kvp.Value.SelectedFurniture.ComfortRating;
                    count++;
                }
            }

            return count > 0 ? Mathf.Clamp(total / count, 0, 100) : 50;
        }

        private int EvaluatePracticality(DecorationManager decorationManager)
        {
            int total = 0;
            int count = 0;

            foreach (var kvp in decorationManager.Choices)
            {
                if (kvp.Value.SelectedFurniture != null)
                {
                    total += kvp.Value.SelectedFurniture.PracticalityRating;
                    total += kvp.Value.SelectedFurniture.DurabilityRating;
                    count += 2;
                }
            }

            return count > 0 ? Mathf.Clamp(total / count, 0, 100) : 50;
        }

        private int EvaluateRequirements(DecorationOrder order, DecorationManager decorationManager)
        {
            int score = 100;
            int requiredCount = order.RequiredSlots.Count;

            if (requiredCount == 0) return 100;

            int fulfilledCount = 0;
            foreach (DecorationSlot slot in order.RequiredSlots)
            {
                if (decorationManager.GetChoiceForSlot(slot.SlotId) != null)
                {
                    fulfilledCount++;
                }
                else
                {
                    score -= 60 / requiredCount;
                }
            }

            int optionalCount = order.OptionalSlots.Count;
            if (optionalCount > 0)
            {
                int filledOptional = 0;
                foreach (DecorationSlot slot in order.OptionalSlots)
                {
                    if (decorationManager.GetChoiceForSlot(slot.SlotId) != null)
                        filledOptional++;
                }
                score += Mathf.RoundToInt((float)filledOptional / optionalCount * 20);
            }

            return Mathf.Clamp(score, 0, 100);
        }

        private int CalculateSatisfaction(int totalScore, CustomerPersonality personality)
        {
            float multiplier = 1f;
            int offset = 0;

            switch (personality)
            {
                case CustomerPersonality.Easygoing:
                    multiplier = 1.05f;
                    offset = 5;
                    break;
                case CustomerPersonality.Demanding:
                    multiplier = 0.9f;
                    offset = -10;
                    break;
                case CustomerPersonality.Creative:
                    multiplier = 1.1f;
                    break;
                case CustomerPersonality.BudgetConscious:
                    multiplier = 1f;
                    break;
                case CustomerPersonality.Trendy:
                    multiplier = 1.05f;
                    break;
                case CustomerPersonality.Traditional:
                    multiplier = 0.95f;
                    break;
            }

            return Mathf.Clamp(Mathf.RoundToInt(totalScore * multiplier) + offset, 0, 100);
        }

        private int CalculateStars(int satisfaction)
        {
            if (satisfaction >= 90) return 5;
            if (satisfaction >= 75) return 4;
            if (satisfaction >= 60) return 3;
            if (satisfaction >= 40) return 2;
            if (satisfaction >= 20) return 1;
            return 0;
        }

        private void GenerateFeedback(ScoringResult result, DecorationOrder order, DecorationManager decorationManager)
        {
            if (result.StyleScore >= 75)
                result.PositiveFeedbacks.Add("整体风格非常协调！");
            else if (result.StyleScore < 40)
                result.NegativeFeedbacks.Add("风格有些杂乱...");

            if (result.ColorScore >= 75)
                result.PositiveFeedbacks.Add("配色令人赏心悦目！");
            else if (result.ColorScore < 40)
                result.NegativeFeedbacks.Add("颜色搭配有些奇怪...");

            if (result.MaterialScore >= 75)
                result.PositiveFeedbacks.Add("材料选得很好，质感很棒！");
            else if (result.MaterialScore < 40)
                result.NegativeFeedbacks.Add("材料品质可以再提升...");

            if (result.BudgetScore >= 75)
                result.PositiveFeedbacks.Add("预算控制得很好！");
            else if (result.BudgetScore < 40)
                result.NegativeFeedbacks.Add("花费超出预期了...");

            if (result.ComfortScore >= 75)
                result.PositiveFeedbacks.Add("看起来非常舒适！");

            if (result.PracticalityScore >= 75)
                result.PositiveFeedbacks.Add("实用性很强！");

            if (result.RequirementScore < 60)
                result.NegativeFeedbacks.Add("有些必要的需求没有满足...");

            if (order.Customer?.SpecialRequirements != null)
            {
                foreach (string req in order.Customer.SpecialRequirements)
                {
                    result.Suggestions.Add(req);
                }
            }

            if (result.StyleScore < 60)
                result.Suggestions.Add("建议统一装饰风格，比如选择现代简约或北欧风的组合。");

            if (result.ColorScore < 60)
                result.Suggestions.Add("建议减少颜色种类，选择2-3种主色调搭配。");
        }
    }
}
