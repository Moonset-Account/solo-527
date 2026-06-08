// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameStateBase.h"
#include "OAMTypes.h"
#include "OAMGameState.generated.h"

UCLASS()
class OLDAPARTMENTMYSTERY_API AOAMGameState : public AGameStateBase
{
	GENERATED_BODY()
public:
	AOAMGameState();

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Progress")
	TArray<FName> CollectedItemIDs;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Progress")
	TArray<FName> ReadNoteIDs;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Progress")
	TArray<FName> SolvedPuzzleIDs;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Progress")
	TArray<FName> OpenedDoorIDs;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Progress")
	TMap<FName, FName> LevelItemStates;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Time")
	float SessionPlayTimeSeconds = 0.f;

	virtual void Tick(float DeltaSeconds) override;

	UFUNCTION(BlueprintCallable, Category = "OAM|Progress")
	void AddCollectedItem(FName ItemID);

	UFUNCTION(BlueprintCallable, Category = "OAM|Progress")
	void AddReadNote(FName NoteID);

	UFUNCTION(BlueprintCallable, Category = "OAM|Progress")
	void AddSolvedPuzzle(FName PuzzleID);

	UFUNCTION(BlueprintCallable, Category = "OAM|Progress")
	void AddOpenedDoor(FName DoorID);

	UFUNCTION(BlueprintPure, Category = "OAM|Progress")
	bool HasItem(FName ItemID) const { return CollectedItemIDs.Contains(ItemID); }

	UFUNCTION(BlueprintPure, Category = "OAM|Progress")
	bool HasReadNote(FName NoteID) const { return ReadNoteIDs.Contains(NoteID); }

	UFUNCTION(BlueprintPure, Category = "OAM|Progress")
	bool HasSolvedPuzzle(FName PuzzleID) const { return SolvedPuzzleIDs.Contains(PuzzleID); }

	UFUNCTION(BlueprintPure, Category = "OAM|Progress")
	bool HasOpenedDoor(FName DoorID) const { return OpenedDoorIDs.Contains(DoorID); }

	UFUNCTION(BlueprintPure, Category = "OAM|Progress")
	FString FormatPlayTime() const;
};
