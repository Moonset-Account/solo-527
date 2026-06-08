#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "StickerShopTypes.h"
#include "DailyLedgerComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnLedgerEntry, const FString&, Category, const FString&, Description, int32, Amount);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDayClosed, int32, NetProfit);

UCLASS(ClassGroup=(StickerShop), meta=(BlueprintSpawnableComponent))
class STICKERSHOP_API UDailyLedgerComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UDailyLedgerComponent();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Ledger")
	void StartDay(int32 DayNumber);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Ledger")
	void RecordIncome(const FString& Description, int32 Amount);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Ledger")
	void RecordExpense(const FString& Description, int32 Amount);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Ledger")
	void CloseDay();

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Ledger")
	const FDailyLedger& GetCurrentLedger() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Ledger")
	int32 GetNetProfit() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Ledger")
	int32 GetTotalIncome() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Ledger")
	int32 GetTotalExpense() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Ledger")
	const TArray<FDailyLedger>& GetHistory() const;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Ledger")
	FOnLedgerEntry OnLedgerEntry;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Ledger")
	FOnDayClosed OnDayClosed;

private:
	UPROPERTY()
	FDailyLedger Current;

	UPROPERTY()
	TArray<FDailyLedger> History;
};
