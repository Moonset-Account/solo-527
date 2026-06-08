// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Managers/OAMSaveManager.h"
#include "Core/OAMGameInstance.h"
#include "Core/OAMGameState.h"
#include "Managers/OAMChapterManager.h"
#include "Misc/Paths.h"
#include "HAL/PlatformFileManager.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"
#include "Serialization/JsonReader.h"
#include "Dom/JsonObject.h"
#include "Kismet/GameplayStatics.h"

void UOAMSaveManager::Initialize()
{
	Slots.SetNum(SLOT_COUNT + 1);
	for (int32 i = 0; i < Slots.Num(); ++i) Slots[i].SlotIndex = i;
}

FString UOAMSaveManager::SlotSaveDir() const
{
	return FPaths::ProjectSavedDir() / TEXT("OAMSaves");
}

void UOAMSaveManager::PersistToDisk(int32 SlotIndex, const FOAMSaveSlot& Slot) const
{
	const FString Dir = SlotSaveDir();
	IPlatformFile& PF = FPlatformFileManager::Get().GetPlatformFile();
	if (!PF.DirectoryExists(*Dir)) PF.CreateDirectoryTree(*Dir);
	const FString File = Dir / FString::Printf(TEXT("slot_%d.json"), SlotIndex);

	TSharedRef<FJsonObject> Json = MakeShared<FJsonObject>();
	Json->SetNumberField(TEXT("SlotIndex"), Slot.SlotIndex);
	Json->SetNumberField(TEXT("SaveTimeTicks"), (int64)Slot.SaveTimeTicks);
	Json->SetNumberField(TEXT("ChapterID"), Slot.ChapterID);
	Json->SetStringField(TEXT("LevelName"), Slot.LevelName.ToString());
	Json->SetNumberField(TEXT("PlayTimeSeconds"), Slot.PlayTimeSeconds);

	TArray<TSharedPtr<FJsonValue>> C, R, S, D, O, U;
	for (FName X : Slot.CollectedItems) C.Add(MakeShared<FJsonValueString>(X.ToString()));
	for (FName X : Slot.ReadNotes) R.Add(MakeShared<FJsonValueString>(X.ToString()));
	for (FName X : Slot.SolvedPuzzles) S.Add(MakeShared<FJsonValueString>(X.ToString()));
	for (FName X : Slot.OpenedDoors) D.Add(MakeShared<FJsonValueString>(X.ToString()));
	for (FName X : Slot.CompletedObjectives) O.Add(MakeShared<FJsonValueString>(X.ToString()));
	for (int32 X : Slot.UnlockedChapters) U.Add(MakeShared<FJsonValueNumber>(X));

	Json->SetArrayField(TEXT("CollectedItems"), C);
	Json->SetArrayField(TEXT("ReadNotes"), R);
	Json->SetArrayField(TEXT("SolvedPuzzles"), S);
	Json->SetArrayField(TEXT("OpenedDoors"), D);
	Json->SetArrayField(TEXT("CompletedObjectives"), O);
	Json->SetArrayField(TEXT("UnlockedChapters"), U);

	FString Out;
	auto W = TJsonWriterFactory<>::Create(&Out);
	FJsonSerializer::Serialize(Json, W);
	FFileHelper::SaveStringToFile(Out, *File);
}

bool UOAMSaveManager::LoadFromDisk(int32 SlotIndex, FOAMSaveSlot& OutSlot) const
{
	const FString File = SlotSaveDir() / FString::Printf(TEXT("slot_%d.json"), SlotIndex);
	FString Content;
	if (!FFileHelper::LoadFileToString(Content, *File)) return false;

	TSharedPtr<FJsonObject> Json;
	auto R = TJsonReaderFactory<>::Create(Content);
	if (!FJsonSerializer::Deserialize(R, Json) || !Json.IsValid()) return false;

	OutSlot.SlotIndex = Json->GetIntegerField(TEXT("SlotIndex"));
	OutSlot.SaveTimeTicks = (int64)Json->GetNumberField(TEXT("SaveTimeTicks"));
	OutSlot.ChapterID = Json->GetIntegerField(TEXT("ChapterID"));
	OutSlot.LevelName = *Json->GetStringField(TEXT("LevelName"));
	OutSlot.PlayTimeSeconds = Json->GetNumberField(TEXT("PlayTimeSeconds"));

	auto GetArr = [&](const FString& K) -> TArray<FName>
	{
		TArray<FName> Res;
		const TArray<TSharedPtr<FJsonValue>>* A;
		if (Json->TryGetArrayField(K, A)) for (auto V : *A) Res.Add(*V->AsString());
		return Res;
	};
	OutSlot.CollectedItems = GetArr(TEXT("CollectedItems"));
	OutSlot.ReadNotes = GetArr(TEXT("ReadNotes"));
	OutSlot.SolvedPuzzles = GetArr(TEXT("SolvedPuzzles"));
	OutSlot.OpenedDoors = GetArr(TEXT("OpenedDoors"));
	OutSlot.CompletedObjectives = GetArr(TEXT("CompletedObjectives"));

	OutSlot.UnlockedChapters.Empty();
	const TArray<TSharedPtr<FJsonValue>>* U;
	if (Json->TryGetArrayField(TEXT("UnlockedChapters"), U))
		for (auto V : *U) OutSlot.UnlockedChapters.Add(V->AsNumber());

	return true;
}

