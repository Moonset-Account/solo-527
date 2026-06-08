// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "OAMTypes.h"
#include "OAMInteractionComponent.generated.h"

class IOAMInteractableInterface;
class AOAMPlayerController;

UCLASS(ClassGroup=(OAM), meta=(BlueprintSpawnableComponent))
class OLDAPARTMENTMYSTERY_API UOAMInteractionComponent : public UActorComponent
{
	GENERATED_BODY()
public:
	UOAMInteractionComponent();

	UFUNCTION(BlueprintCallable, Category = "OAM|Interaction")
	void Initialize(AOAMPlayerController* InOwner);

	UFUNCTION(BlueprintCallable, Category = "OAM|Interaction")
	AActor* FindNearestInteractable(float& OutDistance);

	UFUNCTION(BlueprintCallable, Category = "OAM|Interaction")
	void InteractWithNearest();

	UFUNCTION(BlueprintCallable, Category = "OAM|Interaction")
	void UpdateHover();

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "OAM|Interaction")
	float InteractRadius = 180.f;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Interaction")
	TWeakObjectPtr<AActor> CurrentHover;

	UFUNCTION(BlueprintPure, Category = "OAM|Interaction")
	FText GetCurrentPrompt() const;

protected:
	virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

private:
	TWeakObjectPtr<AOAMPlayerController> OwnerPC;
};
