#include "DroneBase.h"
#include "Components/StaticMeshComponent.h"
#include "Components/ArrowComponent.h"
#include "WeatherSystem.h"
#include "SignalSystem.h"
#include "NiagaraFunctionLibrary.h"
#include "EngineUtils.h"
#include "MountainRescueDrone.h"

ADroneBase::ADroneBase()
{
	PrimaryActorTick.bCanEverTick = true;

	DroneMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("DroneMesh"));
	RootComponent = DroneMesh;
	DroneMesh->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
	DroneMesh->SetCollisionProfileName(TEXT("Pawn"));

	CameraArrow = CreateDefaultSubobject<UArrowComponent>(TEXT("CameraArrow"));
	CameraArrow->SetupAttachment(RootComponent);
	CameraArrow->SetRelativeLocation(FVector(-300.f, 0.f, 150.f));

	PropellerGroup = CreateDefaultSubobject<USceneComponent>(TEXT("PropellerGroup"));
	PropellerGroup->SetupAttachment(RootComponent);

	CurrentVelocity = FVector::ZeroVector;
	TargetVelocity = FVector::ZeroVector;

	AutoPossessPlayer = EAutoReceiveInput::Player0;
}

void ADroneBase::BeginPlay()
{
	Super::BeginPlay();

	LastLocation = GetActorLocation();
	HomeLocation = GetActorLocation();

	for (TActorIterator<AWeatherSystem> It(GetWorld()); It; ++It)
	{
		CachedWeatherSystem = *It;
		break;
	}

	for (TActorIterator<ASignalSystem> It(GetWorld()); It; ++It)
	{
		CachedSignalSystem = *It;
		break;
	}

	CurrentStatus.BatteryPercent = 1.f;
	CurrentStatus.SignalStrength = 1.f;
	UpdatePayloadWeight();
}

void ADroneBase::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	if (bHasCrashed) return;

	CurrentFlightTime += DeltaTime;

	UpdateFlightPhysics(DeltaTime);
	UpdateBattery(DeltaTime);
	UpdateSignalStrength(DeltaTime);
	ApplyWindEffect(DeltaTime);
	CheckTerrainCollision();
	UpdatePropellerAnimation(DeltaTime);
	PlayEngineSound(DeltaTime);

	float DistanceThisFrame = FVector::Dist(LastLocation, GetActorLocation());
	TotalDistanceTraveled += DistanceThisFrame;
	LastLocation = GetActorLocation();

	CurrentStatus.CurrentSpeed = CurrentVelocity.Size();
	CurrentStatus.CurrentVelocity = CurrentVelocity;
	CurrentStatus.EstimatedRangeRemaining = GetEstimatedFlightTimeRemaining() * CurrentStatus.CurrentSpeed;

	if (IsBatteryLow() && !bLowBatteryWarningFired)
	{
		bLowBatteryWarningFired = true;
		OnLowBatteryWarning.Broadcast();
		PlayLowBatteryBeep();
	}

	if (bIsFlyingToTarget)
	{
		if (HasReachedLocation(FlyTargetLocation, FlyTolerance))
		{
			bIsFlyingToTarget = false;
			SetTargetVelocity(FVector::ZeroVector);
		}
	}
}

void ADroneBase::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);
}

void ADroneBase::InitializeDrone(const FTaskConfig& TaskConfig)
{
	FlightParams = TaskConfig.FlightParams;
	HomeLocation = TaskConfig.HomeLocation;
	CurrentPayload = TaskConfig.InitialPayload;
	CurrentStatus.BatteryPercent = TaskConfig.InitialBatteryPercent;
	bLowBatteryWarningFired = false;
	bHasCrashed = false;
	CurrentFlightTime = 0.f;
	TotalDistanceTraveled = 0.f;
	UpdatePayloadWeight();

	OnBatteryChanged.Broadcast(CurrentStatus.BatteryPercent);
	OnSignalChanged.Broadcast(CurrentStatus.SignalStrength);
}

void ADroneBase::SetTargetVelocity(const FVector& NewVelocity)
{
	TargetVelocity = NewVelocity;
}

void ADroneBase::FlyToLocation(const FVector& TargetLocation, float ArrivalTolerance)
{
	bIsFlyingToTarget = true;
	FlyTargetLocation = TargetLocation;
	FlyTolerance = ArrivalTolerance;
	bIsHovering = false;
	bIsReturningHome = false;

	FVector ToTarget = TargetLocation - GetActorLocation();
	ToTarget.Z = 0.f;
	float Distance = ToTarget.Size();

	if (Distance > 0.f)
	{
		FVector DesiredVelocity = ToTarget.GetSafeNormal() * FMath::Min(Distance, FlightParams.MaxHorizontalSpeed);
		float VerticalDiff = TargetLocation.Z - GetActorLocation().Z;
		DesiredVelocity.Z = FMath::Clamp(VerticalDiff, -FlightParams.MaxVerticalSpeed, FlightParams.MaxVerticalSpeed);
		SetTargetVelocity(DesiredVelocity);
	}
}

