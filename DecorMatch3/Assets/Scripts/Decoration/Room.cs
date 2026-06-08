using UnityEngine;
using System.Collections.Generic;

namespace DecorMatch3
{
    public class RoomSlot
    {
        public string SlotName;
        public string CurrentFurnitureId;
        public string AppliedColorHex;
        public List<string> AllowedCategories;

        public RoomSlot()
        {
            AllowedCategories = new List<string>();
        }
    }

    public class Room
    {
        public string RoomType { get; set; }
        public List<RoomSlot> Slots { get; private set; }
        public string AppliedPaletteId { get; set; }

        public Room()
        {
            Slots = new List<RoomSlot>();
        }

        public void Initialize(string roomType, RoomSlotData[] slotData)
        {
            RoomType = roomType;
            Slots.Clear();
            if (slotData == null) return;
            foreach (var sd in slotData)
            {
                var slot = new RoomSlot
                {
                    SlotName = sd.slotName,
                    CurrentFurnitureId = sd.furnitureId,
                    AppliedColorHex = sd.appliedColorHex,
                    AllowedCategories = new List<string>()
                };
                Slots.Add(slot);
            }
        }

        public RoomSlot GetSlot(string name)
        {
            return Slots.Find(s => s.SlotName == name);
        }

        public void SetSlotFurniture(string slotName, string furnitureId)
        {
            var slot = GetSlot(slotName);
            if (slot != null)
            {
                slot.CurrentFurnitureId = furnitureId;
            }
        }

        public void SetSlotColor(string slotName, string hexColor)
        {
            var slot = GetSlot(slotName);
            if (slot != null)
            {
                slot.AppliedColorHex = hexColor;
            }
        }

        public void ApplyPalette(string paletteId, ColorPaletteData palette)
        {
            AppliedPaletteId = paletteId;
            if (palette == null || palette.hexColors == null) return;
            int count = Mathf.Min(Slots.Count, palette.hexColors.Length);
            for (int i = 0; i < count; i++)
            {
                Slots[i].AppliedColorHex = palette.hexColors[i];
            }
        }

        public RoomStateData ToData()
        {
            var slotArray = new RoomSlotData[Slots.Count];
            for (int i = 0; i < Slots.Count; i++)
            {
                slotArray[i] = new RoomSlotData
                {
                    slotName = Slots[i].SlotName,
                    furnitureId = Slots[i].CurrentFurnitureId,
                    appliedColorHex = Slots[i].AppliedColorHex
                };
            }
            return new RoomStateData
            {
                roomType = RoomType,
                slots = slotArray,
                appliedPaletteId = AppliedPaletteId
            };
        }

        public static Room FromData(RoomStateData data)
        {
            if (data == null) return null;
            var room = new Room();
            room.RoomType = data.roomType;
            room.AppliedPaletteId = data.appliedPaletteId;
            if (data.slots != null)
            {
                foreach (var sd in data.slots)
                {
                    var slot = new RoomSlot
                    {
                        SlotName = sd.slotName,
                        CurrentFurnitureId = sd.furnitureId,
                        AppliedColorHex = sd.appliedColorHex,
                        AllowedCategories = new List<string>()
                    };
                    room.Slots.Add(slot);
                }
            }
            return room;
        }
    }
}
