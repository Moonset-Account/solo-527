// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Engine/EngineTypes.h"
#include "Kismet/BlueprintTypeConversions.h"
#include "UObject/NoExportTypes.h"
#include "OAMTypes.generated.h"

/* =========================================================================
 * 枚举 Enums
 * ========================================================================= */

UENUM(BlueprintType)
enum class EOAMInputMode : uint8
{
	Exploration		UMETA(DisplayName = "探索"),
	UI				UMETA(DisplayName = "UI交互"),
	Puzzle			UMETA(DisplayName = "解谜中"),
	Examine			UMETA(DisplayName = "检查物品")
};

UENUM(BlueprintType)
enum class EOAMNoteMood : uint8
{
	Neutral		UMETA(DisplayName = "普通"),
	Tense		UMETA(DisplayName = "紧张"),
	Somber		UMETA(DisplayName = "忧郁"),
	Urgent		UMETA(DisplayName = "紧急"),
	Cryptic		UMETA(DisplayName = "神秘")
};

UENUM(BlueprintType)
enum class EOAMObjectiveCheck : uint8
{
	CollectItem		UMETA(DisplayName = "收集物品"),
	SolvePuzzle		UMETA(DisplayName = "解开谜题"),
	EnterRoom		UMETA(DisplayName = "进入房间"),
	ReadNote		UMETA(DisplayName = "阅读笔记"),
	ExamineItem		UMETA(DisplayName = "检查物品"),
	CollectCount	UMETA(DisplayName = "收集数量")
};

UENUM(BlueprintType)
enum class EOAMLockType : uint8
{
	DigitLock		UMETA(DisplayName = "数字密码锁"),
	PatternLock		UMETA(DisplayName = "方向图案锁")
};

UENUM(BlueprintType)
enum class EOAMToastType : uint8
{
	Info,
	Success,
	Warning,
	Error
};

/* =========================================================================
 * 结构体 Structs
 * ========================================================================= */

USTRUCT(BlueprintType)
struct FOAMNotePage
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)	FText PageText;
	UPROPERTY(EditAnywhere, BlueprintReadWrite)	bool bHasDrawing = false;
	UPROPERTY(EditAnywhere, BlueprintReadWrite)	TSoftObjectPtr<class UTexture2D> DrawingImage;
};

USTRUCT(BlueprintType)
struct FOAMChapterObjective
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite)	FName ObjectiveID;
	UPROPERTY(EditAnywhere, BlueprintReadWrite)	FText Description;
	UPROPERTY(EditAnywhere, BlueprintReadWrite)	bool bIsRequired = true;
	UPROPERTY(EditAnywhere, BlueprintReadWrite)	EOAMObjectiveCheck CheckType = EOAMObjectiveCheck::CollectItem;
	UPROPERTY(EditAnywhere, BlueprintReadWrite)	FName CheckValue;
	UPROPERTY(EditAnywhere, BlueprintReadWrite)	int32 CheckCount = 0;
};

USTRUCT(BlueprintType)
struct FOAMWallRect
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere) int32 X = 0, Y = 0, W = 1, H = 1;
};

USTRUCT(BlueprintType)
struct FOAMFloorZone
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere) FName ZoneID;
	UPROPERTY(EditAnywhere) FString Name;
	UPROPERTY(EditAnywhere) int32 X, Y, W, H;
	UPROPERTY(EditAnywhere) FLinearColor Color = FLinearColor(0.45f, 0.33f, 0.22f);
};

USTRUCT(BlueprintType)
struct FOAMLevelItemSpawn
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere) FName ItemID;
	UPROPERTY(EditAnywhere) FVector2D Position;
	UPROPERTY(EditAnywhere) FName RoomID;
	UPROPERTY(EditAnywhere) bool bIsPuzzle = false;
	UPROPERTY(EditAnywhere) bool bHiddenByDefault = false;
	UPROPERTY(EditAnywhere) FName UnlockConditionItem;
};

