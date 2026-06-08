#include "StickerShopPlayerController.h"
#include "StickerShopGameMode.h"
#include "StickerShopGameInstance.h"
#include "W_StickerDesign.h"
#include "W_Printing.h"
#include "W_StallLayout.h"
#include "W_Settlement.h"
#include "W_RetryPrompt.h"
#include "Blueprint/UserWidget.h"

AStickerShopPlayerController::AStickerShopPlayerController()
{
	bShowMouseCursor = true;
	DesignWidget = nullptr;
	PrintWidget = nullptr;
	StallWidget = nullptr;
	SettlementWidget = nullptr;
	RetryWidget = nullptr;
}

void AStickerShopPlayerController::BeginPlay()
{
	Super::BeginPlay();
	CreateWidgets();
	BindDelegates();
	ShowDesignUI();
}

void AStickerShopPlayerController::CreateWidgets()
{
	if (DesignWidgetClass)
	{
		DesignWidget = CreateWidget<UW_StickerDesign>(this, DesignWidgetClass);
	}
	else
	{
		DesignWidget = NewObject<UW_StickerDesign>(this);
	}

	if (PrintWidgetClass)
	{
		PrintWidget = CreateWidget<UW_Printing>(this, PrintWidgetClass);
	}
	else
	{
		PrintWidget = NewObject<UW_Printing>(this);
	}

	if (StallWidgetClass)
	{
		StallWidget = CreateWidget<UW_StallLayout>(this, StallWidgetClass);
	}
	else
	{
		StallWidget = NewObject<UW_StallLayout>(this);
	}

	if (SettlementWidgetClass)
	{
		SettlementWidget = CreateWidget<UW_Settlement>(this, SettlementWidgetClass);
	}
	else
	{
		SettlementWidget = NewObject<UW_Settlement>(this);
	}

	if (RetryWidgetClass)
	{
		RetryWidget = CreateWidget<UW_RetryPrompt>(this, RetryWidgetClass);
	}
	else
	{
		RetryWidget = NewObject<UW_RetryPrompt>(this);
	}
}

void AStickerShopPlayerController::RemoveAllWidgets()
{
	if (DesignWidget) { DesignWidget->RemoveFromParent(); }
	if (PrintWidget) { PrintWidget->RemoveFromParent(); }
	if (StallWidget) { StallWidget->RemoveFromParent(); }
	if (SettlementWidget) { SettlementWidget->RemoveFromParent(); }
	if (RetryWidget) { RetryWidget->RemoveFromParent(); }
}

void AStickerShopPlayerController::BindDelegates()
{
	if (DesignWidget)
	{
		DesignWidget->OnDesignConfirmed.AddDynamic(this, &AStickerShopPlayerController::OnDesignConfirmed);
	}
	if (PrintWidget)
	{
		PrintWidget->OnPrintConfirmed.AddDynamic(this, &AStickerShopPlayerController::OnPrintConfirmed);
	}
	if (StallWidget)
	{
		StallWidget->OnSlotPlacement.AddDynamic(this, &AStickerShopPlayerController::OnSlotPlacement);
		StallWidget->OnLayoutConfirmed.AddDynamic(this, &AStickerShopPlayerController::OnLayoutConfirmed);
	}
	if (SettlementWidget)
	{
		SettlementWidget->OnSettlementDismissed.AddDynamic(this, &AStickerShopPlayerController::OnSettlementDismissed);
		SettlementWidget->OnRetryRequested.AddDynamic(this, &AStickerShopPlayerController::OnRetryRequested);
	}
	if (RetryWidget)
	{
		RetryWidget->OnRetryConfirmed.AddDynamic(this, &AStickerShopPlayerController::OnRetryConfirmed);
		RetryWidget->OnRetryCancelled.AddDynamic(this, &AStickerShopPlayerController::OnRetryCancelled);
	}
}

void AStickerShopPlayerController::ShowDesignUI()
{
	RemoveAllWidgets();
	if (DesignWidget && !DesignWidget->IsInViewport())
	{
		AStickerShopGameMode* GM = GetWorld()->GetAuthGameMode<AStickerShopGameMode>();
		if (GM)
		{
			const FLevelDefinition* Level = GM->GetCurrentLevelDef();
			if (Level)
			{
				DesignWidget->SetDesignOptions(Level->AvailableThemes);
				DesignWidget->UpdateBudgetDisplay(GM->GetInventoryComponent()->GetBudget());
			}
		}
		DesignWidget->AddToViewport();
	}
	OnShowDesignUI();
}

void AStickerShopPlayerController::ShowPrintUI()
{
	RemoveAllWidgets();
	if (PrintWidget && !PrintWidget->IsInViewport())
	{
		AStickerShopGameMode* GM = GetWorld()->GetAuthGameMode<AStickerShopGameMode>();
		if (GM)
		{
			PrintWidget->SetAvailableDesigns(GM->GetDesignComponent()->GetDesignedStickers());
			PrintWidget->UpdateBudgetDisplay(GM->GetInventoryComponent()->GetBudget());
		}
		PrintWidget->AddToViewport();
	}
	OnShowPrintUI();
}

