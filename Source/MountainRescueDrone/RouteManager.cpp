#include "RouteManager.h"
#include "WaypointActor.h"
#include "DroneBase.h"
#include "SignalSystem.h"
#include "Components/SplineComponent.h"
#include "EngineUtils.h"
#include "MountainRescueDrone.h"

ARouteManager::ARouteManager()
{
	PrimaryActorTick.bCanEverTick = true;

	RouteSpline = CreateDefaultSubobject<USplineComponent>(TEXT("RouteSpline"));
	RootComponent = RouteSpline;
	RouteSpline->SetDrawDebug(true);
	RouteSpline->SetSplineColor(FColor::Cyan);
	RouteSpline->SetUnselectedSplineSegmentColor(FColor::Cyan);
	RouteSpline->SetSelectedSplineSegmentColor(FColor::Yellow);
}

void ARouteManager::BeginPlay()
{
	Super::BeginPlay();
	UpdateSpline();
}

void ARouteManager::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	if (bIsExecuting && AssociatedDrone.IsValid() && CurrentWaypointIndex != INDEX_NONE)
	{
		if (CurrentWaypointIndex >= 0 && CurrentWaypointIndex < WaypointData.Num())
		{
			CheckWaypointReached();
		}
	}
}

int32 ARouteManager::AddWaypointAtLocation(FVector WorldLocation, bool bIsDeliveryPoint, int32 TargetIndex)
{
	if (WaypointData.Num() >= MaxWaypoints)
	{
		UE_LOG(LogMountainRescue, Warning, TEXT("已达到最大航线点数量: %d"), MaxWaypoints);
		return INDEX_NONE;
	}

	if (WaypointData.Num() > 0)
	{
		float LastDist = FVector::Dist(WaypointData.Last().Location, WorldLocation);
		if (LastDist < MinDistanceBetweenWaypoints)
		{
			UE_LOG(LogMountainRescue, Warning, TEXT("航线点距离过近 (%.1fm < %.1fm)"), LastDist, MinDistanceBetweenWaypoints);
			return INDEX_NONE;
		}
	}

	FWaypoint NewWaypoint;
	NewWaypoint.Location = WorldLocation;
	NewWaypoint.DesiredAltitude = WorldLocation.Z > DefaultAltitude ? WorldLocation.Z + 30.f : DefaultAltitude;
	NewWaypoint.Location.Z = NewWaypoint.DesiredAltitude;
	NewWaypoint.bIsDeliveryPoint = bIsDeliveryPoint;
	NewWaypoint.AssociatedTargetIndex = TargetIndex;

	int32 NewIndex = WaypointData.Add(NewWaypoint);

	if (WaypointActorClass)
	{
		FActorSpawnParameters Params;
		Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
		AWaypointActor* NewActor = GetWorld()->SpawnActor<AWaypointActor>(
			WaypointActorClass, NewWaypoint.Location, FRotator::ZeroRotator, Params);

		if (NewActor)
		{
			NewActor->WaypointIndex = NewIndex;
			NewActor->SetWaypointData(NewWaypoint);
			WaypointActors.Add(NewActor);
		}
	}

	UpdateSpline();
	OnWaypointAdded.Broadcast(NewIndex, WaypointActors.IsValidIndex(NewIndex) ? WaypointActors[NewIndex] : nullptr);
	OnRouteChanged.Broadcast();

	return NewIndex;
}

bool ARouteManager::RemoveWaypoint(int32 Index)
{
	if (!WaypointData.IsValidIndex(Index)) return false;

	if (WaypointActors.IsValidIndex(Index))
	{
		AWaypointActor* RemovedActor = WaypointActors[Index];
		OnWaypointRemoved.Broadcast(Index, RemovedActor);
		if (RemovedActor)
		{
			RemovedActor->Destroy();
		}
		WaypointActors.RemoveAt(Index);
	}

	WaypointData.RemoveAt(Index);

	for (int32 i = Index; i < WaypointActors.Num(); i++)
	{
		if (WaypointActors[i])
		{
			WaypointActors[i]->WaypointIndex = i;
			WaypointActors[i]->UpdateLabels();
		}
	}

	if (SelectedWaypointIndex >= WaypointData.Num())
	{
		SelectedWaypointIndex = WaypointData.Num() - 1;
	}

	UpdateSpline();
	OnRouteChanged.Broadcast();
	return true;
}

