using UnityEngine;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace DecorMatch3
{
    public class CustomerPreference
    {
        public static float EvaluateOverall(Room room, CustomerOrder order, FurnitureCatalog catalog)
        {
            float style = EvaluateStyleMatch(room, order, catalog);
            float color = EvaluateColorMatch(room, order);
            float fulfillment = EvaluateFulfillment(room, order);
            float budget = EvaluateBudget(room, order, catalog);
            return Mathf.Clamp(style + color + fulfillment + budget, 0f, 100f);
        }

        public static float EvaluateStyleMatch(Room room, CustomerOrder order, FurnitureCatalog catalog)
        {
            if (room == null || order == null || catalog == null || room.Slots == null || room.Slots.Count == 0) return 0f;
            float totalScore = 0f;
            int filledSlots = 0;
            foreach (var slot in room.Slots)
            {
                if (string.IsNullOrEmpty(slot.CurrentFurnitureId)) continue;
                var furniture = catalog.GetFurniture(slot.CurrentFurnitureId);
                if (furniture == null) continue;
                float match = FurnitureCatalog.CalculateStyleMatch(furniture, order.StylePreference);
                string[] slotStyles = order.GetPreferredStylesForSlot(slot.SlotName);
                if (slotStyles != null && slotStyles.Length > 0)
                {
                    float bestSlotMatch = 0f;
                    foreach (var style in slotStyles)
                    {
                        float sMatch = FurnitureCatalog.CalculateStyleMatch(furniture, style);
                        if (sMatch > bestSlotMatch) bestSlotMatch = sMatch;
                    }
                    match = Mathf.Max(match, bestSlotMatch);
                }
                totalScore += match;
                filledSlots++;
            }
            if (filledSlots == 0) return 0f;
            return Mathf.Clamp((totalScore / filledSlots) * 25f, 0f, 25f);
        }

        public static float EvaluateColorMatch(Room room, CustomerOrder order)
        {
            if (room == null || order == null || room.Slots == null || room.Slots.Count == 0) return 0f;
            float totalScore = 0f;
            int coloredSlots = 0;
            foreach (var slot in room.Slots)
            {
                if (string.IsNullOrEmpty(slot.AppliedColorHex)) continue;
                float weight = order.GetColorWeight(slot.AppliedColorHex);
                totalScore += weight;
                coloredSlots++;
            }
            if (coloredSlots == 0) return 0f;
            return Mathf.Clamp((totalScore / coloredSlots) * 25f, 0f, 25f);
        }

        public static float EvaluateFulfillment(Room room, CustomerOrder order)
        {
            if (room == null || order == null || order.FurnitureRequirements == null) return 0f;
            int totalRequired = order.TotalRequiredSlots;
            if (totalRequired == 0) return 25f;
            int fulfilled = 0;
            foreach (var req in order.FurnitureRequirements)
            {
                if (!req.Required) continue;
                var slot = room.GetSlot(req.SlotName);
                if (slot != null && !string.IsNullOrEmpty(slot.CurrentFurnitureId))
                {
                    fulfilled++;
                }
            }
            return Mathf.Clamp(((float)fulfilled / totalRequired) * 25f, 0f, 25f);
        }

        public static float EvaluateBudget(Room room, CustomerOrder order, FurnitureCatalog catalog)
        {
            if (room == null || order == null || catalog == null) return 0f;
            int totalCost = 0;
            foreach (var slot in room.Slots)
            {
                if (string.IsNullOrEmpty(slot.CurrentFurnitureId)) continue;
                var furniture = catalog.GetFurniture(slot.CurrentFurnitureId);
                if (furniture != null) totalCost += furniture.cost;
            }
            if (order.Budget <= 0) return totalCost == 0 ? 25f : 0f;
            float ratio = (float)totalCost / order.Budget;
            if (ratio > 1f) return 0f;
            if (ratio <= 0.7f) return 25f;
            return Mathf.Lerp(25f, 5f, (ratio - 0.7f) / 0.3f);
        }

        public static string GenerateFeedback(float styleScore, float colorScore, float fulfillScore, float budgetScore)
        {
            var sb = new StringBuilder();
            sb.Append("风格：");
            sb.Append(GetRating(styleScore));
            sb.Append("，颜色：");
            sb.Append(GetRating(colorScore));
            sb.Append("，需求：");
            sb.Append(GetRating(fulfillScore));
            sb.Append("，预算：");
            sb.Append(GetRating(budgetScore));
            sb.Append("。");
            return sb.ToString();
        }

        private static string GetRating(float score)
        {
            if (score > 20f) return "优秀";
            if (score > 15f) return "良好";
            if (score > 10f) return "一般";
            return "差";
        }

        public static int ScoreToStars(float score)
        {
            if (score >= 85f) return 3;
            if (score >= 70f) return 2;
            if (score >= 50f) return 1;
            return 0;
        }
    }
}
