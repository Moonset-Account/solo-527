// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Core/OAMGameMode.h"
#include "Core/OAMGameInstance.h"
#include "Managers/OAMChapterManager.h"
#include "UObject/ConstructorHelpers.h"
#include "OAMPlayerController.h"
#include "Player/OAMCharacter.h"

AOAMGameMode::AOAMGameMode()
{
	PlayerControllerClass = AOAMPlayerController::StaticClass();
	DefaultPawnClass = AOAMCharacter::StaticClass();
}

void AOAMGameMode::StartPlay()
{
	Super::StartPlay();
}

void AOAMGameMode::BeginPlay()
{
	Super::BeginPlay();
	auto* GI = UOAMGameInstance::GetOAM(this);
	UE_LOG(LogTemp, Log, TEXT("[OAM] GameMode BeginPlay"));
}

void AOAMGameMode::HandleLevelLoaded(FName LevelName)
{
	UE_LOG(LogTemp, Log, TEXT("[OAM] 关卡加载完成：%s"), *LevelName.ToString());
}

void AOAMGameMode::NotifyObjectiveEvent(EOAMObjectiveCheck Type, FName Value, int32 Count)
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI || !GI->ChapterManager) return;

	bool bCompleted = GI->ChapterManager->OnObjectiveEvent(Type, Value, Count);
	if (bCompleted)
	{
		FOAMChapterObjective Obj;
		Obj.ObjectiveID = Value;
		OnObjectiveCompleted.Broadcast(Obj);
	}
}
