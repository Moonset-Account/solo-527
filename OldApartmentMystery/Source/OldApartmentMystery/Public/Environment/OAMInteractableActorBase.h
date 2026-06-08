// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Environment/OAMInteractableInterface.h"
#include "Data/OAMItemData.h"
#include "OAMInteractableActorBase.generated.h"

class UWidgetComponent;
class UStaticMeshComponent;
class UBoxComponent;

UCLASS(Abstract, Blueprintable)
class OLDAPARTMENTMYSTERY_API AOAMInteractableActorBase : public AActor, public IOAMInteractableInterface
{
	GENERATED_BODY()
public:
	AOAMInteractableActorBase();

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	TObjectPtr<USceneComponent> SceneRoot;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	TObjectPtr<UStaticMeshComponent> MeshComp;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	TObjectPtr<UBoxComponent> InteractBox;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	TObjectPtr<UWidgetComponent> HoverWidget;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Interactable")
	FText PromptTextOverride;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Interactable")
	bool bIsInteractable = true;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Interactable")
	FName UniqueID;

	virtual bool IsInteractable_Implementation() const override { return bIsInteractable; }
	virtual FText GetPromptText_Implementation() const override { return PromptTextOverride; }

	virtual void OnInteract_Implementation(AOAMPlayerController* InstigatorPC) override;
	virtual void OnStartHover_Implementation() override;
	virtual void OnEndHover_Implementation() override;

protected:
	virtual void BeginPlay() override;
};
