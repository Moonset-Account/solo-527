// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "UI/OAMSaveLoadWidget.h"
#include "Components/VerticalBox.h"
#include "Components/Button.h"
#include "Components/TextBlock.h"
#include "Core/OAMGameInstance.h"
#include "Managers/OAMSaveManager.h"
#include "Managers/OAMAudioManager.h"
#include "Managers/OAMTelemetryManager.h"

void UOAMSaveLoadWidget::NativeConstruct()
{
	Super::NativeConstruct();
	if (Btn_Close) Btn_Close->OnClicked.AddDynamic(this, &UOAMSaveLoadWidget::HandleClose);
	if (Txt_ModeTitle) Txt_ModeTitle->SetText(bIsLoadMode
		? FText::FromString(TEXT("读 取 存 档"));
	RefreshSlots();
}

void UOAMSaveLoadWidget::RefreshSlots()
{
	UE_LOG(LogTemp, Log, TEXT("[OAM][SaveUI] 刷新存档槽"));
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI || !GI->SaveManager) return;
}

void UOAMSaveLoadWidget::HandleSlotClicked(int32 SlotIndex)
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI || !GI->SaveManager) return;
	if (bIsLoadMode)
	{
		GI->SaveManager->LoadGame(SlotIndex);
		if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Load"));
	}
	else
	{
		GI->SaveManager->SaveGame(SlotIndex);
		if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Save"));
	}
	RefreshSlots();
}

void UOAMSaveLoadWidget::HandleClose()
{
	RemoveFromParent();
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI) GI->SetInputMode(EOAMInputMode::Exploration);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_CloseMenu"));
}
