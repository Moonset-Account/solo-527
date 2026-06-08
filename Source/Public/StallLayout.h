#pragma once

#include "StickerTypes.h"

class UStallLayout
{
public:
    UStallLayout() = default;

    void Initialize(int32_t NumSlots);
    bool PlaceSticker(int32_t SlotIndex, const FStickerDesign& Design);
    bool RemoveFromSlot(int32_t SlotIndex);
    void ClearAll();

    const FStallLayout& GetLayout() const;
    int32_t GetSlotCount() const;
    int32_t GetOccupiedCount() const;

    float CalculateLayoutBonus() const;
    float GetAttractiveness(int32_t SlotIndex) const;
    float GetVisibility(int32_t SlotIndex) const;

    std::vector<FInventoryItem> GetDisplayItems(const std::vector<FInventoryItem>& Inventory) const;

private:
    FStallLayout Layout;
    void RecalculateThemeCounts();
};
