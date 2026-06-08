using UnityEngine;
using System.Collections.Generic;
using System.Linq;

namespace DecorMatch3
{
    public class ColorPreference
    {
        public string ColorName;
        public float Weight;
        public string HexCode;
    }

    public class FurnitureRequirement
    {
        public string FurnitureId;
        public string SlotName;
        public bool Required;
        public string[] PreferredStyles;
    }

    public class CustomerOrder
    {
        public CustomerData Customer { get; private set; }
        public string RoomType { get; private set; }
        public string StylePreference { get; private set; }
        public List<ColorPreference> ColorPreferences { get; private set; }
        public List<FurnitureRequirement> FurnitureRequirements { get; private set; }
        public int Budget { get; private set; }

        public int TotalRequiredSlots => FurnitureRequirements != null ? FurnitureRequirements.Count(r => r.Required) : 0;

        public CustomerOrder()
        {
            ColorPreferences = new List<ColorPreference>();
            FurnitureRequirements = new List<FurnitureRequirement>();
        }

        public static CustomerOrder FromData(CustomerOrderData data, CustomerData customer)
        {
            if (data == null) return null;
            var order = new CustomerOrder
            {
                Customer = customer,
                RoomType = data.roomType,
                StylePreference = data.stylePreference,
                Budget = data.budget,
                ColorPreferences = new List<ColorPreference>(),
                FurnitureRequirements = new List<FurnitureRequirement>()
            };
            if (data.colorPreferences != null)
            {
                foreach (var cp in data.colorPreferences)
                {
                    order.ColorPreferences.Add(new ColorPreference
                    {
                        ColorName = cp.colorName,
                        Weight = cp.weight,
                        HexCode = cp.hexCode
                    });
                }
            }
            if (data.furnitureRequirements != null)
            {
                foreach (var fr in data.furnitureRequirements)
                {
                    order.FurnitureRequirements.Add(new FurnitureRequirement
                    {
                        FurnitureId = fr.furnitureId,
                        SlotName = fr.slotName,
                        Required = fr.required,
                        PreferredStyles = fr.preferredStyles
                    });
                }
            }
            return order;
        }

        public float GetColorWeight(string hexCode)
        {
            if (string.IsNullOrEmpty(hexCode) || ColorPreferences == null) return 0f;
            var pref = ColorPreferences.FirstOrDefault(c => c.HexCode == hexCode);
            if (pref != null) return pref.Weight;
            float bestWeight = 0f;
            foreach (var cp in ColorPreferences)
            {
                Color a = ColorScheme.HexToColor(cp.HexCode);
                Color b = ColorScheme.HexToColor(hexCode);
                float dist = ColorScheme.ColorDistance(a, b);
                if (dist < 0.2f)
                {
                    float weight = cp.Weight * (1f - dist / 0.2f);
                    if (weight > bestWeight) bestWeight = weight;
                }
            }
            return bestWeight;
        }

        public bool IsFurnitureRequired(string slotName)
        {
            if (FurnitureRequirements == null) return false;
            var req = FurnitureRequirements.FirstOrDefault(r => r.SlotName == slotName);
            return req != null && req.Required;
        }

        public string[] GetPreferredStylesForSlot(string slotName)
        {
            if (FurnitureRequirements == null) return new string[0];
            var req = FurnitureRequirements.FirstOrDefault(r => r.SlotName == slotName);
            return req != null && req.PreferredStyles != null ? req.PreferredStyles : new string[0];
        }
    }
}
