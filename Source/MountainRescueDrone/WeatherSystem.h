#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MountainRescueTypes.h"
#include "WeatherSystem.generated.h"

class UNiagaraComponent;
class UAudioComponent;

UCLASS(Blueprintable)
class MOUNTAINRESCUEDRONE_API AWeatherSystem : public AActor
{
	GENERATED_BODY()

public:
	AWeatherSystem();

protected:
	virtual void BeginPlay() override;

public:
	virtual void Tick(float DeltaTime) override;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "天气配置")
	FWeatherConfig WeatherConfig;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "组件")
	TObjectPtr<USceneComponent> SceneRoot;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "视觉效果")
	TObjectPtr<UNiagaraComponent> RainEffect;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "视觉效果")
	TObjectPtr<UNiagaraComponent> FogEffect;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "视觉效果")
	TObjectPtr<UNiagaraComponent> WindParticleEffect;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "视觉效果")
	TObjectPtr<UAudioComponent> WindAmbientSound;

public:
	UFUNCTION(BlueprintCallable, Category = "天气")
	void ConfigureWeather(const FWeatherConfig& NewConfig);

	UFUNCTION(BlueprintCallable, Category = "天气")
	void SetWindSpeed(float NewSpeed);

	UFUNCTION(BlueprintCallable, Category = "天气")
	void SetWindDirection(FRotator NewDirection);

	UFUNCTION(BlueprintCallable, Category = "天气|查询")
	FVector GetWindVectorAtLocation(FVector Location) const;

	UFUNCTION(BlueprintCallable, Category = "天气|查询")
	float GetWindEffectOnDrone(FVector DroneLocation, FVector DroneVelocity) const;

	UFUNCTION(BlueprintCallable, Category = "天气|查询")
	float GetGustFactor() const { return CurrentGustFactor; }

	UFUNCTION(BlueprintCallable, Category = "天气|查询")
	float GetWindSpeedMS() const { return WeatherConfig.WindSpeed; }

	UFUNCTION(BlueprintImplementableEvent, Category = "天气|视觉")
	void OnWeatherChanged(const FWeatherConfig& NewConfig);

protected:
	float CurrentGustFactor = 1.f;
	float GustTimer = 0.f;
	float NextGustTime = 3.f;

	virtual void UpdateGusts(float DeltaTime);
	virtual void UpdateVisualEffects(float DeltaTime);
};
