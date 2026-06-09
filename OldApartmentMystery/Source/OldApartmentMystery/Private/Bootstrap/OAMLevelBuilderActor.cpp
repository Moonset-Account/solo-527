// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Bootstrap/OAMLevelBuilderActor.h"
#include "Bootstrap/OAMGameData.h"
#include "Data/OAMLevelDataAsset.h"
#include "Data/OAMItemData.h"
#include "Data/OAMPuzzleData.h"
#include "Environment/OAMDoorActor.h"
#include "Environment/OAMPickupActor.h"
#include "Environment/OAMRoomTriggerVolume.h"
#include "Puzzle/OAMLockPuzzleActor.h"
#include "Puzzle/OAMNoteActor.h"
#include "Components/StaticMeshComponent.h"
#include "Components/BoxComponent.h"
#include "Components/BrushComponent.h"
#include "Engine/StaticMesh.h"
#include "Engine/CollisionProfile.h"
#include "UObject/ConstructorHelpers.h"
#include "Materials/Material.h"

AOAMLevelBuilderActor::AOAMLevelBuilderActor()
{
	PrimaryActorTick.bCanEverTick = false;
	BuildLevelName = FName(TEXT("Chapter1_LivingRoom"));
}

void AOAMLevelBuilderActor::BeginPlay()
{
	Super::BeginPlay();
	BuildAll();
}

FVector AOAMLevelBuilderActor::GridToWorld(int32 GX, int32 GY, float Z) const
{
	return FVector(
		(GX + GridOffset.X) * TileSize + TileSize * 0.5f,
		(GY + GridOffset.Y) * TileSize + TileSize * 0.5f,
		Z
	);
}

void AOAMLevelBuilderActor::BuildAll()
{
	LevelData = UOAMGameData::FindLevel(BuildLevelName);
	if (!LevelData)
	{
		UE_LOG(LogTemp, Warning, TEXT("[OAM][Builder] 找不到关卡数据：%s"), *BuildLevelName.ToString());
		return;
	}
	UE_LOG(LogTemp, Log, TEXT("[OAM][Builder] 开始构建关卡：%s  (%d x %d)"),
		*LevelData->LevelName.ToString(), (int32)LevelData->GridSize.X, (int32)LevelData->GridSize.Y);

	DestroyAllSpawned();

	// 1) 地板：全网格铺地板（Room 颜色）
	{
		// 默认全部棕木色
		for (int32 y = 1; y < LevelData->GridSize.Y - 1; ++y)
		for (int32 x = 1; x < LevelData->GridSize.X - 1; ++x)
		{
			FLinearColor C = FLinearColor(0.45f, 0.33f, 0.22f);
			for (const FOAMFloorZone& Z : LevelData->FloorZones)
			{
				if (x >= Z.X && x < Z.X + Z.W && y >= Z.Y && y < Z.Y + Z.H)
				{
					C = Z.Color;
					break;
				}
			}
			BuildFloorTile(x, y, C);
		}
	}

	BuildWalls();
	BuildFurniture();
	BuildItemsAndPuzzles();
	BuildDoors();
	BuildRoomTriggers();

	UE_LOG(LogTemp, Log, TEXT("[OAM][Builder] 完成，Spawned %d 个 Actor"), SpawnedActors.Num());
}

void AOAMLevelBuilderActor::DestroyAllSpawned()
{
	for (auto* A : SpawnedActors)
	{
		if (IsValid(A)) A->Destroy();
	}
	SpawnedActors.Empty();
}

