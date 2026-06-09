// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "OAMLevelBuilderActor.generated.h"

class UOAMLevelDataAsset;
class AOAMDoorActor;
class AOAMPickupActor;
class AOAMLockPuzzleActor;
class AOAMNoteActor;
class AOAMRoomTriggerVolume;

/**
 * 程序化生成整个关卡的 Actor（墙、家具、物品、门、触发器）。
 * 不依赖二进制 .umap 内容，把这个 Actor 放在一个空关卡里即可。
 */
UCLASS()
class OLDAPARTMENTMYSTERY_API AOAMLevelBuilderActor : public AActor
{
	GENERATED_BODY()
public:
	AOAMLevelBuilderActor();

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Builder")
	FName BuildLevelName;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Builder")
	float TileSize = 100.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Builder")
	FVector2D GridOffset = FVector2D(0, 0);

	/** 构建完成后所有 spawn 的 Actor（用于删除） */
	UPROPERTY(BlueprintReadOnly, Category = "OAM|Builder")
	TArray<TObjectPtr<AActor>> SpawnedActors;

	UFUNCTION(BlueprintCallable, Category = "OAM|Builder")
	void BuildAll();

	UFUNCTION(BlueprintCallable, Category = "OAM|Builder")
	void DestroyAllSpawned();

protected:
	virtual void BeginPlay() override;

private:
	const UOAMLevelDataAsset* LevelData = nullptr;

	void BuildWalls();
	void BuildFurniture();
	void BuildItemsAndPuzzles();
	void BuildDoors();
	void BuildRoomTriggers();

	void BuildFloorTile(int32 GX, int32 GY, FLinearColor Color);

	FVector GridToWorld(int32 GX, int32 GY, float Z = 0) const;
};
