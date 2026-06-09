#pragma once

#include "CoreMinimal.h"
#include "Engine/GameInstance.h"
#include "OldApartmentSaveGame.h"
#include "OldApartmentGameInstance.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSaveLoaded, UOldApartmentSaveGame*, LoadedSave);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSaveSaved, const FString&, SlotName);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnAchievementUnlocked, FName, AchievementId);

USTRUCT(BlueprintType)
struct FAchievementDefinition
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Achievement")
	FName AchievementId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Achievement")
	FText DisplayName;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Achievement")
	FText Description;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Achievement")
	FString IconPath;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Achievement")
	bool bIsHidden;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Achievement")
	int32 RewardScore;
};

USTRUCT(BlueprintType)
struct FLeaderboardEntry
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Leaderboard")
	FString PlayerName;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Leaderboard")
	int32 Score;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Leaderboard")
	float TimeSeconds;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Leaderboard")
	int32 Mistakes;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Leaderboard")
	FString Rank;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Leaderboard")
	FDateTime CompletionDate;
};

UCLASS()
class OLDAPARTMENTMYSTERY_API UOldApartmentGameInstance : public UGameInstance
{
	GENERATED_BODY()

public:
	UOldApartmentGameInstance();

	UPROPERTY(BlueprintAssignable, Category = "SaveSystem")
	FOnSaveLoaded OnSaveLoaded;

	UPROPERTY(BlueprintAssignable, Category = "SaveSystem")
	FOnSaveSaved OnSaveSaved;

	UPROPERTY(BlueprintAssignable, Category = "Achievements")
	FOnAchievementUnlocked OnAchievementUnlocked;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Achievements")
	TArray<FAchievementDefinition> AchievementDefinitions;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Leaderboard")
	TArray<FLeaderboardEntry> LocalLeaderboard;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "SaveSystem")
	UOldApartmentSaveGame* CurrentSaveData;

	UFUNCTION(BlueprintCallable, Category = "SaveSystem")
	UOldApartmentSaveGame* CreateNewSaveGame(const FString& SlotName, int32 InUserIndex = 0);

	UFUNCTION(BlueprintCallable, Category = "SaveSystem")
	bool SaveGameToSlot(const FString& SlotName, int32 InUserIndex = 0);

	UFUNCTION(BlueprintCallable, Category = "SaveSystem")
	UOldApartmentSaveGame* LoadGameFromSlot(const FString& SlotName, int32 InUserIndex = 0);

	UFUNCTION(BlueprintCallable, Category = "SaveSystem")
	bool DeleteSaveSlot(const FString& SlotName, int32 InUserIndex = 0);

	UFUNCTION(BlueprintCallable, Category = "SaveSystem")
	bool DoesSaveExist(const FString& SlotName, int32 InUserIndex = 0);

	UFUNCTION(BlueprintCallable, Category = "SaveSystem")
	TArray<FString> GetAllSaveSlots();

	UFUNCTION(BlueprintCallable, Category = "Achievements")
	bool UnlockAchievement(FName AchievementId);

	UFUNCTION(BlueprintPure, Category = "Achievements")
	bool IsAchievementUnlocked(FName AchievementId) const;

	UFUNCTION(BlueprintPure, Category = "Achievements")
	FAchievementDefinition GetAchievementDefinition(FName AchievementId) const;

	UFUNCTION(BlueprintCallable, Category = "Leaderboard")
	bool AddLeaderboardEntry(const FLeaderboardEntry& Entry);

	UFUNCTION(BlueprintPure, Category = "Leaderboard")
	TArray<FLeaderboardEntry> GetSortedLeaderboard(int32 MaxEntries = 20) const;

	UFUNCTION(BlueprintCallable, Category = "Leaderboard")
	void SaveLeaderboard();

	UFUNCTION(BlueprintCallable, Category = "Leaderboard")
	void LoadLeaderboard();

	UFUNCTION(BlueprintCallable, Category = "DailyChallenge")
	bool CheckDailyChallengeCompletion() const;

	UFUNCTION(BlueprintCallable, Category = "DailyChallenge")
	FString GetTodaysChallengeSeed();

	UFUNCTION(BlueprintCallable, Category = "Progress")
	void RegisterClueDiscovered(const FClueRecord& Clue);

	UFUNCTION(BlueprintCallable, Category = "Progress")
	void RegisterMistake();

	UFUNCTION(BlueprintCallable, Category = "Progress")
	void AddPlayTime(float DeltaSeconds);

protected:
	virtual void Init() override;
	virtual void Shutdown() override;

	void InitDefaultAchievements();
	void InitDefaultLeaderboard();
};
