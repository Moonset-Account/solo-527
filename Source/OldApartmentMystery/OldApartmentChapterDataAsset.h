#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "GameplayTagContainer.h"
#include "OldApartmentChapterDataAsset.generated.h"

USTRUCT(BlueprintType)
struct FChapterObjective
{
	GENERATED_BODY()

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	FName ObjectiveId;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	FText ObjectiveText;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	bool bIsMandatory;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	FGameplayTag RequiredTag;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	FText HintText;
};

USTRUCT(BlueprintType)
struct FChapterLevelConfig
{
	GENERATED_BODY()

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	TSoftObjectPtr<UWorld> PersistentLevel;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	TArray<TSoftObjectPtr<UWorld>> StreamedSublevels;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	FName PlayerStartTag;
};

UCLASS(BlueprintType)
class OLDAPARTMENTMYSTERY_API UDA_ChapterData : public UPrimaryDataAsset
{
	GENERATED_BODY()

public:
	UDA_ChapterData()
	{
		ChapterIndex = 0;
		ParTimeSeconds = 600;
		MaxScore = 1000;
		PerfectBonusScore = 300;
		MistakePenalty = 50;
		bAutoUnlocked = false;
	}

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	int32 ChapterIndex;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	FName ChapterId;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	FText ChapterTitle;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter", meta = (MultiLine = true))
	FText ChapterSynopsis;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	FText DateText;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	FText LocationText;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	TSoftObjectPtr<UTexture2D> ChapterImage;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	FChapterLevelConfig LevelConfig;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	TArray<FChapterObjective> Objectives;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	TArray<FName> RequiredClueIds;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	int32 ParTimeSeconds;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	int32 MaxScore;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	int32 PerfectBonusScore;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	int32 MistakePenalty;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	bool bAutoUnlocked;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	TArray<FName> PrerequisiteChapterIds;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter")
	FGameplayTagContainer ChapterTags;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter", meta = (MultiLine = true))
	FText EndingText;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter", meta = (MultiLine = true))
	FText GoodEndingText;

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Chapter", meta = (MultiLine = true))
	FText PerfectEndingText;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "Chapter")
	TArray<FText> GetMandatoryObjectiveTexts() const
	{
		TArray<FText> Result;
		for (const FChapterObjective& Obj : Objectives)
		{
			if (Obj.bIsMandatory) Result.Add(Obj.ObjectiveText);
		}
		return Result;
	}
};
