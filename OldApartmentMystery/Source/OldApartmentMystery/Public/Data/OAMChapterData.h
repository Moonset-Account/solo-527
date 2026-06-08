// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "OAMTypes.h"
#include "OAMChapterData.generated.h"

UCLASS(BlueprintType)
class OLDAPARTMENTMYSTERY_API UOAMChapterData : public UPrimaryDataAsset
{
	GENERATED_BODY()
public:
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	int32 ChapterID = 1;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FText ChapterSubtitle;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FText ChapterTitle;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, meta = (MultiLine="true")) FText Description;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FName LevelName;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	TArray<FName> RequiredItems;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	TSoftObjectPtr<USoundBase> AmbientSound;
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FLinearColor BGColorA = FLinearColor(0.15f, 0.1f, 0.08f);
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	FLinearColor BGColorB = FLinearColor(0.05f, 0.04f, 0.04f);
	UPROPERTY(EditAnywhere, BlueprintReadOnly)	TArray<FOAMChapterObjective> Objectives;
};