bool UOAMSaveManager::SaveGame(int32 SlotIndex)
{
	auto* GI = Cast<UOAMGameInstance>(GetOuter());
	if (!GI || !GI->GetWorld()) return false;

	FOAMSaveSlot Slot;
	Slot.SlotIndex = SlotIndex;
	Slot.SaveTimeTicks = FDateTime::Now().GetTicks();
	Slot.ChapterID = GI->ChapterManager ? GI->ChapterManager->CurrentChapterID : 1;

	UWorld* W = GI->GetWorld();
	Slot.LevelName = *W->GetMapName();

	if (auto* GS = Cast<AOAMGameState>(UGameplayStatics::GetGameState(W)))
	{
		Slot.PlayTimeSeconds = GS->SessionPlayTimeSeconds;
		Slot.CollectedItems = GS->CollectedItemIDs;
		Slot.ReadNotes = GS->ReadNoteIDs;
		Slot.SolvedPuzzles = GS->SolvedPuzzleIDs;
		Slot.OpenedDoors = GS->OpenedDoorIDs;
	}

	if (APlayerController* PC = UGameplayStatics::GetPlayerController(W, 0))
	{
		if (APawn* P = PC->GetPawn()) Slot.PlayerTransform = P->GetActorTransform();
	}
	if (GI->ChapterManager)
	{
		for (const auto& KV : GI->ChapterManager->CompletedObjectives)
			if (KV.Value) Slot.CompletedObjectives.Add(KV.Key);
		Slot.UnlockedChapters = GI->ChapterManager->GetUnlockedChapters();
	}
	Slot.SettingsSnapshot = GI->Settings;

	if (Slots.IsValidIndex(SlotIndex)) Slots[SlotIndex] = Slot;
	PersistToDisk(SlotIndex, Slot);
	UE_LOG(LogTemp, Log, TEXT("[OAM][Save] 保存到槽 %d"), SlotIndex);
	return true;
}

bool UOAMSaveManager::LoadGame(int32 SlotIndex)
{
	auto* GI = Cast<UOAMGameInstance>(GetOuter());
	if (!GI || !GI->GetWorld()) return false;

	FOAMSaveSlot Slot;
	if (!LoadFromDisk(SlotIndex, Slot))
	{
		if (Slots.IsValidIndex(SlotIndex) && Slots[SlotIndex].SaveTimeTicks != 0) Slot = Slots[SlotIndex];
		else return false;
	}

	UWorld* W = GI->GetWorld();
	if (auto* GS = Cast<AOAMGameState>(UGameplayStatics::GetGameState(W)))
	{
		GS->CollectedItemIDs = Slot.CollectedItems;
		GS->ReadNoteIDs = Slot.ReadNotes;
		GS->SolvedPuzzleIDs = Slot.SolvedPuzzles;
		GS->OpenedDoorIDs = Slot.OpenedDoors;
		GS->SessionPlayTimeSeconds = Slot.PlayTimeSeconds;
	}
	if (GI->ChapterManager)
	{
		GI->ChapterManager->CurrentChapterID = Slot.ChapterID;
		GI->ChapterManager->CompletedObjectives.Empty();
		for (FName ID : Slot.CompletedObjectives) GI->ChapterManager->CompletedObjectives.Add(ID, true);
	}
	GI->ApplySettings(Slot.SettingsSnapshot);
	UE_LOG(LogTemp, Log, TEXT("[OAM][Save] 读取槽 %d, 章节 %d"), SlotIndex, Slot.ChapterID);
	return true;
}

void UOAMSaveManager::AutoSave()
{
	SaveGame(AUTO_SLOT);
}

