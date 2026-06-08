// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Environment/OAMRoomTriggerVolume.h"
#include "Player/OAMCharacter.h"
#include "Core/OAMGameInstance.h"
#include "Managers/OAMAudioManager.h"
#include "Kismet/GameplayStatics.h"
#include "Components/BrushComponent.h"

AOAMRoomTriggerVolume::AOAMRoomTriggerVolume()
{
	PrimaryActorTick.bCanEverTick = false;
	GetBrushComponent()->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
	GetBrushComponent()->SetCollisionResponseToAllChannels(ECR_Ignore);
	GetBrushComponent()->SetCollisionResponseToChannel(ECC_Pawn, ECR_Overlap);
}

void AOAMRoomTriggerVolume::BeginPlay()
{
	Super::BeginPlay();
	GetBrushComponent()->OnComponentBeginOverlap.AddDynamic(this, &AOAMRoomTriggerVolume::OnOverlapBegin);
}

void AOAMRoomTriggerVolume::OnOverlapBegin(UPrimitiveComponent*, AActor* OtherActor, UPrimitiveComponent*,
	int32, bool, const FHitResult&)
{
	AOAMCharacter* C = Cast<AOAMCharacter>(OtherActor);
	if (!C) return;

	C->SetCurrentRoom(RoomID);

	if (!bFirstEnterHandled)
	{
		bFirstEnterHandled = true;

		auto* GI = UOAMGameInstance::GetOAM(this);
		if (GI && GI->AudioManager)
		{
			if (AmbientOnEnter.IsValid()) GI->AudioManager->SetAmbient(AmbientOnEnter.Get(), 0.8f);
			GI->AudioManager->PlaySFX(TEXT("Ambient_FloorCreak"));
		}

		UE_LOG(LogTemp, Log, TEXT("[OAM] 首次进入房间：%s"), *RoomID.ToString());

		if (bHasMicroStimulus)
		{
			FTimerHandle H;
			FTimerDelegate D;
			D.BindWeakLambda(this, [this, GI]()
			{
				if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("Ambient_Rattle"));
				UE_LOG(LogTemp, Verbose, TEXT("[OAM] 环境微刺激触发"));
			});
			GetWorld()->GetTimerManager().SetTimer(H, D, 2.5f + FMath::FRandRange(0, 3), false);
		}
	}
}
