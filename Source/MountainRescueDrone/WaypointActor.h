#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MountainRescueTypes.h"
#include "WaypointActor.generated.h"

class UBillboardComponent;
class USphereComponent;
class UTextRenderComponent;

UCLASS(Blueprintable)
class MOUNTAINRESCUEDRONE_API AWaypointActor : public AActor
{
	GENERATED_BODY()

public:
	AWaypointActor();

protected:
	virtual void BeginPlay() override;

public:
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<USphereComponent> CollisionSphere;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UBillboardComponent> Billboard;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UTextRenderComponent> IndexLabel;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UTextRenderComponent> InfoLabel;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线点数据", meta = (ExposeOnSpawn = "true"))
	FWaypoint WaypointData;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "航线点数据")
	int32 WaypointIndex = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "视觉")
	FColor NormalColor = FColor::White;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "视觉")
	FColor DeliveryColor = FColor::Green;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "视觉")
	FColor SelectedColor = FColor::Yellow;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "视觉")
	FColor WarningColor = FColor::Red;

public:
	UFUNCTION(BlueprintCallable, Category = "航线点")
	void UpdateVisualState(bool bIsSelected, bool bHasBatteryWarning, bool bHasSignalWarning);

	UFUNCTION(BlueprintCallable, Category = "航线点")
	void UpdateLabels();

	UFUNCTION(BlueprintCallable, Category = "航线点")
	void SetWaypointData(const FWaypoint& NewData);

	UFUNCTION(BlueprintImplementableEvent, Category = "航线点|视觉")
	void OnVisualStateChanged(FColor NewColor, bool bPulseEffect);

protected:
	FColor CurrentColor;
};
