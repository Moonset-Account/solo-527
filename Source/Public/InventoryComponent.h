#pragma once

#include "StickerTypes.h"

class UInventoryComponent
{
public:
    UInventoryComponent() = default;

    void Initialize(int32_t StartingBudget);

    bool AddItem(const FStickerDesign& Design, int32_t Quantity);
    bool RemoveItem(int32_t DesignId, int32_t Quantity);
    int32_t GetQuantity(int32_t DesignId) const;
    const std::vector<FInventoryItem>& GetAllItems() const;
    std::vector<FInventoryItem> GetItemsByTheme(EThemeType Theme) const;

    bool SpendBudget(int32_t Amount);
    void EarnIncome(int32_t Amount);
    int32_t GetBudget() const;

    void Clear();
    bool HasDesign(int32_t DesignId) const;
    int32_t GetTotalItemCount() const;

private:
    std::vector<FInventoryItem> Items;
    int32_t CurrentBudget = 0;

    FInventoryItem* FindItem(int32_t DesignId);
    const FInventoryItem* FindItem(int32_t DesignId) const;
};
