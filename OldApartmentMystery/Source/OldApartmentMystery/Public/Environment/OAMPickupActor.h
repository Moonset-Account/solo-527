// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Environment/OAMInteractableActorBase.h"
#include "Data/OAMItemData.h"
#include "OAMPickupActor.generated.h"

UCLASS(Blueprintable)
class OLDAPARTMENTMYSTERY_API AOAMPickupActor : public AOAMInteractableActorBase
{
	GENERATED_BODY()
public:
	AOAMPickupActor();

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Pickup")
	TSoftObjectPtr<UOAMItemData> ItemDataAsset;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Pickup")
	bool bAutoPickup = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Pickup")
	bool bIsPickupComplete = false;

	virtual void OnInteract_Implementation(AOAMPlayerController* InstigatorPC) override;
	virtual FText GetPromptText_Implementation() const override;

protected:
	virtual void BeginPlay() override;

	UFUNCTION(BlueprintCallable, Category = "OAM|Pickup")
	void ApplyVisualFromData();
};
