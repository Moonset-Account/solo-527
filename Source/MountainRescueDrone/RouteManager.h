#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MountainRescueTypes.h"
#include "RouteManager.generated.h"

class AWaypointActor;
class ADroneBase;
class USplineComponent;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnWaypointAdded, int32, Index, AWaypointActor*, Waypoint);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnWaypointRemoved, int32, Index, AWaypointActor*, Waypoint);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnRouteChanged);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnRouteValidationFailed);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnWaypointReached, int32, WaypointIndex);

UCLASS(Blueprintable)
class MOUNTAINRESCUEDRONE_API ARouteManager : public AActor
{
	GENERATED_BODY()

public:
	ARouteManager();

protected:
	virtual void BeginPlay() override;

public:
	virtual void Tick(float DeltaTime) override;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<USplineComponent> RouteSpline;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线配置")
	TSubclassOf<AWaypointActor> WaypointActorClass;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线配置")
	float MinDistanceBetweenWaypoints = 50.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线配置")
	float DefaultAltitude = 150.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线配置")
	int32 MaxWaypoints = 20;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线配置")
	bool bReturnToHomeRequired = true;

	UPROPERTY(BlueprintReadOnly, Category = "航线状态")
	TArray<TObjectPtr<AWaypointActor>> WaypointActors;

	UPROPERTY(BlueprintReadOnly, Category = "航线状态")
	TArray<FWaypoint> WaypointData;

	UPROPERTY(BlueprintReadOnly, Category = "航线状态")
	int32 CurrentWaypointIndex = INDEX_NONE;

	UPROPERTY(BlueprintReadOnly, Category = "航线状态")
	int32 SelectedWaypointIndex = INDEX_NONE;

	UPROPERTY(BlueprintReadOnly, Category = "航线状态")
	bool bIsRouteValid = false;

	UPROPERTY(BlueprintReadOnly, Category = "航线状态")
	float TotalRouteDistance = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "航线状态")
	float EstimatedBatteryCost = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "航线状态")
	float EstimatedFlightTime = 0.f;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnWaypointAdded OnWaypointAdded;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnWaypointRemoved OnWaypointRemoved;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnRouteChanged OnRouteChanged;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnRouteValidationFailed OnRouteValidationFailed;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnWaypointReached OnWaypointReached;

public:
	UFUNCTION(BlueprintCallable, Category = "航线|编辑")
	int32 AddWaypointAtLocation(FVector WorldLocation, bool bIsDeliveryPoint = false, int32 TargetIndex = -1);

	UFUNCTION(BlueprintCallable, Category = "航线|编辑")
	bool RemoveWaypoint(int32 Index);

	UFUNCTION(BlueprintCallable, Category = "航线|编辑")
	bool InsertWaypoint(int32 InsertIndex, FVector WorldLocation);

	UFUNCTION(BlueprintCallable, Category = "航线|编辑")
	bool MoveWaypoint(int32 Index, FVector NewLocation);

	UFUNCTION(BlueprintCallable, Category = "航线|编辑")
	bool SetWaypointDelivery(int32 Index, bool bIsDelivery, ESupplyType Supply, int32 TargetIndex);

	UFUNCTION(BlueprintCallable, Category = "航线|编辑")
	void ClearRoute();

	UFUNCTION(BlueprintCallable, Category = "航线|编辑")
	void SelectWaypoint(int32 Index);

	UFUNCTION(BlueprintCallable, Category = "航线|编辑")
	void AutoGenerateReturnHome(FVector HomeLocation);

	UFUNCTION(BlueprintCallable, Category = "航线|验证")
	bool ValidateRoute(const FTaskConfig& TaskConfig, FText& OutFailureReason);

	UFUNCTION(BlueprintCallable, Category = "航线|执行")
	void StartRouteExecution();

	UFUNCTION(BlueprintCallable, Category = "航线|执行")
	void StopRouteExecution();

	UFUNCTION(BlueprintCallable, Category = "航线|执行")
	void AdvanceToNextWaypoint();

	UFUNCTION(BlueprintCallable, Category = "航线|执行")
	bool IsLastWaypointReached() const;

	UFUNCTION(BlueprintCallable, Category = "航线|查询")
	AWaypointActor* GetWaypointActor(int32 Index) const;

	UFUNCTION(BlueprintCallable, Category = "航线|查询")
	const FWaypoint& GetWaypointData(int32 Index) const;

	UFUNCTION(BlueprintCallable, Category = "航线|查询")
	int32 GetWaypointCount() const { return WaypointData.Num(); }

	UFUNCTION(BlueprintCallable, Category = "航线|查询")
	TArray<FVector> GetPathPoints() const;

	UFUNCTION(BlueprintCallable, Category = "航线|查询")
	float CalculateBatteryRequirement() const;

	UFUNCTION(BlueprintCallable, Category = "航线|查询")
	void UpdateRouteEstimates(ADroneBase* Drone);

	UFUNCTION(BlueprintCallable, Category = "航线|查询")
	FVector GetNextWaypointLocation() const;

	UFUNCTION(BlueprintCallable, Category = "航线|查询")
	TArray<int32> GetWaypointsWithDeadZones(class ASignalSystem* SignalSystem) const;

protected:
	UPROPERTY()
	TWeakObjectPtr<ADroneBase> AssociatedDrone;

	bool bIsExecuting = false;
	float WaypointHoverTimer = 0.f;

	virtual void UpdateSpline();
	virtual void CheckWaypointReached();
	virtual void ExecuteWaypointAction(int32 Index);
};
