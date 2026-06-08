// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Environment/OAMPickupActor.h"
#include "Player/OAMPlayerController.h"
#include "Core/OAMGameInstance.h"
#include "Core/OAMGameState.h"
#include "Data/OAMItemData.h"
#include "Data/OAMNoteData.h"
#include "Managers/OAMAudioManager.h"
#include "Managers/OAMTelemetryManager.h"
#include "Managers/OAMChapterManager.h"
#include "Kismet/GameplayStatics.h"

AOAMPickupActor::AOAMPickupActor()
{
	PromptTextOverride = FText::FromString(TEXT("拾起 [E]"));
}

void AOAMPickupActor::BeginPlay()
{
	Super::BeginPlay();
	ApplyVisualFromData();
}

void AOAMPickupActor::ApplyVisualFromData()
{
	if (const UOAMItemData* ID = ItemDataAsset.LoadSynchronous())
	{
		UniqueID = ID->ItemID;
		PromptTextOverride = FText::Format(FText::FromString(TEXT("拾取 {0} [E]")), ID->DisplayName);
		if (ID->WorldMesh.IsValid()) MeshComp->SetStaticMesh(ID->WorldMesh.Get());
	}
}

FText AOAMPickupActor::GetPromptText_Implementation() const
{
	if (bIsPickupComplete) return FText::GetEmpty();
	return Super::GetPromptText_Implementation();
}

void AOAMPickupActor::OnInteract_Implementation(AOAMPlayerController* InstigatorPC)
{
	Super::OnInteract_Implementation(InstigatorPC);

	if (bIsPickupComplete || !InstigatorPC) return;

	auto* GI = UOAMGameInstance::GetOAM(this);
	auto* GS = Cast<AOAMGameState>(UGameplayStatics::GetGameState(this));
	const UOAMItemData* ID = ItemDataAsset.LoadSynchronous();
	if (!GI || !GS || !ID) return;

	GS->AddCollectedItem(ID->ItemID);
	if (GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Item_Pickup"));
	if (GI->Telemetry) GI->Telemetry->RecordItemCollected(ID->ItemID, GetActorLocation());

	if (GI->ChapterManager)
	{
		GI->ChapterManager->OnObjectiveEvent(EOAMObjectiveCheck::CollectItem, ID->ItemID);
		GI->ChapterManager->OnObjectiveEvent(EOAMObjectiveCheck::CollectCount, ID->ItemID, 1);
	}

	InstigatorPC->ShowToast(FText::Format(FText::FromString(TEXT("已获得：{0}")), ID->DisplayName), EOAMToastType::Success);

	bIsPickupComplete = true;
	SetActorEnableCollision(false);
	Destroy();
}
