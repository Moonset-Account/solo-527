// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Volume.h"
#include "OAMRoomTriggerVolume.generated.h"

UCLASS(Blueprintable)
class OLDAPARTMENTMYSTERY_API AOAMRoomTriggerVolume : public AVolume
{
	GENERATED_BODY()
public:
	AOAMRoomTriggerVolume();

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Room")
	FName RoomID;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Room")
	FText RoomDisplay;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Room")
	TSoftObjectPtr<USoundBase> AmbientOnEnter;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Room")
	FText NarrationOnFirstEnter;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Room")
	bool bHasMicroStimulus = false;

protected:
	virtual void BeginPlay() override;

	UFUNCTION()
	void OnOverlapBegin(UPrimitiveComponent* OverlappedComp, AActor* OtherActor, UPrimitiveComponent* OtherComp,
		int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult);

private:
	bool bFirstEnterHandled = false;
};
