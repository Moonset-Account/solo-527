#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "StickerShopTypes.h"
#include "InventoryComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnItemAdded, int32, DesignId, const FString&, Name, int32, Quantity);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnBudgetChanged, int32, NewBudget, bool, bIsIncome);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnBudgetDepleted, int32, RemainingBudget);

UCLASS(ClassGroup=(StickerShop), meta=(BlueprintSpawnableComponent))
class STICKERSHOP_API UInventoryComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UInventoryComponent();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Inventory")
	void Initialize(int32 StartingBudget);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Inventory")
	bool AddItem(const FStickerDesign& Design, int32 Quantity);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Inventory")
	bool RemoveItem(int32 DesignId, int32 Quantity);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Inventory")
	int32 GetQuantity(int32 DesignId) const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Inventory")
	const TArray<FInventoryItem>& GetAllItems() const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Inventory")
	TArray<FInventoryItem> GetItemsByTheme(EThemeType Theme) const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Inventory")
	bool SpendBudget(int32 Amount);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Inventory")
	void EarnIncome(int32 Amount);

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Inventory")
	int32 GetBudget() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Inventory")
	bool HasDesign(int32 DesignId) const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Inventory")
	int32 GetTotalItemCount() const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Inventory")
	void Clear();

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Inventory")
	FOnItemAdded OnItemAdded;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Inventory")
	FOnBudgetChanged OnBudgetChanged;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Inventory")
	FOnBudgetDepleted OnBudgetDepleted;

private:
	UPROPERTY()
	TArray<FInventoryItem> Items;

	UPROPERTY()
	int32 CurrentBudget = 0;

	FInventoryItem* FindItem(int32 DesignId);
	const FInventoryItem* FindItem(int32 DesignId) const;
};
