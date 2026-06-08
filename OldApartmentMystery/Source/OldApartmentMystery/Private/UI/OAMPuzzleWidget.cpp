// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "UI/OAMPuzzleWidget.h"
#include "Puzzle/OAMLockPuzzleActor.h"
#include "Components/Button.h"
#include "Components/HorizontalBox.h"
#include "Components/VerticalBox.h"
#include "Components/TextBlock.h"
#include "Components/Image.h"
#include "Core/OAMGameInstance.h"
#include "Managers/OAMAudioManager.h"

void UOAMPuzzleWidget::NativeConstruct()
{
	Super::NativeConstruct();
	if (Btn_Close)  Btn_Close->OnClicked.AddDynamic(this, &UOAMPuzzleWidget::HandleClose);
	if (Btn_Submit) Btn_Submit->OnClicked.AddDynamic(this, &UOAMPuzzleWidget::HandleSubmit);
	if (Btn_Clear)  Btn_Clear->OnClicked.AddDynamic(this, &UOAMPuzzleWidget::HandleClear);
}

void UOAMPuzzleWidget::BindToPuzzle(AOAMLockPuzzleActor* Actor)
{
	PuzzleActor = Actor;
	UpdateDigitsDisplay();
}

void UOAMPuzzleWidget::HandleDigitInput(int32 Digit)
{
	if (!PuzzleActor.IsValid()) return;
	PuzzleActor->InputDigit(Digit);
	UpdateDigitsDisplay();
}

void UOAMPuzzleWidget::HandleSubmit()
{
	if (!PuzzleActor.IsValid()) return;
	PuzzleActor->SubmitAttempt();
	UpdateDigitsDisplay();
}

void UOAMPuzzleWidget::HandleClear()
{
	if (!PuzzleActor.IsValid()) return;
	PuzzleActor->ClearInput();
	UpdateDigitsDisplay();
}

void UOAMPuzzleWidget::UpdateDigitsDisplay()
{
	UE_LOG(LogTemp, Log, TEXT("[OAM][PuzzleUI] 更新显示"));
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Click"));
}

void UOAMPuzzleWidget::TriggerShake(float Intensity)
{
	if (!Img_ShakeRoot) return;
	float T = 0;
	FTimerHandle H;
	FTimerDelegate D;
	const FVector2D Orig = Img_ShakeRoot->GetRenderTransform().Translation;
	D.BindWeakLambda(this, [this, T, Intensity, Orig]() mutable
	{
		if (!Img_ShakeRoot) return;
		T += 0.02f;
		const float Decay = FMath::Max(0.f, 1.f - T / 0.4f);
		FVector2D Shake(FMath::FRandRange(-1,1) * Intensity * Decay, FMath::FRandRange(-1,1) * Intensity * Decay);
		FWidgetTransform Tr = Img_ShakeRoot->GetRenderTransform();
		Tr.Translation = Orig + Shake;
		Img_ShakeRoot->SetRenderTransform(Tr);
		if (T >= 0.4f)
		{
			Tr.Translation = Orig;
			Img_ShakeRoot->SetRenderTransform(Tr);
			GetWorld()->GetTimerManager().ClearTimer(H);
		}
	});
	GetWorld()->GetTimerManager().SetTimer(H, D, 0.02f, true);
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Puzzle_Shake"));
}

void UOAMPuzzleWidget::HandleClose()
{
	RemoveFromParent();
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI) GI->SetInputMode(EOAMInputMode::Exploration);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_ClosePuzzle"));
}
