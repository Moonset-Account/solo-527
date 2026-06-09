#include "OldApartmentGameInstance.h"
#include "Kismet/GameplayStatics.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"
#include "Policies/CondensedJsonPrintPolicy.h"

UOldApartmentGameInstance::UOldApartmentGameInstance()
{
	CurrentSaveData = nullptr;
}

void UOldApartmentGameInstance::Init()
{
	Super::Init();
	InitDefaultAchievements();
	InitDefaultLeaderboard();
	LoadLeaderboard();
}

void UOldApartmentGameInstance::Shutdown()
{
	SaveLeaderboard();
	Super::Shutdown();
}

void UOldApartmentGameInstance::InitDefaultAchievements()
{
	AchievementDefinitions.Empty();

	auto AddAch = [this](FName Id, FText Name, FText Desc, int32 Score, bool bHidden = false) {
		FAchievementDefinition Def;
		Def.AchievementId = Id;
		Def.DisplayName = Name;
		Def.Description = Desc;
		Def.RewardScore = Score;
		Def.bIsHidden = bHidden;
		AchievementDefinitions.Add(Def);
	};

	AddAch(ACH_FirstStep,
		FText::FromString("初入公寓"),
		FText::FromString("进入公寓大堂，开始探索"), 50);

	AddAch(ACH_ClueHunter,
		FText::FromString("线索猎人"),
		FText::FromString("收集10条线索"), 100);

	AddAch(ACH_PuzzleMaster,
		FText::FromString("谜题大师"),
		FText::FromString("解开第一个锁谜题"), 150);

	AddAch(ACH_NoMistakes,
		FText::FromString("完美推理"),
		FText::FromString("无失误完成一个章节"), 300);

	AddAch(ACH_SpeedRunner,
		FText::FromString("疾风侦探"),
		FText::FromString("在10分钟内完成一个章节"), 200);

	AddAch(ACH_Completionist,
		FText::FromString("探索狂人"),
		FText::FromString("发现所有房间"), 250);

	AddAch(ACH_FirstCase,
		FText::FromString("首个案件"),
		FText::FromString("完成第一章"), 100);

	AddAch(ACH_SecretRoom,
		FText::FromString("密室发现者"),
		FText::FromString("进入隐藏房间"), 500, true);

	AddAch(ACH_AllEndings,
		FText::FromString("真相全貌"),
		FText::FromString("解锁所有结局"), 1000, true);

	AddAch(ACH_DailyPlayer,
		FText::FromString("每日挑战"),
		FText::FromString("完成每日挑战一次"), 150);
}

void UOldApartmentGameInstance::InitDefaultLeaderboard()
{
}

UOldApartmentSaveGame* UOldApartmentGameInstance::CreateNewSaveGame(const FString& SlotName, int32 InUserIndex)
{
	CurrentSaveData = Cast<UOldApartmentSaveGame>(UGameplayStatics::CreateSaveGameObject(UOldApartmentSaveGame::StaticClass()));
	if (CurrentSaveData)
	{
		CurrentSaveData->SaveSlotName = SlotName;
		CurrentSaveData->UserIndex = InUserIndex;
		CurrentSaveData->SaveTime = FDateTime::Now();
		CurrentSaveData->PlayerProgress.LastPlayed = FDateTime::Now();
		return CurrentSaveData;
	}
	return nullptr;
}

bool UOldApartmentGameInstance::SaveGameToSlot(const FString& SlotName, int32 InUserIndex)
{
	if (!CurrentSaveData)
	{
		CurrentSaveData = CreateNewSaveGame(SlotName, InUserIndex);
	}
	if (!CurrentSaveData) return false;

	CurrentSaveData->SaveTime = FDateTime::Now();
	CurrentSaveData->PlayerProgress.LastPlayed = FDateTime::Now();
	bool bSuccess = UGameplayStatics::SaveGameToSlot(CurrentSaveData, SlotName, InUserIndex);
	if (bSuccess)
	{
		OnSaveSaved.Broadcast(SlotName);
	}
	return bSuccess;
}

