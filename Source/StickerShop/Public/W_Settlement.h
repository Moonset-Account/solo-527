#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "StickerShopTypes.h"
#include "W_Settlement.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnSettlementDismissed);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnRetryRequested, int32, LevelId);

UCLASS()
class STICKERSHOP_API UW_Settlement : public UUserWidget
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Settlement")
	void DisplaySettlement(const FSettlementData& Data);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Settlement")
	void DismissSettlement();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Settlement")
	void RequestRetry();

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|UI|Settlement")
	bool IsRetryAvailable() const;

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI|Settlement")
	void BP_OnSettlementDisplayed(const FSettlementData& Data);

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI|Settlement")
	void BP_OnRetryAvailable(bool bAvailable);

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI|Settlement")
	void BP_OnSettlementDismissed();

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|UI|Settlement")
	FOnSettlementDismissed OnSettlementDismissed;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|UI|Settlement")
	FOnRetryRequested OnRetryRequested;

protected:
	UPROPERTY(BlueprintReadWrite, Category = "StickerShop|UI|Settlement")
	FSettlementData CurrentSettlement;

	UPROPERTY(BlueprintReadWrite, Category = "StickerShop|UI|Settlement")
	bool bCanRetry = false;
};
