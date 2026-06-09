#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Pawn.h"
#include "MountainRescueTypes.h"
#include "DroneBase.generated.h"

class UStaticMeshComponent;
class UArrowComponent;
class UNiagaraSystem;
class UAudioComponent;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnBatteryChanged, float, NewBatteryPercent);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSignalChanged, float, NewSignalStrength);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnLowBatteryWarning);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnSignalLost);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnSignalRestored);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSupplyDropped, ESupplyType, DroppedSupply);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnBatteryDepleted);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnDroneCrashed);

UCLASS(Abstract, Blueprintable)
class MOUNTAINRESCUEDRONE_API ADroneBase : public APawn
{
	GENERATED_BODY()

public:
	ADroneBase();

protected:
	virtual void BeginPlay() override;

public:
	virtual void Tick(float DeltaTime) override;
	virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UStaticMeshComponent> DroneMesh;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UArrowComponent> CameraArrow;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<USceneComponent> PropellerGroup;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "配置")
	FDroneFlightParams FlightParams;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "配置")
	FVector HomeLocation;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "视觉效果")
	TObjectPtr<UNiagaraSystem> DropEffect;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "视觉效果")
	TObjectPtr<UNiagaraSystem> CrashEffect;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	FDroneStatusReport CurrentStatus;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	TArray<FSupplyPayload> CurrentPayload;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	float CurrentFlightTime = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	float TotalDistanceTraveled = 0.f;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnBatteryChanged OnBatteryChanged;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnSignalChanged OnSignalChanged;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnLowBatteryWarning OnLowBatteryWarning;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnSignalLost OnSignalLost;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnSignalRestored OnSignalRestored;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnSupplyDropped OnSupplyDropped;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnBatteryDepleted OnBatteryDepleted;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnDroneCrashed OnDroneCrashed;

public:
	UFUNCTION(BlueprintCallable, Category = "无人机|控制")
	void InitializeDrone(const FTaskConfig& TaskConfig);

	UFUNCTION(BlueprintCallable, Category = "无人机|控制")
	void SetTargetVelocity(const FVector& NewVelocity);

	UFUNCTION(BlueprintCallable, Category = "无人机|控制")
	void FlyToLocation(const FVector& TargetLocation, float ArrivalTolerance = 100.f);

	UFUNCTION(BlueprintCallable, Category = "无人机|控制")
	void HoverInPlace(float HoverDuration = -1.f);

	UFUNCTION(BlueprintCallable, Category = "无人机|控制")
	void ReturnToHome();

	UFUNCTION(BlueprintCallable, Category = "无人机|控制")
	void EmergencyLand();

	UFUNCTION(BlueprintCallable, Category = "无人机|物资")
	bool DropSupply(ESupplyType SupplyType, FVector DropLocation);

	UFUNCTION(BlueprintCallable, Category = "无人机|物资")
	void AddSupply(ESupplyType SupplyType, int32 Count, float UnitWeight);

	UFUNCTION(BlueprintCallable, Category = "无人机|物资")
	int32 GetSupplyCount(ESupplyType SupplyType) const;

	UFUNCTION(BlueprintCallable, Category = "无人机|物资")
	float GetTotalPayloadWeight() const;

	UFUNCTION(BlueprintCallable, Category = "无人机|状态")
	bool IsBatteryLow() const { return CurrentStatus.BatteryPercent <= FlightParams.LowBatteryThreshold; }

	UFUNCTION(BlueprintCallable, Category = "无人机|状态")
	bool IsSignalLost() const { return CurrentStatus.bIsSignalLost; }

	UFUNCTION(BlueprintCallable, Category = "无人机|状态")
	float GetBatteryPercent() const { return CurrentStatus.BatteryPercent; }

	UFUNCTION(BlueprintCallable, Category = "无人机|状态")
	float GetSignalStrength() const { return CurrentStatus.SignalStrength; }

	UFUNCTION(BlueprintCallable, Category = "无人机|状态")
	float GetEstimatedFlightTimeRemaining() const;

	UFUNCTION(BlueprintCallable, Category = "无人机|状态")
	FVector GetCurrentVelocity() const { return CurrentVelocity; }

	UFUNCTION(BlueprintCallable, Category = "无人机|状态")
	bool HasReachedLocation(const FVector& Location, float Tolerance = 100.f) const;

	UFUNCTION(BlueprintCallable, Category = "无人机|计算")
	float CalculateBatteryCostForPath(const TArray<FVector>& PathPoints, float& OutEstimatedTime) const;

	UFUNCTION(BlueprintCallable, Category = "无人机|计算")
	float CalculateWindEffect() const;

protected:
	FVector CurrentVelocity;
	FVector TargetVelocity;
	bool bIsFlyingToTarget = false;
	FVector FlyTargetLocation;
	float FlyTolerance = 100.f;
	bool bIsHovering = false;
	float HoverRemainingTime = -1.f;
	bool bIsReturningHome = false;
	bool bHasCrashed = false;
	bool bLowBatteryWarningFired = false;

	FVector LastLocation;

	UPROPERTY()
	const class AWeatherSystem* CachedWeatherSystem;

	UPROPERTY()
	const class ASignalSystem* CachedSignalSystem;

	virtual void UpdateFlightPhysics(float DeltaTime);
	virtual void UpdateBattery(float DeltaTime);
	virtual void UpdateSignalStrength(float DeltaTime);
	virtual void UpdatePayloadWeight();
	virtual void ApplyWindEffect(float DeltaTime);
	virtual void CheckTerrainCollision();

	UFUNCTION()
	virtual void HandleBatteryDepleted();

	UFUNCTION()
	virtual void HandleSignalLost();

	UFUNCTION()
	virtual void HandleSignalRestored();

	UFUNCTION(BlueprintNativeEvent, Category = "无人机|动画")
	void UpdatePropellerAnimation(float DeltaTime);
	virtual void UpdatePropellerAnimation_Implementation(float DeltaTime) {}

	UFUNCTION(BlueprintNativeEvent, Category = "无人机|音效")
	void PlayEngineSound(float DeltaTime);
	virtual void PlayEngineSound_Implementation(float DeltaTime) {}

	UFUNCTION(BlueprintNativeEvent, Category = "无人机|音效")
	void PlayLowBatteryBeep();
	virtual void PlayLowBatteryBeep_Implementation() {}

	UFUNCTION(BlueprintNativeEvent, Category = "无人机|视觉")
	void PlayDropVFX(ESupplyType SupplyType);
	virtual void PlayDropVFX_Implementation(ESupplyType SupplyType);

	UFUNCTION(BlueprintNativeEvent, Category = "无人机|视觉")
	void PlayCrashVFX();
	virtual void PlayCrashVFX_Implementation();
};