bool UOAMSaveManager::DeleteSave(int32 SlotIndex)
{
	IPlatformFile& PF = FPlatformFileManager::Get().GetPlatformFile();
	const FString File = SlotSaveDir() / FString::Printf(TEXT("slot_%d.json"), SlotIndex);
	const bool bDeleted = PF.DeleteFile(*File);
	if (Slots.IsValidIndex(SlotIndex)) Slots[SlotIndex] = FOAMSaveSlot();
	return bDeleted;
}

const FOAMSaveSlot* UOAMSaveManager::GetSlot(int32 SlotIndex) const
{
	FOAMSaveSlot* Mutable = nullptr;
	if (LoadFromDisk(SlotIndex, *(Mutable = &const_cast<TArray<FOAMSaveSlot>&>(Slots)[SlotIndex])) || Slots[SlotIndex].SaveTimeTicks != 0)
	{
		return &Slots[SlotIndex];
	}
	return nullptr;
}

void UOAMSaveManager::SaveSettings(const FOAMGameSettings& Settings)
{
	const FString File = SlotSaveDir() / TEXT("settings.json");
	IPlatformFile& PF = FPlatformFileManager::Get().GetPlatformFile();
	if (!PF.DirectoryExists(*SlotSaveDir())) PF.CreateDirectoryTree(*SlotSaveDir());

	TSharedRef<FJsonObject> Json = MakeShared<FJsonObject>();
	Json->SetNumberField(TEXT("MasterVolume"), Settings.MasterVolume);
	Json->SetNumberField(TEXT("SFXVolume"), Settings.SFXVolume);
	Json->SetNumberField(TEXT("AmbientVolume"), Settings.AmbientVolume);
	Json->SetNumberField(TEXT("UIVolume"), Settings.UIVolume);
	Json->SetNumberField(TEXT("Brightness"), Settings.Brightness);
	Json->SetNumberField(TEXT("MouseSensitivity"), Settings.MouseSensitivity);
	Json->SetNumberField(TEXT("FOV"), Settings.FOV);
	Json->SetNumberField(TEXT("AutoSaveMinutes"), Settings.AutoSaveMinutes);
	Json->SetBoolField(TEXT("FilmGrain"), Settings.bFilmGrain);
	Json->SetBoolField(TEXT("Vignette"), Settings.bVignette);
	Json->SetBoolField(TEXT("HintsEnabled"), Settings.bHintsEnabled);
	Json->SetBoolField(TEXT("SubtitlesEnabled"), Settings.bSubtitlesEnabled);

	FString Out;
	auto W = TJsonWriterFactory<>::Create(&Out);
	FJsonSerializer::Serialize(Json, W);
	FFileHelper::SaveStringToFile(Out, *File);
}

bool UOAMSaveManager::LoadSettings(FOAMGameSettings& OutSettings)
{
	const FString File = SlotSaveDir() / TEXT("settings.json");
	FString Content;
	if (!FFileHelper::LoadFileToString(Content, *File)) return false;
	TSharedPtr<FJsonObject> Json;
	auto R = TJsonReaderFactory<>::Create(Content);
	if (!FJsonSerializer::Deserialize(R, Json) || !Json.IsValid()) return false;

	OutSettings.MasterVolume = Json->GetNumberField(TEXT("MasterVolume"));
	OutSettings.SFXVolume = Json->GetNumberField(TEXT("SFXVolume"));
	OutSettings.AmbientVolume = Json->GetNumberField(TEXT("AmbientVolume"));
	OutSettings.UIVolume = Json->GetNumberField(TEXT("UIVolume"));
	OutSettings.Brightness = Json->GetNumberField(TEXT("Brightness"));
	OutSettings.MouseSensitivity = Json->GetNumberField(TEXT("MouseSensitivity"));
	OutSettings.FOV = Json->GetNumberField(TEXT("FOV"));
	OutSettings.AutoSaveMinutes = Json->GetIntegerField(TEXT("AutoSaveMinutes"));
	OutSettings.bFilmGrain = Json->GetBoolField(TEXT("FilmGrain"));
	OutSettings.bVignette = Json->GetBoolField(TEXT("Vignette"));
	OutSettings.bHintsEnabled = Json->GetBoolField(TEXT("HintsEnabled"));
	OutSettings.bSubtitlesEnabled = Json->GetBoolField(TEXT("SubtitlesEnabled"));
	return true;
}

FString UOAMSaveManager::FormatSaveTime(const FOAMSaveSlot& Slot) const
{
	if (Slot.SaveTimeTicks == 0) return TEXT("空");
	return FDateTime(Slot.SaveTimeTicks).ToString(TEXT("%Y/%m/%d %H:%M"));
}