void ADroneBase::HoverInPlace(float HoverDuration)
{
	bIsHovering = true;
	HoverRemainingTime = HoverDuration;
	bIsFlyingToTarget = false;
	SetTargetVelocity(FVector::ZeroVector);
}

void ADroneBase::ReturnToHome()
{
	bIsReturningHome = true;
	FlyToLocation(HomeLocation, 50.f);
}

void ADroneBase::EmergencyLand()
{
	SetTargetVelocity(FVector(0.f, 0.f, -FlightParams.MaxVerticalSpeed * 0.5f));
	bIsHovering = false;
	bIsFlyingToTarget = false;
	bIsReturningHome = false;
}

bool ADroneBase::DropSupply(ESupplyType SupplyType, FVector DropLocation)
{
	for (FSupplyPayload& Payload : CurrentPayload)
	{
		if (Payload.SupplyType == SupplyType && Payload.Count > 0)
		{
			Payload.Count--;
			UpdatePayloadWeight();
			OnSupplyDropped.Broadcast(SupplyType);
			PlayDropVFX(SupplyType);

			if (Payload.Count == 0)
			{
				CurrentPayload.Remove(Payload);
			}

			UE_LOG(LogMountainRescue, Log, TEXT("无人机投放物资: %s, 剩余: %d"),
				*UEnum::GetValueAsString(SupplyType), Payload.Count);
			return true;
		}
	}

	UE_LOG(LogMountainRescue, Warning, TEXT("无法投放物资: %s - 库存不足"), *UEnum::GetValueAsString(SupplyType));
	return false;
}

void ADroneBase::AddSupply(ESupplyType SupplyType, int32 Count, float UnitWeight)
{
	for (FSupplyPayload& Payload : CurrentPayload)
	{
		if (Payload.SupplyType == SupplyType)
		{
			Payload.Count += Count;
			Payload.UnitWeightKg = UnitWeight;
			UpdatePayloadWeight();
			return;
		}
	}

	FSupplyPayload NewPayload;
	NewPayload.SupplyType = SupplyType;
	NewPayload.Count = Count;
	NewPayload.UnitWeightKg = UnitWeight;
	CurrentPayload.Add(NewPayload);
	UpdatePayloadWeight();
}

int32 ADroneBase::GetSupplyCount(ESupplyType SupplyType) const
{
	for (const FSupplyPayload& Payload : CurrentPayload)
	{
		if (Payload.SupplyType == SupplyType)
		{
			return Payload.Count;
		}
	}
	return 0;
}

float ADroneBase::GetTotalPayloadWeight() const
{
	float TotalWeight = 0.f;
	for (const FSupplyPayload& Payload : CurrentPayload)
	{
		TotalWeight += Payload.GetTotalWeight();
	}
	return TotalWeight;
}

float ADroneBase::GetEstimatedFlightTimeRemaining() const
{
	if (CurrentStatus.BatteryPercent <= 0.f) return 0.f;
	if (FlightParams.BaseBatteryDrainPerSecond <= 0.f) return 9999.f;

	float DrainRate = FlightParams.BaseBatteryDrainPerSecond;
	if (GetTotalPayloadWeight() > FlightParams.MaxPayloadWeight * 0.7f)
	{
		DrainRate *= FlightParams.HeavyLoadBatteryMultiplier;
	}
	if (bIsHovering)
	{
		DrainRate *= FlightParams.HoverBatteryMultiplier;
	}
	float WindEffect = CalculateWindEffect();
	DrainRate *= (1.f + WindEffect * 0.3f);

	return CurrentStatus.BatteryPercent / DrainRate;
}

bool ADroneBase::HasReachedLocation(const FVector& Location, float Tolerance) const
{
	return FVector::Dist2D(GetActorLocation(), Location) <= Tolerance
		&& FMath::Abs(GetActorLocation().Z - Location.Z) <= Tolerance * 0.5f;
}

