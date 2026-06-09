// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "OAMTypes.h"
#include "OAMPlayerController.generated.h"

class UOAMInteractionComponent;
class UInputMappingContext;
class UInputAction;
struct FInputActionValue;

UCLASS()
class OLDAPARTMENTMYSTERY_API AOAMPlayerController : public APlayerController
{
	GENERATED_BODY()
public:
	AOAMPlayerController();

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "OAM|Components")
	TObjectPtr<UOAMInteractionComponent> InteractionComp;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "OAM|Input")
	TObjectPtr<UInputMappingContext> InputContext;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "OAM|Input")
	TObjectPtr<UInputAction> IA_Move;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "OAM|Input")
	TObjectPtr<UInputAction> IA_Look;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "OAM|Input")
	TObjectPtr<UInputAction> IA_Interact;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "OAM|Input")
	TObjectPtr<UInputAction> IA_Notebook;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "OAM|Input")
	TObjectPtr<UInputAction> IA_Inventory;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "OAM|Input")
	TObjectPtr<UInputAction> IA_Pause;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "OAM|Input")
	TArray<TObjectPtr<UInputAction>> IA_Digits;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "OAM|Input")
	TObjectPtr<UInputAction> IA_Back;

	UFUNCTION(BlueprintCallable, Category = "OAM|UI")
	void ShowToast(const FText& Message, EOAMToastType Type = EOAMToastType::Info, float Duration = 2.5f);

	UFUNCTION(BlueprintCallable, Category = "OAM|UI")
	void TriggerScreenShake(float Intensity = 1.f, float Duration = 0.5f);

	UFUNCTION(BlueprintCallable, Category = "OAM|UI")
	void TriggerScreenFlash(FLinearColor Color = FLinearColor(1, 1, 1, 0.3f), float Duration = 0.2f);

protected:
	virtual void BeginPlay() override;
	virtual void SetupInputComponent() override;
	void OnMove(const FInputActionValue& Value);
	void OnLook(const FInputActionValue& Value);
	void OnInteractTriggered(const FInputActionValue& Value);
	void OnToggleNotebook(const FInputActionValue& Value);
	void OnToggleInventory(const FInputActionValue& Value);
	void OnPause(const FInputActionValue& Value);
	void OnDigitPressed(int32 Digit);
	void OnBack(const FInputActionValue& Value);
	void OnDigit0() { OnDigitPressed(0); }
	void OnDigit1() { OnDigitPressed(1); }
	void OnDigit2() { OnDigitPressed(2); }
	void OnDigit3() { OnDigitPressed(3); }
	void OnDigit4() { OnDigitPressed(4); }
	void OnDigit5() { OnDigitPressed(5); }
	void OnDigit6() { OnDigitPressed(6); }
	void OnDigit7() { OnDigitPressed(7); }
	void OnDigit8() { OnDigitPressed(8); }
	void OnDigit9() { OnDigitPressed(9); }
};
