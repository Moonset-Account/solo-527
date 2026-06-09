#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MountainRescueTypes.h"
#include "DroppedSupply.generated.h"

class UStaticMeshComponent;
class UNiagaraComponent;
class UProjectileMovementComponent;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_FourParams(FOnSupplyLanded, FVector, LandingLocation, ESupplyType, SupplyType, float, LandingDistance, bool, bHitTarget);

UCLASS(Blueprintable)
class MOUNTAINRESCUEDRONE_API ADroppedSupply : public AActor
{
	GENERATED_BODY()

public:
	ADroppedSupply();

protected:
	virtual void BeginPlay() override;

public:
	virtual void Tick(float DeltaTime) override;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UStaticMeshComponent> SupplyMesh;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UProjectileMovementComponent> ProjectileMovement;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UNiagaraComponent> ParachuteEffect;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UNiagaraComponent> LandingEffect;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "物资数据")
	ESupplyType SupplyType = ESupplyType::MedicalKit;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "物资数据")
	float UnitWeight = 2.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "物资数据")
	FVector TargetDeliveryLocation;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	bool bHasLanded = false;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	FVector LandingLocation;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	float LandingDistanceToTarget = 0.f;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnSupplyLanded OnSupplyLanded;

public:
	UFUNCTION(BlueprintCallable, Category = "物资")
	void DropFromDrone(FVector DroneVelocity, FVector TargetLocation);

	UFUNCTION(BlueprintCallable, Category = "物资")
	void SetSupplyMeshByType(ESupplyType Type);

protected:
	UFUNCTION()
	virtual void OnLanded(const FHitResult& Hit);
};
