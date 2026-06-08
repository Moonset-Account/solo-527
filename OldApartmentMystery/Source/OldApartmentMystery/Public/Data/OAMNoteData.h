// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "OAMTypes.h"
#include "OAMNoteData.generated.h"

UCLASS(BlueprintType)
class OLDAPARTMENTMYSTERY_API UOAMNoteData : public UPrimaryDataAsset
{
	GENERATED_BODY()
public:
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FName NoteID;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FText Title;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FText Author;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FText DateStr;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	TArray<FOAMNotePage> Pages;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	EOAMNoteMood MoodTag = EOAMNoteMood::Neutral;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FName RelatedPuzzleID;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	bool bIsEvidence = false;
};
