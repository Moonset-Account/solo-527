#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "StickerShopTypes.h"
#include "StallLayoutComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnStickerPlaced, int32, SlotIndex, int32, DesignId, EThemeType, Theme);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnStickerRemoved, int32, SlotIndex);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnLayoutBonusChanged, float, NewBonus);

UCLASS(ClassGroup=(StickerShop), meta=(BlueprintSpawnableComponent))
class STICKERSHOP_API UStallLayoutComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UStallLayoutComponent();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Stall")
	void Initialize(int32 NumSlots);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Stall")
	bool PlaceSticker(int32 SlotIndex, const FStickerDesign& Design);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Stall")
	bool RemoveFromSlot(int32 SlotIndex);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Stall")
	void ClearAll();

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Stall")
	const TArray<FStallSlot>& GetSlots() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Stall")
	int32 GetSlotCount() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Stall")
	int32 GetOccupiedCount() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Stall")
	float GetLayoutBonus() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Stall")
	float GetAttractiveness(int32 SlotIndex) const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Stall")
	float GetVisibility(int32 SlotIndex) const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Stall")
	TArray<FInventoryItem> GetDisplayItems(const TArray<FInventoryItem>& Inventory) const;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Stall")
	FOnStickerPlaced OnStickerPlaced;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Stall")
	FOnStickerRemoved OnStickerRemoved;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Stall")
	FOnLayoutBonusChanged OnLayoutBonusChanged;

private:
	UPROPERTY()
	TArray<FStallSlot> Slots;

	UPROPERTY()
	float LayoutBonus = 0.0f;

	UPROPERTY()
	TMap<EThemeType, int32> ThemeCounts;

	void RecalculateThemeCounts();
	float CalculateLayoutBonus() const;
};
