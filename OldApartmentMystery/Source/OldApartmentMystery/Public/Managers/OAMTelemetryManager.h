// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "OAMTypes.h"
#include "OAMTelemetryManager.generated.h"

UENUM(BlueprintType)
enum class EOAMTelemetryEventType : uint8
{
	SessionStart,
	SessionEnd,
	ChapterStart,
	ChapterComplete,
	ItemCollected,
	ItemExamine,
	NoteRead,
	PuzzleAttempt,
	PuzzleSolved,
	DoorOpened,
	DoorUnlock,
	ObjectiveComplete,
	RoomEntered,
	ChoiceMade,
	DeathEvent
};

USTRUCT(BlueprintType)
struct FOAMTelemetryEvent
{
	GENERATED_BODY()
	UPROPERTY() EOAMTelemetryEventType Type = EOAMTelemetryEventType::SessionStart;
	UPROPERTY() float Timestamp = 0;
	UPROPERTY() FName ID;
	UPROPERTY() FString PayloadJSON;
};

UCLASS()
class OLDAPARTMENTMYSTERY_API UOAMTelemetryManager : public UObject
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void Initialize();

	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void BeginSession();

	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	FString FinalizeAndExport();

	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	bool DownloadJSONToSavedDir();

	/* ====== 记录函数 12+ 类 ====== */
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void RecordChapterStart(int32 ChapterID);
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void RecordChapterComplete(int32 ChapterID, float Seconds);
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void RecordItemCollected(FName ItemID, FVector Loc);
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void RecordItemExamine(FName ItemID, int32 HotspotIndex);
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void RecordNoteRead(FName NoteID);
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void RecordPuzzleAttempt(FName PuzzleID, const TArray<int32>& Guess, bool bCorrect);
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void RecordPuzzleSolved(FName PuzzleID, int32 Attempts, float Seconds);
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void RecordDoorOpened(FName DoorID);
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void RecordDoorUnlock(FName DoorID);
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void RecordObjectiveComplete(FName ObjectiveID);
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void RecordRoomEntered(FName RoomID);
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void RecordChoice(FName ChoiceID, int32 ChoiceValue);
	UFUNCTION(BlueprintCallable, Category = "OAM|Telemetry")
	void RecordDeath(FName Reason);

	UFUNCTION(BlueprintPure, Category = "OAM|Telemetry")
	int32 GetTotalFailures() const { return FailCount; }

	UFUNCTION(BlueprintPure, Category = "OAM|Telemetry")
	float GetElapsedSeconds() const { return FPlatformTime::Seconds() - SessionStartTime; }

	UFUNCTION(BlueprintPure, Category = "OAM|Telemetry")
	const TArray<FOAMTelemetryEvent>& GetEvents() const { return Events; }

private:
	double SessionStartTime = 0;
	int32 FailCount = 0;
	UPROPERTY()
	TArray<FOAMTelemetryEvent> Events;

	void AddEvent(EOAMTelemetryEventType T, FName ID, const FString& JSON = FString());
};
