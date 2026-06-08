using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using DecorMatch3.Core;
using DecorMatch3.Data;
using DecorMatch3.Gameplay.Decoration;
using DecorMatch3.Audio;

namespace DecorMatch3.Gameplay.Customer
{
    [Serializable]
    public class CustomerReviewResult
    {
        public int TotalScore;
        public int MaxScore;
        public float Percentage;
        public int Stars;
        public string CustomerName;
        public string FeedbackMessage;
        public bool IsPositive;

        [Header("Breakdown")]
        public int ColorScore;
        public int ColorMaxScore;
        public int FurnitureScore;
        public int FurnitureMaxScore;
        public int QualityScore;
        public int QualityMaxScore;
        public int BudgetScore;
        public int BudgetMaxScore;
        public int CompletenessScore;
        public int CompletenessMaxScore;

        public List<string> PositivePoints = new List<string>();
        public List<string> NegativePoints = new List<string>();
    }

    public class CustomerReviewSystem : Singleton<CustomerReviewSystem>
    {
        [Header("Weights")]
        [Range(0, 100)] public int ColorWeight = 30;
        [Range(0, 100)] public int FurnitureWeight = 25;
        [Range(0, 100)] public int QualityWeight = 20;
        [Range(0, 100)] public int BudgetWeight = 15;
        [Range(0, 100)] public int CompletenessWeight = 10;

        public CustomerReviewResult LastReview { get; private set; }

        public event Action<CustomerReviewResult> OnReviewCompleted;

        public CustomerReviewResult EvaluateDecoration(OrderData order)
        {
            if (order == null || order.Customer == null)
            {
                Debug.LogError("[CustomerReviewSystem] Invalid order data for review!");
                return null;
            }

            CustomerPreference preferences = order.Customer.Preferences;
            CustomerReviewResult result = new CustomerReviewResult
            {
                CustomerName = order.Customer.Name
            };

            EvaluateColorScore(preferences, result);
            EvaluateFurnitureScore(preferences, result);
            EvaluateQualityScore(preferences, result);
            EvaluateBudgetScore(preferences, result);
            EvaluateCompletenessScore(preferences, order, result);

            CalculateFinalScore(result);

            result.IsPositive = result.Percentage >= 60f;
            result.Stars = CalculateStars(result.Percentage);
            result.FeedbackMessage = GenerateFeedback(order.Customer, result);

            LastReview = result;

            AudioManager.Instance?.StopMusic(0.3f);
            AudioManager.Instance?.PlaySFX(result.IsPositive ? SFXType.CustomerHappy : SFXType.CustomerSad);
            AudioManager.Instance?.PlayMusic(MusicType.CustomerReview);

            GameStateManager.Instance.ChangeState(GameState.CustomerReview);
            OnReviewCompleted?.Invoke(result);

            EventBus.Publish(new CustomerReviewedEvent
            {
                Order = order,
                Review = result
            });

            if (order.Customer != null)
            {
                SaveManager.Instance.CompleteOrder(order.OrderId);
                SaveManager.Instance.SaveGame();
            }

            return result;
        }

        private void EvaluateColorScore(CustomerPreference pref, CustomerReviewResult result)
        {
            result.ColorMaxScore = 100;
            List<ColorStyle> appliedStyles = DecorationSystem.Instance.GetAppliedColorStyles();

            if (appliedStyles.Count == 0)
            {
                result.ColorScore = 0;
                result.NegativePoints.Add("没有选择任何颜色和材质");
                return;
            }

            int totalWeight = 0;
            int positiveWeight = 0;

            foreach (ColorStyle style in appliedStyles)
            {
                int weight = 1;

                if (style == pref.PreferredColorStyle)
                {
                    weight = 3;
                }

                totalWeight += weight;

                if (style == pref.PreferredColorStyle)
                {
                    positiveWeight += weight * 3;
                }
                else if (pref.DislikedColorStyles.Contains(style))
                {
                    positiveWeight += 0;
                }
                else
                {
                    positiveWeight += weight;
                }
            }

            int maxPossibleWeight = 0;
            foreach (ColorStyle style in appliedStyles)
            {
                int w = (style == pref.PreferredColorStyle) ? 3 : 1;
                maxPossibleWeight += w * 3;
            }

            result.ColorScore = maxPossibleWeight > 0
                ? Mathf.RoundToInt((float)positiveWeight / maxPossibleWeight * 100f)
                : 0;

            if (pref.PreferredColorStyle != ColorStyle.Neutral)
            {
                int preferredCount = appliedStyles.Count(s => s == pref.PreferredColorStyle);
                if (preferredCount >= 2)
                {
                    result.PositivePoints.Add($"大量使用了客户喜欢的{StyleName(pref.PreferredColorStyle)}风格");
                }
                else if (preferredCount == 0)
                {
                    result.NegativePoints.Add($"没有使用客户喜欢的{StyleName(pref.PreferredColorStyle)}风格");
                }
            }

            int dislikedCount = appliedStyles.Count(s => pref.DislikedColorStyles.Contains(s));
            if (dislikedCount > 0)
            {
                result.NegativePoints.Add($"使用了{dislikedCount}种客户不喜欢的颜色风格");
            }

            result.ColorScore = Mathf.RoundToInt(result.ColorScore * (pref.ColorImportance / 100f) +
                                                  result.ColorScore * (1 - pref.ColorImportance / 100f) * 0.8f);
        }