bool ARouteManager::InsertWaypoint(int32 InsertIndex, FVector WorldLocation)
{
	if (WaypointData.Num() >= MaxWaypoints) return false;
	if (InsertIndex < 0 || InsertIndex > WaypointData.Num()) return false;

	FWaypoint NewWaypoint;
	NewWaypoint.Location = WorldLocation;
	NewWaypoint.DesiredAltitude = WorldLocation.Z > DefaultAltitude ? WorldLocation.Z + 30.f : DefaultAltitude;
	NewWaypoint.Location.Z = NewWaypoint.DesiredAltitude;

	WaypointData.Insert(NewWaypoint, InsertIndex);

	if (WaypointActorClass)
	{
		FActorSpawnParameters Params;
		Params.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;
		AWaypointActor* NewActor = GetWorld()->SpawnActor<AWaypointActor>(
			WaypointActorClass, NewWaypoint.Location, FRotator::ZeroRotator, Params);

		if (NewActor)
		{
			NewActor->WaypointIndex = InsertIndex;
			NewActor->SetWaypointData(NewWaypoint);
			WaypointActors.Insert(NewActor, InsertIndex);
		}
	}

	for (int32 i = InsertIndex; i < WaypointActors.Num(); i++)
	{
		if (WaypointActors[i])
		{
			WaypointActors[i]->WaypointIndex = i;
			WaypointActors[i]->UpdateLabels();
		}
	}

	UpdateSpline();
	OnWaypointAdded.Broadcast(InsertIndex, WaypointActors.IsValidIndex(InsertIndex) ? WaypointActors[InsertIndex] : nullptr);
	OnRouteChanged.Broadcast();
	return true;
}

bool ARouteManager::MoveWaypoint(int32 Index, FVector NewLocation)
{
	if (!WaypointData.IsValidIndex(Index)) return false;

	WaypointData[Index].Location = NewLocation;
	WaypointData[Index].DesiredAltitude = NewLocation.Z;

	if (WaypointActors.IsValidIndex(Index) && WaypointActors[Index])
	{
		WaypointActors[Index]->SetActorLocation(NewLocation);
		WaypointActors[Index]->WaypointData.Location = NewLocation;
		WaypointActors[Index]->WaypointData.DesiredAltitude = NewLocation.Z;
		WaypointActors[Index]->UpdateLabels();
	}

	UpdateSpline();
	OnRouteChanged.Broadcast();
	return true;
}

bool ARouteManager::SetWaypointDelivery(int32 Index, bool bIsDelivery, ESupplyType Supply, int32 TargetIndex)
{
	if (!WaypointData.IsValidIndex(Index)) return false;

	WaypointData[Index].bIsDeliveryPoint = bIsDelivery;
	WaypointData[Index].SupplyToDrop = Supply;
	WaypointData[Index].AssociatedTargetIndex = TargetIndex;

	if (WaypointActors.IsValidIndex(Index) && WaypointActors[Index])
	{
		WaypointActors[Index]->SetWaypointData(WaypointData[Index]);
	}

	OnRouteChanged.Broadcast();
	return true;
}

void ARouteManager::ClearRoute()
{
	for (AWaypointActor* Actor : WaypointActors)
	{
		if (Actor) Actor->Destroy();
	}
	WaypointActors.Empty();
	WaypointData.Empty();
	CurrentWaypointIndex = INDEX_NONE;
	SelectedWaypointIndex = INDEX_NONE;
	bIsRouteValid = false;

	UpdateSpline();
	OnRouteChanged.Broadcast();
}

void ARouteManager::SelectWaypoint(int32 Index)
{
	if (SelectedWaypointIndex >= 0 && SelectedWaypointIndex < WaypointActors.Num())
	{
		if (WaypointActors[SelectedWaypointIndex])
		{
			WaypointActors[SelectedWaypointIndex]->UpdateVisualState(false, false, false);
		}
	}

	SelectedWaypointIndex = Index;

	if (SelectedWaypointIndex >= 0 && SelectedWaypointIndex < WaypointActors.Num())
	{
		if (WaypointActors[SelectedWaypointIndex])
		{
			WaypointActors[SelectedWaypointIndex]->UpdateVisualState(true, false, false);
		}
	}
}

void ARouteManager::AutoGenerateReturnHome(FVector HomeLocation)
{
	if (!bReturnToHomeRequired) return;

	if (WaypointData.Num() > 0)
	{
		int32 LastIndex = WaypointData.Num() - 1;
		if (FVector::Dist(WaypointData[LastIndex].Location, HomeLocation) < 100.f)
		{
			return;
		}
	}

	AddWaypointAtLocation(HomeLocation, false, INDEX_NONE);
}

