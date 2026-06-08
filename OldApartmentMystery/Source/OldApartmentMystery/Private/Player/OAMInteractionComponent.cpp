// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Player/OAMInteractionComponent.h"
#include "Player/OAMPlayerController.h"
#include "Player/OAMCharacter.h"
#include "Environment/OAMInteractableInterface.h"
#include "Kismet/GameplayStatics.h"
#include "DrawDebugHelpers.h"
#include "Managers/OAMAudioManager.h"

UOAMInteractionComponent::UOAMInteractionComponent()
{
	PrimaryComponentTick.bCanEverTick = true;
	PrimaryComponentTick.bStartWithTickEnabled = true;
}

void UOAMInteractionComponent::Initialize(AOAMPlayerController* InOwner)
{
	OwnerPC = InOwner;
}

AActor* UOAMInteractionComponent::FindNearestInteractable(float& OutDistance)
{
	if (!OwnerPC.IsValid() || !OwnerPC->GetPawn())
	{
		OutDistance = 0;
		return nullptr;
	}

	const FVector Origin = OwnerPC->GetPawn()->GetActorLocation();
	AActor* Best = nullptr;
	OutDistance = InteractRadius;

	TArray<AActor*> OutActors;
	UGameplayStatics::GetAllActorsWithInterface(GetWorld(), UOAMInteractableInterface::StaticClass(), OutActors);

	for (AActor* Actor : OutActors)
	{
		if (!Actor) continue;
		IOAMInteractableInterface* Itf = Cast<IOAMInteractableInterface>(Actor);
		if (!Itf || !Itf->IsInteractable_Implementation()) continue;

		const float Dist = FVector::Dist2D(Actor->GetActorLocation(), Origin);
		if (Dist < OutDistance)
		{
			OutDistance = Dist;
			Best = Actor;
		}
	}
	return Best;
}

void UOAMInteractionComponent::InteractWithNearest()
{
	float Dist;
	AActor* Near = FindNearestInteractable(Dist);
	if (!Near)
	{
		UE_LOG(LogTemp, Verbose, TEXT("[OAM] 附近没有可交互物体"));
		return;
	}

	IOAMInteractableInterface* Itf = Cast<IOAMInteractableInterface>(Near);
	if (Itf)
	{
		if (auto* GI = UOAMGameInstance::GetOAM(Near))
		{
			if (GI && GI->AudioManager) GI->AudioManager->PlaySFX(TEXT("UI_Interact"));
		}
		Itf->OnInteract_Implementation(OwnerPC.Get());
	}
}

void UOAMInteractionComponent::UpdateHover()
{
	float D;
	AActor* N = FindNearestInteractable(D);
	CurrentHover = N;
	if (AOAMCharacter* C = OwnerPC.IsValid() ? Cast<AOAMCharacter>(OwnerPC->GetPawn()) : nullptr)
	{
		if (UWidgetComponent* WC = C->InteractHintWidget)
		{
			WC->SetVisibility(N != nullptr);
		}
	}
}

FText UOAMInteractionComponent::GetCurrentPrompt() const
{
	if (!CurrentHover.IsValid()) return FText::GetEmpty();
	if (IOAMInteractableInterface* Itf = Cast<IOAMInteractableInterface>(CurrentHover.Get()))
	{
		return Itf->GetPromptText_Implementation();
	}
	return FText::GetEmpty();
}

void UOAMInteractionComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
	Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
	UpdateHover();
}
