// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "UObject/Interface.h"
#include "OAMTypes.h"
#include "OAMInteractableInterface.generated.h"

class AOAMPlayerController;

UINTERFACE(MinimalAPI, Blueprintable)
class UOAMInteractableInterface : public UInterface { GENERATED_BODY() };

class OLDAPARTMENTMYSTERY_API IOAMInteractableInterface
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "OAM|Interactable")
	bool IsInteractable() const;
	virtual bool IsInteractable_Implementation() const { return true; }

	UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "OAM|Interactable")
	FText GetPromptText() const;
	virtual FText GetPromptText_Implementation() const { return FText::FromString(TEXT("交互 [E]")); }

	UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "OAM|Interactable")
	void OnInteract(AOAMPlayerController* InstigatorPC);
	virtual void OnInteract_Implementation(AOAMPlayerController* InstigatorPC) {}

	UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "OAM|Interactable")
	void OnStartHover();
	virtual void OnStartHover_Implementation() {}

	UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "OAM|Interactable")
	void OnEndHover();
	virtual void OnEndHover_Implementation() {}
};
