using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3.Decoration
{
    [CreateAssetMenu(fileName = "NewCustomer", menuName = "DecorMatch3/Customer Profile", order = 11)]
    public class CustomerProfile : ScriptableObject
    {
        [Header("基础信息")]
        public string CustomerId;
        public string CustomerName;
        public Sprite Avatar;
        public int Age;
        public string Occupation;
        public string Bio;

        [Header("预算范围")]
        public int MinBudget;
        public int MaxBudget;

        [Header("风格偏好权重 (0-100)")]
        public List<StylePreference> StylePreferences = new List<StylePreference>();

        [Header("颜色偏好权重 (0-100)")]
        public List<ColorPreference> ColorPreferences = new List<ColorPreference>();

        [Header("材料偏好权重 (0-100)")]
        public List<MaterialPreference> MaterialPreferences = new List<MaterialPreference>();

        [Header("家具偏好权重 (0-100)")]
        public List<FurnitureTypePreference> FurniturePreferences = new List<FurnitureTypePreference>();

        [Header("特殊需求")]
        [TextArea(2, 4)] public string[] SpecialRequirements;

        [Header("客户性格")]
        public CustomerPersonality Personality;

        [Header("沟通台词")]
        public string[] GreetingLines;
        public string[] HintLines;
        public string[] HappyLines;
        public string[] DisappointedLines;
        public string[] NeutralLines;

        public int GetStyleScore(DecorationStyle style)
        {
            StylePreference pref = StylePreferences.Find(s => s.Style == style);
            return pref != null ? pref.Weight : 30;
        }

        public int GetColorScore(Color color)
        {
            ColorPreference bestMatch = null;
            float bestDelta = float.MaxValue;

            foreach (ColorPreference pref in ColorPreferences)
            {
                float delta = Mathf.Abs(color.r - pref.Color.r) +
                              Mathf.Abs(color.g - pref.Color.g) +
                              Mathf.Abs(color.b - pref.Color.b);
                if (delta < bestDelta)
                {
                    bestDelta = delta;
                    bestMatch = pref;
                }
            }

            if (bestMatch != null)
            {
                float similarity = 1f - (bestDelta / 3f);
                return Mathf.RoundToInt(bestMatch.Weight * similarity);
            }

            return 40;
        }

        public int GetMaterialScore(Match3.MaterialCategory category)
        {
            MaterialPreference pref = MaterialPreferences.Find(m => m.Category == category);
            return pref != null ? pref.Weight : 50;
        }

        public int GetFurnitureTypeScore(FurnitureType type)
        {
            FurnitureTypePreference pref = FurniturePreferences.Find(f => f.FurnitureType == type);
            return pref != null ? pref.Weight : 50;
        }

        public string GetRandomGreeting()
        {
            return GreetingLines != null && GreetingLines.Length > 0
                ? GreetingLines[Random.Range(0, GreetingLines.Length)]
                : "你好，我想装修我的房间。";
        }

        public string GetRandomHint()
        {
            return HintLines != null && HintLines.Length > 0
                ? HintLines[Random.Range(0, HintLines.Length)]
                : "我希望能更舒适一些。";
        }

        public string GetReactionLine(int satisfactionLevel)
        {
            if (satisfactionLevel >= 80)
                return HappyLines != null && HappyLines.Length > 0
                    ? HappyLines[Random.Range(0, HappyLines.Length)]
                    : "太棒了！非常满意！";
            else if (satisfactionLevel >= 50)
                return NeutralLines != null && NeutralLines.Length > 0
                    ? NeutralLines[Random.Range(0, NeutralLines.Length)]
                    : "还不错，谢谢。";
            else
                return DisappointedLines != null && DisappointedLines.Length > 0
                    ? DisappointedLines[Random.Range(0, DisappointedLines.Length)]
                    : "这和我想要的不太一样...";
        }
    }

    [System.Serializable]
    public class StylePreference
    {
        public DecorationStyle Style;
        [Range(0, 100)] public int Weight = 50;
    }

    [System.Serializable]
    public class ColorPreference
    {
        public Color Color;
        [Range(0, 100)] public int Weight = 50;
    }

    [System.Serializable]
    public class MaterialPreference
    {
        public Match3.MaterialCategory Category;
        [Range(0, 100)] public int Weight = 50;
    }

    [System.Serializable]
    public class FurnitureTypePreference
    {
        public FurnitureType FurnitureType;
        [Range(0, 100)] public int Weight = 50;
    }

    public enum CustomerPersonality
    {
        Easygoing,
        Demanding,
        Creative,
        BudgetConscious,
        Trendy,
        Traditional
    }
}
