// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Environment/OAMInteractableActorBase.h"
#include "OAMTypes.h"
#include "OAMDoorActor.generated.h"

UCLASS(Blueprintable)
class OLDAPARTMENTMYSTERY_API AOAMDoorActor : public AOAMInteractableActorBase
{
	GENERATED_BODY()
public:
	AOAMDoorActor();

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Door")
	FName DoorID;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Door")
	bool bLocked = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Door")
	FName RequiredKeyItemID;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Door")
	FName TargetLevel;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Door")
	FVector TargetSpawnLocation;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Door")
	FRotator TargetSpawnRotation;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Door")
	FName TargetRoomID;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Door")
	bool bIsEndingDoor = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Door")
	FRotator OpenRotationOffset = FRotator(0, 90, 0);

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Door")
	bool bIsOpen = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Door")
	float OpenAnimDuration = 0.8f;

	virtual void OnInteract_Implementation(AOAMPlayerController* InstigatorPC) override;
	virtual FText GetPromptText_Implementation() const override;

	UFUNCTION(BlueprintCallable, Category = "OAM|Door")
	void Unlock();

	UFUNCTION(BlueprintCallable, Category = "OAM|Door")
	void PlayOpenAnimation();

private:
	FTimerHandle OpenAnimTimer;
	FRotator StartRotation;
	FRotator TargetRotation;
};
