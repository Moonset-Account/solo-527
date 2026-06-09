#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MountainRescueTypes.h"
#include "RescueTarget.generated.h"

class UBillboardComponent;
class USphereComponent;
class UWidgetComponent;
class UStaticMeshComponent;
class UNiagaraComponent;
class UAudioComponent;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnTargetRescued, FName, TargetID);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnTargetTimedOut, FName, TargetID);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnTargetDelivered, FName, TargetID, EDeliveryResult, Result);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnTargetTimeUpdated, FName, TargetID, float, RemainingRatio);

UCLASS(Blueprintable)
class MOUNTAINRESCUEDRONE_API ARescueTarget : public AActor
{
	GENERATED_BODY()

public:
	ARescueTarget();

protected:
	virtual void BeginPlay() override;

public:
	virtual void Tick(float DeltaTime) override;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<USphereComponent> DeliverySphere;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UBillboardComponent> TargetBillboard;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UStaticMeshComponent> TargetMesh;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UWidgetComponent> StatusWidget;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UNiagaraComponent> SOSBeaconEffect;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UAudioComponent> SOSBeepSound;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "目标数据", meta = (ExposeOnSpawn = "true"))
	FRescueTargetData TargetData;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	float TimeRemaining = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	float TimeElapsed = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	bool bIsRescued = false;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	bool bIsTimedOut = false;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	EDeliveryResult LastDeliveryResult = EDeliveryResult::Timeout;

	UPROPERTY(BlueprintReadOnly, Category = "状态")
	float LastDeliveryDistance = 0.f;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnTargetRescued OnTargetRescued;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnTargetTimedOut OnTargetTimedOut;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnTargetDelivered OnTargetDelivered;

	UPROPERTY(BlueprintAssignable, Category = "事件")
	FOnTargetTimeUpdated OnTargetTimeUpdated;

public:
	UFUNCTION(BlueprintCallable, Category = "救援目标")
	void InitializeTarget(const FRescueTargetData& Data);

	UFUNCTION(BlueprintCallable, Category = "救援目标")
	EDeliveryResult ProcessDelivery(ESupplyType DeliveredSupply, FVector DropLocation);

	UFUNCTION(BlueprintCallable, Category = "救援目标")
	bool IsSupplyCorrect(ESupplyType Supply) const;

	UFUNCTION(BlueprintCallable, Category = "救援目标")
	float GetTimeRemainingRatio() const;

	UFUNCTION(BlueprintCallable, Category = "救援目标")
	bool IsInGoldenTime() const { return TimeRemaining >= (TargetData.TimeLimitSeconds - TargetData.GoldenTimeSeconds); }

	UFUNCTION(BlueprintCallable, Category = "救援目标")
	ETaskPriority GetPriority() const { return TargetData.Priority; }

	UFUNCTION(BlueprintCallable, Category = "救援目标")
	float GetDeliveryRadius() const { return TargetData.WorldLocation != FVector::ZeroVector ? 25.f : 25.f; }

	UFUNCTION(BlueprintCallable, Category = "救援目标")
	FTargetResult GetResultData() const;

	UFUNCTION(BlueprintCallable, Category = "救援目标")
	void StartCountdown();

	UFUNCTION(BlueprintCallable, Category = "救援目标")
	void PauseCountdown();

	UFUNCTION(BlueprintCallable, Category = "救援目标")
	FText GetPriorityColorTag() const;

	UFUNCTION(BlueprintImplementableEvent, Category = "救援目标|视觉")
	void OnStatusChanged(bool bRescued, bool bTimedOut);

	UFUNCTION(BlueprintImplementableEvent, Category = "救援目标|视觉")
	void OnDeliveryAttempt(EDeliveryResult Result);

	UFUNCTION(BlueprintImplementableEvent, Category = "救援目标|视觉")
	void OnUrgencyLevelChanged(float Urgency01);

protected:
	bool bCountdownActive = false;

	virtual void UpdateCountdown(float DeltaTime);
	virtual void UpdateVisualUrgency();
	virtual FText GetFailureExplanation(EDeliveryResult Result) const;
};