        private void EvaluateFurnitureScore(CustomerPreference pref, CustomerReviewResult result)
        {
            result.FurnitureMaxScore = 100;
            var placedFurniture = DecorationSystem.Instance.PlacedFurniture;

            if (placedFurniture.Count == 0)
            {
                result.FurnitureScore = 0;
                result.NegativePoints.Add("没有放置任何家具");
                return;
            }

            int requiredCount = pref.RequiredFurniture.Count;
            int requiredMet = 0;

            foreach (FurnitureCategory required in pref.RequiredFurniture)
            {
                if (DecorationSystem.Instance.GetPlacedCategoryCount(required) > 0)
                {
                    requiredMet++;
                }
            }

            if (requiredCount > 0)
            {
                if (requiredMet == requiredCount)
                {
                    result.PositivePoints.Add("所有必需的家具都已放置");
                }
                else
                {
                    result.NegativePoints.Add($"还差 {requiredCount - requiredMet} 件必需家具");
                }
            }

            int preferredCount = pref.PreferredFurniture.Count;
            int preferredMet = 0;
            foreach (FurnitureCategory preferred in pref.PreferredFurniture)
            {
                if (DecorationSystem.Instance.GetPlacedCategoryCount(preferred) > 0)
                {
                    preferredMet++;
                }
            }

            if (preferredCount > 0 && preferredMet == preferredCount)
            {
                result.PositivePoints.Add("家具选择完全符合客户偏好");
            }

            float requiredRatio = requiredCount > 0 ? (float)requiredMet / requiredCount : 1f;
            float preferredRatio = preferredCount > 0 ? (float)preferredMet / preferredCount : 1f;
            float slotsRatio = Mathf.Min(1f, (float)placedFurniture.Count /
                Mathf.Max(1, DecorationSystem.Instance.CurrentRoom.DecorationSlots.Count));

            result.FurnitureScore = Mathf.RoundToInt(
                (requiredRatio * 0.5f + preferredRatio * 0.35f + slotsRatio * 0.15f) * 100f
            );

            result.FurnitureScore = Mathf.RoundToInt(
                result.FurnitureScore * (pref.FurnitureStyleImportance / 100f) +
                result.FurnitureScore * (1 - pref.FurnitureStyleImportance / 100f) * 0.85f
            );
        }

        private void EvaluateQualityScore(CustomerPreference pref, CustomerReviewResult result)
        {
            result.QualityMaxScore = 100;
            int avgQuality = DecorationSystem.Instance.GetAverageQualityRating();

            if (avgQuality == 0)
            {
                result.QualityScore = 50;
                return;
            }

            result.QualityScore = Mathf.Clamp(avgQuality * 20, 0, 100);

            if (avgQuality >= 4)
            {
                result.PositivePoints.Add("家具品质优秀");
            }
            else if (avgQuality <= 2)
            {
                result.NegativePoints.Add("家具品质较低");
            }

            result.QualityScore = Mathf.RoundToInt(
                result.QualityScore * (pref.MaterialQualityImportance / 100f) +
                result.QualityScore * (1 - pref.MaterialQualityImportance / 100f) * 0.9f
            );
        }

        private void EvaluateBudgetScore(CustomerPreference pref, CustomerReviewResult result)
        {
            result.BudgetMaxScore = 100;
            int totalCost = DecorationSystem.Instance.TotalCost;
            int budgetMin = pref.BudgetMin;
            int budgetMax = pref.BudgetMax;
            int budgetRange = budgetMax - budgetMin;

            if (totalCost == 0)
            {
                result.BudgetScore = 0;
                result.NegativePoints.Add("没有花费任何预算");
                return;
            }

            if (totalCost > budgetMax)
            {
                float overRatio = (float)(totalCost - budgetMax) / budgetMax;
                result.BudgetScore = Mathf.Max(0, Mathf.RoundToInt(60f - overRatio * 100f));
                result.NegativePoints.Add($"超出预算 {(totalCost - budgetMax)} 金币");
            }
            else if (totalCost < budgetMin)
            {
                float underRatio = 1f - (float)totalCost / budgetMin;
                result.BudgetScore = Mathf.RoundToInt(70f - underRatio * 40f);
                result.NegativePoints.Add($"预算使用不足，客户觉得有点简陋");
            }
            else
            {
                float center = (budgetMin + budgetMax) * 0.5f;
                float distanceFromCenter = Mathf.Abs(totalCost - center) / (budgetRange * 0.5f);
                result.BudgetScore = Mathf.RoundToInt(100f - distanceFromCenter * 20f);
                result.PositivePoints.Add("预算使用合理");
            }
        }

