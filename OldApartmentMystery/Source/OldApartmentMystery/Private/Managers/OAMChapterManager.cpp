// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Managers/OAMChapterManager.h"
#include "Core/OAMGameInstance.h"
#include "Core/OAMGameState.h"
#include "Managers/OAMTelemetryManager.h"
#include "Data/OAMChapterData.h"
#include "Kismet/GameplayStatics.h"

void UOAMChapterManager::Initialize()
{
	LoadChapterDataAssets();
	ChapterRecords.SetNum(TotalChapters);
	for (int32 i = 0; i < TotalChapters; ++i)
	{
		ChapterRecords[i].ChapterID = i + 1;
	}
	UnlockedChapters = { 1 };
}

void UOAMChapterManager::LoadChapterDataAssets()
{
	for (int32 i = 1; i <= TotalChapters; ++i)
	{
		ChapterDataMap.Add(i, TSoftObjectPtr<UOAMChapterData>(FSoftObjectPath(
			FString::Printf(TEXT("/Game/Data/Chapters/DA_Chapter%d.DA_Chapter%d"), i, i))));
	}
}

void UOAMChapterManager::StartChapter(int32 ChapterID)
{
	CurrentChapterID = FMath::Clamp(ChapterID, 1, TotalChapters);
	CompletedObjectives.Empty();
	CollectedObjectiveCount = 0;

	const int32 Idx = CurrentChapterID - 1;
	if (ChapterRecords.IsValidIndex(Idx))
	{
		ChapterRecords[Idx].StartTime = UGameplayStatics::GetRealTimeSeconds(GWorld ? GWorld : nullptr);
		ChapterRecords[Idx].bCompleted = false;
	}

	if (auto* GI = Cast<UOAMGameInstance>(GetOuter()))
	{
		if (GI->Telemetry) GI->Telemetry->RecordChapterStart(CurrentChapterID);
	}
}

FName UOAMChapterManager::GetLevelForChapter(int32 ChapterID) const
{
	auto* It = ChapterDataMap.Find(ChapterID);
	if (!It) return NAME_None;
	if (const UOAMChapterData* D = It->LoadSynchronous()) return D->LevelName;
	return FName(*FString::Printf(TEXT("Chapter%d"), ChapterID));
}

bool UOAMChapterManager::OnObjectiveEvent(EOAMObjectiveCheck Type, FName Value, int32 Count)
{
	auto* It = ChapterDataMap.Find(CurrentChapterID);
	if (!It) return false;
	const UOAMChapterData* CD = It->LoadSynchronous();
	if (!CD) return false;

	bool AnyCompleted = false;

	for (const FOAMChapterObjective& Obj : CD->Objectives)
	{
		if (CompletedObjectives.Contains(Obj.ObjectiveID)) continue;
		if (Obj.CheckType != Type) continue;

		bool Match = false;
		switch (Type)
		{
		case EOAMObjectiveCheck::CollectCount:
			CollectedObjectiveCount += Count;
			Match = CollectedObjectiveCount >= Obj.CheckCount;
			break;
		case EOAMObjectiveCheck::CollectItem:
		case EOAMObjectiveCheck::SolvePuzzle:
		case EOAMObjectiveCheck::EnterRoom:
		case EOAMObjectiveCheck::ReadNote:
		case EOAMObjectiveCheck::ExamineItem:
		default:
			Match = Obj.CheckValue == Value;
			break;
		}

		if (Match)
		{
			CompletedObjectives.Add(Obj.ObjectiveID, true);
			OnObjectiveCompleted.Broadcast(Obj);

			const int32 Idx = CurrentChapterID - 1;
			if (ChapterRecords.IsValidIndex(Idx))
			{
				switch (Type)
				{
				case EOAMObjectiveCheck::CollectItem: ChapterRecords[Idx].ItemsCollected.Add(Value); break;
				case EOAMObjectiveCheck::ReadNote:    ChapterRecords[Idx].NotesRead.Add(Value); break;
				case EOAMObjectiveCheck::SolvePuzzle: ChapterRecords[Idx].PuzzlesSolved.Add(Value); break;
				default: break;
				}
			}
			AnyCompleted = true;

			if (auto* GI = Cast<UOAMGameInstance>(GetOuter()))
			{
				if (GI->Telemetry) GI->Telemetry->RecordObjectiveComplete(Obj.ObjectiveID);
			}
		}
	}

	CheckChapterCompletion();
	return AnyCompleted;
}

bool UOAMChapterManager::IsChapterComplete(int32 ChapterID) const
{
	auto* It = ChapterDataMap.Find(ChapterID);
	if (!It) return false;
	const UOAMChapterData* CD = It->LoadSynchronous();
	if (!CD) return false;

	for (const FOAMChapterObjective& Obj : CD->Objectives)
	{
		if (Obj.bIsRequired && !CompletedObjectives.Contains(Obj.ObjectiveID)) return false;
	}
	return true;
}

void UOAMChapterManager::CheckChapterCompletion()
{
	if (!IsChapterComplete(CurrentChapterID)) return;

	const int32 Idx = CurrentChapterID - 1;
	if (ChapterRecords.IsValidIndex(Idx))
	{
		ChapterRecords[Idx].bCompleted = true;
		ChapterRecords[Idx].CompletionSeconds =
			UGameplayStatics::GetRealTimeSeconds(GWorld ? GWorld : nullptr) - ChapterRecords[Idx].StartTime;
	}

	if (CurrentChapterID < TotalChapters && !UnlockedChapters.Contains(CurrentChapterID + 1))
	{
		UnlockedChapters.Add(CurrentChapterID + 1);
	}

	OnChapterCompleted.Broadcast(CurrentChapterID);

	if (auto* GI = Cast<UOAMGameInstance>(GetOuter()))
	{
		if (GI->Telemetry) GI->Telemetry->RecordChapterComplete(CurrentChapterID, ChapterRecords[Idx].CompletionSeconds);
	}
}

void UOAMChapterManager::TriggerEndingDoor(FName DoorID)
{
	UE_LOG(LogTemp, Log, TEXT("[OAM] 章节触发结局门：%s"), *DoorID.ToString());
	CheckChapterCompletion();
}

const FOAMChapterRecord* UOAMChapterManager::GetChapterRecord(int32 ID) const
{
	return ChapterRecords.IsValidIndex(ID - 1) ? &ChapterRecords[ID - 1] : nullptr;
}

TArray<FText> UOAMChapterManager::GetCurrentChapterObjectiveTexts() const
{
	TArray<FText> Out;
	auto* It = ChapterDataMap.Find(CurrentChapterID);
	if (!It) return Out;
	if (const UOAMChapterData* CD = It->LoadSynchronous())
	{
		for (const auto& O : CD->Objectives) Out.Add(O.Description);
	}
	return Out;
}

float UOAMChapterManager::GetCurrentCompletionPercent() const
{
	auto* It = ChapterDataMap.Find(CurrentChapterID);
	if (!It) return 0.f;
	const UOAMChapterData* CD = It->LoadSynchronous();
	if (!CD || CD->Objectives.Num() == 0) return 0.f;
	int32 Done = 0;
	for (const auto& O : CD->Objectives)
	{
		if (CompletedObjectives.Contains(O.ObjectiveID)) Done++;
	}
	return (float)Done / (float)CD->Objectives.Num();
}