bool ARouteManager::ValidateRoute(const FTaskConfig& TaskConfig, FText& OutFailureReason)
{
	bIsRouteValid = false;

	if (WaypointData.Num() < 2)
	{
		OutFailureReason = FText::FromString(TEXT("航线至少需要2个点（起飞+返航）"));
		return false;
	}

	if (bReturnToHomeRequired)
	{
		int32 LastIndex = WaypointData.Num() - 1;
		float HomeDist = FVector::Dist(WaypointData[LastIndex].Location, TaskConfig.HomeLocation);
		if (HomeDist > 200.f)
		{
			OutFailureReason = FText::FromString(TEXT("航线终点必须返回起点（Home）"));
			return false;
		}
	}

	float EstimatedCost = 0.f;
	float EstimatedTime = 0.f;
	for (int32 i = 0; i < WaypointData.Num() - 1; i++)
	{
		float SegmentCost = FVector::Dist(WaypointData[i].Location, WaypointData[i + 1].Location);
		EstimatedCost += SegmentCost;
	}
	EstimatedCost *= TaskConfig.FlightParams.BaseBatteryDrainPerSecond / TaskConfig.FlightParams.MaxHorizontalSpeed;
	EstimatedCost *= 1.5f;
	EstimatedTime = EstimatedCost / TaskConfig.FlightParams.BaseBatteryDrainPerSecond;

	float PayloadWeight = 0.f;
	for (const FSupplyPayload& P : TaskConfig.InitialPayload)
	{
		PayloadWeight += P.GetTotalWeight();
	}
	if (PayloadWeight > TaskConfig.FlightParams.MaxPayloadWeight * 0.7f)
	{
		EstimatedCost *= TaskConfig.FlightParams.HeavyLoadBatteryMultiplier;
	}

	if (EstimatedCost > TaskConfig.InitialBatteryPercent)
	{
		OutFailureReason = FText::FromString(FString::Printf(
			TEXT("电量不足！预估消耗 %.0f%% ，当前 %.0f%%"),
			EstimatedCost * 100.f, TaskConfig.InitialBatteryPercent * 100.f));
		return false;
	}

	int32 DeliveryPointCount = 0;
	for (const FWaypoint& WP : WaypointData)
	{
		if (WP.bIsDeliveryPoint) DeliveryPointCount++;
	}
	if (DeliveryPointCount < TaskConfig.RescueTargets.Num() && TaskConfig.RescueTargets.Num() > 0)
	{
		OutFailureReason = FText::FromString(FString::Printf(
			TEXT("投放点数量不足：需要 %d 个，实际 %d 个"),
			TaskConfig.RescueTargets.Num(), DeliveryPointCount));
	}

	TotalRouteDistance = EstimatedCost * TaskConfig.FlightParams.MaxHorizontalSpeed / TaskConfig.FlightParams.BaseBatteryDrainPerSecond;
	EstimatedBatteryCost = EstimatedCost;
	EstimatedFlightTime = EstimatedTime;

	bIsRouteValid = true;
	return true;
}

void ARouteManager::StartRouteExecution()
{
	if (!bIsRouteValid || WaypointData.Num() < 2) return;

	bIsExecuting = true;
	CurrentWaypointIndex = 0;

	for (TActorIterator<ADroneBase> It(GetWorld()); It; ++It)
	{
		AssociatedDrone = *It;
		break;
	}

	if (AssociatedDrone.IsValid() && CurrentWaypointIndex < WaypointData.Num())
	{
		AssociatedDrone->FlyToLocation(WaypointData[CurrentWaypointIndex].Location, 50.f);
	}
}

void ARouteManager::StopRouteExecution()
{
	bIsExecuting = false;
}

void ARouteManager::AdvanceToNextWaypoint()
{
	if (!bIsExecuting) return;

	CurrentWaypointIndex++;
	if (CurrentWaypointIndex >= WaypointData.Num())
	{
		CurrentWaypointIndex = INDEX_NONE;
		bIsExecuting = false;
		UE_LOG(LogMountainRescue, Log, TEXT("航线执行完毕"));
		return;
	}

	if (AssociatedDrone.IsValid())
	{
		AssociatedDrone->FlyToLocation(WaypointData[CurrentWaypointIndex].Location, 50.f);
	}
}

