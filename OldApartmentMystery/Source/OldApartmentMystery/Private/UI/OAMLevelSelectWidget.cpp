// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "UI/OAMLevelSelectWidget.h"
#include "Components/VerticalBox.h"
#include "Components/Button.h"
#include "Components/TextBlock.h"
#include "Core/OAMGameInstance.h"
#include "Managers/OAMChapterManager.h"
#include "Managers/OAMAudioManager.h"

void UOAMLevelSelectWidget::NativeConstruct()
{
	Super::NativeConstruct();
	if (Btn_Close) Btn_Close->OnClicked.AddDynamic(this, &UOAMLevelSelectWidget::HandleClose);
	RefreshCards();
}

void UOAMLevelSelectWidget::RefreshCards()
{
	UE_LOG(LogTemp, Log, TEXT("[OAM][关卡选择] 刷新"));
}

void UOAMLevelSelectWidget::HandleChapterSelected(int32 ChapterID)
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;
	GI->StartNewGame(ChapterID);
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
}

void UOAMLevelSelectWidget::HandleClose()
{
	RemoveFromParent();
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI) GI->SetInputMode(EOAMInputMode::Exploration);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_CloseMenu"));
}