void AOAMLevelBuilderActor::BuildFloorTile(int32 GX, int32 GY, FLinearColor Color)
{
	AActor* Tile = GetWorld()->SpawnActor<AActor>(AActor::StaticClass(), GridToWorld(GX, GY, 0), FRotator::ZeroRotator);
	if (!Tile) return;
	Tile->SetActorScale3D(FVector(0.98f, 0.98f, 0.02f) * (TileSize / 100.f));
	UStaticMeshComponent* SMC = NewObject<UStaticMeshComponent>(Tile);
	SMC->RegisterComponent();
	Tile->SetRootComponent(SMC);

	// 使用默认立方体 Mesh + 材质
	static ConstructorHelpers::FObjectFinder<UStaticMesh> CubeMesh(TEXT("StaticMesh'/Engine/BasicShapes/Cube.Cube'"));
	static ConstructorHelpers::FObjectFinder<UMaterial> DefMat(TEXT("Material'/Engine/EngineMaterials/WorldGridMaterial.WorldGridMaterial'"));
	if (CubeMesh.Succeeded()) SMC->SetStaticMesh(CubeMesh.Object);
	if (DefMat.Succeeded()) SMC->SetMaterial(0, DefMat.Object);
	SMC->SetCollisionProfileName(UCollisionProfile::BlockAll_ProfileName);
	SMC->SetWorldLocation(GridToWorld(GX, GY, 0));
	SMC->SetVectorParameterValueOnMaterials(TEXT("BaseColor"), FVector(Color.R, Color.G, Color.B));
	SpawnedActors.Add(Tile);
}

void AOAMLevelBuilderActor::BuildWalls()
{
	static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("StaticMesh'/Engine/BasicShapes/Cube.Cube'"));
	static ConstructorHelpers::FObjectFinder<UMaterial> Mat(TEXT("Material'/Engine/EngineMaterials/WorldGridMaterial.WorldGridMaterial'"));
	const FLinearColor WallColor = FLinearColor(0.28f, 0.22f, 0.18f);

	for (const FOAMWallRect& W : LevelData->Walls)
	{
		for (int32 dy = 0; dy < W.H; ++dy)
		for (int32 dx = 0; dx < W.W; ++dx)
		{
			AActor* A = GetWorld()->SpawnActor<AActor>(AActor::StaticClass(), GridToWorld(W.X + dx, W.Y + dy, TileSize * 1.5f), FRotator::ZeroRotator);
			if (!A) continue;
			UStaticMeshComponent* SMC = NewObject<UStaticMeshComponent>(A);
			SMC->RegisterComponent();
			A->SetRootComponent(SMC);
			if (Cube.Succeeded()) SMC->SetStaticMesh(Cube.Object);
			if (Mat.Succeeded()) SMC->SetMaterial(0, Mat.Object);
			SMC->SetCollisionProfileName(UCollisionProfile::BlockAll_ProfileName);
			const FVector Scale = FVector(0.98f, 0.98f, 3.f) * (TileSize / 100.f);
			A->SetActorScale3D(Scale);
			SMC->SetVectorParameterValueOnMaterials(TEXT("BaseColor"), FVector(WallColor.R, WallColor.G, WallColor.B));
			SpawnedActors.Add(A);
		}
	}
}

void AOAMLevelBuilderActor::BuildFurniture()
{
	if (!LevelData) return;
	static ConstructorHelpers::FObjectFinder<UStaticMesh> Cube(TEXT("StaticMesh'/Engine/BasicShapes/Cube.Cube'"));
	static ConstructorHelpers::FObjectFinder<UMaterial> Mat(TEXT("Material'/Engine/EngineMaterials/WorldGridMaterial.WorldGridMaterial'"));

	// DA_Level 的家具目前在 Row 里没单独存（上面用了旧字段），此处用 LevelData 配置的家具：
	// 为保持一致，直接检查 LevelData::FurnitureTiles（若未来用）+ 用自定义简化：
	// 根据 Row 数据重新 Build：
	// 这里暂时使用通用的 4 件默认家具，每个关卡：
	const FOAMLevelDataRow* MyRow = nullptr;
	const UOAMGameData* GData = UOAMGameData::Get();
	for (const FOAMLevelDataRow& R : GData->LevelRows)
	{
		if (R.LevelName == BuildLevelName) { MyRow = &R; break; }
	}
	if (!MyRow) return;

	for (const FOAMFurnitureRow& F : MyRow->Furniture)
	{
		for (int32 dy = 0; dy < F.H; ++dy)
		for (int32 dx = 0; dx < F.W; ++dx)
		{
			const float Height = (F.Kind == TEXT("Window")) ? 0.1f : 1.2f;
			const float ZOffset = (F.Kind == TEXT("Window")) ? TileSize * 1.5f : TileSize * Height * 0.5f;
			AActor* A = GetWorld()->SpawnActor<AActor>(AActor::StaticClass(), GridToWorld(F.X + dx, F.Y + dy, ZOffset), FRotator::ZeroRotator);
			if (!A) continue;
			UStaticMeshComponent* SMC = NewObject<UStaticMeshComponent>(A);
			SMC->RegisterComponent();
			A->SetRootComponent(SMC);
			if (Cube.Succeeded()) SMC->SetStaticMesh(Cube.Object);
			if (Mat.Succeeded()) SMC->SetMaterial(0, Mat.Object);
			SMC->SetCollisionProfileName(UCollisionProfile::BlockAll_ProfileName);
			const FVector Scale = FVector(0.95f, 0.95f, Height) * (TileSize / 100.f);
			A->SetActorScale3D(Scale);
			SMC->SetVectorParameterValueOnMaterials(TEXT("BaseColor"), FVector(F.Color.R, F.Color.G, F.Color.B));
			SpawnedActors.Add(A);
		}
	}
}

