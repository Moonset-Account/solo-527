#include "StickerShopPlayerController.h"
#include "StickerShopGameMode.h"

AStickerShopPlayerController::AStickerShopPlayerController()
{
	bShowMouseCursor = true;
}

void AStickerShopPlayerController::BeginPlay()
{
	Super::BeginPlay();
}

void AStickerShopPlayerController::ShowDesignUI()
{
	OnShowDesignUI();
}

void AStickerShopPlayerController::ShowPrintUI()
{
	OnShowPrintUI();
}

void AStickerShopPlayerController::ShowStallUI()
{
	OnShowStallUI();
}

void AStickerShopPlayerController::ShowSellUI()
{
	OnShowSellUI();
}

void AStickerShopPlayerController::ShowSettlementUI(const FSettlementData& Data)
{
	OnShowSettlementUI(Data);
}

void AStickerShopPlayerController::ShowRetryPrompt(int32 LevelId, const FString& Reason)
{
	OnShowRetryPrompt(LevelId, Reason);
}

void AStickerShopPlayerController::HideAllUI()
{
	OnHideAllUI();
}
