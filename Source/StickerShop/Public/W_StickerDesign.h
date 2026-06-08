#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "StickerShopTypes.h"
#include "W_StickerDesign.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnDesignConfirmed, const FString&, Name, EThemeType, Theme, EStickerRarity, Rarity);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnDesignCancelled);

UCLASS()
class STICKERSHOP_API UW_StickerDesign : public UUserWidget
{
	GENERATED_BODY()

public:
	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Design")
	void SetDesignOptions(const TArray<EThemeType>& AvailableThemes);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Design")
	void ConfirmDesign(const FString& Name, EThemeType Theme, EStickerRarity Rarity);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Design")
	void CancelDesign();

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|UI|Design")
	int32 GetBudgetRemaining() const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI|Design")
	void UpdateBudgetDisplay(int32 Budget);

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI|Design")
	void BP_OnDesignOptionsUpdated();

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI|Design")
	void BP_OnBudgetUpdated(int32 Budget);

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|UI|Design")
	FOnDesignConfirmed OnDesignConfirmed;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|UI|Design")
	FOnDesignCancelled OnDesignCancelled;

protected:
	UPROPERTY(BlueprintReadWrite, Category = "StickerShop|UI|Design")
	TArray<EThemeType> AvailableThemes;

	UPROPERTY(BlueprintReadWrite, Category = "StickerShop|UI|Design")
	int32 CurrentBudget = 0;
};
