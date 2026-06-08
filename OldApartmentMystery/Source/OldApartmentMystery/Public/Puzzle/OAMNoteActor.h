// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Environment/OAMInteractableActorBase.h"
#include "Data/OAMItemData.h"
#include "OAMNoteActor.generated.h"

UCLASS(Blueprintable)
class OLDAPARTMENTMYSTERY_API AOAMNoteActor : public AOAMInteractableActorBase
{
	GENERATED_BODY()
public:
	AOAMNoteActor();

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Note")
	TSoftObjectPtr<UOAMItemData> ItemDataAsset;

	virtual void OnInteract_Implementation(AOAMPlayerController* InstigatorPC) override;
	virtual FText GetPromptText_Implementation() const override;

protected:
	virtual void BeginPlay() override;
};
