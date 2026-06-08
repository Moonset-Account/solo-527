#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "StickerShopPlayerController.generated.h"

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
};
