#include "StallLayout.h"

void UStallLayout::Initialize(int32_t NumSlots)
{
    Layout.Slots.clear();
    Layout.StallId = 0;
    Layout.LayoutBonus = 0.0f;
    Layout.ThemeCounts.clear();
    for (int32_t i = 0; i < NumSlots; i++)
    {
        FStallSlot Slot;
        Slot.SlotIndex = i;
        Slot.Visibility = 1.0f - (i * 0.1f);
        Slot.Attractiveness = 0.5f + (i % 2 == 0 ? 0.1f : 0.0f);
        Layout.Slots.push_back(Slot);
    }
}

bool UStallLayout::PlaceSticker(int32_t SlotIndex, const FStickerDesign& Design)
{
    if (SlotIndex < 0 || SlotIndex >= static_cast<int32_t>(Layout.Slots.size())) return false;
    FStallSlot& Slot = Layout.Slots[SlotIndex];
    if (Slot.bOccupied) return false;

    Slot.bOccupied = true;
    Slot.DesignId = Design.DesignId;
    Slot.DesignName = Design.Name;
    Slot.Theme = Design.Theme;
    Slot.Attractiveness = Design.Popularity;

    RecalculateThemeCounts();
    Layout.LayoutBonus = CalculateLayoutBonus();
    return true;
}

bool UStallLayout::RemoveFromSlot(int32_t SlotIndex)
{
    if (SlotIndex < 0 || SlotIndex >= static_cast<int32_t>(Layout.Slots.size())) return false;
    FStallSlot& Slot = Layout.Slots[SlotIndex];
    if (!Slot.bOccupied) return false;

    Slot.bOccupied = false;
    Slot.DesignId = -1;
    Slot.DesignName.clear();
    Slot.Theme = EThemeType::Floral;
    Slot.Attractiveness = 0.5f;

    RecalculateThemeCounts();
    Layout.LayoutBonus = CalculateLayoutBonus();
    return true;
}

void UStallLayout::ClearAll()
{
    for (auto& Slot : Layout.Slots)
    {
        Slot.bOccupied = false;
        Slot.DesignId = -1;
        Slot.DesignName.clear();
        Slot.Theme = EThemeType::Floral;
        Slot.Attractiveness = 0.5f;
    }
    Layout.ThemeCounts.clear();
    Layout.LayoutBonus = 0.0f;
}

const FStallLayout& UStallLayout::GetLayout() const
{
    return Layout;
}

int32_t UStallLayout::GetSlotCount() const
{
    return static_cast<int32_t>(Layout.Slots.size());
}

int32_t UStallLayout::GetOccupiedCount() const
{
    return Layout.GetOccupiedCount();
}

float UStallLayout::CalculateLayoutBonus() const
{
    if (Layout.Slots.empty()) return 0.0f;
    int32_t Occupied = Layout.GetOccupiedCount();
    if (Occupied == 0) return 0.0f;

    float Bonus = 0.0f;
    int32_t MaxThemeCount = 0;
    for (const auto& [Theme, Count] : Layout.ThemeCounts)
    {
        MaxThemeCount = std::max(MaxThemeCount, Count);
    }
    float DiversityRatio = static_cast<float>(Layout.ThemeCounts.size()) / static_cast<float>(Occupied);
    if (DiversityRatio >= 0.5f && DiversityRatio <= 1.0f)
    {
        Bonus += 0.1f;
    }
    if (MaxThemeCount >= 2 && MaxThemeCount <= 3)
    {
        Bonus += 0.15f;
    }
    float FillRatio = static_cast<float>(Occupied) / static_cast<float>(Layout.GetCapacity());
    Bonus += FillRatio * 0.1f;

    return Bonus;
}

float UStallLayout::GetAttractiveness(int32_t SlotIndex) const
{
    if (SlotIndex < 0 || SlotIndex >= static_cast<int32_t>(Layout.Slots.size())) return 0.0f;
    return Layout.Slots[SlotIndex].Attractiveness + Layout.LayoutBonus;
}

float UStallLayout::GetVisibility(int32_t SlotIndex) const
{
    if (SlotIndex < 0 || SlotIndex >= static_cast<int32_t>(Layout.Slots.size())) return 0.0f;
    return Layout.Slots[SlotIndex].Visibility;
}

std::vector<FInventoryItem> UStallLayout::GetDisplayItems(const std::vector<FInventoryItem>& Inventory) const
{
    std::vector<FInventoryItem> Display;
    for (const auto& Slot : Layout.Slots)
    {
        if (!Slot.bOccupied) continue;
        for (const auto& Item : Inventory)
        {
            if (Item.DesignId == Slot.DesignId && Item.Quantity > 0)
            {
                Display.push_back(Item);
                break;
            }
        }
    }
    return Display;
}

void UStallLayout::RecalculateThemeCounts()
{
    Layout.ThemeCounts.clear();
    for (const auto& Slot : Layout.Slots)
    {
        if (Slot.bOccupied)
        {
            Layout.ThemeCounts[Slot.Theme]++;
        }
    }
}
