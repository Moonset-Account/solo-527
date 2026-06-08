// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "OAMTypes.h"
#include "Data/OAMChapterData.h"
#include "OAMChapterManager.generated.h"

class UOAMGameInstance;

UCLASS()
class OLDAPARTMENTMYSTERY_API UOAMChapterManager : public UObject
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category = "OAM|Chapter")
	void Initialize();

	UFUNCTION(BlueprintCallable, Category = "OAM|Chapter")
	void StartChapter(int32 ChapterID);

	UFUNCTION(BlueprintCallable, Category = "OAM|Chapter")
	FName GetLevelForChapter(int32 ChapterID) const;

	UFUNCTION(BlueprintCallable, Category = "OAM|Chapter")
	bool OnObjectiveEvent(EOAMObjectiveCheck Type, FName Value, int32 Count = 1);

	UFUNCTION(BlueprintCallable, Category = "OAM|Chapter")
	bool IsChapterComplete(int32 ChapterID) const;

	UFUNCTION(BlueprintCallable, Category = "OAM|Chapter")
	void CheckChapterCompletion();

	UFUNCTION(BlueprintCallable, Category = "OAM|Chapter")
	void TriggerEndingDoor(FName DoorID);

	UFUNCTION(BlueprintCallable, Category = "OAM|Chapter")
	const TArray<int32>& GetUnlockedChapters() const { return UnlockedChapters; }

	UFUNCTION(BlueprintCallable, Category = "OAM|Chapter")
	const FOAMChapterRecord* GetChapterRecord(int32 ID) const;

	UFUNCTION(BlueprintCallable, Category = "OAM|Chapter")
	TArray<FText> GetCurrentChapterObjectiveTexts() const;

	UFUNCTION(BlueprintCallable, Category = "OAM|Chapter")
	float GetCurrentCompletionPercent() const;

	UPROPERTY(BlueprintAssignable, Category = "OAM|Chapter")
	FOAM_OnObjectiveChanged OnObjectiveCompleted;

	UPROPERTY(BlueprintAssignable, Category = "OAM|Chapter")
	FOAM_OnChapterCompleted OnChapterCompleted;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Chapter")
	int32 CurrentChapterID = 1;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Chapter")
	int32 TotalChapters = 3;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Chapter")
	TArray<FOAMChapterRecord> ChapterRecords;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Chapter")
	TMap<FName, bool> CompletedObjectives;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Chapter")
	int32 CollectedObjectiveCount = 0;

private:
	UPROPERTY()
	TArray<int32> UnlockedChapters = { 1 };

	UPROPERTY()
	TMap<int32, TSoftObjectPtr<UOAMChapterData>> ChapterDataMap;

	void LoadChapterDataAssets();
};