UOldApartmentSaveGame* UOldApartmentGameInstance::LoadGameFromSlot(const FString& SlotName, int32 InUserIndex)
{
	UOldApartmentSaveGame* Loaded = Cast<UOldApartmentSaveGame>(UGameplayStatics::LoadGameFromSlot(SlotName, InUserIndex));
	if (Loaded)
	{
		CurrentSaveData = Loaded;
		OnSaveLoaded.Broadcast(Loaded);
		return Loaded;
	}
	return nullptr;
}

bool UOldApartmentGameInstance::DeleteSaveSlot(const FString& SlotName, int32 InUserIndex)
{
	return UGameplayStatics::DeleteGameInSlot(SlotName, InUserIndex);
}

bool UOldApartmentGameInstance::DoesSaveExist(const FString& SlotName, int32 InUserIndex)
{
	return UGameplayStatics::DoesSaveGameExist(SlotName, InUserIndex);
}

TArray<FString> UOldApartmentGameInstance::GetAllSaveSlots()
{
	TArray<FString> Slots;
	for (int32 i = 0; i < 10; i++)
	{
		FString Slot = FString::Printf(TEXT("Save_%02d"), i);
		if (DoesSaveExist(Slot, 0))
		{
			Slots.Add(Slot);
		}
	}
	return Slots;
}

bool UOldApartmentGameInstance::UnlockAchievement(FName AchievementId)
{
	if (!CurrentSaveData) return false;
	if (IsAchievementUnlocked(AchievementId)) return false;

	CurrentSaveData->PlayerProgress.UnlockedAchievements.Add(AchievementId);
	OnAchievementUnlocked.Broadcast(AchievementId);
	FAchievementDefinition Def = GetAchievementDefinition(AchievementId);
	if (Def.RewardScore > 0)
	{
		CurrentSaveData->PlayerProgress.HighScore += Def.RewardScore;
	}
	return true;
}

bool UOldApartmentGameInstance::IsAchievementUnlocked(FName AchievementId) const
{
	return CurrentSaveData ? CurrentSaveData->PlayerProgress.UnlockedAchievements.Contains(AchievementId) : false;
}

FAchievementDefinition UOldApartmentGameInstance::GetAchievementDefinition(FName AchievementId) const
{
	for (const FAchievementDefinition& Def : AchievementDefinitions)
	{
		if (Def.AchievementId == AchievementId) return Def;
	}
	return FAchievementDefinition();
}

bool UOldApartmentGameInstance::AddLeaderboardEntry(const FLeaderboardEntry& Entry)
{
	LocalLeaderboard.Add(Entry);
	LocalLeaderboard.Sort([](const FLeaderboardEntry& A, const FLeaderboardEntry& B) {
		return A.Score > B.Score;
	});
	while (LocalLeaderboard.Num() > 100) LocalLeaderboard.Pop();
	return true;
}

TArray<FLeaderboardEntry> UOldApartmentGameInstance::GetSortedLeaderboard(int32 MaxEntries) const
{
	TArray<FLeaderboardEntry> Sorted = LocalLeaderboard;
	Sorted.Sort([](const FLeaderboardEntry& A, const FLeaderboardEntry& B) {
		return A.Score > B.Score;
	});
	if (Sorted.Num() > MaxEntries) Sorted.SetNum(MaxEntries);
	return Sorted;
}

