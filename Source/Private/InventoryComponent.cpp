#include "InventoryComponent.h"

void UInventoryComponent::Initialize(int32_t StartingBudget)
{
    Items.clear();
    CurrentBudget = StartingBudget;
}

bool UInventoryComponent::AddItem(const FStickerDesign& Design, int32_t Quantity)
{
    if (Quantity <= 0) return false;

    FInventoryItem* Existing = FindItem(Design.DesignId);
    if (Existing)
    {
        Existing->Quantity += Quantity;
    }
    else
    {
        FInventoryItem Item;
        Item.DesignId = Design.DesignId;
        Item.DesignName = Design.Name;
        Item.Theme = Design.Theme;
        Item.Quantity = Quantity;
        Item.SellPrice = Design.SellPrice;
        Item.Rarity = Design.Rarity;
        Items.push_back(Item);
    }
    return true;
}

bool UInventoryComponent::RemoveItem(int32_t DesignId, int32_t Quantity)
{
    FInventoryItem* Item = FindItem(DesignId);
    if (!Item || Item->Quantity < Quantity) return false;

    Item->Quantity -= Quantity;
    if (Item->Quantity <= 0)
    {
        Items.erase(std::remove_if(Items.begin(), Items.end(),
            [DesignId](const FInventoryItem& I) { return I.DesignId == DesignId; }),
            Items.end());
    }
    return true;
}

int32_t UInventoryComponent::GetQuantity(int32_t DesignId) const
{
    const FInventoryItem* Item = FindItem(DesignId);
    return Item ? Item->Quantity : 0;
}

const std::vector<FInventoryItem>& UInventoryComponent::GetAllItems() const
{
    return Items;
}

std::vector<FInventoryItem> UInventoryComponent::GetItemsByTheme(EThemeType Theme) const
{
    std::vector<FInventoryItem> Result;
    for (const auto& Item : Items)
    {
        if (Item.Theme == Theme) Result.push_back(Item);
    }
    return Result;
}

bool UInventoryComponent::SpendBudget(int32_t Amount)
{
    if (Amount <= 0 || CurrentBudget < Amount) return false;
    CurrentBudget -= Amount;
    return true;
}

void UInventoryComponent::EarnIncome(int32_t Amount)
{
    if (Amount > 0) CurrentBudget += Amount;
}

int32_t UInventoryComponent::GetBudget() const
{
    return CurrentBudget;
}

void UInventoryComponent::Clear()
{
    Items.clear();
    CurrentBudget = 0;
}

bool UInventoryComponent::HasDesign(int32_t DesignId) const
{
    return FindItem(DesignId) != nullptr;
}

int32_t UInventoryComponent::GetTotalItemCount() const
{
    int32_t Total = 0;
    for (const auto& Item : Items) Total += Item.Quantity;
    return Total;
}

FInventoryItem* UInventoryComponent::FindItem(int32_t DesignId)
{
    for (auto& Item : Items)
    {
        if (Item.DesignId == DesignId) return &Item;
    }
    return nullptr;
}

const FInventoryItem* UInventoryComponent::FindItem(int32_t DesignId) const
{
    for (const auto& Item : Items)
    {
        if (Item.DesignId == DesignId) return &Item;
    }
    return nullptr;
}
