// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Bootstrap/OAMLevelBootstrapActor.h"
#include "Core/OAMGameInstance.h"
#include "Data/OAMLevelDataAsset.h"
#include "Data/OAMItemData.h"
#include "Data/OAMPuzzleData.h"
#include "Environment/OAMPickupActor.h"
#include "Environment/OAMDoorActor.h"
#include "Environment/OAMRoomTriggerVolume.h"
#include "Environment/OAMInteractableActorBase.h"
#include "Puzzle/OAMLockPuzzleActor.h"
#include "Puzzle/OAMNoteActor.h"
#include "GameFramework/PlayerStart.h"
#include "Engine/StaticMesh.h"
#include "Engine/StaticMeshActor.h"
#include "Components/StaticMeshComponent.h"
#include "Components/BoxComponent.h"
#include "Components/BrushComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Engine/World.h"
#include "Kismet/GameplayStatics.h"
#include "UObject/ConstructorHelpers.h"

AOAMLevelBootstrapActor::AOAMLevelBootstrapActor()
{
	PrimaryActorTick.bCanEverTick = false;
	Origin = FVector(-50, -50, 0);
}

void AOAMLevelBootstrapActor::BeginPlay()
{
	Super::BeginPlay();
	if (bAutoBootstrapOnBeginPlay)
	{
		FTimerHandle H;
		GetWorldTimerManager().SetTimer(H, this, &AOAMLevelBootstrapActor::BootstrapLevel, 0.08f, false);
	}
}

AOAMLevelBootstrapActor* AOAMLevelBootstrapActor::SpawnInWorld(UWorld* World, FName ForLevel)
{
	if (!World) return nullptr;
	AOAMLevelBootstrapActor* B = World->SpawnActor<AOAMLevelBootstrapActor>(FVector::ZeroVector, FRotator::ZeroRotator);
	if (B && ForLevel != NAME_None) B->OverrideLevelName = ForLevel;
	return B;
}

void AOAMLevelBootstrapActor::ClearGeneratedActors()
{
	for (AActor* A : GeneratedActors)
	{
		if (A && !A->IsPendingKill()) A->Destroy();
	}
	GeneratedActors.Empty();
}

void AOAMLevelBootstrapActor::BootstrapLevel()
{
	UWorld* W = GetWorld();
	if (!W) return;

	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;

	FName LName = OverrideLevelName;
	if (LName.IsNone())
	{
		FString M = W->GetMapName();
		int32 LastSlash = INDEX_NONE;
		if (M.FindLastChar('/', LastSlash)) M = M.Mid(LastSlash + 1);
		if (M.EndsWith(TEXT("_C"))) M.ChopRight(2);
		LName = *M;
	}

	LevelData = GI->ResolveLevel(LName);
	if (!LevelData)
	{
		// 默认：尝试按当前章节找
		int32 Ch = GI->ChapterManager ? GI->ChapterManager->CurrentChapterID : 1;
		LevelData = GI->ResolveLevel(Ch == 1 ? FName("MainMenu") : (Ch == 2 ? FName("Chapter2") : FName("Chapter3")));
	}
	if (!LevelData)
	{
		UE_LOG(LogTemp, Error, TEXT("[OAM][Bootstrap] 找不到关卡数据：%s，使用 MainMenu 默认"), *LName.ToString());
		LevelData = GI->ResolveLevel(FName("MainMenu"));
	}
	if (!LevelData) return;

	UE_LOG(LogTemp, Log, TEXT("[OAM][Bootstrap] 开始生成关卡：%s (%dx%d)"), *LevelData->DisplayName.ToString(),
		FMath::RoundToInt(LevelData->GridSize.X), FMath::RoundToInt(LevelData->GridSize.Y));

	if (W->WorldType == EWorldType::Game || W->WorldType == EWorldType::PIE)
	{
		ClearGeneratedActors();
	}

	GenerateFloor(W);
	GenerateWalls(W);
	GenerateFurniture(W);
	GenerateItems(W);
	GenerateDoors(W);
	GenerateRoomTriggers(W);
	GeneratePlayerStart(W);

	UE_LOG(LogTemp, Log, TEXT("[OAM][Bootstrap] 完成，共生成 %d 个 Actor"), GeneratedActors.Num());
}

