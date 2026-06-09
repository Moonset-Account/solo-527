// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.
// =========================================================================
// OAMBootstrapData —— 所有游戏内容的代码级硬编码数据源
//   - 当 Content 目录下的 .uasset DataAsset 缺失时，由本类提供内存数据
//   - 启动流程：GameInstance.Init() → OAMBootstrapData::Get() → 注册所有硬编码条目
// =========================================================================

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "OAMTypes.h"
#include "OAMBootstrapData.generated.h"

class UOAMItemData;
class UOAMNoteData;
class UOAMPuzzleData;
class UOAMChapterData;
class UOAMLevelDataAsset;

UCLASS()
class OLDAPARTMENTMYSTERY_API UOAMBootstrapData : public UObject
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category = "OAM|Bootstrap")
	static UOAMBootstrapData* Get();

	UFUNCTION(BlueprintCallable, Category = "OAM|Bootstrap")
	void EnsureAllDataBuilt(UObject* OuterForNewObjects);

	/* -------- 查询 API -------- */
	UFUNCTION(BlueprintPure, Category = "OAM|Bootstrap")
	UOAMItemData* GetItem(FName ID) const;
	UFUNCTION(BlueprintPure, Category = "OAM|Bootstrap")
	UOAMNoteData* GetNote(FName ID) const;
	UFUNCTION(BlueprintPure, Category = "OAM|Bootstrap")
	UOAMPuzzleData* GetPuzzle(FName ID) const;
	UFUNCTION(BlueprintPure, Category = "OAM|Bootstrap")
	UOAMChapterData* GetChapter(int32 ID) const;
	UFUNCTION(BlueprintPure, Category = "OAM|Bootstrap")
	UOAMLevelDataAsset* GetLevel(FName LevelName) const;

	UFUNCTION(BlueprintPure, Category = "OAM|Bootstrap")
	TArray<UOAMItemData*> GetAllItems() const;
	UFUNCTION(BlueprintPure, Category = "OAM|Bootstrap")
	TArray<FName> GetAllItemIDs() const;

protected:
	void BuildAllItems();
	void BuildAllNotes();
	void BuildAllPuzzles();
	void BuildAllChapters();
	void BuildAllLevels();

private:
	static UOAMBootstrapData* Singleton;
	UPROPERTY() TObjectPtr<UObject> BuildOuter;

	UPROPERTY() TMap<FName, TObjectPtr<UOAMItemData>> Items;
	UPROPERTY() TMap<FName, TObjectPtr<UOAMNoteData>> Notes;
	UPROPERTY() TMap<FName, TObjectPtr<UOAMPuzzleData>> Puzzles;
	UPROPERTY() TMap<int32, TObjectPtr<UOAMChapterData>> Chapters;
	UPROPERTY() TMap<FName, TObjectPtr<UOAMLevelDataAsset>> Levels;

	TMap<FName, TArray<FText>> ExamineCache;
	TMap<FName, TArray<FOAMNotePage>> NotePageCache;
	TMap<FName, TArray<int32>> PuzzlePasswordCache;
	TMap<int32, TArray<FOAMChapterObjective>> ChapterObjectiveCache;

	FText _T(const FString& S) const { return FText::FromString(S); }
	FLinearColor C(float R, float G, float B, float A = 1) const { return FLinearColor(R, G, B, A); }

	UOAMItemData* MakeItem(FName ID, const FString& Name, const FString& Desc,
		bool bPickable = true, bool bNote = false, FName LinkedNote = NAME_None,
		FName UnlockDoor = NAME_None, FName RequiredItem = NAME_None,
		const TArray<FText>& Examine = {},
		const TArray<FVector2D>& Hotspots = {}, const TArray<FText>& HotspotTexts = {});

	UOAMNoteData* MakeNote(FName ID, const FString& Title, const FString& Author,
		const FString& Date, EOAMNoteMood Mood, const TArray<FOAMNotePage>& Pages,
		FName RelatedPuzzle = NAME_None, bool bEvidence = false);

	UOAMPuzzleData* MakePuzzle(FName ID, const FString& Name, EOAMLockType LockType,
		int32 Digits, const TArray<int32>& Pwd,
		const FString& Hint, const FString& Fail, const FString& OnSolve,
		int32 MaxAttempts, FName RewardItem, FName UnlockDoor, FName ReqKey);

	UOAMChapterData* MakeChapter(int32 ID, const FString& Title, const FString& Sub,
		const FString& Desc, FName LevelName,
		const FLinearColor& A, const FLinearColor& B,
		const TArray<FName>& ReqItems, const TArray<FOAMChapterObjective>& Objs);

	UOAMLevelDataAsset* MakeLevel(FName Name, const FString& Display, int32 Chapter,
		FVector2D Grid, const TArray<FOAMWallRect>& Walls,
		const TArray<FOAMFloorZone>& Zones, const TArray<FVector2D>& Furn,
		const TArray<FOAMLevelItemSpawn>& Items,
		const TArray<FOAMLevelDoor>& Doors, const TArray<FOAMRoomTrigger>& Rooms,
		FVector2D Spawn, const FLinearColor& Fog);
};
