// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Core/OAMGameState.h"

AOAMGameState::AOAMGameState()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.bStartWithTickEnabled = true;
}

void AOAMGameState::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);
	SessionPlayTimeSeconds += DeltaSeconds;
}

void AOAMGameState::AddCollectedItem(FName ItemID)
{
	if (!CollectedItemIDs.Contains(ItemID)) CollectedItemIDs.Add(ItemID);
}

void AOAMGameState::AddReadNote(FName NoteID)
{
	if (!ReadNoteIDs.Contains(NoteID)) ReadNoteIDs.Add(NoteID);
}

void AOAMGameState::AddSolvedPuzzle(FName PuzzleID)
{
	if (!SolvedPuzzleIDs.Contains(PuzzleID)) SolvedPuzzleIDs.Add(PuzzleID);
}

void AOAMGameState::AddOpenedDoor(FName DoorID)
{
	if (!OpenedDoorIDs.Contains(DoorID)) OpenedDoorIDs.Add(DoorID);
}

FString AOAMGameState::FormatPlayTime() const
{
	int32 TotalSec = FMath::FloorToInt(SessionPlayTimeSeconds);
	int32 H = TotalSec / 3600;
	int32 M = (TotalSec % 3600) / 60;
	int32 S = TotalSec % 60;
	if (H > 0) return FString::Printf(TEXT("%d小時 %02d分 %02d秒"), H, M, S);
	return FString::Printf(TEXT("%02d分 %02d秒"), M, S);
}
