#pragma once

#include "CoreMinimal.h"
#include "GameFramework/SaveGame.h"
#include "OldApartmentSaveGame.generated.h"

USTRUCT(BlueprintType)
struct FClueRecord
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Clue")
	FName ClueId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Clue")
	FText Title;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Clue")
	FText Description;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Clue")
	FString AssociatedRoom;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Clue")
	FString AssociatedTenant;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Clue")
	bool bIsKeyItem;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Clue")
	int32 ChapterUnlocked;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Clue")
	TArray<FName> LinkedClueIds;
};

USTRUCT(BlueprintType)
struct FNoteEntry
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Note")
	FName NoteId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Note")
	FText Title;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Note")
	FText Content;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Note")
	TArray<FName> RelatedClueIds;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Note")
	FDateTime DiscoveryTime;
};

USTRUCT(BlueprintType)
struct FPlayerProgressData
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Progress")
	int32 CurrentChapterIndex;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Progress")
	TArray<FName> DiscoveredRoomIds;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Progress")
	TArray<FClueRecord> CollectedClues;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Progress")
	TArray<FNoteEntry> NotebookEntries;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Progress")
	TArray<FName> UnlockedAchievements;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Progress")
	TArray<FName> UnlockedGalleryItems;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Progress")
	TArray<int32> CompletedPuzzleIds;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Progress")
	int32 TotalPlayCount;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Progress")
	float TotalPlayTimeSeconds;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Progress")
	int32 HighScore;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Progress")
	int32 MistakesLifetime;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Progress")
	FDateTime LastPlayed;
};

UCLASS()
class OLDAPARTMENTMYSTERY_API UOldApartmentSaveGame : public USaveGame
{
	GENERATED_BODY()

public:
	UOldApartmentSaveGame();

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "SaveMeta")
	FString SaveSlotName;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "SaveMeta")
	int32 UserIndex;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "SaveMeta")
	FDateTime SaveTime;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "SaveMeta")
	int32 SaveVersion;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Game")
	FPlayerProgressData PlayerProgress;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Position")
	FVector PlayerWorldLocation;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Position")
	FRotator PlayerWorldRotation;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settings")
	float MasterVolume;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settings")
	float MusicVolume;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settings")
	float SFXVolume;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settings")
	float VoiceVolume;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settings")
	float AmbientVolume;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settings")
	float Brightness;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settings")
	float MouseSensitivity;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settings")
	float GamepadSensitivity;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settings")
	bool bSubtitlesEnabled;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settings")
	bool bInvertYAxis;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settings")
	bool bVibrationEnabled;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settings")
	bool bTutorialCompleted;
};
