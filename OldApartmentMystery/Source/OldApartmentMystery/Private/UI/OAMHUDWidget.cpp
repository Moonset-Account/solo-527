// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "UI/OAMHUDWidget.h"
#include "Components/TextBlock.h"
#include "Components/ProgressBar.h"
#include "Components/CanvasPanel.h"
#include "Components/CanvasPanelSlot.h"
#include "Components/Image.h"
#include "Managers/OAMAudioManager.h"

void UOAMHUDWidget::NativeConstruct()
{
	Super::NativeConstruct();
	if (Txt_InteractPrompt) Txt_InteractPrompt->SetVisibility(ESlateVisibility::Collapsed);
	if (Img_DamageFlash) Img_DamageFlash->SetOpacity(0);
}

void UOAMHUDWidget::UpdateInteractPrompt(const FText& NewText)
{
	if (!Txt_InteractPrompt) return;
	const bool bEmpty = NewText.IsEmptyOrWhitespace();
	Txt_InteractPrompt->SetVisibility(bEmpty ? ESlateVisibility::Collapsed : ESlateVisibility::HitTestInvisible);
	if (!bEmpty) Txt_InteractPrompt->SetText(NewText);
}

void UOAMHUDWidget::UpdateObjective(const FText& Desc, float CompletionPercent)
{
	if (Txt_ObjectiveText) Txt_ObjectiveText->SetText(Desc);
	if (Progress_Objective) Progress_Objective->SetPercent(FMath::Clamp(CompletionPercent, 0.f, 1.f));
}

void UOAMHUDWidget::ShowToast(const FText& Message, EOAMToastType Type, float Duration)
{
	if (!Panel_ToastContainer) return;
	UE_LOG(LogTemp, Log, TEXT("[OAM][Toast] %s"), *Message.ToString());
}

void UOAMHUDWidget::SetChapterTitle(const FText& Title, const FText& Subtitle)
{
	if (Txt_ChapterTitle)
	{
		FString Full = FString::Printf(TEXT("%s\n%s"), *Title.ToString(), *Subtitle.ToString());
		Txt_ChapterTitle->SetText(FText::FromString(Full));
		Txt_ChapterTitle->SetVisibility(ESlateVisibility::HitTestInvisible);
	}
	GetWorld()->GetTimerManager().ClearTimer(HideTitleTimer);
	GetWorld()->GetTimerManager().SetTimer(HideTitleTimer, this, &UOAMHUDWidget::HideChapterTitle, 3.5f, false);
}

void UOAMHUDWidget::HideChapterTitle()
{
	if (Txt_ChapterTitle) Txt_ChapterTitle->SetVisibility(ESlateVisibility::Collapsed);
}

void UOAMHUDWidget::TriggerDamageFlash(float Duration)
{
	if (!Img_DamageFlash) return;
	Img_DamageFlash->SetOpacity(0.8f);
	FTimerHandle H;
	FTimerDelegate D;
	float T = 0;
	D.BindWeakLambda(this, [this, T, Duration]() mutable
	{
		if (!Img_DamageFlash) return;
		T += 0.02f;
		const float A = FMath::Clamp(1.f - T / Duration, 0.f, 1.f);
		Img_DamageFlash->SetOpacity(A * 0.8f);
	});
	GetWorld()->GetTimerManager().SetTimer(H, D, 0.02f, true);
}

void UOAMHUDWidget::SetCurrentRoom(const FText& Room)
{
	if (Txt_CurrentRoom) Txt_CurrentRoom->SetText(Room);
}
