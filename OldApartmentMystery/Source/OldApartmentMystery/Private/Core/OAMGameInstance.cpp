// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Core/OAMGameInstance.h"
#include "Bootstrap/OAMBootstrapData.h"
#include "Bootstrap/OAMLevelBootstrapActor.h"
#include "Bootstrap/OAMUIFactory.h"
#include "Managers/OAMSaveManager.h"
#include "Managers/OAMAudioManager.h"
#include "Managers/OAMTelemetryManager.h"
#include "Managers/OAMChapterManager.h"
#include "Data/OAMItemData.h"
#include "Data/OAMNoteData.h"
#include "Data/OAMPuzzleData.h"
#include "Data/OAMChapterData.h"
#include "Data/OAMLevelDataAsset.h"
#include "Kismet/GameplayStatics.h"
#include "EnhancedInputSubsystems.h"
#include "EnhancedInputComponent.h"
#include "InputMappingContext.h"
#include "InputAction.h"
#include "InputActionValue.h"
#include "Engine/World.h"
#include "Engine/LevelStreaming.h"
#include "GameFramework/PlayerController.h"
#include "GameFramework/Pawn.h"

UOAMGameInstance::UOAMGameInstance()
{
	CurrentInputMode = EOAMInputMode::UI;
	bMainMenuMode = true;
	CurrentLogicalLevel = FName(TEXT("MainMenu"));
}

void UOAMGameInstance::Init()
{
	Super::Init();
	Bootstrap = UOAMBootstrapData::Get();
	if (Bootstrap) Bootstrap->EnsureAllDataBuilt(this);
	CreateManagers();
	BuildRuntimeInputAssets();
	UE_LOG(LogTemp, Log, TEXT("[OAM] Bootstrap 数据就绪：%d 章 / %d 物品 / %d 谜题"),
		ChapterManager ? 3 : 0,
		Bootstrap ? Bootstrap->GetAllItemIDs().Num() : 0,
		3);
}

void UOAMGameInstance::Shutdown()
{
	if (Telemetry) Telemetry->FinalizeAndExport();
	Super::Shutdown();
}

/* ============ Bootstrap Resolve ============ */

