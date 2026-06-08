// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#include "Environment/OAMInteractableActorBase.h"
#include "Components/StaticMeshComponent.h"
#include "Components/BoxComponent.h"
#include "Components/WidgetComponent.h"
#include "Core/OAMGameInstance.h"

AOAMInteractableActorBase::AOAMInteractableActorBase()
{
	PrimaryActorTick.bCanEverTick = false;

	SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
	SetRootComponent(SceneRoot);

	MeshComp = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
	MeshComp->SetupAttachment(RootComponent);
	MeshComp->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
	MeshComp->SetCollisionObjectType(ECC_WorldDynamic);

	InteractBox = CreateDefaultSubobject<UBoxComponent>(TEXT("InteractBox"));
	InteractBox->SetupAttachment(RootComponent);
	InteractBox->SetBoxExtent(FVector(60, 60, 100));
	InteractBox->SetRelativeLocation(FVector(0, 0, 50));
	InteractBox->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
	InteractBox->SetCollisionResponseToAllChannels(ECR_Ignore);
	InteractBox->SetCollisionResponseToChannel(ECC_Visibility, ECR_Block);

	HoverWidget = CreateDefaultSubobject<UWidgetComponent>(TEXT("HoverIndicator"));
	HoverWidget->SetupAttachment(RootComponent);
	HoverWidget->SetRelativeLocation(FVector(0, 0, 180));
	HoverWidget->SetWidgetSpace(EWidgetSpace::Screen);
	HoverWidget->SetDrawSize(FVector2D(40, 40));
	HoverWidget->SetVisibility(false);
}

void AOAMInteractableActorBase::BeginPlay()
{
	Super::BeginPlay();
}

void AOAMInteractableActorBase::OnInteract_Implementation(AOAMPlayerController* InstigatorPC)
{
	UE_LOG(LogTemp, Log, TEXT("[OAM] 交互: %s"), *GetName());
}

void AOAMInteractableActorBase::OnStartHover_Implementation()
{
	if (HoverWidget) HoverWidget->SetVisibility(true);
}

void AOAMInteractableActorBase::OnEndHover_Implementation()
{
	if (HoverWidget) HoverWidget->SetVisibility(false);
}
