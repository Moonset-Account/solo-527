// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "OAMTypes.h"
#include "OAMItemData.generated.h"

UCLASS(BlueprintType)
class OLDAPARTMENTMYSTERY_API UOAMItemData : public UPrimaryDataAsset
{
	GENERATED_BODY()
public:
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Identification")
	FName ItemID;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Identification")
	FText DisplayName;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Identification", meta = (MultiLine = "true"))
	FText Description;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Visual")
	TSoftObjectPtr<class UTexture2D> Icon;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Visual")
	TSoftObjectPtr<class UStaticMesh> WorldMesh;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Visual")
	FLinearColor TintColor = FLinearColor::White;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Behavior")
	bool bIsPickable = true;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Behavior")
	bool bIsNote = false;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Behavior")
	TSoftObjectPtr<class UOAMNoteData> LinkedNote;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Behavior")
	FName RequiredItemForInteraction;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Behavior")
	FName UnlocksDoorID;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Examine")
	TArray<FText> ExamineFlavorTexts;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Examine")
	TArray<FVector2D> HotspotPositions;
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Examine")
	TArray<FText> HotspotTexts;
};