void AOAMLevelBuilderActor::BuildItemsAndPuzzles()
{
	const FOAMLevelDataRow* MyRow = nullptr;
	const UOAMGameData* GData = UOAMGameData::Get();
	for (const FOAMLevelDataRow& R : GData->LevelRows)
	{
		if (R.LevelName == BuildLevelName) { MyRow = &R; break; }
	}
	if (!MyRow) return;

	for (const FOAMItemSpawnRow& IS : MyRow->Items)
	{
		const UOAMItemData* ID = UOAMGameData::FindItem(IS.ItemID);
		if (!ID) continue;
		const FVector Loc = GridToWorld(IS.Position.X, IS.Position.Y, TileSize * 0.5f);

		AActor* Spawned = nullptr;

		// Puzzle?
		if (IS.bIsPuzzle)
		{
			AOAMLockPuzzleActor* P = GetWorld()->SpawnActor<AOAMLockPuzzleActor>(
				AOAMLockPuzzleActor::StaticClass(), Loc, FRotator(0, 180, 0));
			if (P)
			{
				// 找到对应的 PuzzleData
				FName PuzzleID;
				for (const FOAMPuzzleDataRow& PR : GData->PuzzleRows)
				{
					if (PR.DisplayName.EqualToCaseIgnored(ID->DisplayName)
						|| PR.DisplayName.ToString().Contains(ID->DisplayName.ToString().LeftChop(1)))
					{
						PuzzleID = PR.PuzzleID;
						break;
					}
				}
				// 默认匹配
				if (PuzzleID.IsNone())
				{
					if (IS.ItemID == TEXT("item_cdbox"))        PuzzleID = TEXT("puzzle_cdbox");
					if (IS.ItemID == TEXT("item_jewelrybox"))   PuzzleID = TEXT("puzzle_jewelrybox");
					if (IS.ItemID == TEXT("item_oldchest"))      PuzzleID = TEXT("puzzle_chest");
				}
				if (!PuzzleID.IsNone())
				{
					const UOAMPuzzleData* PD = UOAMGameData::FindPuzzle(PuzzleID);
					if (PD) P->PuzzleData = TSoftObjectPtr<UOAMPuzzleData>(PD);
				}
				P->PromptTextOverride = FText::Format(FText::FromString(TEXT("解锁 {0} [E]")), ID->DisplayName);
				P->MeshComp->SetWorldScale3D(FVector(1, 1, 0.8f));
				if (ID->WorldMesh.Get()) P->MeshComp->SetStaticMesh(ID->WorldMesh.Get());
				P->MeshComp->SetVectorParameterValueOnMaterials(TEXT("BaseColor"),
					FVector(ID->TintColor.R, ID->TintColor.G, ID->TintColor.B));
				Spawned = P;
			}
		}
		else if (ID->bIsNote)
		{
			AOAMNoteActor* N = GetWorld()->SpawnActor<AOAMNoteActor>(AOAMNoteActor::StaticClass(), Loc, FRotator::ZeroRotator);
			if (N)
			{
				N->ItemDataAsset = TSoftObjectPtr<UOAMItemData>(ID);
				N->UniqueID = ID->ItemID;
				Spawned = N;
			}
		}
		else
		{
			AOAMPickupActor* PI = GetWorld()->SpawnActor<AOAMPickupActor>(AOAMPickupActor::StaticClass(), Loc, FRotator::ZeroRotator);
			if (PI)
			{
				PI->ItemDataAsset = TSoftObjectPtr<UOAMItemData>(ID);
				PI->UniqueID = ID->ItemID;
				if (ID->WorldMesh.Get()) PI->MeshComp->SetStaticMesh(ID->WorldMesh.Get());
				PI->MeshComp->SetVectorParameterValueOnMaterials(TEXT("BaseColor"),
					FVector(ID->TintColor.R, ID->TintColor.G, ID->TintColor.B));
				Spawned = PI;
			}
		}

		if (Spawned) SpawnedActors.Add(Spawned);
	}
}

