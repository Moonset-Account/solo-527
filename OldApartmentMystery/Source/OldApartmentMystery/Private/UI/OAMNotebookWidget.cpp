// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "UI/OAMNotebookWidget.h"
#include "Components/Button.h"
#include "Components/WidgetSwitcher.h"
#include "Components/VerticalBox.h"
#include "Components/HorizontalBox.h"
#include "Components/Image.h"
#include "Core/OAMGameInstance.h"
#include "Managers/OAMAudioManager.h"
#include "Kismet/GameplayStatics.h"

void UOAMNotebookWidget::NativeConstruct()
{
	Super::NativeConstruct();
	if (Btn_Close) Btn_Close->OnClicked.AddDynamic(this, &UOAMNotebookWidget::HandleClose);
	if (Btn_TabNotes)   ->OnClicked.AddDynamic(this, &UOAMNotebookWidget::HandleTabNotes);
	if (Btn_TabClues)    ->OnClicked.AddDynamic(this, &UOAMNotebookWidget::HandleTabClues);
	if (Btn_TabInventory) ->OnClicked.AddDynamic(this, &UOAMNotebookWidget::HandleTabInventory);
	if (Btn_PrevPage) Btn_PrevPage->OnClicked.AddDynamic(this, &UOAMNotebookWidget::TurnPage, -1);
	if (Btn_NextPage) Btn_NextPage->OnClicked.AddDynamic(this, &UOAMNotebookWidget::TurnPage, 1);
	SetTab(EOAMNotebookTab::Notes);
	RefreshAll();
}

void UOAMNotebookWidget::SetTab(EOAMNotebookTab Tab)
{
	if (Switcher_Tabs) Switcher_Tabs->SetActiveWidgetIndex((int32)Tab);
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
}

void UOAMNotebookWidget::RefreshAll()
{
	RefreshNotesList();
}

void UOAMNotebookWidget::TurnPage(int32 Direction)
{
	CurrentPage = FMath::Clamp(CurrentPage + Direction, 0, 99);
	if (Txt_PageIndicator)
	{
		Txt_PageIndicator->SetText(FText::FromString(FString::Printf(TEXT("第 %d 页"), CurrentPage + 1)));
	}
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_PageFlip"));
}

void UOAMNotebookWidget::RefreshNotesList()
{
	UE_LOG(LogTemp, Log, TEXT("[OAM][Notebook] 刷新笔记列表"));
}

void UOAMNotebookWidget::SelectNote(FName NoteID)
{
	UE_LOG(LogTemp, Log, TEXT("[OAM][Notebook] 选择笔记：%s"), *NoteID.ToString());
}

void UOAMNotebookWidget::HandleClose()
{
	RemoveFromParent();
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI) GI->SetInputMode(EOAMInputMode::Exploration);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_CloseMenu"));
}
