#include "StallLayoutComponent.h"

UStallLayoutComponent::UStallLayoutComponent()
{
	PrimaryComponentTick.bCanEverTick = false;
}

void UStallLayoutComponent::Initialize(int32 NumSlots)
{
	Slots.Empty();
	LayoutBonus = 0.0f;
	ThemeCounts.Empty();

	for (int32 i = 0; i < NumSlots; i++)
	{
		FStallSlot Slot;
		Slot.SlotIndex = i;
		Slot.Visibility = 1.0f - (i * 0.1f);
		Slot.Attractiveness = 0.5f + (i % 2 == 0 ? 0.1f : 0.0f);
		Slots.Add(Slot);
	}
}

bool UStallLayoutComponent::PlaceSticker(int32 SlotIndex, const FStickerDesign& Design)
{
	if (!Slots.IsValidIndex(SlotIndex)) return false;
	FStallSlot& Slot = Slots[SlotIndex];
	if (Slot.bOccupied) return false;

	Slot.bOccupied = true;
	Slot.DesignId = Design.DesignId;
	Slot.DesignName = Design.Name;
	Slot.Theme = Design.Theme;
	Slot.Attractiveness = Design.Popularity;

	RecalculateThemeCounts();
	float OldBonus = LayoutBonus;
	LayoutBonus = CalculateLayoutBonus();
	if (!FMath::IsNearlyEqual(OldBonus, LayoutBonus))
	{
		OnLayoutBonusChanged.Broadcast(LayoutBonus);
	}

	OnStickerPlaced.Broadcast(SlotIndex, Design.DesignId, Design.Theme);
	return true;
}

bool UStallLayoutComponent::RemoveFromSlot(int32 SlotIndex)
{
	if (!Slots.IsValidIndex(SlotIndex)) return false;
	FStallSlot& Slot = Slots[SlotIndex];
	if (!Slot.bOccupied) return false;

	Slot.bOccupied = false;
	Slot.DesignId = -1;
	Slot.DesignName.Empty();
	Slot.Theme = EThemeType::Floral;
	Slot.Attractiveness = 0.5f;

	RecalculateThemeCounts();
	float OldBonus = LayoutBonus;
	LayoutBonus = CalculateLayoutBonus();
	if (!FMath::IsNearlyEqual(OldBonus, LayoutBonus))
	{
		OnLayoutBonusChanged.Broadcast(LayoutBonus);
	}

	OnStickerRemoved.Broadcast(SlotIndex);
	return true;
}

void UStallLayoutComponent::ClearAll()
{
	for (auto& Slot : Slots)
	{
		Slot.bOccupied = false;
		Slot.DesignId = -1;
		Slot.DesignName.Empty();
		Slot.Theme = EThemeType::Floral;
		Slot.Attractiveness = 0.5f;
	}
	ThemeCounts.Empty();
	LayoutBonus = 0.0f;
}

const TArray<FStallSlot>& UStallLayoutComponent::GetSlots() const
{
	return Slots;
}

int32 UStallLayoutComponent::GetSlotCount() const
{
	return Slots.Num();
}

int32 UStallLayoutComponent::GetOccupiedCount() const
{
	int32 Count = 0;
	for (const auto& S : Slots) if (S.bOccupied) Count++;
	return Count;
}

float UStallLayoutComponent::GetLayoutBonus() const
{
	return LayoutBonus;
}

float UStallLayoutComponent::GetAttractiveness(int32 SlotIndex) const
{
	if (!Slots.IsValidIndex(SlotIndex)) return 0.0f;
	return Slots[SlotIndex].Attractiveness + LayoutBonus;
}

float UStallLayoutComponent::GetVisibility(int32 SlotIndex) const
{
	if (!Slots.IsValidIndex(SlotIndex)) return 0.0f;
	return Slots[SlotIndex].Visibility;
}

TArray<FInventoryItem> UStallLayoutComponent::GetDisplayItems(const TArray<FInventoryItem>& Inventory) const
{
	TArray<FInventoryItem> Display;
	for (const auto& Slot : Slots)
	{
		if (!Slot.bOccupied) continue;
		for (const auto& Item : Inventory)
		{
			if (Item.DesignId == Slot.DesignId && Item.Quantity > 0)
			{
				Display.Add(Item);
				break;
			}
		}
	}
	return Display;
}

void UStallLayoutComponent::RecalculateThemeCounts()
{
	ThemeCounts.Empty();
	for (const auto& Slot : Slots)
	{
		if (Slot.bOccupied)
		{
			int32& Count = ThemeCounts.FindOrAdd(Slot.Theme, 0);
			Count++;
		}
	}
}

float UStallLayoutComponent::CalculateLayoutBonus() const
{
	if (Slots.Num() == 0) return 0.0f;
	int32 Occupied = GetOccupiedCount();
	if (Occupied == 0) return 0.0f;

	float Bonus = 0.0f;
	int32 MaxThemeCount = 0;
	for (const auto& [Theme, Count] : ThemeCounts)
	{
		MaxThemeCount = FMath::Max(MaxThemeCount, Count);
	}

	float DiversityRatio = static_cast<float>(ThemeCounts.Num()) / static_cast<float>(Occupied);
	if (DiversityRatio >= 0.5f && DiversityRatio <= 1.0f)
	{
		Bonus += 0.1f;
	}
	if (MaxThemeCount >= 2 && MaxThemeCount <= 3)
	{
		Bonus += 0.15f;
	}

	float FillRatio = static_cast<float>(Occupied) / static_cast<float>(Slots.Num());
	Bonus += FillRatio * 0.1f;

	return Bonus;
}