FVector AOAMLevelBootstrapActor::TileToWorld(float X, float Y, float Z) const
{
	return Origin + FVector(X * TileSize, Y * TileSize, Z);
}

FVector2D AOAMLevelBootstrapActor::WorldToTile(const FVector& V) const
{
	const FVector R = V - Origin;
	return FVector2D(R.X / TileSize, R.Y / TileSize);
}

/* ----------------- Floor ----------------- */
void AOAMLevelBootstrapActor::GenerateFloor(UWorld* W)
{
	if (!LevelData) return;
	// 为每个 FloorZone 生成一个大 StaticMesh (Cube 拉伸)
	for (const FOAMFloorZone& Z : LevelData->FloorZones)
	{
		FVector Loc = TileToWorld(Z.X + Z.W * 0.5f, Z.Y + Z.H * 0.5f, -10.f);
		AStaticMeshActor* SM = W->SpawnActor<AStaticMeshActor>(Loc, FRotator(0, 0, 0));
		if (!SM) continue;
		GeneratedActors.Add(SM);
		UStaticMeshComponent* MC = SM->GetStaticMeshComponent();
		MC->SetMobility(EComponentMobility::Static);
		static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
		if (Cube.Succeeded()) MC->SetStaticMesh(Cube.Object);
		const FVector Scl(Z.W * TileSize / 100.f * 0.5f, Z.H * TileSize / 100.f * 0.5f, 0.2f);
		MC->SetWorldScale3D(Scl);
		MC->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
		MC->SetCollisionObjectType(ECC_WorldStatic);
		UMaterialInstanceDynamic* MID = MC->CreateAndSetMaterialInstanceDynamic(0);
		if (MID) MID->SetVectorParameterValue(TEXT("Color"), FVector(Z.Color.R, Z.Color.G, Z.Color.B));
		SM->Tags.Add(FName("OAM_Floor"));
		SM->SetActorLabel(FString::Printf(TEXT("FLOOR_%s"), *Z.Name));
	}
}

/* ----------------- Walls ----------------- */
void AOAMLevelBootstrapActor::GenerateWalls(UWorld* W)
{
	if (!LevelData) return;
	static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
	for (const FOAMWallRect& R : LevelData->Walls)
	{
		FVector Loc = TileToWorld(R.X + R.W * 0.5f, R.Y + R.H * 0.5f, 150.f);
		AStaticMeshActor* SM = W->SpawnActor<AStaticMeshActor>(Loc, FRotator(0, 0, 0));
		if (!SM) continue;
		GeneratedActors.Add(SM);
		UStaticMeshComponent* MC = SM->GetStaticMeshComponent();
		MC->SetMobility(EComponentMobility::Static);
		if (Cube.Succeeded()) MC->SetStaticMesh(Cube.Object);
		const FVector Scl(R.W * TileSize / 100.f * 0.5f, R.H * TileSize / 100.f * 0.5f, 1.5f);
		MC->SetWorldScale3D(Scl);
		MC->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
		MC->SetCollisionObjectType(ECC_WorldStatic);
		MC->SetCollisionResponseToChannel(ECC_Pawn, ECR_Block);
		UMaterialInstanceDynamic* MID = MC->CreateAndSetMaterialInstanceDynamic(0);
		if (MID) MID->SetVectorParameterValue(TEXT("Color"), FVector(0.35f, 0.28f, 0.22f));
		SM->Tags.Add(FName("OAM_Wall"));
	}
}

