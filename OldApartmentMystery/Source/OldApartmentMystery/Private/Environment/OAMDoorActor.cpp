// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Environment/OAMDoorActor.h"
#include "Player/OAMPlayerController.h"
#include "Core/OAMGameInstance.h"
#include "Core/OAMGameState.h"
#include "Managers/OAMAudioManager.h"
#include "Kismet/GameplayStatics.h"
#include "Managers/OAMTelemetryManager.h"
#include "Managers/OAMChapterManager.h"
#include "OAMTypes.h"

AOAMDoorActor::AOAMDoorActor()
{
	PrimaryActorTick.bCanEverTick = true;
	PromptTextOverride = FText::FromString(TEXT("开门 [E]"));
}

FText AOAMDoorActor::GetPromptText_Implementation() const
{
	if (bLocked)
	{
		return RequiredKeyItemID.IsNone()
			? FText::FromString(TEXT("门被锁上了"))
			: FText::FromString(TEXT("需要钥匙..."));
	}
	return bIsOpen
		? PromptTextOverride
		: FText::FromString(TEXT("开门 [E]"));
}

void AOAMDoorActor::OnInteract_Implementation(AOAMPlayerController* InstigatorPC)
{
	Super::OnInteract_Implementation(InstigatorPC);

	if (!InstigatorPC) return;
	auto* GI = UOAMGameInstance::GetOAM(this);
	auto* GS = Cast<AOAMGameState>(UGameplayStatics::GetGameState(this));
	if (!GI) return;

	if (bLocked)
	{
		if (!RequiredKeyItemID.IsNone() && GS && GS->HasItem(RequiredKeyItemID))
		{
			Unlock();
			InstigatorPC->ShowToast(FText::FromString(TEXT("你用钥匙打开了门")), EOAMToastType::Success);
			if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Door_Unlock"));
			if (GI->Telemetry) GI->Telemetry->RecordDoorUnlock(DoorID);
		}
		else
		{
			InstigatorPC->ShowToast(FText::FromString(TEXT("门锁着，你需要找到钥匙或密码")), EOAMToastType::Warning);
			InstigatorPC->TriggerScreenShake(0.5f, 0.3f);
			if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Door_Shake"));
		}
		return;
	}

	if (!bIsOpen)
	{
		PlayOpenAnimation();
		if (GS) GS->AddOpenedDoor(DoorID);
		if (GI->Telemetry) GI->Telemetry->RecordDoorOpened(DoorID);

		if (GI->ChapterManager)
		{
			GI->ChapterManager->OnObjectiveEvent(EOAMObjectiveCheck::CollectItem, DoorID);
		}

		if (bIsEndingDoor)
		{
			UE_LOG(LogTemp, Log, TEXT("[OAM] 触发结局门 -> 章节完成"));
			if (GI->ChapterManager)
			{
				GI->ChapterManager->TriggerEndingDoor(DoorID);
			}
		}
		else if (!TargetLevel.IsNone())
		{
			FTimerHandle Dummy;
			FTimerDelegate Del;
			Del.BindWeakLambda(this, [this, GI]()
			{
				GI->TransitionToLevel(TargetLevel, FVector2D(TargetSpawnLocation.X, TargetSpawnLocation.Y));
			});
			GetWorld()->GetTimerManager().SetTimer(Dummy, Del, 0.6f, false);
		}
	}
}

void AOAMDoorActor::Unlock()
{
	bLocked = false;
	InstigatorPC->ShowToast(FText::FromString(TEXT("门解锁了")), EOAMToastType::Info);
}

void AOAMDoorActor::PlayOpenAnimation()
{
	bIsOpen = true;
	StartRotation = GetActorRotation();
	TargetRotation = StartRotation + OpenRotationOffset;
	GetWorldTimerManager().ClearTimer(OpenAnimTimer);

	float T = 0;
	FTimerDelegate Step;
	Step.BindWeakLambda(this, [this, T]() mutable
	{
		T += 0.016f / OpenAnimDuration;
		const float E = FMath::Clamp(T, 0.f, 1.f);
		const float Alpha = 1 - FMath::Pow(1 - E, 3);
		SetActorRotation(FMath::Lerp(StartRotation, TargetRotation, Alpha));
		if (E >= 1.f)
		{
			GetWorldTimerManager().ClearTimer(OpenAnimTimer);
		}
	});
	GetWorldTimerManager().SetTimer(OpenAnimTimer, Step, 0.016f, true);
}
