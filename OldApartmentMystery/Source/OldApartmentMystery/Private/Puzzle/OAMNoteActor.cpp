// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Puzzle/OAMNoteActor.h"
#include "Player/OAMPlayerController.h"
#include "Core/OAMGameInstance.h"
#include "Core/OAMGameState.h"
#include "Data/OAMItemData.h"
#include "Data/OAMNoteData.h"
#include "Managers/OAMAudioManager.h"
#include "Managers/OAMTelemetryManager.h"
#include "Managers/OAMChapterManager.h"
#include "Kismet/GameplayStatics.h"

AOAMNoteActor::AOAMNoteActor()
{
	PromptTextOverride = FText::FromString(TEXT("阅读 [E]"));
}

void AOAMNoteActor::BeginPlay()
{
	Super::BeginPlay();
	if (const UOAMItemData* ID = ItemDataAsset.LoadSynchronous())
	{
		UniqueID = ID->ItemID;
	}
}

FText AOAMNoteActor::GetPromptText_Implementation() const
{
	const UOAMItemData* ID = ItemDataAsset.Get();
	if (ID) return FText::Format(FText::FromString(TEXT("阅读 {0} [E]")), ID->DisplayName);
	return PromptTextOverride;
}

void AOAMNoteActor::OnInteract_Implementation(AOAMPlayerController* InstigatorPC)
{
	Super::OnInteract_Implementation(InstigatorPC);
	if (!InstigatorPC) return;

	auto* GI = UOAMGameInstance::GetOAM(this);
	auto* GS = Cast<AOAMGameState>(UGameplayStatics::GetGameState(this));
	const UOAMItemData* ID = ItemDataAsset.LoadSynchronous();
	if (!GI || !GS || !ID) return;

	GS->AddCollectedItem(ID->ItemID);

	if (ID->LinkedNote.IsValid())
	{
		if (const UOAMNoteData* ND = ID->LinkedNote.LoadSynchronous())
		{
			GS->AddReadNote(ND->NoteID);
			if (GI->Telemetry) GI->Telemetry->RecordNoteRead(ND->NoteID);
			if (GI->ChapterManager) GI->ChapterManager->OnObjectiveEvent(EOAMObjectiveCheck::ReadNote, ND->NoteID);
		}
	}

	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Note_Open"));
	InstigatorPC->ShowToast(FText::Format(FText::FromString(TEXT("已读取：{0}")), ID->DisplayName), EOAMToastType::Info);
	GI->SetInputMode(EOAMInputMode::UI);
}