/* ----------------- Furniture ----------------- */
void AOAMLevelBootstrapActor::GenerateFurniture(UWorld* W)
{
	if (!LevelData) return;
	static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("/Engine/BasicShapes/Cube.Cube"));
	for (const FVector2D& T : LevelData->FurnitureTiles)
	{
		FVector Loc = TileToWorld(T.X, T.Y, 40.f);
		AStaticMeshActor* SM = W->SpawnActor<AStaticMeshActor>(Loc, FRotator(0, 0, 0));
		if (!SM) continue;
		GeneratedActors.Add(SM);
		UStaticMeshComponent* MC = SM->GetStaticMeshComponent();
		MC->SetMobility(EComponentMobility::Static);
		if (Cube.Succeeded()) MC->SetStaticMesh(Cube.Object);
		MC->SetWorldScale3D(FVector(0.8f * TileSize / 100.f, 0.8f * TileSize / 100.f, 0.7f));
		MC->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
		MC->SetCollisionObjectType(ECC_WorldDynamic);
		MC->SetCollisionResponseToChannel(ECC_Pawn, ECR_Block);
		UMaterialInstanceDynamic* MID = MC->CreateAndSetMaterialInstanceDynamic(0);
		if (MID) MID->SetVectorParameterValue(TEXT("Color"), FVector(0.28f, 0.22f, 0.18f));
		SM->Tags.Add(FName("OAM_Furniture"));
	}
}

/* ----------------- Items ----------------- */
void AOAMLevelBootstrapActor::GenerateItems(UWorld* W)
{
	if (!LevelData) return;
	auto* GI = UOAMGameInstance::GetOAM(this);
	if (!GI) return;

	// 如果是谜题物品或关联了谜题 → 生成 OAMLockPuzzleActor；笔记生成 OAMNoteActor；否则 OAMPickupActor
	for (const FOAMLevelItemSpawn& S : LevelData->ItemSpawns)
	{
		const FVector Loc = TileToWorld(S.Position.X + 0.5f, S.Position.Y + 0.5f, 30.f);

		// 检查是否是谜题（Item 名称里带 puzzle）→ 生成锁
		UOAMItemData* ID = GI->ResolveItem(S.ItemID);
		if (!ID) continue;

		AActor* Spawned = nullptr;

		// 检查该物品是否是谜题ID（名字前缀 puzzle_）
		if (S.bIsPuzzle || S.ItemID.ToString().StartsWith(TEXT("item_iron_chest")) ||
			S.ItemID.ToString().StartsWith(TEXT("item_cd_box")))
		{
			// 谜题锁 Actor
			FName PuzzleID = NAME_None;
			if (S.ItemID == FName("item_cd_box")) PuzzleID = FName("puzzle_cdbox");
			if (S.ItemID == FName("item_diary") && false) {} // 日记本身不是锁
			if (S.ItemID == FName("item_iron_chest")) PuzzleID = FName("puzzle_chest");
			// 梳妆台小盒用 item_jewelry_box —— 我们直接额外生成：
			if (!PuzzleID.IsNone())
			{
				AOAMLockPuzzleActor* Lock = W->SpawnActor<AOAMLockPuzzleActor>(Loc, FRotator(0, 0, 0));
				if (Lock)
				{
					Lock->PuzzleData = GI->ResolvePuzzle(PuzzleID);
					Lock->PromptTextOverride = Lock->PuzzleData.IsValid()
						? FText::FromString(FString::Printf(TEXT("打开 %s [E]"), *Lock->PuzzleData->DisplayName.ToString()))
						: FText::FromString(TEXT("谜题 [E]"));
					Lock->AttemptsLeft = Lock->PuzzleData.IsValid() ? Lock->PuzzleData->MaxAttempts : 3;
					Spawned = Lock;
				}
			}
		}

		if (!Spawned && ID->bIsNote)
		{
			AOAMNoteActor* Note = W->SpawnActor<AOAMNoteActor>(Loc, FRotator(0, 0, 0));
			if (Note)
			{
				Note->ItemDataAsset = GI->ResolveItem(S.ItemID);
				Spawned = Note;
			}
		}

		if (!Spawned)
		{
			AOAMPickupActor* Pick = W->SpawnActor<AOAMPickupActor>(Loc, FRotator(0, 0, 0));
			if (Pick)
			{
				Pick->ItemDataAsset = GI->ResolveItem(S.ItemID);
				Spawned = Pick;
			}
		}

		if (Spawned)
		{
			if (S.bHiddenByDefault) Spawned->SetActorHiddenInGame(true);
			GeneratedActors.Add(Spawned);
		}
	}
}

