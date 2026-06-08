// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Core/OAMGameInstance.h"
#include "Managers/OAMSaveManager.h"
#include "Managers/OAMAudioManager.h"
#include "Managers/OAMTelemetryManager.h"
#include "Managers/OAMChapterManager.h"
#include "Kismet/GameplayStatics.h"
#include "EnhancedInputSubsystems.h"

UOAMGameInstance::UOAMGameInstance()
{
	CurrentInputMode = EOAMInputMode::UI;
}

void UOAMGameInstance::Init()
{
	Super::Init();
	CreateManagers();
}

void UOAMGameInstance::Shutdown()
{
	if (Telemetry) Telemetry->FinalizeAndExport();
	Super::Shutdown();
}

void UOAMGameInstance::CreateManagers()
{
	SaveManager = NewObject<UOAMSaveManager>(this);
	AudioManager = NewObject<UOAMAudioManager>(this);
	Telemetry = NewObject<UOAMTelemetryManager>(this);
	ChapterManager = NewObject<UOAMChapterManager>(this);
	Telemetry->Initialize();
	ChapterManager->Initialize();
	SaveManager->Initialize();
	AudioManager->Initialize(this);
	UE_LOG(LogTemp, Log, TEXT("[OAM] 4 个 Managers 初始化完成"));
}

void UOAMGameInstance::StartNewGame(int32 FromChapterID)
{
	if (Telemetry) Telemetry->BeginSession();
	if (ChapterManager) ChapterManager->StartChapter(FromChapterID);
	FName Level = ChapterManager->GetLevelForChapter(FromChapterID);
	TransitionToLevel(Level, FVector2D(5, 10));
	SetInputMode(EOAMInputMode::Exploration);
	UE_LOG(LogTemp, Log, TEXT("[OAM] 新游戏开始，章节 %d"), FromChapterID);
}

void UOAMGameInstance::ReturnToMainMenu()
{
	if (Telemetry) Telemetry->FinalizeAndExport();
	UGameplayStatics::OpenLevel(this, FName(TEXT("MainMenu")), true);
	SetInputMode(EOAMInputMode::UI);
}

void UOAMGameInstance::ApplySettings(const FOAMGameSettings& NewSettings)
{
	Settings = NewSettings;
	if (AudioManager) AudioManager->ApplyVolumeSettings(NewSettings);
}

void UOAMGameInstance::SetInputMode(EOAMInputMode NewMode)
{
	CurrentInputMode = NewMode;
	OnInputModeChanged.Broadcast(NewMode);

	auto* PC = UGameplayStatics::GetPlayerController(this, 0);
	if (!PC) return;

	switch (NewMode)
	{
	case EOAMInputMode::Exploration:
	{
		FInputModeGameOnly InputMode;
		InputMode.SetConsumeCaptureMouseDown(true);
		PC->SetInputMode(InputMode);
		PC->bShowMouseCursor = false;
		break;
	}
	case EOAMInputMode::UI:
	case EOAMInputMode::Puzzle:
	case EOAMInputMode::Examine:
	{
		FInputModeGameAndUI InputMode;
		InputMode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
		InputMode.SetHideCursorDuringCapture(false);
		PC->SetInputMode(InputMode);
		PC->bShowMouseCursor = true;
		break;
	}
	}
}

void UOAMGameInstance::TransitionToLevel(FName LevelName, FVector2D SpawnLocation)
{
	UE_LOG(LogTemp, Log, TEXT("[OAM] 关卡切换 → %s"), *LevelName.ToString());
	FString Options = FString::Printf(TEXT("SpawnX=%d?SpawnY=%d"), FMath::RoundToInt(SpawnLocation.X), FMath::RoundToInt(SpawnLocation.Y));
	UGameplayStatics::OpenLevel(this, LevelName, true, Options);
}

UOAMGameInstance* UOAMGameInstance::GetOAM(const UObject* WorldContext)
{
	if (!WorldContext) return nullptr;
	if (auto* GI = WorldContext->GetWorld()->GetGameInstance())
	{
		return Cast<UOAMGameInstance>(GI);
	}
	return nullptr;
}
