using UnityEngine;
using System.Collections.Generic;
using System.Linq;

namespace DecorMatch3
{
    public class FurnitureCatalog : MonoBehaviour
    {
        private List<FurnitureData> _allFurniture = new List<FurnitureData>();

        public void Initialize()
        {
            _allFurniture.Clear();
            var config = ConfigManager.Instance;
            if (config == null) return;
            var categories = new[] { "Bed", "Sofa", "Table", "Chair", "Lamp", "Rug", "Curtain", "Shelf", "Desk", "Wardrobe" };
            foreach (var cat in categories)
            {
                var items = config.GetFurnitureByCategory(cat);
                if (items != null)
                {
                    _allFurniture.AddRange(items);
                }
            }
        }

        public FurnitureData GetFurniture(string id)
        {
            return _allFurniture.FirstOrDefault(f => f.furnitureId == id);
        }

        public List<FurnitureData> GetByCategory(string category)
        {
            return _allFurniture.Where(f => f.category == category).ToList();
        }

        public List<FurnitureData> GetByStyle(string style)
        {
            return _allFurniture.Where(f => f.style == style).ToList();
        }

        public List<FurnitureData> GetByCategoryAndStyle(string category, string style)
        {
            return _allFurniture.Where(f => f.category == category && f.style == style).ToList();
        }

        public List<FurnitureData> GetAffordable(int budget)
        {
            return _allFurniture.Where(f => f.cost <= budget).ToList();
        }

        public List<FurnitureData> GetCompatibleWithColor(string hexColor)
        {
            return _allFurniture.Where(f => f.compatibleColors != null && f.compatibleColors.Contains(hexColor)).ToList();
        }

        public bool IsUnlocked(string furnitureId)
        {
            var save = SaveManager.Instance;
            if (save == null || save.CurrentSave == null) return false;
            return save.CurrentSave.playerProfile.unlockedFurniture != null && save.CurrentSave.playerProfile.unlockedFurniture.Contains(furnitureId);
        }

        public void Unlock(string furnitureId)
        {
            var save = SaveManager.Instance;
            if (save == null || save.CurrentSave == null) return;
            if (save.CurrentSave.playerProfile.unlockedFurniture == null)
            {
                save.CurrentSave.playerProfile.unlockedFurniture = new List<string>();
            }
            if (!save.CurrentSave.playerProfile.unlockedFurniture.Contains(furnitureId))
            {
                save.CurrentSave.playerProfile.unlockedFurniture.Add(furnitureId);
            }
        }

        public static float CalculateStyleMatch(FurnitureData furniture, string preferredStyle)
        {
            if (furniture == null || string.IsNullOrEmpty(preferredStyle)) return 0f;
            if (furniture.style == preferredStyle) return 1f;
            float baseScore = 0.3f;
            if (furniture.style != null && preferredStyle != null)
            {
                string fStyle = furniture.style.ToLower();
                string pStyle = preferredStyle.ToLower();
                if (fStyle.Contains(pStyle) || pStyle.Contains(fStyle)) return 0.6f;
                var similarStyles = new Dictionary<string, string[]>
                {
                    { "modern", new[] { "minimalist", "contemporary" } },
                    { "classic", new[] { "traditional", "vintage" } },
                    { "rustic", new[] { "country", "farmhouse" } },
                    { "bohemian", new[] { "eclectic", "artistic" } }
                };
                foreach (var kvp in similarStyles)
                {
                    bool fMatch = fStyle == kvp.Key || System.Array.Exists(kvp.Value, s => fStyle == s);
                    bool pMatch = pStyle == kvp.Key || System.Array.Exists(kvp.Value, s => pStyle == s);
                    if (fMatch && pMatch) return 0.5f;
                }
            }
            return baseScore;
        }

        public static float CalculateColorMatch(FurnitureData furniture, string[] likedColors, string[] dislikedColors)
        {
            if (furniture == null || furniture.compatibleColors == null) return 0f;
            if ((likedColors == null || likedColors.Length == 0) && (dislikedColors == null || dislikedColors.Length == 0)) return 0.5f;
            float score = 0f;
            int count = 0;
            foreach (var fc in furniture.compatibleColors)
            {
                if (likedColors != null && likedColors.Contains(fc))
                {
                    score += 1f;
                }
                else if (dislikedColors != null && dislikedColors.Contains(fc))
                {
                    score -= 0.5f;
                }
                else
                {
                    score += 0.3f;
                }
                count++;
            }
            if (count == 0) return 0f;
            return Mathf.Clamp01(score / count);
        }
    }
}
