#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "StickerShopTypes.h"
#include "W_StallLayout.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnSlotPlacement, int32, SlotIndex, int32, DesignId);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSlotCleared, int32, SlotIndex);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnLayoutConfirmed);

UCLASS()
class STICKERSHOP_API UW_StallLayout : public UUserWidget
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Stall")
	void SetStallState(const TArray<FStallSlot>& Slots, const TArray<FInventoryItem>& Inventory);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Stall")
	void PlaceOnSlot(int32 SlotIndex, int32 DesignId);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Stall")
	void ClearSlot(int32 SlotIndex);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Stall")
	void ConfirmLayout();

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|UI|Stall")
	float GetCurrentLayoutBonus() const;

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI|Stall")
	void BP_OnStallUpdated();

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI|Stall")
	void BP_OnLayoutBonusChanged(float Bonus);

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|UI|Stall")
	FOnSlotPlacement OnSlotPlacement;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|UI|Stall")
	FOnSlotCleared OnSlotCleared;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|UI|Stall")
	FOnLayoutConfirmed OnLayoutConfirmed;

protected:
	UPROPERTY(BlueprintReadWrite, Category = "StickerShop|UI|Stall")
	TArray<FStallSlot> CurrentSlots;

	UPROPERTY(BlueprintReadWrite, Category = "StickerShop|UI|Stall")
	TArray<FInventoryItem> AvailableInventory;

	UPROPERTY(BlueprintReadWrite, Category = "StickerShop|UI|Stall")
	float LayoutBonus = 0.0f;
};
