#include "WeatherSystem.h"
#include "Components/SceneComponent.h"
#include "NiagaraComponent.h"
#include "Components/AudioComponent.h"
#include "MountainRescueDrone.h"

AWeatherSystem::AWeatherSystem()
{
	PrimaryActorTick.bCanEverTick = true;

	SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("SceneRoot"));
	RootComponent = SceneRoot;

	WindParticleEffect = CreateDefaultSubobject<UNiagaraComponent>(TEXT("WindParticleEffect"));
	WindParticleEffect->SetupAttachment(RootComponent);

	WindAmbientSound = CreateDefaultSubobject<UAudioComponent>(TEXT("WindAmbientSound"));
	WindAmbientSound->SetupAttachment(RootComponent);
	WindAmbientSound->bAutoActivate = true;
}

void AWeatherSystem::BeginPlay()
{
	Super::BeginPlay();
	OnWeatherChanged(WeatherConfig);
}

void AWeatherSystem::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
	UpdateGusts(DeltaTime);
	UpdateVisualEffects(DeltaTime);
}

void AWeatherSystem::ConfigureWeather(const FWeatherConfig& NewConfig)
{
	WeatherConfig = NewConfig;
	OnWeatherChanged(NewConfig);
	UE_LOG(LogMountainRescue, Log, TEXT("天气配置已更新: 风速=%.1fm/s, 风向=%s"),
		WeatherConfig.WindSpeed, *WeatherConfig.WindDirection.ToString());
}

void AWeatherSystem::SetWindSpeed(float NewSpeed)
{
	WeatherConfig.WindSpeed = FMath::Clamp(NewSpeed, 0.f, 30.f);
	OnWeatherChanged(WeatherConfig);
}

void AWeatherSystem::SetWindDirection(FRotator NewDirection)
{
	WeatherConfig.WindDirection = NewDirection.Vector();
	OnWeatherChanged(WeatherConfig);
}

FVector AWeatherSystem::GetWindVectorAtLocation(FVector Location) const
{
	FVector BaseWind = WeatherConfig.GetWindVector();
	float HeightFactor = 1.f + FMath::Clamp(Location.Z / 1000.f, 0.f, 1.f);
	float Turbulence = FMath::Sin(Location.X * 0.01f + Location.Y * 0.01f) * 0.2f;
	return BaseWind * CurrentGustFactor * HeightFactor * (1.f + Turbulence);
}

float AWeatherSystem::GetWindEffectOnDrone(FVector DroneLocation, FVector DroneVelocity) const
{
	FVector WindVec = GetWindVectorAtLocation(DroneLocation);
	FVector DroneDir = DroneVelocity.GetSafeNormal();
	float DotProduct = FVector::DotProduct(-DroneDir, WindVec.GetSafeNormal());
	float WindMag = WindVec.Size() / 15.f;
	return FMath::Clamp(DotProduct * WindMag, -1.f, 1.f);
}

void AWeatherSystem::UpdateGusts(float DeltaTime)
{
	if (!WeatherConfig.bIsGusty)
	{
		CurrentGustFactor = FMath::Lerp(CurrentGustFactor, 1.f, DeltaTime * 2.f);
		return;
	}

	GustTimer += DeltaTime;

	if (GustTimer >= NextGustTime)
	{
		CurrentGustFactor = 1.f + FMath::FRandRange(-0.3f, WeatherConfig.GustIntensity);
		NextGustTime = FMath::FRandRange(2.f, 6.f);
		GustTimer = 0.f;
	}

	float TargetGust = CurrentGustFactor;
	CurrentGustFactor = FMath::Lerp(1.f, TargetGust, FMath::Clamp(GustTimer / (NextGustTime * 0.5f), 0.f, 1.f));
}

void AWeatherSystem::UpdateVisualEffects(float DeltaTime)
{
	if (WindAmbientSound)
	{
		float Volume = FMath::Clamp(WeatherConfig.WindSpeed / 20.f, 0.1f, 1.f);
		WindAmbientSound->SetVolumeMultiplier(Volume * CurrentGustFactor);
		float Pitch = 1.f + (WeatherConfig.WindSpeed - 5.f) / 20.f;
		WindAmbientSound->SetPitchMultiplier(FMath::Clamp(Pitch, 0.8f, 1.3f));
	}
}