float ADroneBase::CalculateBatteryCostForPath(const TArray<FVector>& PathPoints, float& OutEstimatedTime) const
{
	if (PathPoints.Num() < 2)
	{
		OutEstimatedTime = 0.f;
		return 0.f;
	}

	float TotalCost = 0.f;
	float TotalTime = 0.f;
	float Weight = GetTotalPayloadWeight();

	for (int32 i = 0; i < PathPoints.Num() - 1; i++)
	{
		FVector Start = PathPoints[i];
		FVector End = PathPoints[i + 1];
		float Distance = FVector::Dist(Start, End);
		float HeightDiff = FMath::Abs(End.Z - Start.Z);

		float SegmentTime = Distance / FlightParams.MaxHorizontalSpeed;
		SegmentTime += HeightDiff / FlightParams.MaxVerticalSpeed;
		TotalTime += SegmentTime;

		float SegmentCost = FlightParams.BaseBatteryDrainPerSecond * SegmentTime;

		if (Weight > FlightParams.MaxPayloadWeight * 0.7f)
		{
			SegmentCost *= FlightParams.HeavyLoadBatteryMultiplier;
		}

		if (HeightDiff > 50.f)
		{
			SegmentCost *= 1.2f;
		}

		TotalCost += SegmentCost;
	}

	TotalCost += TotalTime * 0.05f;
	OutEstimatedTime = TotalTime;
	return TotalCost;
}

float ADroneBase::CalculateWindEffect() const
{
	if (!CachedWeatherSystem) return 0.f;
	return CachedWeatherSystem->GetWindEffectOnDrone(GetActorLocation(), CurrentVelocity);
}

void ADroneBase::UpdateFlightPhysics(float DeltaTime)
{
	FVector VelocityDiff = TargetVelocity - CurrentVelocity;
	float AccelAmount = FlightParams.Acceleration * DeltaTime;

	if (VelocityDiff.Size() <= AccelAmount)
	{
		CurrentVelocity = TargetVelocity;
	}
	else
	{
		CurrentVelocity += VelocityDiff.GetSafeNormal() * AccelAmount;
	}

	CurrentVelocity.X = FMath::Clamp(CurrentVelocity.X, -FlightParams.MaxHorizontalSpeed, FlightParams.MaxHorizontalSpeed);
	CurrentVelocity.Y = FMath::Clamp(CurrentVelocity.Y, -FlightParams.MaxHorizontalSpeed, FlightParams.MaxHorizontalSpeed);
	CurrentVelocity.Z = FMath::Clamp(CurrentVelocity.Z, -FlightParams.MaxVerticalSpeed, FlightParams.MaxVerticalSpeed);

	if (bIsHovering && HoverRemainingTime > 0.f)
	{
		HoverRemainingTime -= DeltaTime;
		if (HoverRemainingTime <= 0.f)
		{
			bIsHovering = false;
		}
	}

	if (bIsFlyingToTarget)
	{
		FVector ToTarget = FlyTargetLocation - GetActorLocation();
		float RemainingDistance = ToTarget.Size();

		if (RemainingDistance > FlyTolerance * 0.5f)
		{
			FVector DesiredVelocity = ToTarget.GetSafeNormal() * FMath::Min(RemainingDistance * 2.f, FlightParams.MaxHorizontalSpeed);
			DesiredVelocity.Z = FMath::Clamp(ToTarget.Z * 2.f, -FlightParams.MaxVerticalSpeed, FlightParams.MaxVerticalSpeed);
			SetTargetVelocity(DesiredVelocity);
		}
	}

	AddActorWorldOffset(CurrentVelocity * DeltaTime, true);

	if (!CurrentVelocity.IsNearlyZero(0.1f))
	{
		FRotator TargetRot = CurrentVelocity.Rotation();
		TargetRot.Pitch = 0.f;
		SetActorRotation(FMath::RInterpTo(GetActorRotation(), TargetRot, DeltaTime, FlightParams.TurnRate / 90.f));
	}
}

void ADroneBase::UpdateBattery(float DeltaTime)
{
	if (CurrentStatus.BatteryPercent <= 0.f) return;

	float DrainRate = FlightParams.BaseBatteryDrainPerSecond;

	float Weight = GetTotalPayloadWeight();
	if (Weight > FlightParams.MaxPayloadWeight * 0.7f)
	{
		DrainRate *= FlightParams.HeavyLoadBatteryMultiplier;
	}

	if (bIsHovering)
	{
		DrainRate *= FlightParams.HoverBatteryMultiplier;
	}

	float WindEffect = CalculateWindEffect();
	if (WindEffect > 0.3f)
	{
		DrainRate *= FlightParams.HeadwindBatteryMultiplier;
	}

	float SpeedFactor = CurrentVelocity.Size() / FlightParams.MaxHorizontalSpeed;
	DrainRate *= (0.5f + 0.5f * SpeedFactor);

	CurrentStatus.BatteryPercent -= DrainRate * DeltaTime;

	if (CurrentStatus.BatteryPercent <= 0.f)
	{
		CurrentStatus.BatteryPercent = 0.f;
		CurrentStatus.bIsLowBattery = true;
		OnBatteryChanged.Broadcast(0.f);
		HandleBatteryDepleted();
		return;
	}

	CurrentStatus.bIsLowBattery = IsBatteryLow();
	OnBatteryChanged.Broadcast(CurrentStatus.BatteryPercent);
}

