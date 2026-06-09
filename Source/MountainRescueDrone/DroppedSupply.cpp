#include "DroppedSupply.h"
#include "Components/StaticMeshComponent.h"
#include "GameFramework/ProjectileMovementComponent.h"
#include "NiagaraComponent.h"
#include "MountainRescueDrone.h"

ADroppedSupply::ADroppedSupply()
{
	PrimaryActorTick.bCanEverTick = true;

	SupplyMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("SupplyMesh"));
	RootComponent = SupplyMesh;
	SupplyMesh->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
	SupplyMesh->SetCollisionProfileName(TEXT("PhysicsActor"));
	SupplyMesh->SetSimulatePhysics(true);
	SupplyMesh->SetEnableGravity(true);

	ProjectileMovement = CreateDefaultSubobject<UProjectileMovementComponent>(TEXT("ProjectileMovement"));
	ProjectileMovement->UpdatedComponent = SupplyMesh;
	ProjectileMovement->InitialSpeed = 0.f;
	ProjectileMovement->MaxSpeed = 300.f;
	ProjectileMovement->bRotationFollowsVelocity = true;
	ProjectileMovement->bShouldBounce = false;
	ProjectileMovement->ProjectileGravityScale = 0.3f;
	ProjectileMovement->AirResistance = 0.5f;

	ParachuteEffect = CreateDefaultSubobject<UNiagaraComponent>(TEXT("ParachuteEffect"));
	ParachuteEffect->SetupAttachment(RootComponent);

	LandingEffect = CreateDefaultSubobject<UNiagaraComponent>(TEXT("LandingEffect"));
	LandingEffect->SetupAttachment(RootComponent);
	LandingEffect->bAutoActivate = false;

	TargetDeliveryLocation = FVector::ZeroVector;
}

void ADroppedSupply::BeginPlay()
{
	Super::BeginPlay();

	SupplyMesh->OnComponentHit.AddDynamic(this, &ADroppedSupply::OnLanded);
	SetSupplyMeshByType(SupplyType);
}

void ADroppedSupply::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
}

void ADroppedSupply::DropFromDrone(FVector DroneVelocity, FVector TargetLocation)
{
	TargetDeliveryLocation = TargetLocation;

	FVector DropVelocity = DroneVelocity + FVector(0, 0, -2.f);
	ProjectileMovement->Velocity = DropVelocity;
	SupplyMesh->SetPhysicsLinearVelocity(DropVelocity);

	if (ParachuteEffect)
	{
		ParachuteEffect->Activate();
	}

	UE_LOG(LogMountainRescue, Log, TEXT("投放物资: %s 从位置 %s 开始下落"),
		*UEnum::GetValueAsString(SupplyType),
		*GetActorLocation().ToString());
}

void ADroppedSupply::SetSupplyMeshByType(ESupplyType Type)
{
	SupplyType = Type;
}

void ADroppedSupply::OnLanded(const FHitResult& Hit)
{
	if (bHasLanded) return;

	bHasLanded = true;
	LandingLocation = Hit.ImpactPoint;
	LandingDistanceToTarget = FVector::Dist(LandingLocation, TargetDeliveryLocation);

	bool bHitTarget = LandingDistanceToTarget <= 25.f;

	if (ProjectileMovement)
	{
		ProjectileMovement->StopMovementImmediately();
	}
	SupplyMesh->SetSimulatePhysics(false);
	SetActorLocation(LandingLocation);

	if (ParachuteEffect)
	{
		ParachuteEffect->Deactivate();
	}
	if (LandingEffect)
	{
		LandingEffect->Activate();
	}

	UE_LOG(LogMountainRescue, Log, TEXT("物资落地: %s 距离目标 %.1fm, 是否命中目标: %s"),
		*UEnum::GetValueAsString(SupplyType),
		LandingDistanceToTarget,
		bHitTarget ? TEXT("是") : TEXT("否"));

	OnSupplyLanded.Broadcast(LandingLocation, SupplyType, LandingDistanceToTarget, bHitTarget);
}
