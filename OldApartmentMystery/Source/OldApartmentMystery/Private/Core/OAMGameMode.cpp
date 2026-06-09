// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Core/OAMGameMode.h"
#include "Core/OAMGameInstance.h"
#include "Bootstrap/OAMLevelBootstrapActor.h"
#include "Bootstrap/OAMUIFactory.h"
#include "Managers/OAMChapterManager.h"
#include "Player/OAMPlayerController.h"
#include "Player/OAMCharacter.h"
#include "Kismet/GameplayStatics.h"
#include "Engine/World.h"

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
	UWorld* W = GetWorld();
	if (!W) return;

	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;

	// 交给 GI 统一负责初始化：
	// GI.Init() 已经构建了 BootstrapData、Managers、程序化 Input。
	// 这里只需要确保第一次进入关卡时，GI 重建"当前逻辑关卡"的场景和 UI。
	// GI 默认 CurrentLogicalLevel="MainMenu"，bMainMenuMode=true
	// → 会生成 MainMenu 关卡内容（客厅）+ 显示主菜单 UI
	// 玩家点击"开始游戏" → GI::StartNewGame → GI::TransitionToLevel("Chapter1"→MainMenu) → 重建场景+游戏HUD
	FTimerHandle Dummy;
	W->GetTimerManager().SetTimer(Dummy, FTimerDelegate::CreateWeakLambda(this, [this, GI, W]()
	{
		// 确保 LevelBootstrap Actor 存在并生成场景
		AOAMLevelBootstrapActor* BootstrapActor = nullptr;
		TArray<AActor*> Arr;
		UGameplayStatics::GetAllActorsOfClass(W, AOAMLevelBootstrapActor::StaticClass(), Arr);
		if (Arr.Num() > 0)
			BootstrapActor = Cast<AOAMLevelBootstrapActor>(Arr[0]);
		if (!BootstrapActor)
			BootstrapActor = W->SpawnActor<AOAMLevelBootstrapActor>(FVector::ZeroVector, FRotator::ZeroRotator);
		LevelBootstrap = BootstrapActor;

		if (BootstrapActor)
		{
			BootstrapActor->OverrideLevelName = GI->GetCurrentLevelName();
			BootstrapActor->bAutoBootstrapOnBeginPlay = false;
			BootstrapActor->BootstrapLevel();
		}

		// 重建 UI（根据 GI::IsInMainMenu 决定主菜单 or HUD）
		GI->RebuildCurrentLevelUI();

		UE_LOG(LogTemp, Log, TEXT("[OAM][GameMode] 初始化完成。模式=%s，逻辑关卡=%s"),
			GI->IsInMainMenu() ? TEXT("主菜单") : TEXT("游戏"),
			*GI->GetCurrentLevelName().ToString());
	}), 0.25f, false);
}

void AOAMGameMode::BuildDefaultGameplayUI()
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (GI) GI->RebuildCurrentLevelUI();
}

void AOAMGameMode::HandleLevelLoaded(FName LevelName)
{
	UE_LOG(LogTemp, Log, TEXT("[OAM][GameMode] 关卡加载通知（逻辑关卡：%s）"), *LevelName.ToString());
}

void AOAMGameMode::NotifyObjectiveEvent(EOAMObjectiveCheck Type, FName Value, int32 Count)
{
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI || !GI->ChapterManager) return;

	const bool bChapterCompleted = GI->ChapterManager->OnObjectiveEvent(Type, Value, Count);
	if (bChapterCompleted)
	{
		FOAMChapterObjective Obj;
		Obj.ObjectiveID = Value;
		OnObjectiveCompleted.Broadcast(Obj);
		const int32 CID = GI->ChapterManager->CurrentChapterID;
		if (GI->ChapterManager->IsChapterComplete(CID))
		{
			if (APlayerController* PC = UGameplayStatics::GetPlayerController(this, 0))
			{
				UOAMUIFactory::CreateChapterComplete(PC, CID);
				GI->SetInputMode(EOAMInputMode::UI);
			}
		}
	}
}
