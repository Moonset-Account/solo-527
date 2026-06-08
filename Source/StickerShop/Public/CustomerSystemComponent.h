#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "StickerShopTypes.h"
#include "CustomerSystemComponent.generated.h"

class UInventoryComponent;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnCustomerServed, int32, OrderIndex, float, Satisfaction, int32, Revenue);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnCustomerRejected, int32, OrderIndex, const FString&, Reason);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnAllCustomersProcessed);

UCLASS(ClassGroup=(StickerShop), meta=(BlueprintSpawnableComponent))
class STICKERSHOP_API UCustomerSystemComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UCustomerSystemComponent();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Customer")
	void Initialize(int32 CustomerCount, const TArray<EThemeType>& AvailableThemes, float DifficultyMultiplier = 1.0f);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Customer")
	void GenerateCustomers();

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Customer")
	const TArray<FCustomerOrder>& GetOrders() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Customer")
	int32 GetActiveOrderCount() const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Customer")
	bool FulfillOrder(int32 OrderIndex, UInventoryComponent* Inventory);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Customer")
	void SkipOrder(int32 OrderIndex, const FString& Reason);

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Customer")
	int32 GetSatisfiedCount() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Customer")
	int32 GetTotalCount() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Customer")
	float GetSatisfactionRate() const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Customer")
	void Reset();

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Customer")
	FOnCustomerServed OnCustomerServed;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Customer")
	FOnCustomerRejected OnCustomerRejected;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Customer")
	FOnAllCustomersProcessed OnAllCustomersProcessed;

private:
	UPROPERTY()
	TArray<FCustomerOrder> Orders;

	int32 ConfigCustomerCount = 5;
	TArray<EThemeType> ConfigThemes;
	float ConfigDifficulty = 1.0f;
	int32 NextOrderId = 0;

	FCustomerPreference GeneratePreference();
	float CalculateSatisfaction(const FCustomerPreference& Pref, const FInventoryItem& Item) const;
};
