// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Managers/OAMTelemetryManager.h"
#include "Misc/Paths.h"
#include "HAL/PlatformFileManager.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"
#include "Serialization/JsonReader.h"
#include "Dom/JsonObject.h"
#include "Misc/DateTime.h"
#include "HAL/PlatformTime.h"

void UOAMTelemetryManager::Initialize()
{
	Events.Empty();
	FailCount = 0;
}

void UOAMTelemetryManager::BeginSession()
{
	Events.Empty();
	FailCount = 0;
	SessionStartTime = FPlatformTime::Seconds();
	AddEvent(EOAMTelemetryEventType::SessionStart, NAME_None, FString::Printf(TEXT("{\"start\":\"%s\"}"), *FDateTime::Now().ToIso8601()));
}

FString UOAMTelemetryManager::FinalizeAndExport()
{
	AddEvent(EOAMTelemetryEventType::SessionEnd, NAME_None, FString::Printf(TEXT("{\"elapsed\":%.2f,\"fails\":%d}"), GetElapsedSeconds(), FailCount));
	return BuildJSONString();
}

bool UOAMTelemetryManager::DownloadJSONToSavedDir()
{
	const FString JSON = BuildJSONString();
	const FString Dir = FPaths::ProjectSavedDir() / TEXT("Telemetry");
	IPlatformFile& PF = FPlatformFileManager::Get().GetPlatformFile();
	if (!PF.DirectoryExists(*Dir)) PF.CreateDirectoryTree(*Dir);
	const FString File = Dir / FString::Printf(TEXT("OAM_Session_%s.json"), *FDateTime::Now().ToString(TEXT("%Y%m%d_%H%M%S")));
	const bool bOk = FFileHelper::SaveStringToFile(JSON, *File);
	UE_LOG(LogTemp, Log, TEXT("[OAM][Telemetry] 导出 %s -> %d"), *File, (int)bOk);
	return bOk;
}

void UOAMTelemetryManager::AddEvent(EOAMTelemetryEventType T, FName ID, const FString& JSON)
{
	FOAMTelemetryEvent E;
	E.Type = T;
	E.ID = ID;
	E.Timestamp = FPlatformTime::Seconds() - SessionStartTime;
	E.PayloadJSON = JSON;
	Events.Add(E);
}

void UOAMTelemetryManager::RecordChapterStart(int32 ChapterID)
{
	AddEvent(EOAMTelemetryEventType::ChapterStart, FName(*FString::FromInt(ChapterID)));
}

void UOAMTelemetryManager::RecordChapterComplete(int32 ChapterID, float Seconds)
{
	AddEvent(EOAMTelemetryEventType::ChapterComplete, FName(*FString::FromInt(ChapterID)),
		FString::Printf(TEXT("{\"seconds\":%.2f}"), Seconds));
}

void UOAMTelemetryManager::RecordItemCollected(FName ItemID, FVector Loc)
{
	AddEvent(EOAMTelemetryEventType::ItemCollected, ItemID,
		FString::Printf(TEXT("{\"loc\":[%.1f,%.1f,%.1f]}"), Loc.X, Loc.Y, Loc.Z));
}

void UOAMTelemetryManager::RecordItemExamine(FName ItemID, int32 HotspotIndex)
{
	AddEvent(EOAMTelemetryEventType::ItemExamine, ItemID,
		FString::Printf(TEXT("{\"hotspot\":%d}"), HotspotIndex));
}

void UOAMTelemetryManager::RecordNoteRead(FName NoteID)
{
	AddEvent(EOAMTelemetryEventType::NoteRead, NoteID);
}

void UOAMTelemetryManager::RecordPuzzleAttempt(FName PuzzleID, const TArray<int32>& Guess, bool bCorrect)
{
	FString G = TEXT("[");
	for (int32 i = 0; i < Guess.Num(); ++i)
	{
		G += FString::FromInt(Guess[i]);
		if (i < Guess.Num() - 1) G += TEXT(",");
	}
	G += TEXT("]");
	AddEvent(EOAMTelemetryEventType::PuzzleAttempt, PuzzleID,
		FString::Printf(TEXT("{\"guess\":%s,\"correct\":%s}"), *G, bCorrect ? TEXT("true") : TEXT("false")));
	if (!bCorrect) FailCount++;
}