bool ARouteManager::IsLastWaypointReached() const
{
	return CurrentWaypointIndex >= WaypointData.Num() - 1 || CurrentWaypointIndex == INDEX_NONE;
}

AWaypointActor* ARouteManager::GetWaypointActor(int32 Index) const
{
	return WaypointActors.IsValidIndex(Index) ? WaypointActors[Index] : nullptr;
}

const FWaypoint& ARouteManager::GetWaypointData(int32 Index) const
{
	return WaypointData[Index];
}

TArray<FVector> ARouteManager::GetPathPoints() const
{
	TArray<FVector> Points;
	for (const FWaypoint& WP : WaypointData)
	{
		Points.Add(WP.Location);
	}
	return Points;
}

float ARouteManager::CalculateBatteryRequirement() const
{
	if (WaypointData.Num() < 2) return 0.f;

	float Total = 0.f;
	for (int32 i = 0; i < WaypointData.Num() - 1; i++)
	{
		float Dist = FVector::Dist(WaypointData[i].Location, WaypointData[i + 1].Location);
		Total += Dist;
	}
	return Total;
}

void ARouteManager::UpdateRouteEstimates(ADroneBase* Drone)
{
	if (!Drone) return;

	TArray<FVector> Points = GetPathPoints();
	float EstTime = 0.f;
	EstimatedBatteryCost = Drone->CalculateBatteryCostForPath(Points, EstTime);
	EstimatedFlightTime = EstTime;

	TotalRouteDistance = 0.f;
	for (int32 i = 0; i < WaypointData.Num() - 1; i++)
	{
		TotalRouteDistance += FVector::Dist(WaypointData[i].Location, WaypointData[i + 1].Location);
	}
}

FVector ARouteManager::GetNextWaypointLocation() const
{
	if (CurrentWaypointIndex >= 0 && CurrentWaypointIndex < WaypointData.Num())
	{
		return WaypointData[CurrentWaypointIndex].Location;
	}
	return FVector::ZeroVector;
}

TArray<int32> ARouteManager::GetWaypointsWithDeadZones(ASignalSystem* SignalSystem) const
{
	TArray<int32> Result;
	if (!SignalSystem) return Result;

	for (int32 i = 0; i < WaypointData.Num(); i++)
	{
		float Block = SignalSystem->GetSignalBlockAtLocation(WaypointData[i].Location);
		if (Block > 0.5f)
		{
			Result.Add(i);
		}
	}
	return Result;
}

void ARouteManager::UpdateSpline()
{
	RouteSpline->ClearSplinePoints(false);

	for (const FWaypoint& WP : WaypointData)
	{
		RouteSpline->AddSplinePoint(WP.Location, ESplineCoordinateSpace::World, false);
	}

	RouteSpline->UpdateSpline();
}

void ARouteManager::CheckWaypointReached()
{
	if (!AssociatedDrone.IsValid() || CurrentWaypointIndex < 0) return;

	const FWaypoint& CurrentWP = WaypointData[CurrentWaypointIndex];

	if (WaypointHoverTimer > 0.f)
	{
		WaypointHoverTimer -= GetWorld()->GetDeltaSeconds();
		if (WaypointHoverTimer <= 0.f)
		{
			WaypointHoverTimer = 0.f;
			OnWaypointReached.Broadcast(CurrentWaypointIndex);
			ExecuteWaypointAction(CurrentWaypointIndex);
			AdvanceToNextWaypoint();
		}
		return;
	}

	if (AssociatedDrone->HasReachedLocation(CurrentWP.Location, 50.f))
	{
		WaypointHoverTimer = CurrentWP.HoverTime;
		AssociatedDrone->HoverInPlace(WaypointHoverTimer > 0.f ? WaypointHoverTimer : 1.f);

		if (WaypointHoverTimer <= 0.f)
		{
			WaypointHoverTimer = 0.5f;
		}
	}
}

void ARouteManager::ExecuteWaypointAction(int32 Index)
{
	if (!WaypointData.IsValidIndex(Index) || !AssociatedDrone.IsValid()) return;

	const FWaypoint& WP = WaypointData[Index];
	if (WP.bIsDeliveryPoint && WP.SupplyToDrop != ESupplyType::MAX)
	{
		FVector DropLoc = WP.Location;
		DropLoc.Z -= 50.f;
		AssociatedDrone->DropSupply(WP.SupplyToDrop, DropLoc);
	}
}
