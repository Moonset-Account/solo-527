// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Engine/DeveloperSettings.h"
#include "Data/OAMItemData.h"
#include "Data/OAMNoteData.h"
#include "Data/OAMPuzzleData.h"
#include "Data/OAMChapterData.h"
#include "Data/OAMLevelDataAsset.h"
#include "OAMTypes.h"
#include "OAMGameData.generated.h"

/**
 * 硬编码的游戏数据单例（开发者设置里可编辑）。
 * 不依赖 DataAsset，双击 .uproject 编译后就带完整内容。
 */
UCLASS(Config = Game, DefaultConfig, meta = (DisplayName = "OAM Game Data"))
class OLDAPARTMENTMYSTERY_API UOAMGameData : public UDeveloperSettings
{
	GENERATED_BODY()
public:
	/** 获取单例 */
	UFUNCTION(BlueprintPure, Category = "OAM|Data")
	static const UOAMGameData* Get();

	UFUNCTION(BlueprintPure, Category = "OAM|Data")
	static const UOAMItemData* FindItem(FName ItemID);

	UFUNCTION(BlueprintPure, Category = "OAM|Data")
	static const UOAMNoteData* FindNote(FName NoteID);

	UFUNCTION(BlueprintPure, Category = "OAM|Data")
	static const UOAMPuzzleData* FindPuzzle(FName PuzzleID);

	UFUNCTION(BlueprintPure, Category = "OAM|Data")
	static const UOAMChapterData* FindChapter(int32 ChapterID);

	UFUNCTION(BlueprintPure, Category = "OAM|Data")
	static const UOAMLevelDataAsset* FindLevel(FName LevelName);

	/** 所有可交互物品（22 件） */
	UPROPERTY(Config, EditAnywhere, BlueprintReadOnly, Category = "OAM|Items")
	TArray<FOAMItemDataRow> ItemRows;

	/** 所有笔记（6 篇） */
	UPROPERTY(Config, EditAnywhere, BlueprintReadOnly, Category = "OAM|Notes")
	TArray<FOAMNoteDataRow> NoteRows;

	/** 所有谜题（3 个） */
	UPROPERTY(Config, EditAnywhere, BlueprintReadOnly, Category = "OAM|Puzzles")
	TArray<FOAMPuzzleDataRow> PuzzleRows;

	/** 章节配置（3 章） */
	UPROPERTY(Config, EditAnywhere, BlueprintReadOnly, Category = "OAM|Chapters")
	TArray<FOAMChapterDataRow> ChapterRows;

	/** 关卡配置（3 关 + 主菜单） */
	UPROPERTY(Config, EditAnywhere, BlueprintReadOnly, Category = "OAM|Levels")
	TArray<FOAMLevelDataRow> LevelRows;

	/** 默认 SFX 路径映射（用于 UI 反馈文本，无资源也不崩） */
	UPROPERTY(Config, EditAnywhere, BlueprintReadOnly, Category = "OAM|Audio")
	TMap<FName, FString> SFXPathMap;

	/* ===================== 构造函数：完整填充默认数据 ===================== */
	UOAMGameData();

	/** 运行时缓存（不需要再创建 DataAsset） */
	UPROPERTY(Transient)
	mutable TMap<FName, UOAMItemData*> RuntimeItemCache;

	UPROPERTY(Transient)
	mutable TMap<FName, UOAMNoteData*> RuntimeNoteCache;

	UPROPERTY(Transient)
	mutable TMap<FName, UOAMPuzzleData*> RuntimePuzzleCache;

	UPROPERTY(Transient)
	mutable TMap<int32, UOAMChapterData*> RuntimeChapterCache;

	UPROPERTY(Transient)
	mutable TMap<FName, UOAMLevelDataAsset*> RuntimeLevelCache;

	/** 运行时构建/读取缓存的 DA 对象 */
	UOAMItemData* BuildOrGetItem(FName ID) const;
	UOAMNoteData* BuildOrGetNote(FName ID) const;
	UOAMPuzzleData* BuildOrGetPuzzle(FName ID) const;
	UOAMChapterData* BuildOrGetChapter(int32 ID) const;
	UOAMLevelDataAsset* BuildOrGetLevel(FName ID) const;
};

/* ================= 行结构（存到配置文件，编辑器可改） ================= */

