#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "StickerShopTypes.h"
#include "StickerShopPlayerController.generated.h"

class UW_StickerDesign;
class UW_Printing;
class UW_StallLayout;
class UW_Settlement;
class UW_RetryPrompt;
class AStickerShopGameMode;

UCLASS()
class STICKERSHOP_API AStickerShopPlayerController : public APlayerController
{
	GENERATED_BODY()

public:
	AStickerShopPlayerController();

	virtual void BeginPlay() override;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI")
	void ShowDesignUI();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI")
	void ShowPrintUI();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI")
	void ShowStallUI();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI")
	void ShowSellUI();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI")
	void ShowSettlementUI(const FSettlementData& Data);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI")
	void ShowRetryPrompt(int32 LevelId, const FString& Reason);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|UI")
	void HideAllUI();

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|UI")
	UW_StickerDesign* GetDesignWidget() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|UI")
	UW_Printing* GetPrintWidget() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|UI")
	UW_StallLayout* GetStallWidget() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|UI")
	UW_Settlement* GetSettlementWidget() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|UI")
	UW_RetryPrompt* GetRetryWidget() const;

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI")
	void OnShowDesignUI();

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI")
	void OnShowPrintUI();

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI")
	void OnShowStallUI();

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI")
	void OnShowSellUI();

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI")
	void OnShowSettlementUI(const FSettlementData& Data);

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI")
	void OnShowRetryPrompt(int32 LevelId, const FString& Reason);

	UFUNCTION(BlueprintImplementableEvent, Category = "StickerShop|UI")
	void OnHideAllUI();

protected:
	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|UI")
	TSubclassOf<UW_StickerDesign> DesignWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|UI")
	TSubclassOf<UW_Printing> PrintWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|UI")
	TSubclassOf<UW_StallLayout> StallWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|UI")
	TSubclassOf<UW_Settlement> SettlementWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "StickerShop|UI")
	TSubclassOf<UW_RetryPrompt> RetryWidgetClass;

private:
	UPROPERTY()
	UW_StickerDesign* DesignWidget;

	UPROPERTY()
	UW_Printing* PrintWidget;

	UPROPERTY()
	UW_StallLayout* StallWidget;

	UPROPERTY()
	UW_Settlement* SettlementWidget;

	UPROPERTY()
	UW_RetryPrompt* RetryWidget;

	void CreateWidgets();
	void RemoveAllWidgets();
	void BindDelegates();

	UFUNCTION()
	void OnDesignConfirmed(const FString& Name, EThemeType Theme, EStickerRarity Rarity);

	UFUNCTION()
	void OnPrintConfirmed(int32 DesignId, int32 Quantity);

	UFUNCTION()
	void OnSlotPlacement(int32 SlotIndex, int32 DesignId);

	UFUNCTION()
	void OnLayoutConfirmed();

	UFUNCTION()
	void OnRetryConfirmed(int32 LevelId);

	UFUNCTION()
	void OnRetryCancelled();

	UFUNCTION()
	void OnSettlementDismissed();

	UFUNCTION()
	void OnRetryRequested(int32 LevelId);
};
