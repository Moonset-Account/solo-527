#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "StickerShopTypes.h"
#include "W_Printing.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnPrintConfirmed, int32, DesignId, int32, Quantity);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnPrintCancelled);

UCLASS()
class STICKERSHOP_API UW_Printing : public UUserWidget
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Print")
	void SetAvailableDesigns(const TArray<FStickerDesign>& Designs);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Print")
	void ConfirmPrint(int32 DesignId, int32 Quantity);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Print")
	void CancelPrint();

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|UI|Print")
	int32 GetPrintCost(int32 DesignId, int32 Quantity) const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Print")
	void UpdateBudgetDisplay(int32 Budget);

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI|Print")
	void BP_OnDesignsUpdated();

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI|Print")
	void BP_OnBudgetUpdated(int32 Budget);

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|UI|Print")
	FOnPrintConfirmed OnPrintConfirmed;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|UI|Print")
	FOnPrintCancelled OnPrintCancelled;

protected:
	UPROPERTY(BlueprintReadWrite, Category = "StickerShop|UI|Print")
	TArray<FStickerDesign> AvailableDesigns;

	UPROPERTY(BlueprintReadWrite, Category = "StickerShop|UI|Print")
	int32 CurrentBudget = 0;
};
