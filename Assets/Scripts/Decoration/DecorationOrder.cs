using System.Collections.Generic;
using UnityEngine;

namespace DecorMatch3.Decoration
{
    public enum OrderCategory
    {
        LivingRoom,
        Bedroom,
        Kitchen,
        Bathroom,
        Study,
        Balcony
    }

    public enum OrderStatus
    {
        Available,
        Accepted,
        InProgress,
        Completed,
        Failed,
        Expired
    }

    public enum RoomSize
    {
        Small,
        Medium,
        Large
    }

    [CreateAssetMenu(fileName = "NewOrder", menuName = "DecorMatch3/Decoration Order", order = 20)]
    public class DecorationOrder : ScriptableObject
    {
        [Header("订单基础信息")]
        public int OrderId;
        public string OrderTitle;
        [TextArea(3, 6)] public string OrderDescription;
        public OrderCategory Category;
        public RoomSize RoomSize;
        public Sprite RoomPreview;

        [Header("客户")]
        public CustomerProfile Customer;
        public int PriorityLevel = 1;

        [Header("预算与奖励")]
        public int BudgetMin;
        public int BudgetMax;
        public int BaseReward;
        public int StarRewardMultiplier = 100;
        public int GemReward = 0;

        [Header("所需关卡")]
        public int[] RequiredLevelIds;

        [Header("必选装修区域")]
        public List<DecorationSlot> RequiredSlots = new List<DecorationSlot>();

        [Header("可选装修区域")]
        public List<DecorationSlot> OptionalSlots = new List<DecorationSlot>();

        [Header("时限")]
        public float TimeLimitMinutes = 0;

        [Header("解锁条件")]
        public int UnlockOrderId = -1;
        public int MinLevelRequirement = 0;

        public bool HasWallSlot => RequiredSlots.Exists(s => s.SlotType == DecorationSlotType.WallColor) ||
                                   OptionalSlots.Exists(s => s.SlotType == DecorationSlotType.WallColor);

        public bool HasFloorSlot => RequiredSlots.Exists(s => s.SlotType == DecorationSlotType.FloorColor) ||
                                    OptionalSlots.Exists(s => s.SlotType == DecorationSlotType.FloorColor);

        public List<DecorationSlot> GetAllSlots()
        {
            List<DecorationSlot> allSlots = new List<DecorationSlot>(RequiredSlots);
            allSlots.AddRange(OptionalSlots);
            return allSlots;
        }

        public bool IsSlotRequired(DecorationSlot slot)
        {
            return RequiredSlots.Contains(slot);
        }
    }

    [System.Serializable]
    public class DecorationSlot
    {
        public string SlotId;
        public string SlotName;
        public DecorationSlotType SlotType;
        [TextArea(1, 3)] public string Description;
        public DecorationStyle[] PreferredStyles;

        public List<FurnitureItem> AvailableFurniture;
        public List<ColorPalette> AvailableColorPalettes;
        public List<MaterialData> AvailableMaterials;

        public bool IsRequired;
        public int MinMaterialCost;
        public int MaxMaterialCost;
    }

    public enum DecorationSlotType
    {
        WallColor,
        FloorColor,
        MainFurniture,
        SecondaryFurniture,
        Lighting,
        Decoration,
        Textile,
        Custom
    }
}