/* ----------------- Doors ----------------- */
void AOAMLevelBootstrapActor::GenerateDoors(UWorld* W)
{
	if (!LevelData) return;
	for (const FOAMLevelDoor& D : LevelData->Doors)
	{
		const FVector Loc = TileToWorld(D.Position.X + 0.5f, D.Position.Y + 0.5f, 80.f);
		AOAMDoorActor* Door = W->SpawnActor<AOAMDoorActor>(Loc, FRotator(0, 0, 0));
		if (!Door) continue;
		Door->DoorID = D.DoorID;
		Door->bLocked = D.bLocked;
		Door->RequiredKeyItemID = D.KeyItemID;
		Door->TargetLevel = D.ToLevel;
		Door->TargetSpawnLocation = TileToWorld(D.ToSpawn.X, D.ToSpawn.Y, 0);
		Door->TargetRoomID = D.ToRoom;
		Door->bIsEndingDoor = D.bIsEndingDoor;
		Door->PromptTextOverride = D.DisplayName;
		GeneratedActors.Add(Door);
	}
}

/* ----------------- Room Triggers ----------------- */
void AOAMLevelBootstrapActor::GenerateRoomTriggers(UWorld* W)
{
	if (!LevelData) return;
	for (const FOAMRoomTrigger& R : LevelData->RoomTriggers)
	{
		const FVector Center = TileToWorld(
			(R.Rect.Min.X + R.Rect.Max.X) * 0.5f,
			(R.Rect.Min.Y + R.Rect.Max.Y) * 0.5f, 80.f);
		AOAMRoomTriggerVolume* Vol = W->SpawnActor<AOAMRoomTriggerVolume>(Center, FRotator(0, 0, 0));
		if (!Vol) continue;
		Vol->RoomID = R.RoomID;
		Vol->RoomDisplay = R.RoomName;
		Vol->bHasMicroStimulus = true;
		const int32 W_t = R.Rect.Max.X - R.Rect.Min.X;
		const int32 H_t = R.Rect.Max.Y - R.Rect.Min.Y;
		Vol->GetBrushComponent()->Brush.BoxExtent = FVector(W_t * TileSize * 0.5f, H_t * TileSize * 0.5f, 100.f);
		GeneratedActors.Add(Vol);
	}
}

/* ----------------- PlayerStart ----------------- */
void AOAMLevelBootstrapActor::GeneratePlayerStart(UWorld* W)
{
	if (!LevelData) return;

	APlayerStart* Existing = nullptr;
	TArray<AActor*> Starts;
	UGameplayStatics::GetAllActorsOfClass(W, APlayerStart::StaticClass(), Starts);
	if (Starts.Num() > 0) Existing = Cast<APlayerStart>(Starts[0]);

	FVector2D Sp = LevelData->SpawnPoint;
	const FVector Loc = TileToWorld(Sp.X, Sp.Y, 0);

	if (Existing)
	{
		Existing->SetActorLocation(Loc);
	}
	else
	{
		APlayerStart* PS = W->SpawnActor<APlayerStart>(Loc, FRotator(0, 0, 0));
		if (PS) GeneratedActors.Add(PS);
	}

	// 额外移动现有 Pawn
	APawn* P = UGameplayStatics::GetPlayerPawn(W, 0);
	if (P)
	{
		P->SetActorLocation(Loc + FVector(0, 0, 100));
	}
}