void AStickerShopPlayerController::ShowStallUI()
{
	RemoveAllWidgets();
	if (StallWidget && !StallWidget->IsInViewport())
	{
		AStickerShopGameMode* GM = GetWorld()->GetAuthGameMode<AStickerShopGameMode>();
		if (GM)
		{
			StallWidget->SetStallState(
				GM->GetStallComponent()->GetSlots(),
				GM->GetInventoryComponent()->GetAllItems());
		}
		StallWidget->AddToViewport();
	}
	OnShowStallUI();
}

void AStickerShopPlayerController::ShowSellUI()
{
	RemoveAllWidgets();
	AStickerShopGameMode* GM = GetWorld()->GetAuthGameMode<AStickerShopGameMode>();
	if (GM)
	{
		GM->GetCustomerComponent()->GenerateCustomers();
	}
	OnShowSellUI();
}

void AStickerShopPlayerController::ShowSettlementUI(const FSettlementData& Data)
{
	RemoveAllWidgets();
	if (SettlementWidget && !SettlementWidget->IsInViewport())
	{
		SettlementWidget->DisplaySettlement(Data);
		SettlementWidget->AddToViewport();
	}
	OnShowSettlementUI(Data);
}

void AStickerShopPlayerController::ShowRetryPrompt(int32 LevelId, const FString& Reason)
{
	if (RetryWidget && !RetryWidget->IsInViewport())
	{
		RetryWidget->ShowPrompt(LevelId, Reason);
		RetryWidget->AddToViewport();
	}
	OnShowRetryPrompt(LevelId, Reason);
}

void AStickerShopPlayerController::HideAllUI()
{
	RemoveAllWidgets();
	OnHideAllUI();
}

UW_StickerDesign* AStickerShopPlayerController::GetDesignWidget() const { return DesignWidget; }
UW_Printing* AStickerShopPlayerController::GetPrintWidget() const { return PrintWidget; }
UW_StallLayout* AStickerShopPlayerController::GetStallWidget() const { return StallWidget; }
UW_Settlement* AStickerShopPlayerController::GetSettlementWidget() const { return SettlementWidget; }
UW_RetryPrompt* AStickerShopPlayerController::GetRetryWidget() const { return RetryWidget; }

void AStickerShopPlayerController::OnDesignConfirmed(const FString& Name, EThemeType Theme, EStickerRarity Rarity)
{
	AStickerShopGameMode* GM = GetWorld()->GetAuthGameMode<AStickerShopGameMode>();
	if (GM)
	{
		GM->DesignSticker(Name, Theme, Rarity);
		if (DesignWidget)
		{
			DesignWidget->UpdateBudgetDisplay(GM->GetInventoryComponent()->GetBudget());
		}
	}
}

void AStickerShopPlayerController::OnPrintConfirmed(int32 DesignId, int32 Quantity)
{
	AStickerShopGameMode* GM = GetWorld()->GetAuthGameMode<AStickerShopGameMode>();
	if (GM)
	{
		GM->PrintStickerSet(DesignId, Quantity);
		if (PrintWidget)
		{
			PrintWidget->UpdateBudgetDisplay(GM->GetInventoryComponent()->GetBudget());
			PrintWidget->SetAvailableDesigns(GM->GetDesignComponent()->GetDesignedStickers());
		}
	}
}

void AStickerShopPlayerController::OnSlotPlacement(int32 SlotIndex, int32 DesignId)
{
	AStickerShopGameMode* GM = GetWorld()->GetAuthGameMode<AStickerShopGameMode>();
	if (GM)
	{
		GM->PlaceStickerOnStall(SlotIndex, DesignId);
		if (StallWidget)
		{
			StallWidget->SetStallState(
				GM->GetStallComponent()->GetSlots(),
				GM->GetInventoryComponent()->GetAllItems());
		}
	}
}

void AStickerShopPlayerController::OnLayoutConfirmed()
{
	AStickerShopGameMode* GM = GetWorld()->GetAuthGameMode<AStickerShopGameMode>();
	if (GM)
	{
		GM->AdvancePhase();
		ShowSellUI();
	}
}

void AStickerShopPlayerController::OnRetryConfirmed(int32 LevelId)
{
	UStickerShopGameInstance* GI = GetGameInstance<UStickerShopGameInstance>();
	if (GI)
	{
		GI->RetryCurrentLevel();
	}
}

void AStickerShopPlayerController::OnRetryCancelled()
{
	if (RetryWidget) { RetryWidget->RemoveFromParent(); }
}

void AStickerShopPlayerController::OnSettlementDismissed()
{
	if (SettlementWidget) { SettlementWidget->RemoveFromParent(); }
}

void AStickerShopPlayerController::OnRetryRequested(int32 LevelId)
{
	AStickerShopGameMode* GM = GetWorld()->GetAuthGameMode<AStickerShopGameMode>();
	if (GM)
	{
		FString Reason;
		const FLevelDefinition* Level = GM->GetCurrentLevelDef();
		if (Level)
		{
			Reason = FString::Printf(TEXT("Score target: %d not reached"), Level->TargetScore);
		}
		ShowRetryPrompt(LevelId, Reason);
	}
}