void UOldApartmentGameInstance::SaveLeaderboard()
{
	TArray<TSharedPtr<FJsonValue>> JsonArray;
	for (const FLeaderboardEntry& Entry : LocalLeaderboard)
	{
		TSharedPtr<FJsonObject> Obj = MakeShared<FJsonObject>();
		Obj->SetStringField(TEXT("PlayerName"), Entry.PlayerName);
		Obj->SetNumberField(TEXT("Score"), Entry.Score);
		Obj->SetNumberField(TEXT("Time"), Entry.TimeSeconds);
		Obj->SetNumberField(TEXT("Mistakes"), Entry.Mistakes);
		Obj->SetStringField(TEXT("Rank"), Entry.Rank);
		Obj->SetStringField(TEXT("Date"), Entry.CompletionDate.ToString());
		JsonArray.Add(MakeShared<FJsonValueObject>(Obj));
	}
	TSharedRef<FJsonObject> Root = MakeShared<FJsonObject>();
	Root->SetArrayField(TEXT("Leaderboard"), JsonArray);

	FString JsonStr;
	TSharedRef<TJsonWriter<TCHAR, TCondensedJsonPrintPolicy<TCHAR>>> Writer = TJsonWriterFactory<TCHAR, TCondensedJsonPrintPolicy<TCHAR>>::Create(&JsonStr);
	FJsonSerializer::Serialize(Root, Writer);

	FFileHelper::SaveStringToFile(JsonStr, *FPaths::ProjectSavedDir() / TEXT("Leaderboard.json"));
}

void UOldApartmentGameInstance::LoadLeaderboard()
{
	FString JsonStr;
	if (!FFileHelper::LoadFileToString(JsonStr, *FPaths::ProjectSavedDir() / TEXT("Leaderboard.json"))) return;

	TSharedPtr<FJsonObject> Root;
	TSharedRef<TJsonReader<TCHAR>> Reader = TJsonReaderFactory<TCHAR>::Create(JsonStr);
	if (!FJsonSerializer::Deserialize(Reader, Root)) return;

	const TArray<TSharedPtr<FJsonValue>>* JsonArray;
	if (!Root->TryGetArrayField(TEXT("Leaderboard"), JsonArray)) return;

	LocalLeaderboard.Empty();
	for (const TSharedPtr<FJsonValue>& Val : *JsonArray)
	{
		const TSharedPtr<FJsonObject>* Obj;
		if (!Val->TryGetObject(Obj)) continue;
		FLeaderboardEntry Entry;
		Entry.PlayerName = (*Obj)->GetStringField(TEXT("PlayerName"));
		Entry.Score = (*Obj)->GetIntegerField(TEXT("Score"));
		Entry.TimeSeconds = (*Obj)->GetNumberField(TEXT("Time"));
		Entry.Mistakes = (*Obj)->GetIntegerField(TEXT("Mistakes"));
		Entry.Rank = (*Obj)->GetStringField(TEXT("Rank"));
		FDateTime::Parse((*Obj)->GetStringField(TEXT("Date")), Entry.CompletionDate);
		LocalLeaderboard.Add(Entry);
	}
}

bool UOldApartmentGameInstance::CheckDailyChallengeCompletion() const
{
	if (!CurrentSaveData) return false;
	FDateTime Last = CurrentSaveData->PlayerProgress.LastPlayed;
	FDateTime Today = FDateTime::Now();
	return Last.GetYear() == Today.GetYear()
		&& Last.GetMonth() == Today.GetMonth()
		&& Last.GetDay() == Today.GetDay();
}

FString UOldApartmentGameInstance::GetTodaysChallengeSeed()
{
	FDateTime Today = FDateTime::Now();
	return FString::Printf(TEXT("%04d%02d%02d_OldApartment"),
		Today.GetYear(), Today.GetMonth(), Today.GetDay());
}

void UOldApartmentGameInstance::RegisterClueDiscovered(const FClueRecord& Clue)
{
	if (!CurrentSaveData) return;
	bool bExists = false;
	for (const FClueRecord& Existing : CurrentSaveData->PlayerProgress.CollectedClues)
	{
		if (Existing.ClueId == Clue.ClueId) { bExists = true; break; }
	}
	if (!bExists)
	{
		CurrentSaveData->PlayerProgress.CollectedClues.Add(Clue);
	}
}

void UOldApartmentGameInstance::RegisterMistake()
{
	if (!CurrentSaveData) return;
	CurrentSaveData->PlayerProgress.MistakesLifetime++;
}

void UOldApartmentGameInstance::AddPlayTime(float DeltaSeconds)
{
	if (!CurrentSaveData) return;
	CurrentSaveData->PlayerProgress.TotalPlayTimeSeconds += DeltaSeconds;
}