UOAMItemData* UOAMGameInstance::ResolveItem(FName ItemID) const
{
	if (!Bootstrap) return nullptr;
	return Bootstrap->GetItem(ItemID);
}
UOAMNoteData* UOAMGameInstance::ResolveNote(FName NoteID) const
{
	if (!Bootstrap) return nullptr;
	return Bootstrap->GetNote(NoteID);
}
UOAMPuzzleData* UOAMGameInstance::ResolvePuzzle(FName PuzzleID) const
{
	if (!Bootstrap) return nullptr;
	return Bootstrap->GetPuzzle(PuzzleID);
}
UOAMChapterData* UOAMGameInstance::ResolveChapter(int32 ChapterID) const
{
	if (!Bootstrap) return nullptr;
	return Bootstrap->GetChapter(ChapterID);
}
UOAMLevelDataAsset* UOAMGameInstance::ResolveLevel(FName LevelName) const
{
	if (!Bootstrap) return nullptr;
	return Bootstrap->GetLevel(LevelName);
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

/* ============ Input 程序化创建 ============ */

void UOAMGameInstance::BuildRuntimeInputAssets()
{
	// 所有输入都在 C++ 层构建，无需 Content/Input/*.uasset
	BuildInputContextAndMappings();
	UE_LOG(LogTemp, Log, TEXT("[OAM] Enhanced Input 程序化创建完成：IMC + 17 InputAction"));
}

void UOAMGameInstance::BuildInputContextAndMappings()
{
	DefaultInputContext = NewObject<UInputMappingContext>(this);
	DefaultInputContext->RegisterWithOuter(this);

	// --- 辅助：创建 InputAction ---
	auto MakeIA = [&](const FString& Name, EInputActionValueType T) -> UInputAction*
	{
		UInputAction* IA = NewObject<UInputAction>(this, UInputAction::StaticClass(), *Name);
		IA->ValueType = T;
		IA->bConsumeInput = true;
		IA->bTriggerWhenPaused = false;
		return IA;
	};

	// --- 辅助：添加按键映射到 IMC ---
	auto AddKey = [&](UInputAction* IA, FKey Key)
	{
		DefaultInputContext->MapKey(IA, Key);
	};

	// 1) Move (Axis2D：WASD)
	UInputAction* IA_Move = MakeIA(TEXT("IA_Move"), EInputActionValueType::Axis2D);
	AddKey(IA_Move, EKeys::W);
	AddKey(IA_Move, EKeys::S);
	AddKey(IA_Move, EKeys::A);
	AddKey(IA_Move, EKeys::D);

	// 2) Look (Axis2D：鼠标 + 右摇杆)
	UInputAction* IA_Look = MakeIA(TEXT("IA_Look"), EInputActionValueType::Axis2D);
	AddKey(IA_Look, EKeys::Mouse2D);
	AddKey(IA_Look, EKeys::Gamepad_RightX);
	AddKey(IA_Look, EKeys::Gamepad_RightY);

	// 3) Interact (E / 游戏柄A)
	UInputAction* IA_Interact = MakeIA(TEXT("IA_Interact"), EInputActionValueType::Boolean);
	AddKey(IA_Interact, EKeys::E);
	AddKey(IA_Interact, EKeys::Gamepad_FaceButton_Bottom);

	// 4) Notebook (N / Tab)
	UInputAction* IA_Notebook = MakeIA(TEXT("IA_Notebook"), EInputActionValueType::Boolean);
	AddKey(IA_Notebook, EKeys::N);
	AddKey(IA_Notebook, EKeys::Tab);

	// 5) Inventory (I)
	UInputAction* IA_Inventory = MakeIA(TEXT("IA_Inventory"), EInputActionValueType::Boolean);
	AddKey(IA_Inventory, EKeys::I);

	// 6) Pause (Esc / 手柄菜单)
	UInputAction* IA_Pause = MakeIA(TEXT("IA_Pause"), EInputActionValueType::Boolean);
	AddKey(IA_Pause, EKeys::Escape);
	AddKey(IA_Pause, EKeys::Gamepad_Special_Right);

	// 7) Back (右键 / B)
	UInputAction* IA_Back = MakeIA(TEXT("IA_Back"), EInputActionValueType::Boolean);
	AddKey(IA_Back, EKeys::RightMouseButton);
	AddKey(IA_Back, EKeys::Gamepad_FaceButton_Right);

	// 8) Digits 0-9 (谜题输入)
	TArray<UInputAction*> IA_Digits_All;
	for (int32 D = 0; D < 10; ++D)
	{
		UInputAction* IA_D = MakeIA(FString::Printf(TEXT("IA_Digit_%d"), D), EInputActionValueType::Boolean);
		const FKey Key = FKey(*FString::Printf(TEXT("Zero"), D));
		switch (D)
		{
		case 0: AddKey(IA_D, EKeys::Zero); AddKey(IA_D, EKeys::NumPadZero); break;
		case 1: AddKey(IA_D, EKeys::One);  AddKey(IA_D, EKeys::NumPadOne); break;
		case 2: AddKey(IA_D, EKeys::Two);  AddKey(IA_D, EKeys::NumPadTwo); break;
		case 3: AddKey(IA_D, EKeys::Three);AddKey(IA_D, EKeys::NumPadThree); break;
		case 4: AddKey(IA_D, EKeys::Four); AddKey(IA_D, EKeys::NumPadFour); break;
		case 5: AddKey(IA_D, EKeys::Five); AddKey(IA_D, EKeys::NumPadFive); break;
		case 6: AddKey(IA_D, EKeys::Six);  AddKey(IA_D, EKeys::NumPadSix); break;
		case 7: AddKey(IA_D, EKeys::Seven);AddKey(IA_D, EKeys::NumPadSeven); break;
		case 8: AddKey(IA_D, EKeys::Eight);AddKey(IA_D, EKeys::NumPadEight); break;
		case 9: AddKey(IA_D, EKeys::Nine); AddKey(IA_D, EKeys::NumPadNine); break;
		}
		IA_Digits_All.Add(IA_D);
	}

	// --- 放到 PlayerController 上（通过 friend 访问）---
	// 注：PlayerController::BeginPlay 会从这里取引用
	// 这里用 FMemory 将其存到单例的友元访问槽位
	InputCache_IA_Move = IA_Move;
	InputCache_IA_Look = IA_Look;
	InputCache_IA_Interact = IA_Interact;
	InputCache_IA_Notebook = IA_Notebook;
	InputCache_IA_Inventory = IA_Inventory;
	InputCache_IA_Pause = IA_Pause;
	InputCache_IA_Back = IA_Back;
	for (int32 D = 0; D < IA_Digits_All.Num() && D < 10; ++D)
		InputCache_IA_Digits[D] = IA_Digits_All[D];
}

/* ============ 游戏流程 ============ */

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
	bMainMenuMode = true;
	CurrentLogicalLevel = FName(TEXT("MainMenu"));
	TransitionToLevel(FName(TEXT("MainMenu")), FVector2D(0, 0));
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

/* ============ 核心：同关卡内切换（替代 OpenLevel 到不存在的关卡） ============ */

void UOAMGameInstance::TransitionToLevel(FName LevelName, FVector2D SpawnLocation)
{
	UE_LOG(LogTemp, Log, TEXT("[OAM] 关卡切换（同场景内重建）→ %s"), *LevelName.ToString());

	UWorld* W = GetWorld();
	if (!W) return;

	CurrentLogicalLevel = LevelName;
	bMainMenuMode = (LevelName == FName(TEXT("MainMenu")));

	// --- Step 1: 找或创建 LevelBootstrapActor ---
	AOAMLevelBootstrapActor* BootstrapActor = nullptr;
	TArray<AActor*> Arr;
	UGameplayStatics::GetAllActorsOfClass(W, AOAMLevelBootstrapActor::StaticClass(), Arr);
	if (Arr.Num() > 0)
	{
		BootstrapActor = Cast<AOAMLevelBootstrapActor>(Arr[0]);
	}
	if (!BootstrapActor)
	{
		BootstrapActor = W->SpawnActor<AOAMLevelBootstrapActor>(FVector::ZeroVector, FRotator::ZeroRotator);
	}
	if (!BootstrapActor) return;

	// --- Step 2: 重建关卡 ---
	BootstrapActor->OverrideLevelName = LevelName;
	BootstrapActor->bAutoBootstrapOnBeginPlay = false;
	BootstrapActor->ClearGeneratedActors();
	BootstrapActor->BootstrapLevel();

	// --- Step 3: 移动 Pawn 到目标 Spawn（如果有） ---
	if (SpawnLocation.X >= 0 && SpawnLocation.Y >= 0)
	{
		PendingSpawnTile = SpawnLocation;
	}
	else
	{
		// 用 LevelData 的默认 Spawn
		UOAMLevelDataAsset* LD = ResolveLevel(LevelName);
		if (LD) PendingSpawnTile = LD->SpawnPoint;
	}

	if (APawn* P = UGameplayStatics::GetPlayerPawn(W, 0))
	{
		const float TileSize = BootstrapActor->TileSize;
		const FVector Loc(-50.f + PendingSpawnTile.X * TileSize,
						  -50.f + PendingSpawnTile.Y * TileSize,
						  110.f);
		P->SetActorLocation(Loc, false, nullptr, ETeleportType::TeleportPhysics);
		P->SetActorRotation(FRotator(0, 0, 0));
	}

	// --- Step 4: 延迟重建 UI（给关卡生成留时间） ---
	FTimerHandle H;
	W->GetTimerManager().SetTimer(H, this, &UOAMGameInstance::RebuildCurrentLevelUI, 0.35f, false);
}

void UOAMGameInstance::RebuildCurrentLevelUI()
{
	UWorld* W = GetWorld();
	if (!W) return;
	APlayerController* PC = UGameplayStatics::GetPlayerController(W, 0);
	if (!PC) return;

	// 清除屏幕上所有现有 UI Widget
	TArray<UUserWidget*> Widgets;
	UUserWidget::GetAllWidgetsOfClass(W, Widgets, UUserWidget::StaticClass(), false);
	for (UUserWidget* Wg : Widgets)
	{
		if (Wg && Wg->IsInViewport()) Wg->RemoveFromParent();
	}

	if (bMainMenuMode)
	{
		UOAMUIFactory::CreateMainMenu(PC);
		SetInputMode(EOAMInputMode::UI);
		UE_LOG(LogTemp, Log, TEXT("[OAM][UI] 主菜单已创建"));
	}
	else
	{
		UOAMUIFactory::CreateGameplayHUD(PC);
		SetInputMode(EOAMInputMode::Exploration);
		UE_LOG(LogTemp, Log, TEXT("[OAM][UI] 游戏 HUD 已创建"));
	}
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