void AOAMLevelBuilderActor::BuildDoors()
{
	const FOAMLevelDataRow* MyRow = nullptr;
	const UOAMGameData* GData = UOAMGameData::Get();
	for (const FOAMLevelDataRow& R : GData->LevelRows)
	{
		if (R.LevelName == BuildLevelName) { MyRow = &R; break; }
	}
	if (!MyRow) return;

	for (const FOAMDoorRow& DR : MyRow->Doors)
	{
		const FVector Loc = GridToWorld(DR.Position.X, DR.Position.Y, TileSize * 1.5f);
		const FRotator Rot = FRotator(0, (DR.Position.X == 0 || DR.Position.X == (int32)LevelData->GridSize.X - 1) ? 90 : 0, 0);
		AOAMDoorActor* D = GetWorld()->SpawnActor<AOAMDoorActor>(AOAMDoorActor::StaticClass(), Loc, Rot);
		if (!D) continue;
		D->DoorID = DR.DoorID;
		D->bLocked = DR.bLocked;
		D->RequiredKeyItemID = DR.KeyItemID;
		D->TargetLevel = DR.ToLevel;
		D->TargetSpawnLocation = FVector(DR.ToSpawn.X * TileSize + TileSize * 0.5f, DR.ToSpawn.Y * TileSize + TileSize * 0.5f, TileSize);
		D->TargetSpawnRotation = FRotator::ZeroRotator;
		D->TargetRoomID = DR.ToRoom;
		D->bIsEndingDoor = DR.bIsEndingDoor;
		D->PromptTextOverride = DR.DisplayName;
		D->MeshComp->SetWorldScale3D(FVector(0.2f, 1.f, 2.5f) * (TileSize / 100.f));
		D->MeshComp->SetVectorParameterValueOnMaterials(TEXT("BaseColor"), FVector(0.5f, 0.32f, 0.18f));
		SpawnedActors.Add(D);
	}
}

void AOAMLevelBuilderActor::BuildRoomTriggers()
{
	const FOAMLevelDataRow* MyRow = nullptr;
	const UOAMGameData* GData = UOAMGameData::Get();
	for (const FOAMLevelDataRow& R : GData->LevelRows)
	{
		if (R.LevelName == BuildLevelName) { MyRow = &R; break; }
	}
	if (!MyRow) return;

	for (const FOAMRoomRow& RR : MyRow->Rooms)
	{
		const FVector Center = GridToWorld(RR.X + RR.W / 2, RR.Y + RR.H / 2, TileSize);
		AOAMRoomTriggerVolume* T = GetWorld()->SpawnActor<AOAMRoomTriggerVolume>(
			AOAMRoomTriggerVolume::StaticClass(), Center, FRotator::ZeroRotator);
		if (!T) continue;
		T->RoomID = RR.RoomID;
		T->RoomDisplay = RR.RoomName;
		T->bHasMicroStimulus = RR.bMicroStimulus;
		const FVector HalfScale = FVector(
			(float)RR.W * TileSize,
			(float)RR.H * TileSize,
			TileSize * 3.f
		) * 0.5f;
		if (UBoxComponent* BC = T->FindComponentByClass<UBoxComponent>())
		{
			BC->SetBoxExtent(HalfScale, false);
		}
		else
		{
			T->GetBrushComponent()->SetBoxExtent(FVector2D(HalfScale.X, HalfScale.Y), false);
		}
		SpawnedActors.Add(T);
	}
}
