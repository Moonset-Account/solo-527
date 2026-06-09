#include "SignalSystem.h"
#include "Components/SphereComponent.h"
#include "DrawDebugHelpers.h"
#include "MountainRescueDrone.h"

ASignalSystem::ASignalSystem()
{
	PrimaryActorTick.bCanEverTick = true;

	USceneComponent* RootComp = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
	RootComponent = RootComp;
}

void ASignalSystem::BeginPlay()
{
	Super::BeginPlay();
	DrawDebugZones();
}

void ASignalSystem::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	if (bDebugDrawDeadZones)
	{
		DrawDebugZones();
	}
}

void ASignalSystem::ConfigureDeadZones(const TArray<FSignalDeadZone>& NewDeadZones)
{
	DeadZones = NewDeadZones;
	DrawDebugZones();
	UE_LOG(LogMountainRescue, Log, TEXT("信号盲区已配置: %d个区域"), DeadZones.Num());
}

void ASignalSystem::AddDeadZone(const FSignalDeadZone& NewZone)
{
	DeadZones.Add(NewZone);
	DrawDebugZones();
}

void ASignalSystem::RemoveDeadZone(int32 Index)
{
	if (DeadZones.IsValidIndex(Index))
	{
		DeadZones.RemoveAt(Index);
		DrawDebugZones();
	}
}

float ASignalSystem::GetSignalBlockAtLocation(FVector Location) const
{
	float TotalBlock = 0.f;

	for (const FSignalDeadZone& Zone : DeadZones)
	{
		float Distance = FVector::Dist(Location, Zone.CenterLocation);
		if (Distance < Zone.Radius)
		{
			float Falloff = 1.f - (Distance / Zone.Radius);
			Falloff = FMath::Pow(Falloff, 1.5f);
			TotalBlock = FMath::Max(TotalBlock, Falloff * Zone.SignalBlockStrength);
		}
	}

	float MinTowerDistance = GetDistanceToNearestTower(Location);
	if (SignalTowers.Num() > 0 && MinTowerDistance > 2000.f)
	{
		float TowerFalloff = (MinTowerDistance - 2000.f) / 3000.f;
		TotalBlock = FMath::Max(TotalBlock, FMath::Clamp(TowerFalloff, 0.f, 0.8f));
	}

	return FMath::Clamp(TotalBlock, 0.f, 1.f);
}

bool ASignalSystem::IsInDeadZone(FVector Location, FSignalDeadZone& OutZone) const
{
	for (const FSignalDeadZone& Zone : DeadZones)
	{
		float Distance = FVector::Dist(Location, Zone.CenterLocation);
		if (Distance < Zone.Radius * 0.7f)
		{
			OutZone = Zone;
			return true;
		}
	}
	return false;
}

float ASignalSystem::GetDistanceToNearestTower(FVector Location) const
{
	if (SignalTowers.Num() == 0) return 999999.f;

	float MinDist = FLT_MAX;
	for (const FVector& Tower : SignalTowers)
	{
		float Dist = FVector::Dist(Location, Tower);
		if (Dist < MinDist)
		{
			MinDist = Dist;
		}
	}
	return MinDist;
}

void ASignalSystem::DrawDebugZones()
{
	if (GetWorld() == nullptr) return;

	for (TObjectPtr<USphereComponent> Sphere : DebugSphereComponents)
	{
		if (Sphere) Sphere->DestroyComponent();
	}
	DebugSphereComponents.Empty();

	for (int32 i = 0; i < DeadZones.Num(); i++)
	{
		const FSignalDeadZone& Zone = DeadZones[i];

		if (bDebugDrawDeadZones)
		{
			DrawDebugSphere(
				GetWorld(),
				Zone.CenterLocation,
				Zone.Radius,
				32,
				FColor(255, 100, 0),
				false,
				DebugDrawDuration,
				0,
				2.f
			);

			DrawDebugSphere(
				GetWorld(),
				Zone.CenterLocation,
				Zone.Radius * 0.7f,
				32,
				FColor(255, 50, 0),
				false,
				DebugDrawDuration,
				0,
				1.f
			);
		}

		USphereComponent* SphereComp = NewObject<USphereComponent>(this, USphereComponent::StaticClass(), *FString::Printf(TEXT("DeadZone_%d"), i));
		if (SphereComp)
		{
			SphereComp->RegisterComponent();
			SphereComp->SetWorldLocation(Zone.CenterLocation);
			SphereComp->SetSphereRadius(Zone.Radius);
			SphereComp->SetCollisionEnabled(ECollisionEnabled::NoCollision);
			SphereComp->SetVisibility(false);
			DebugSphereComponents.Add(SphereComp);
		}
	}

	for (const FVector& Tower : SignalTowers)
	{
		if (bDebugDrawDeadZones)
		{
			DrawDebugCylinder(
				GetWorld(),
				Tower,
				Tower + FVector(0, 0, 100.f),
				30.f,
				16,
				FColor::Green,
				false,
				DebugDrawDuration,
				0,
				2.f
			);

			DrawDebugSphere(
				GetWorld(),
				Tower + FVector(0, 0, 50.f),
				2000.f,
				32,
				FColor(0, 255, 0, 30),
				false,
				DebugDrawDuration,
				0,
				0.5f
			);
		}
	}
}
