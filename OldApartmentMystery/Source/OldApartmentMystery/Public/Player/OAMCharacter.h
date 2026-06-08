// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "OAMTypes.h"
#include "OAMCharacter.generated.h"

class UCameraComponent;
class USpringArmComponent;
class UWidgetComponent;

UCLASS(Blueprintable)
class OLDAPARTMENTMYSTERY_API AOAMCharacter : public ACharacter
{
	GENERATED_BODY()
public:
	AOAMCharacter();

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "OAM|Components")
	TObjectPtr<USpringArmComponent> CameraBoom;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "OAM|Components")
	TObjectPtr<UCameraComponent> FollowCamera;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "OAM|Components")
	TObjectPtr<UWidgetComponent> InteractHintWidget;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Character")
	float BaseWalkSpeed = 180.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Character")
	float BaseRunSpeed = 320.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Character")
	float InteractionReach = 200.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Character")
	FName CurrentRoom = NAME_None;

	virtual void Tick(float DeltaSeconds) override;

	UFUNCTION(BlueprintCallable, Category = "OAM|Character")
	void SetCurrentRoom(FName RoomID);

protected:
	virtual void BeginPlay() override;
};
