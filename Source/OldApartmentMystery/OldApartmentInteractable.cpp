#include "OldApartmentInteractable.h"
#include "Components/SphereComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/WidgetComponent.h"
#include "Kismet/GameplayStatics.h"
#include "NiagaraFunctionLibrary.h"

AOldApartmentInteractable::AOldApartmentInteractable()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.bStartWithTickEnabled = false;

	InteractCollision = CreateDefaultSubobject<USphereComponent>(TEXT("InteractCollision"));
	InteractCollision->InitSphereRadius(120.0f);
	InteractCollision->SetCollisionProfileName(TEXT("OverlapAllDynamic"));
	RootComponent = InteractCollision;

	InteractableMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("InteractableMesh"));
	InteractableMesh->SetupAttachment(RootComponent);
	InteractableMesh->SetCollisionProfileName(TEXT("Interactable"));

	InteractionWidget = CreateDefaultSubobject<UWidgetComponent>(TEXT("InteractionWidget"));
	InteractionWidget->SetupAttachment(RootComponent);
	InteractionWidget->SetWidgetSpace(EWidgetSpace::Screen);
	InteractionWidget->SetDrawSize(FVector2D(256, 64));
	InteractionWidget->SetVisibility(false);

	bHighlightOnHover = true;
	bHasBeenInteracted = false;
	bIsActive = true;

	InteractableData.InteractableId = NAME_None;
	InteractableData.Type = EInteractableType::Furniture;
	InteractableData.bIsCollectable = false;
	InteractableData.bCanBeExamined = true;
	InteractableData.bDestroyOnInteract = false;
	InteractableData.ScoreReward = 10;
	InteractableData.MistakePenalty = 0;
}

void AOldApartmentInteractable::BeginPlay()
{
	Super::BeginPlay();

	InteractCollision->OnComponentBeginOverlap.AddDynamic(this, &AOldApartmentInteractable::HandleBeginOverlap);
	InteractCollision->OnComponentEndOverlap.AddDynamic(this, &AOldApartmentInteractable::HandleEndOverlap);

	if (InteractableMesh)
	{
		HighlightMID = InteractableMesh->CreateAndSetMaterialInstanceDynamic(0);
	}
}

void AOldApartmentInteractable::Interact(APawn* InstigatorPawn)
{
	if (!bIsActive) return;

	bHasBeenInteracted = true;
	OnInteracted.Broadcast(this, InstigatorPawn);
	OnInteractEvent(InstigatorPawn);

	if (InteractSound)
	{
		UGameplayStatics::PlaySoundAtLocation(this, InteractSound, GetActorLocation());
	}
	if (InteractVFX)
	{
		UNiagaraFunctionLibrary::SpawnSystemAtLocation(this, InteractVFX, GetActorLocation());
	}
	if (InteractableData.bDestroyOnInteract)
	{
		SetLifeSpan(0.5f);
	}
}

void AOldApartmentInteractable::BeginExamine()
{
	if (ExamineSound)
	{
		UGameplayStatics::PlaySoundAtLocation(this, ExamineSound, GetActorLocation());
	}
	OnExamined.Broadcast(this);
	OnExamineEvent();
}

void AOldApartmentInteractable::EndExamine()
{
}

void AOldApartmentInteractable::SetHighlight(bool bEnabled)
{
	if (HighlightMID && bHighlightOnHover)
	{
		float Emissive = bEnabled ? 1.0f : 0.0f;
		HighlightMID->SetScalarParameterValue(TEXT("Highlight"), Emissive);
	}
	if (InteractionWidget)
	{
		InteractionWidget->SetVisibility(bEnabled ? ESlateVisibility::Visible : ESlateVisibility::Hidden);
	}
}

void AOldApartmentInteractable::ActivateInteractable()
{
	bIsActive = true;
	SetActorEnableCollision(true);
	SetActorHiddenInGame(false);
}

void AOldApartmentInteractable::DeactivateInteractable()
{
	bIsActive = false;
	SetActorEnableCollision(false);
	SetActorHiddenInGame(true);
}

void AOldApartmentInteractable::OnInteractEvent_Implementation(APawn* InstigatorPawn)
{
}

void AOldApartmentInteractable::OnExamineEvent_Implementation()
{
}

FText AOldApartmentInteractable::GetInteractionLabel() const
{
	return InteractableData.DisplayName;
}

void AOldApartmentInteractable::HandleBeginOverlap(UPrimitiveComponent* OverlappedComponent, AActor* OtherActor,
	UPrimitiveComponent* OtherComp, int32 OtherBodyIndex, bool bFromSweep, const FHitResult& SweepResult)
{
	if (OtherActor && OtherActor != this)
	{
		SetHighlight(true);
	}
}

void AOldApartmentInteractable::HandleEndOverlap(UPrimitiveComponent* OverlappedComponent, AActor* OtherActor,
	UPrimitiveComponent* OtherComp, int32 OtherBodyIndex)
{
	if (OtherActor && OtherActor != this)
	{
		SetHighlight(false);
	}
}
