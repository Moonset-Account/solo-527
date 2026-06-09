#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "GameplayTagContainer.h"
#include "OldApartmentSaveGame.h"
#include "OldApartmentClueDataAsset.generated.h"

UCLASS(BlueprintType)
class OLDAPARTMENTMYSTERY_API UDA_ClueItemData : public UPrimaryDataAsset
{
	GENERATED_BODY()

public:
	UDA_ClueItemData()
	{
		ClueId = NAME_None;
		SurfaceType = 0;
		bIsKeyItem = false;
		bRequiresOtherClue = false;
		bDestroyOnCollect = true;
	}

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	FName ClueId;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	FText Title;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue", meta = (MultiLine = true))
	FText Description;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	FText TenantName;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	FText RoomNumber;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	FText DateText;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	TSoftObjectPtr<UTexture2D> ClueImage;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	TSoftObjectPtr<UStaticMesh> DisplayMesh;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	FGameplayTagContainer ClueTags;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	FName RoomTag;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	int32 SurfaceType;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	bool bIsKeyItem;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	FName RequiredClueId;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	bool bRequiresOtherClue;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	FText HintText;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	int32 ScoreReward;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue")
	bool bDestroyOnCollect;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Clue|Examine")
	TArray<FVector> ExamineHotspots;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "Clue")
	FClueRecord ToClueRecord() const
	{
		FClueRecord Rec;
		Rec.ClueId = ClueId;
		Rec.Title = Title;
		Rec.Description = Description;
		Rec.RoomId = RoomTag;
		Rec.TenantName = TenantName;
		Rec.AssociatedRoom = RoomNumber.ToString();
		Rec.AssociatedTenant = TenantName.ToString();
		Rec.bIsKeyItem = bIsKeyItem;
		Rec.bDiscovered = false;
		return Rec;
	}
};
