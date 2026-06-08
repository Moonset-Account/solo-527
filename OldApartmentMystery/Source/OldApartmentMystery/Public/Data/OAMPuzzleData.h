// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "OAMTypes.h"
#include "OAMPuzzleData.generated.h"

UCLASS(BlueprintType)
class OLDAPARTMENTMYSTERY_API UOAMPuzzleData : public UPrimaryDataAsset
{
	GENERATED_BODY()
public:
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FName PuzzleID;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FText DisplayName;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	EOAMLockType LockType = EOAMLockType::DigitLock;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	int32 DigitCount = 4;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	TArray<int32> Password;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, meta = (MultiLine="true")) FText HintText;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, meta = (MultiLine="true")) FText FailFeedback;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, meta = (MultiLine="true")) FText OnSolveNarration;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	int32 MaxAttempts = 3;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	float ShakeOnFail = 1.f;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FName RewardItemID;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FName UnlocksDoorID;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FName RequiredKeyItemID;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	TSoftObjectPtr<USoundBase> LockSoundLoop;
};
