// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Environment/OAMInteractableActorBase.h"
#include "Data/OAMPuzzleData.h"
#include "OAMLockPuzzleActor.generated.h"

UCLASS(Blueprintable)
class OLDAPARTMENTMYSTERY_API AOAMLockPuzzleActor : public AOAMInteractableActorBase
{
	GENERATED_BODY()
public:
	AOAMLockPuzzleActor();

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Puzzle")
	TSoftObjectPtr<UOAMPuzzleData> PuzzleData;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Puzzle")
	bool bIsSolved = false;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Puzzle")
	int32 AttemptsLeft = 3;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Puzzle")
	bool bIsCooldown = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Puzzle")
	float CooldownDuration = 5.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "OAM|Puzzle")
	TArray<int32> CurrentInput;

	UPROPERTY(BlueprintAssignable, Category = "OAM|Puzzle")
	FOAM_OnPuzzleResult OnPuzzleResult;

	virtual void OnInteract_Implementation(AOAMPlayerController* InstigatorPC) override;
	virtual FText GetPromptText_Implementation() const override;

	UFUNCTION(BlueprintCallable, Category = "OAM|Puzzle")
	void InputDigit(int32 Digit);

	UFUNCTION(BlueprintCallable, Category = "OAM|Puzzle")
	void ClearInput();

	UFUNCTION(BlueprintCallable, Category = "OAM|Puzzle")
	void SubmitAttempt();

	UFUNCTION(BlueprintCallable, Category = "OAM|Puzzle")
	void ForceSolve();

private:
	FTimerHandle CooldownTimer;
	TWeakObjectPtr<AOAMPlayerController> LastInstigator;

	void BeginCooldown();
	void OnCooldownComplete();
	void DoSuccessFlow();
	void DoFailFlow();
};
