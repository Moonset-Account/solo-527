#include "InventoryComponent.h"

UInventoryComponent::UInventoryComponent()
{
	PrimaryComponentTick.bCanEverTick = false;
}

void UInventoryComponent::Initialize(int32 StartingBudget)
{
	Items.Empty();
	CurrentBudget = StartingBudget;
}

bool UInventoryComponent::AddItem(const FStickerDesign& Design, int32 Quantity)
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
		Items.Add(Item);
	}

	OnItemAdded.Broadcast(Design.DesignId, Design.Name, Quantity);
	return true;
}

bool UInventoryComponent::RemoveItem(int32 DesignId, int32 Quantity)
{
	FInventoryItem* Item = FindItem(DesignId);
	if (!Item || Item->Quantity < Quantity) return false;

	Item->Quantity -= Quantity;
	if (Item->Quantity <= 0)
	{
		Items.RemoveAll([DesignId](const FInventoryItem& I) { return I.DesignId == DesignId; });
	}
	return true;
}

int32 UInventoryComponent::GetQuantity(int32 DesignId) const
{
	const FInventoryItem* Item = FindItem(DesignId);
	return Item ? Item->Quantity : 0;
}

const TArray<FInventoryItem>& UInventoryComponent::GetAllItems() const
{
	return Items;
}

TArray<FInventoryItem> UInventoryComponent::GetItemsByTheme(EThemeType Theme) const
{
	TArray<FInventoryItem> Result;
	for (const auto& Item : Items)
	{
		if (Item.Theme == Theme) Result.Add(Item);
	}
	return Result;
}

bool UInventoryComponent::SpendBudget(int32 Amount)
{
	if (Amount <= 0 || CurrentBudget < Amount) return false;
	CurrentBudget -= Amount;
	OnBudgetChanged.Broadcast(CurrentBudget, false);
	if (CurrentBudget <= 0)
	{
		OnBudgetDepleted.Broadcast(CurrentBudget);
	}
	return true;
}

void UInventoryComponent::EarnIncome(int32 Amount)
{
	if (Amount > 0)
	{
		CurrentBudget += Amount;
		OnBudgetChanged.Broadcast(CurrentBudget, true);
	}
}

int32 UInventoryComponent::GetBudget() const
{
	return CurrentBudget;
}

bool UInventoryComponent::HasDesign(int32 DesignId) const
{
	return FindItem(DesignId) != nullptr;
}

int32 UInventoryComponent::GetTotalItemCount() const
{
	int32 Total = 0;
	for (const auto& Item : Items) Total += Item.Quantity;
	return Total;
}

void UInventoryComponent::Clear()
{
	Items.Empty();
	CurrentBudget = 0;
}

FInventoryItem* UInventoryComponent::FindItem(int32 DesignId)
{
	for (auto& Item : Items)
	{
		if (Item.DesignId == DesignId) return &Item;
	}
	return nullptr;
}

const FInventoryItem* UInventoryComponent::FindItem(int32 DesignId) const
{
	for (const auto& Item : Items)
	{
		if (Item.DesignId == DesignId) return &Item;
	}
	return nullptr;
}