USTRUCT(BlueprintType)
struct FOAMItemDataRow
{
	GENERATED_BODY()
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName ItemID;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FText DisplayName;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FText Description;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	bool bIsNote = false;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName LinkedNoteID;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName UnlocksDoorID;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	TArray<FString> ExamineTexts;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FLinearColor Color = FLinearColor(0.8f, 0.6f, 0.35f);
};

USTRUCT(BlueprintType)
struct FOAMNoteDataRow
{
	GENERATED_BODY()
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName NoteID;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FText Title;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FText Author;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FString DateStr;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	TArray<FString> Pages;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	int32 Mood = 0;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	bool bIsEvidence = false;
};

USTRUCT(BlueprintType)
struct FOAMPuzzleDataRow
{
	GENERATED_BODY()
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName PuzzleID;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FText DisplayName;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	int32 DigitCount = 4;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	TArray<int32> Password;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	int32 MaxAttempts = 3;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FText HintText;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FText FailFeedback;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FText OnSolveNarration;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName RewardItemID;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName UnlocksDoorID;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName RequiredKeyItemID;
};

USTRUCT(BlueprintType)
struct FOAMObjectiveRow
{
	GENERATED_BODY()
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName ObjectiveID;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FText Description;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	int32 CheckType = 0;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName CheckValue;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	int32 CheckCount = 0;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	bool bIsRequired = true;
};

USTRUCT(BlueprintType)
struct FOAMChapterDataRow
{
	GENERATED_BODY()
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	int32 ChapterID = 1;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FText Title;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FText Subtitle;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FText Description;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName LevelName;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	TArray<FOAMObjectiveRow> Objectives;
};

USTRUCT(BlueprintType)
struct FOAMItemSpawnRow
{
	GENERATED_BODY()
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName ItemID;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FVector2D Position = FVector2D(5, 5);
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName RoomID;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	bool bIsPuzzle = false;
};

USTRUCT(BlueprintType)
struct FOAMDoorRow
{
	GENERATED_BODY()
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName DoorID;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FVector2D Position = FVector2D(10, 5);
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FVector2D Size = FVector2D(1, 3);
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName ToLevel;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FVector2D ToSpawn = FVector2D(5, 5);
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName ToRoom;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	bool bLocked = false;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FName KeyItemID;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	FText DisplayName;
	UPROPERTY(Config, EditAnywhere, BlueprintReadWrite)	bool bIsEndingDoor = false;
};

USTRUCT(BlueprintType)
struct FOAMWallRow { GENERATED_BODY()
	UPROPERTY(Config, EditAnywhere) int32 X, Y, W, H; };

USTRUCT(BlueprintType)
struct FOAMFurnitureRow { GENERATED_BODY()
	UPROPERTY(Config, EditAnywhere) int32 X, Y, W, H;
	UPROPERTY(Config, EditAnywhere) FString Kind;
	UPROPERTY(Config, EditAnywhere) FLinearColor Color = FLinearColor(0.7f, 0.5f, 0.35f);
};

USTRUCT(BlueprintType)
struct FOAMRoomRow { GENERATED_BODY()
	UPROPERTY(Config, EditAnywhere) FName RoomID;
	UPROPERTY(Config, EditAnywhere) FText RoomName;
	UPROPERTY(Config, EditAnywhere) int32 X, Y, W, H;
	UPROPERTY(Config, EditAnywhere) bool bMicroStimulus = false;
};

USTRUCT(BlueprintType)
struct FOAMLevelDataRow
{
	GENERATED_BODY()
	UPROPERTY(Config, EditAnywhere)	FName LevelName;
	UPROPERTY(Config, EditAnywhere)	int32 ChapterID = 1;
	UPROPERTY(Config, EditAnywhere)	FVector2D GridSize = FVector2D(24, 18);
	UPROPERTY(Config, EditAnywhere)	TArray<FOAMWallRow> Walls;
	UPROPERTY(Config, EditAnywhere)	TArray<FOAMFurnitureRow> Furniture;
	UPROPERTY(Config, EditAnywhere)	TArray<FOAMItemSpawnRow> Items;
	UPROPERTY(Config, EditAnywhere)	TArray<FOAMDoorRow> Doors;
	UPROPERTY(Config, EditAnywhere)	TArray<FOAMRoomRow> Rooms;
	UPROPERTY(Config, EditAnywhere)	FVector2D SpawnPoint = FVector2D(5, 10);
};
