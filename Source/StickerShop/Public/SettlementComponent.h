#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "StickerShopTypes.h"
#include "SettlementComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSettlementComplete, const FSettlementData&, SettlementData);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnRetryPrompt, int32, LevelId, const FString&, FailureReason);

UCLASS(ClassGroup=(StickerShop), meta=(BlueprintSpawnableComponent))
class STICKERSHOP_API USettlementComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	USettlementComponent();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Settlement")
	FSettlementData Calculate(const FLevelDefinition& Level, int32 Score, float TimeUsed,
		int32 CustomersSatisfied, int32 CustomersTotal, int32 NetProfit,
		const TArray<FString>& ErrorReasons, const TArray<FString>& CollectedItems);

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Settlement")
	static FString CalculateGrade(int32 Score);

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Settlement")
	static float CalculateSatisfactionRate(int32 Satisfied, int32 Total);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Settlement")
	void ShowSettlement(const FSettlementData& Data);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Settlement")
	void RequestRetry(int32 LevelId, const FString& FailureReason);

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Settlement")
	bool ShouldShowRetry(const FSettlementData& Data) const;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Settlement")
	FOnSettlementComplete OnSettlementComplete;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Settlement")
	FOnRetryPrompt OnRetryPrompt;
};
