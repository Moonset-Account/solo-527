// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "OAMTypes.h"
#include "OAMLevelDataAsset.generated.h"

UCLASS(BlueprintType)
class OLDAPARTMENTMYSTERY_API UOAMLevelDataAsset : public UPrimaryDataAsset
{
	GENERATED_BODY()
public:
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FName LevelName;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FText DisplayName;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	int32 ChapterID = 1;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FVector2D GridSize = FVector2D(24, 18);
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	TArray<FOAMWallRect> Walls;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	TArray<FOAMFloorZone> FloorZones;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	TArray<FVector2D> FurnitureTiles;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	TArray<FOAMLevelItemSpawn> ItemSpawns;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	TArray<FOAMLevelDoor> Doors;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	TArray<FOAMRoomTrigger> RoomTriggers;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FVector2D SpawnPoint = FVector2D(5, 10);
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	TSoftObjectPtr<USoundBase> AmbientSound;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FLinearColor FogTint = FLinearColor(0.4f, 0.3f, 0.2f, 0.6f);
};