void UOAMTelemetryManager::RecordPuzzleSolved(FName PuzzleID, int32 Attempts, float Seconds)
{
	AddEvent(EOAMTelemetryEventType::PuzzleSolved, PuzzleID,
		FString::Printf(TEXT("{\"attempts\":%d,\"seconds\":%.2f}"), Attempts, Seconds));
}

void UOAMTelemetryManager::RecordDoorOpened(FName DoorID)
{
	AddEvent(EOAMTelemetryEventType::DoorOpened, DoorID);
}

void UOAMTelemetryManager::RecordDoorUnlock(FName DoorID)
{
	AddEvent(EOAMTelemetryEventType::DoorUnlock, DoorID);
}

void UOAMTelemetryManager::RecordObjectiveComplete(FName ObjectiveID)
{
	AddEvent(EOAMTelemetryEventType::ObjectiveComplete, ObjectiveID);
}

void UOAMTelemetryManager::RecordRoomEntered(FName RoomID)
{
	AddEvent(EOAMTelemetryEventType::RoomEntered, RoomID);
}

void UOAMTelemetryManager::RecordChoice(FName ChoiceID, int32 ChoiceValue)
{
	AddEvent(EOAMTelemetryEventType::ChoiceMade, ChoiceID,
		FString::Printf(TEXT("{\"value\":%d}"), ChoiceValue));
}

void UOAMTelemetryManager::RecordDeath(FName Reason)
{
	AddEvent(EOAMTelemetryEventType::DeathEvent, Reason);
	FailCount++;
}

/* -------------------- 序列化 -------------------- */

namespace OAMTelem
{
	static const TCHAR* ETypeStr(EOAMTelemetryEventType T)
	{
#define C(X) case EOAMTelemetryEventType::X: return TEXT(#X)
		switch (T) {
			C(SessionStart); C(SessionEnd); C(ChapterStart); C(ChapterComplete);
			C(ItemCollected); C(ItemExamine); C(NoteRead); C(PuzzleAttempt); C(PuzzleSolved);
			C(DoorOpened); C(DoorUnlock); C(ObjectiveComplete); C(RoomEntered); C(ChoiceMade); C(DeathEvent);
		default: return TEXT("Unknown"); }
#undef C
	}
}

FString UOAMTelemetryManager::BuildJSONString() const
{
	TSharedRef<FJsonObject> Root = MakeShared<FJsonObject>();
	Root->SetStringField(TEXT("sessionId"), FGuid::NewGuid().ToString(EGuidFormats::Digits));
	Root->SetStringField(TEXT("generatedAt"), FDateTime::Now().ToIso8601());
	Root->SetNumberField(TEXT("elapsedSeconds"), GetElapsedSeconds());
	Root->SetNumberField(TEXT("failCount"), FailCount);
	Root->SetNumberField(TEXT("eventCount"), Events.Num());

	TArray<TSharedPtr<FJsonValue>> EvArr;
	for (const auto& E : Events)
	{
		TSharedRef<FJsonObject> J = MakeShared<FJsonObject>();
		J->SetNumberField(TEXT("t"), E.Timestamp);
		J->SetStringField(TEXT("type"), OAMTelem::ETypeStr(E.Type));
		J->SetStringField(TEXT("id"), E.ID.ToString());
		if (!E.PayloadJSON.IsEmpty())
		{
			TSharedPtr<FJsonValue> V;
			auto R = TJsonReaderFactory<>::Create(E.PayloadJSON);
			FJsonSerializer::Deserialize(R, V);
			if (V.IsValid()) J->SetField(TEXT("p"), V);
		}
		EvArr.Add(MakeShared<FJsonValueObject>(J));
	}
	Root->SetArrayField(TEXT("events"), EvArr);

	FString Out;
	auto W = TJsonWriterFactory<>::Create(&Out);
	FJsonSerializer::Serialize(Root, W);
	return Out;
}
