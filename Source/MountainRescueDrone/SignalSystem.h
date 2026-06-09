#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MountainRescueTypes.h"
#include "Components/SphereComponent.h"
#include "SignalSystem.generated.h"

UCLASS(Blueprintable)
class MOUNTAINRESCUEDRONE_API ASignalSystem : public AActor
{
	GENERATED_BODY()

public:
	ASignalSystem();

protected:
	virtual void BeginPlay() override;

public:
	virtual void Tick(float DeltaTime) override;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "信号配置")
	TArray<FSignalDeadZone> DeadZones;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "信号基站")
	TArray<FVector> SignalTowers;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "调试", meta = (ToolTip = "是否显示信号盲区调试球体"))
	bool bDebugDrawDeadZones = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "调试")
	float DebugDrawDuration = -1.f;

public:
	UFUNCTION(BlueprintCallable, Category = "信号")
	void ConfigureDeadZones(const TArray<FSignalDeadZone>& NewDeadZones);

	UFUNCTION(BlueprintCallable, Category = "信号")
	void AddDeadZone(const FSignalDeadZone& NewZone);

	UFUNCTION(BlueprintCallable, Category = "信号")
	void RemoveDeadZone(int32 Index);

	UFUNCTION(BlueprintCallable, Category = "信号|查询")
	float GetSignalBlockAtLocation(FVector Location) const;

	UFUNCTION(BlueprintCallable, Category = "信号|查询")
	bool IsInDeadZone(FVector Location, FSignalDeadZone& OutZone) const;

	UFUNCTION(BlueprintCallable, Category = "信号|查询")
	float GetDistanceToNearestTower(FVector Location) const;

protected:
	UPROPERTY()
	TArray<TObjectPtr<USphereComponent>> DebugSphereComponents;

	virtual void DrawDebugZones();
};
