// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "UI/OAMChapterCompleteWidget.h"
#include "Components/Button.h"
#include "Components/TextBlock.h"
#include "Components/ProgressBar.h"
#include "Core/OAMGameInstance.h"
#include "Managers/OAMAudioManager.h"
#include "Managers/OAMTelemetryManager.h"

void UOAMChapterCompleteWidget::NativeConstruct()
{
	Super::NativeConstruct();
	if (Btn_NextChapter) Btn_NextChapter->OnClicked.AddDynamic(this, &UOAMChapterCompleteWidget::HandleNext);
	if (Btn_MainMenu)    Btn_MainMenu->OnClicked.AddDynamic(this, &UOAMChapterCompleteWidget::HandleMenu);
}

void UOAMChapterCompleteWidget::PopulateFromRecord(const FOAMChapterRecord& R, int32 Done, int32 Total, bool bHasNextChapter)
{
	if (Txt_ChapterTitle)
	{
		Txt_ChapterTitle->SetText(FText::FromString(
			FString::Printf(TEXT("第 %d 章 · 已完成"), R.ChapterID)));
	}

	auto FmtTime = [](float Sec) -> FString
	{
		int32 T = FMath::FloorToInt(Sec);
		int32 H = T / 3600, M = (T % 3600) / 60, S = T % 60;
		return FString::Printf(TEXT("%02d:%02d:%02d"), H, M, S);
	};

	if (Txt_TimeValue)       Txt_TimeValue->SetText(FText::FromString(FmtTime(R.CompletionSeconds)));
	if (Txt_ItemsValue)      Txt_ItemsValue->SetText(FText::FromString(FString::FromInt(R.ItemsCollected.Num())));
	if (Txt_NotesValue)      Txt_NotesValue->SetText(FText::FromString(FString::FromInt(R.NotesRead.Num())));
	if (Txt_PuzzlesValue)    Txt_PuzzlesValue->SetText(FText::FromString(FString::FromInt(R.PuzzlesSolved.Num())));
	if (Txt_FailsValue)      Txt_FailsValue->SetText(FText::FromString(FString::FromInt(R.FailCount)));

	const float Pct = Total > 0 ? (float)Done / (float)Total : 1.f;
	if (Txt_CompletionValue) Txt_CompletionValue->SetText(FText::FromString(FString::Printf(TEXT("%d / %d (%d%%)"), Done, Total, FMath::RoundToInt(Pct * 100))));
	if (Bar_Completion)      Bar_Completion->SetPercent(Pct);

	if (Btn_NextChapter)     Btn_NextChapter->SetVisibility(bHasNextChapter ? ESlateVisibility::Visible : ESlateVisibility::Collapsed);

	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Chapter_Complete"));
}

void UOAMChapterCompleteWidget::HandleNext()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;
	GI->StartNewGame(CompletedChapterID + 1);
	RemoveFromParent();
}

void UOAMChapterCompleteWidget::HandleMenu()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;
	GI->ReturnToMainMenu();
}
