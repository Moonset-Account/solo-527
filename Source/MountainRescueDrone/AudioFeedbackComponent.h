#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "MountainRescueTypes.h"
#include "AudioFeedbackComponent.generated.h"

class USoundBase;
class UAudioComponent;
class ADroneBase;
class AMountainRescueGameMode;

USTRUCT(BlueprintType)
struct FDroneAudioSet
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> EngineIdle;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> EngineFlying;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> LowBatteryBeep;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> CriticalBatteryBeep;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> SignalLostBeep;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> WaypointReached;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> SupplyDropped;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> DeliverySuccess;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> DeliveryFailed;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> ReturnHomeAlert;
};

USTRUCT(BlueprintType)
struct FUI_AudioSet
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> ButtonClick;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> WaypointAdded;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> WaypointRemoved;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> RouteValidated;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> RouteValidationFailed;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> MissionSuccessFanfare;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> MissionFailed;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> ToastSuccess;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> ToastWarning;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效")
	TObjectPtr<USoundBase> ToastError;
};

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class MOUNTAINRESCUEDRONE_API UAudioFeedbackComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UAudioFeedbackComponent();

protected:
	virtual void BeginPlay() override;

public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效配置")
	FDroneAudioSet DroneSounds;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效配置")
	FUI_AudioSet UISounds;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效配置")
	float MasterVolume = 1.f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效配置")
	float UIVolume = 0.8f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "音效配置")
	float DroneVolume = 0.6f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<UAudioComponent> EngineLoopComponent;

public:
	UFUNCTION(BlueprintCallable, Category = "音效|无人机")
	void PlayEngineSound(float SpeedRatio, float BatteryRatio);

	UFUNCTION(BlueprintCallable, Category = "音效|无人机")
	void PlayLowBatteryBeep(bool bCritical = false);

	UFUNCTION(BlueprintCallable, Category = "音效|无人机")
	void PlaySignalLostBeep();

	UFUNCTION(BlueprintCallable, Category = "音效|无人机")
	void PlayWaypointReached();

	UFUNCTION(BlueprintCallable, Category = "音效|无人机")
	void PlaySupplyDrop();

	UFUNCTION(BlueprintCallable, Category = "音效|无人机")
	void PlayReturnHomeAlert();

	UFUNCTION(BlueprintCallable, Category = "音效|事件反馈")
	void PlayDeliveryResult(EDeliveryResult Result);

	UFUNCTION(BlueprintCallable, Category = "音效|UI")
	void PlayButtonClick();

	UFUNCTION(BlueprintCallable, Category = "音效|UI")
	void PlayWaypointAddedSound();

	UFUNCTION(BlueprintCallable, Category = "音效|UI")
	void PlayWaypointRemovedSound();

	UFUNCTION(BlueprintCallable, Category = "音效|UI")
	void PlayRouteValidated(bool bSuccess);

	UFUNCTION(BlueprintCallable, Category = "音效|UI")
	void PlayMissionResult(bool bSuccess);

	UFUNCTION(BlueprintCallable, Category = "音效|UI")
	void PlayToastSound(FColor ToastColor);

	UFUNCTION(BlueprintCallable, Category = "音效|UI")
	void PlaySound2D(USoundBase* Sound, float VolumeMultiplier = 1.f);

	UFUNCTION(BlueprintCallable, Category = "音效|音量")
	void SetMasterVolume(float NewVolume);

protected:
	UPROPERTY()
	TWeakObjectPtr<ADroneBase> CachedDrone;

	UPROPERTY()
	TWeakObjectPtr<AMountainRescueGameMode> CachedGameMode;

	virtual void BindToGameEvents();
};
