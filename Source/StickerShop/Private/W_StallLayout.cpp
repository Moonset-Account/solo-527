#include "W_StallLayout.h"
#include "StickerShopGameMode.h"

void UW_StallLayout::SetStallState(const TArray<FStallSlot>& InSlots, const TArray<FInventoryItem>& InInventory)
{
	CurrentSlots = InSlots;
	AvailableInventory = InInventory;
	BP_OnStallUpdated();
}

void UW_StallLayout::PlaceOnSlot(int32 SlotIndex, int32 DesignId)
{
	if (!CurrentSlots.IsValidIndex(SlotIndex)) return;
	OnSlotPlacement.Broadcast(SlotIndex, DesignId);
}

void UW_StallLayout::ClearSlot(int32 SlotIndex)
{
	if (!CurrentSlots.IsValidIndex(SlotIndex)) return;
	OnSlotCleared.Broadcast(SlotIndex);
}

void UW_StallLayout::ConfirmLayout()
{
	OnLayoutConfirmed.Broadcast();
}

float UW_StallLayout::GetCurrentLayoutBonus() const
{
	return LayoutBonus;
}
