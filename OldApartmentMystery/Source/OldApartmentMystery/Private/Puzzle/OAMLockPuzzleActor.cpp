// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Puzzle/OAMLockPuzzleActor.h"
#include "Player/OAMPlayerController.h"
#include "Core/OAMGameInstance.h"
#include "Core/OAMGameState.h"
#include "Data/OAMPuzzleData.h"
#include "Data/OAMItemData.h"
#include "Managers/OAMAudioManager.h"
#include "Managers/OAMTelemetryManager.h"
#include "Managers/OAMChapterManager.h"
#include "Environment/OAMDoorActor.h"
#include "Kismet/GameplayStatics.h"

AOAMLockPuzzleActor::AOAMLockPuzzleActor()
{
	PromptTextOverride = FText::FromString(TEXT("输入密码 [E]"));
	AttemptsLeft = 3;
}

FText AOAMLockPuzzleActor::GetPromptText_Implementation() const
{
	if (bIsSolved) return FText::FromString(TEXT("密码已解锁"));
	if (bIsCooldown) return FText::FromString(TEXT("锁定中... 请稍后"));
	return PromptTextOverride;
}

void AOAMLockPuzzleActor::OnInteract_Implementation(AOAMPlayerController* InstigatorPC)
{
	Super::OnInteract_Implementation(InstigatorPC);
	LastInstigator = InstigatorPC;

	if (bIsSolved || !InstigatorPC) return;
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;

	if (bIsCooldown)
	{
		InstigatorPC->ShowToast(FText::FromString(TEXT("输入错误过多，密码锁暂时锁定")), EOAMToastType::Warning);
		InstigatorPC->TriggerScreenShake(0.3f, 0.3f);
		if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Puzzle_Locked"));
		return;
	}

	const UOAMPuzzleData* PD = PuzzleData.LoadSynchronous();
	if (!PD) return;

	if (!PD->RequiredKeyItemID.IsNone())
	{
		auto* GS = Cast<AOAMGameState>(UGameplayStatics::GetGameState(this));
		if (!GS || !GS->HasItem(PD->RequiredKeyItemID))
		{
			InstigatorPC->ShowToast(FText::FromString(TEXT("似乎还需要什么前置条件...")), EOAMToastType::Warning);
			return;
		}
	}

	GI->SetInputMode(EOAMInputMode::Puzzle);
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_OpenPuzzle"));
	AttemptsLeft = PD->MaxAttempts;
}

void AOAMLockPuzzleActor::InputDigit(int32 Digit)
{
	if (bIsSolved || bIsCooldown) return;
	const UOAMPuzzleData* PD = PuzzleData.LoadSynchronous();
	if (!PD) return;

	if (CurrentInput.Num() < PD->DigitCount && Digit >= 0 && Digit <= 9)
	{
		CurrentInput.Add(Digit);
		auto* GI = UOAMGameInstance::GetOAM(this);
		if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Puzzle_Digit"));
		if (LastInstigator.IsValid()) LastInstigator->TriggerScreenShake(0.05f, 0.05f);
	}
}

void AOAMLockPuzzleActor::ClearInput()
{
	CurrentInput.Empty();
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Clear"));
}

void AOAMLockPuzzleActor::SubmitAttempt()
{
	const UOAMPuzzleData* PD = PuzzleData.LoadSynchronous();
	if (!PD || CurrentInput.Num() != PD->DigitCount) return;
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;

	bool bCorrect = true;
	for (int32 i = 0; i < PD->DigitCount; ++i)
	{
		if (CurrentInput[i] != PD->Password[i]) { bCorrect = false; break; }
	}

	if (GI->Telemetry) GI->Telemetry->RecordPuzzleAttempt(PD->PuzzleID, CurrentInput, bCorrect);

	if (bCorrect) { DoSuccessFlow(); }
	else { DoFailFlow(); }
}

void AOAMLockPuzzleActor::ForceSolve()
{
	DoSuccessFlow();
}

