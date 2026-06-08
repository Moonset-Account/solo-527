// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "OAMTypes.h"
#include "OAMGameMode.generated.h"

class UOAMLevelDataAsset;

UCLASS()
class OLDAPARTMENTMYSTERY_API AOAMGameMode : public AGameModeBase
{
	GENERATED_BODY()
public:
	AOAMGameMode();
	virtual void StartPlay() override;
	virtual void BeginPlay() override;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "OAM|Level")
	TSoftObjectPtr<UOAMLevelDataAsset> CurrentLevelData;

	UFUNCTION(BlueprintCallable, Category = "OAM|Flow")
	void HandleLevelLoaded(FName LevelName);

	UFUNCTION(BlueprintCallable, Category = "OAM|Objectives")
	void NotifyObjectiveEvent(EOAMObjectiveCheck Type, FName Value, int32 Count = 1);

	UPROPERTY(BlueprintAssignable)
	FOAM_OnObjectiveChanged OnObjectiveCompleted;
};
