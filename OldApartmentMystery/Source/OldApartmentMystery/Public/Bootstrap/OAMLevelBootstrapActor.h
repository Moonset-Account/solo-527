// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.
// =========================================================================
// OAMLevelBootstrapActor —— 放在关卡（哪怕是空关卡）里
//   BeginPlay → 读取 OAMLevelDataAsset → 在场景中生成：
//     1. 墙（BSP/StaticMesh Box）
//     2. 地板 Tile（按 Zone 分色）
//     3. 家具（Block Volumes）
//     4. OAMPickupActor / OAMDoorActor / OAMRoomTriggerVolume
//     5. PlayerStart
// =========================================================================

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "OAMLevelBootstrapActor.generated.h"

class UOAMLevelDataAsset;
class UBoxComponent;

UCLASS(Blueprintable, NotPlaceable, HideCategories = ("Transform", "Rendering"))
class OLDAPARTMENTMYSTERY_API AOAMLevelBootstrapActor : public AActor
{
	GENERATED_BODY()
public:
	AOAMLevelBootstrapActor();

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Bootstrap")
	bool bAutoBootstrapOnBeginPlay = true;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Bootstrap")
	FName OverrideLevelName = NAME_None;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Bootstrap")
	float TileSize = 100.f;

	UFUNCTION(BlueprintCallable, Category = "OAM|Bootstrap")
	void BootstrapLevel();

	UFUNCTION(BlueprintCallable, Category = "OAM|Bootstrap")
	void ClearGeneratedActors();

	UFUNCTION(BlueprintCallable, Category = "OAM|Bootstrap")
	static AOAMLevelBootstrapActor* SpawnInWorld(UWorld* World, FName ForLevel);

protected:
	virtual void BeginPlay() override;

private:
	UPROPERTY()
	TArray<TObjectPtr<AActor>> GeneratedActors;

	UPROPERTY()
	TObjectPtr<UOAMLevelDataAsset> LevelData;

	UPROPERTY()
	FVector Origin;

	/* 子步骤 */
	void GenerateWalls(UWorld* W);
	void GenerateFloor(UWorld* W);
	void GenerateFurniture(UWorld* W);
	void GenerateItems(UWorld* W);
	void GenerateDoors(UWorld* W);
	void GenerateRoomTriggers(UWorld* W);
	void GeneratePlayerStart(UWorld* W);

	FVector TileToWorld(float X, float Y, float Z = 0) const;
	FVector2D WorldToTile(const FVector& V) const;
};