USTRUCT(BlueprintType)
struct FOAMLevelDoor
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere) FName DoorID;
	UPROPERTY(EditAnywhere) FVector2D Position;
	UPROPERTY(EditAnywhere) FVector2D Size = FVector2D(1, 3);
	UPROPERTY(EditAnywhere) FName ToLevel;
	UPROPERTY(EditAnywhere) FVector2D ToSpawn;
	UPROPERTY(EditAnywhere) FName ToRoom;
	UPROPERTY(EditAnywhere) bool bLocked = false;
	UPROPERTY(EditAnywhere) FName KeyItemID;
	UPROPERTY(EditAnywhere) FText DisplayName;
	UPROPERTY(EditAnywhere) bool bIsEndingDoor = false;
};

USTRUCT(BlueprintType)
struct FOAMRoomTrigger
{
	GENERATED_BODY()
	UPROPERTY(EditAnywhere) FName RoomID;
	UPROPERTY(EditAnywhere) FIntRect Rect;
	UPROPERTY(EditAnywhere) FText RoomName;
};

/* =========================================================================
 * 遥测 Telemetry 结构
 * ========================================================================= */

USTRUCT(BlueprintType)
struct FOAMChoiceRecord
{
	GENERATED_BODY()
	UPROPERTY() FName ChoiceID;
	UPROPERTY() FText Description;
	UPROPERTY() int32 ChoiceMade = 0;
	UPROPERTY() float Timestamp = 0;
};

USTRUCT(BlueprintType)
struct FOAMChapterRecord
{
	GENERATED_BODY()
	UPROPERTY() int32 ChapterID = 0;
	UPROPERTY() float StartTime = 0;
	UPROPERTY() float CompletionSeconds = 0;
	UPROPERTY() bool bCompleted = false;
	UPROPERTY() TArray<FName> ItemsCollected;
	UPROPERTY() TArray<FName> NotesRead;
	UPROPERTY() TMap<FName, int32> PuzzleAttempts;
	UPROPERTY() TArray<FName> PuzzlesSolved;
	UPROPERTY() TArray<FName> DoorsOpened;
	UPROPERTY() int32 FailCount = 0;
};

USTRUCT(BlueprintType)
struct FOAMGameSettings
{
	GENERATED_BODY()
	UPROPERTY() float MasterVolume = 1.f;
	UPROPERTY() float SFXVolume = 1.f;
	UPROPERTY() float AmbientVolume = 0.8f;
	UPROPERTY() float UIVolume = 1.f;
	UPROPERTY() float Brightness = 1.f;
	UPROPERTY() float MouseSensitivity = 1.f;
	UPROPERTY() float FOV = 75.f;
	UPROPERTY() int32 AutoSaveMinutes = 5;
	UPROPERTY() bool bFilmGrain = true;
	UPROPERTY() bool bVignette = true;
	UPROPERTY() bool bHintsEnabled = true;
	UPROPERTY() bool bSubtitlesEnabled = true;
};

USTRUCT(BlueprintType)
struct FOAMSaveSlot
{
	GENERATED_BODY()
	UPROPERTY() int32 SlotIndex = 0;
	UPROPERTY() int64 SaveTimeTicks = 0;
	UPROPERTY() int32 ChapterID = 1;
	UPROPERTY() FName LevelName;
	UPROPERTY() float PlayTimeSeconds = 0;
	UPROPERTY() TArray<FName> CollectedItems;
	UPROPERTY() TArray<FName> ReadNotes;
	UPROPERTY() TArray<FName> SolvedPuzzles;
	UPROPERTY() TArray<FName> OpenedDoors;
	UPROPERTY() FTransform PlayerTransform;
	UPROPERTY() TArray<FName> CompletedObjectives;
	UPROPERTY() TArray<int32> UnlockedChapters;
	UPROPERTY() FOAMGameSettings SettingsSnapshot;
};

/* =========================================================================
 * 委托 Delegates
 * ========================================================================= */

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOAM_OnObjectiveChanged, const FOAMChapterObjective&, Objective);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOAM_OnInputModeChanged, EOAMInputMode, NewMode);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOAM_OnPuzzleResult, FName, PuzzleID, bool, bSolved);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOAM_OnChapterCompleted, int32, ChapterID);