        private void EvaluateCompletenessScore(CustomerPreference pref, OrderData order, CustomerReviewResult result)
        {
            result.CompletenessMaxScore = 100;
            int totalSlots = DecorationSystem.Instance.CurrentRoom.DecorationSlots.Count;
            int filledSlots = DecorationSystem.Instance.PlacedFurniture.Count;

            float fillRatio = (float)filledSlots / Mathf.Max(1, totalSlots);
            bool hasWallColor = DecorationSystem.Instance.CurrentWallColor != null;
            bool hasFloorColor = DecorationSystem.Instance.CurrentFloorColor != null;

            if (!hasWallColor)
            {
                result.NegativePoints.Add("墙面没有进行配色");
            }
            if (!hasFloorColor)
            {
                result.NegativePoints.Add("地面没有进行配色");
            }

            float completeness = fillRatio * 0.6f +
                                 (hasWallColor ? 0.2f : 0f) +
                                 (hasFloorColor ? 0.2f : 0f);

            result.CompletenessScore = Mathf.RoundToInt(completeness * 100f);

            if (filledSlots == totalSlots && hasWallColor && hasFloorColor)
            {
                result.PositivePoints.Add("房间布置完整度很高！");
            }
        }

        private void CalculateFinalScore(CustomerReviewResult result)
        {
            int totalWeight = ColorWeight + FurnitureWeight + QualityWeight + BudgetWeight + CompletenessWeight;

            float weightedColor = (float)result.ColorScore / result.ColorMaxScore * ColorWeight;
            float weightedFurniture = (float)result.FurnitureScore / result.FurnitureMaxScore * FurnitureWeight;
            float weightedQuality = (float)result.QualityScore / result.QualityMaxScore * QualityWeight;
            float weightedBudget = (float)result.BudgetScore / result.BudgetMaxScore * BudgetWeight;
            float weightedCompleteness = (float)result.CompletenessScore / result.CompletenessMaxScore * CompletenessWeight;

            float totalWeightedScore = weightedColor + weightedFurniture + weightedQuality + weightedBudget + weightedCompleteness;

            result.MaxScore = totalWeight;
            result.TotalScore = Mathf.RoundToInt(totalWeightedScore);
            result.Percentage = (totalWeight > 0) ? (totalWeightedScore / totalWeight) * 100f : 0f;
        }

        private int CalculateStars(float percentage)
        {
            if (percentage >= 90f) return 5;
            if (percentage >= 75f) return 4;
            if (percentage >= 60f) return 3;
            if (percentage >= 40f) return 2;
            if (percentage >= 20f) return 1;
            return 0;
        }

        private string GenerateFeedback(CustomerData customer, CustomerReviewResult result)
        {
            List<string> feedbackPool = result.IsPositive
                ? new List<string>(customer.PositiveFeedback)
                : new List<string>(customer.NegativeFeedback);

            if (feedbackPool.Count == 0)
            {
                return result.IsPositive ? "不错，继续加油！" : "还可以做得更好。";
            }

            if (result.Stars >= 4 && result.PositivePoints.Count > 0)
            {
                feedbackPool.Add(result.PositivePoints[UnityEngine.Random.Range(0, result.PositivePoints.Count)]);
            }
            else if (result.Stars <= 2 && result.NegativePoints.Count > 0)
            {
                feedbackPool.Add(result.NegativePoints[UnityEngine.Random.Range(0, result.NegativePoints.Count)]);
            }

            return feedbackPool[UnityEngine.Random.Range(0, feedbackPool.Count)];
        }

        private string StyleName(ColorStyle style)
        {
            switch (style)
            {
                case ColorStyle.Warm: return "暖色调";
                case ColorStyle.Cool: return "冷色调";
                case ColorStyle.Neutral: return "中性色";
                case ColorStyle.Vibrant: return "鲜艳色";
                case ColorStyle.Pastel: return "柔和色";
                case ColorStyle.Earthy: return "大地色";
                default: return "未知风格";
            }
        }

        public int GetRewardCoins(CustomerReviewResult result)
        {
            int baseReward = 200;
            int starBonus = result.Stars * 100;
            int scoreBonus = Mathf.RoundToInt(result.TotalScore * 2);
            return baseReward + starBonus + scoreBonus;
        }

        public int GetRewardXP(CustomerReviewResult result)
        {
            return 50 + result.Stars * 30;
        }
    }

    public struct CustomerReviewedEvent
    {
        public OrderData Order;
        public CustomerReviewResult Review;
    }
}