void AOAMLockPuzzleActor::BeginCooldown()
{
	bIsCooldown = true;
	CooldownTimer.Invalidate();
	GetWorldTimerManager().SetTimer(CooldownTimer, this, &AOAMLockPuzzleActor::OnCooldownComplete, CooldownDuration, false);
}

void AOAMLockPuzzleActor::OnCooldownComplete()
{
	bIsCooldown = false;
	if (auto* GI = UOAMGameInstance::GetOAM(this))
	{
		const UOAMPuzzleData* PD = PuzzleData.LoadSynchronous();
		if (PD) AttemptsLeft = PD->MaxAttempts;
	}
	UE_LOG(LogTemp, Log, TEXT("[OAM] 锁冷却结束"));
}

void AOAMLockPuzzleActor::DoSuccessFlow()
{
	bIsSolved = true;
	const UOAMPuzzleData* PD = PuzzleData.LoadSynchronous();
	if (!PD) return;

	auto* GI = UOAMGameInstance::GetOAM(this);
	auto* GS = Cast<AOAMGameState>(UGameplayStatics::GetGameState(this));
	if (!GI || !GS) return;

	GS->AddSolvedPuzzle(PD->PuzzleID);
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Puzzle_Success"));
	if (LastInstigator.IsValid())
	{
		LastInstigator->TriggerScreenFlash(FLinearColor(1.f, 0.95f, 0.7f, 0.35f), 0.35f);
		LastInstigator->ShowToast(FText::FromString(TEXT("密码正确！")), EOAMToastType::Success);
	}

	if (!PD->RewardItemID.IsNone())
	{
		GS->AddCollectedItem(PD->RewardItemID);
		if (LastInstigator.IsValid())
		{
			LastInstigator->ShowToast(FText::Format(FText::FromString(TEXT("已获得线索物品")), FText::FromName(PD->RewardItemID)), EOAMToastType::Success);
		}
		if (GI->Telemetry) GI->Telemetry->RecordItemCollected(PD->RewardItemID, GetActorLocation());
		if (GI->ChapterManager) GI->ChapterManager->OnObjectiveEvent(EOAMObjectiveCheck::CollectItem, PD->RewardItemID);
	}

	if (!PD->UnlocksDoorID.IsNone())
	{
		TArray<AActor*> Doors;
		UGameplayStatics::GetAllActorsOfClass(this, AOAMDoorActor::StaticClass(), Doors);
		for (AActor* A : Doors)
		{
			if (auto* D = Cast<AOAMDoorActor>(A))
			{
				if (D->DoorID == PD->UnlocksDoorID) D->Unlock();
			}
		}
	}

	if (GI->ChapterManager)
	{
		GI->ChapterManager->OnObjectiveEvent(EOAMObjectiveCheck::SolvePuzzle, PD->PuzzleID);
	}

	OnPuzzleResult.Broadcast(PD->PuzzleID, true);
	GI->SetInputMode(EOAMInputMode::Exploration);
	CurrentInput.Empty();
}

void AOAMLockPuzzleActor::DoFailFlow()
{
	const UOAMPuzzleData* PD = PuzzleData.LoadSynchronous();
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI || !PD) return;

	AttemptsLeft -= 1;
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Puzzle_Fail"));
	if (LastInstigator.IsValid())
	{
		LastInstigator->TriggerScreenShake(PD->ShakeOnFail, 0.45f);
		LastInstigator->ShowToast(PD->FailFeedback, EOAMToastType::Error);
	}
	CurrentInput.Empty();

	if (AttemptsLeft <= 0)
	{
		BeginCooldown();
		if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Puzzle_Locked"));
		if (LastInstigator.IsValid())
		{
			LastInstigator->ShowToast(FText::FromString(TEXT("尝试次数用尽，请稍后再试")), EOAMToastType::Warning);
		}
	}
	OnPuzzleResult.Broadcast(PD->PuzzleID, false);
}