void ADroneBase::UpdateSignalStrength(float DeltaTime)
{
	float DistanceToHome = FVector::Dist2D(GetActorLocation(), HomeLocation);
	float NormalizedDistance = DistanceToHome / FlightParams.MaxSignalRange;
	float BaseSignal = 1.f - FMath::Clamp(NormalizedDistance, 0.f, 1.f);

	float DeadZoneEffect = 0.f;
	if (CachedSignalSystem)
	{
		DeadZoneEffect = CachedSignalSystem->GetSignalBlockAtLocation(GetActorLocation());
	}

	float AltitudeFactor = FMath::Clamp((GetActorLocation().Z - HomeLocation.Z + 100.f) / 500.f, 0.3f, 1.2f);
	BaseSignal *= AltitudeFactor;

	float NewSignal = FMath::Clamp(BaseSignal * (1.f - DeadZoneEffect), 0.f, 1.f);
	float SmoothSignal = FMath::Lerp(CurrentStatus.SignalStrength, NewSignal, DeltaTime * 2.f);

	bool bWasSignalLost = CurrentStatus.bIsSignalLost;
	CurrentStatus.SignalStrength = SmoothSignal;

	if (CurrentStatus.SignalStrength <= 0.01f)
	{
		CurrentStatus.SignalLostTimer += DeltaTime;
		if (CurrentStatus.SignalLostTimer >= FlightParams.SignalLostTimeout && !CurrentStatus.bIsSignalLost)
		{
			CurrentStatus.bIsSignalLost = true;
			HandleSignalLost();
		}
	}
	else
	{
		CurrentStatus.SignalLostTimer = 0.f;
		if (CurrentStatus.bIsSignalLost)
		{
			CurrentStatus.bIsSignalLost = false;
			HandleSignalRestored();
		}
	}

	OnSignalChanged.Broadcast(CurrentStatus.SignalStrength);
}

void ADroneBase::UpdatePayloadWeight()
{
	CurrentStatus.CurrentPayloadWeight = GetTotalPayloadWeight();
}

void ADroneBase::ApplyWindEffect(float DeltaTime)
{
	if (!CachedWeatherSystem) return;

	FVector WindVector = CachedWeatherSystem->GetWindVectorAtLocation(GetActorLocation());
	float WeightFactor = 1.f - FMath::Clamp(GetTotalPayloadWeight() / FlightParams.MaxPayloadWeight, 0.f, 0.7f);
	AddActorWorldOffset(WindVector * WeightFactor * DeltaTime, true);
}

void ADroneBase::CheckTerrainCollision()
{
	FHitResult HitResult;
	FVector Start = GetActorLocation();
	FVector End = Start - FVector(0, 0, 200.f);

	FCollisionQueryParams Params;
	Params.AddIgnoredActor(this);

	if (GetWorld()->LineTraceSingleByChannel(HitResult, Start, End, ECC_WorldStatic, Params))
	{
		float TerrainHeight = HitResult.ImpactPoint.Z;
		if (GetActorLocation().Z <= TerrainHeight + 10.f && CurrentVelocity.Z < -1.f)
		{
			bHasCrashed = true;
			SetActorLocation(FVector(GetActorLocation().X, GetActorLocation().Y, TerrainHeight + 10.f));
			SetTargetVelocity(FVector::ZeroVector);
			OnDroneCrashed.Broadcast();
			PlayCrashVFX();
			UE_LOG(LogMountainRescue, Error, TEXT("无人机撞山坠毁! 位置: %s"), *GetActorLocation().ToString());
		}
	}
}

void ADroneBase::HandleBatteryDepleted()
{
	UE_LOG(LogMountainRescue, Error, TEXT("无人机电量耗尽!"));
	OnBatteryDepleted.Broadcast();
	SetTargetVelocity(FVector(0.f, 0.f, -FlightParams.MaxVerticalSpeed));
}

void ADroneBase::HandleSignalLost()
{
	UE_LOG(LogMountainRescue, Warning, TEXT("无人机信号丢失超过%.1f秒, 允许返航但扣分"), FlightParams.SignalLostTimeout);
	OnSignalLost.Broadcast();
}

void ADroneBase::HandleSignalRestored()
{
	UE_LOG(LogMountainRescue, Log, TEXT("无人机信号恢复"));
	OnSignalRestored.Broadcast();
}

void ADroneBase::PlayDropVFX_Implementation(ESupplyType SupplyType)
{
	if (DropEffect)
	{
		UNiagaraFunctionLibrary::SpawnSystemAtLocation(GetWorld(), DropEffect, GetActorLocation());
	}
}

void ADroneBase::PlayCrashVFX_Implementation()
{
	if (CrashEffect)
	{
		UNiagaraFunctionLibrary::SpawnSystemAtLocation(GetWorld(), CrashEffect, GetActorLocation());
	}
}
