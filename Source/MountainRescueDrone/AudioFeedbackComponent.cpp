#include "AudioFeedbackComponent.h"
#include "DroneBase.h"
#include "MountainRescueGameMode.h"
#include "Components/AudioComponent.h"
#include "Sound/SoundBase.h"
#include "Kismet/GameplayStatics.h"
#include "MountainRescueDrone.h"

UAudioFeedbackComponent::UAudioFeedbackComponent()
{
	PrimaryComponentTick.bCanEverTick = false;
	EngineLoopComponent = nullptr;
}

void UAudioFeedbackComponent::BeginPlay()
{
	Super::BeginPlay();
	BindToGameEvents();

	AActor* Owner = GetOwner();
	if (Owner)
	{
		EngineLoopComponent = NewObject<UAudioComponent>(Owner, UAudioComponent::StaticClass(), TEXT("EngineLoop"));
		if (EngineLoopComponent)
		{
			EngineLoopComponent->RegisterComponent();
			EngineLoopComponent->bAutoActivate = false;
			EngineLoopComponent->AttachToComponent(Owner->GetRootComponent(), FAttachmentTransformRules::KeepRelativeTransform);
		}
	}
}

void UAudioFeedbackComponent::PlayEngineSound(float SpeedRatio, float BatteryRatio)
{
	if (!EngineLoopComponent) return;

	USoundBase* SoundToUse = (SpeedRatio < 0.1f) ? DroneSounds.EngineIdle : DroneSounds.EngineFlying;
	if (!SoundToUse) return;

	if (EngineLoopComponent->Sound != SoundToUse)
	{
		EngineLoopComponent->SetSound(SoundToUse);
		if (!EngineLoopComponent->IsPlaying()) EngineLoopComponent->Play();
	}

	float PitchMod = 0.7f + SpeedRatio * 0.6f;
	float BatteryMod = 1.f + (1.f - BatteryRatio) * 0.15f;
	EngineLoopComponent->SetPitchMultiplier(FMath::Clamp(PitchMod * BatteryMod, 0.6f, 1.6f));

	float Vol = DroneVolume * MasterVolume;
	Vol *= (0.5f + SpeedRatio * 0.5f);
	EngineLoopComponent->SetVolumeMultiplier(FMath::Clamp(Vol, 0.05f, 1.f));
}

void UAudioFeedbackComponent::PlayLowBatteryBeep(bool bCritical)
{
	USoundBase* S = bCritical ? DroneSounds.CriticalBatteryBeep : DroneSounds.LowBatteryBeep;
	if (S) PlaySound2D(S, DroneVolume);
}

void UAudioFeedbackComponent::PlaySignalLostBeep()
{
	if (DroneSounds.SignalLostBeep) PlaySound2D(DroneSounds.SignalLostBeep, DroneVolume * 1.2f);
}

void UAudioFeedbackComponent::PlayWaypointReached()
{
	if (DroneSounds.WaypointReached) PlaySound2D(DroneSounds.WaypointReached, DroneVolume);
}

void UAudioFeedbackComponent::PlaySupplyDrop()
{
	if (DroneSounds.SupplyDropped) PlaySound2D(DroneSounds.SupplyDropped, DroneVolume);
}

void UAudioFeedbackComponent::PlayReturnHomeAlert()
{
	if (DroneSounds.ReturnHomeAlert) PlaySound2D(DroneSounds.ReturnHomeAlert, DroneVolume * 1.1f);
}

void UAudioFeedbackComponent::PlayDeliveryResult(EDeliveryResult Result)
{
	switch (Result)
	{
	case EDeliveryResult::Success:
		if (DroneSounds.DeliverySuccess) PlaySound2D(DroneSounds.DeliverySuccess, DroneVolume);
		break;
	case EDeliveryResult::PartialSuccess:
		if (DroneSounds.DeliverySuccess) PlaySound2D(DroneSounds.DeliverySuccess, DroneVolume * 0.7f);
		break;
	case EDeliveryResult::WrongSupply:
	case EDeliveryResult::FailedNoSupply:
	case EDeliveryResult::Timeout:
		if (DroneSounds.DeliveryFailed) PlaySound2D(DroneSounds.DeliveryFailed, DroneVolume);
		break;
	default: break;
	}
}

void UAudioFeedbackComponent::PlayButtonClick()
{
	if (UISounds.ButtonClick) PlaySound2D(UISounds.ButtonClick, UIVolume);
}

void UAudioFeedbackComponent::PlayWaypointAddedSound()
{
	if (UISounds.WaypointAdded) PlaySound2D(UISounds.WaypointAdded, UIVolume);
}

void UAudioFeedbackComponent::PlayWaypointRemovedSound()
{
	if (UISounds.WaypointRemoved) PlaySound2D(UISounds.WaypointRemoved, UIVolume);
}

void UAudioFeedbackComponent::PlayRouteValidated(bool bSuccess)
{
	if (bSuccess) { if (UISounds.RouteValidated) PlaySound2D(UISounds.RouteValidated, UIVolume); }
	else { if (UISounds.RouteValidationFailed) PlaySound2D(UISounds.RouteValidationFailed, UIVolume); }
}

void UAudioFeedbackComponent::PlayMissionResult(bool bSuccess)
{
	if (bSuccess) { if (UISounds.MissionSuccessFanfare) PlaySound2D(UISounds.MissionSuccessFanfare, MasterVolume); }
	else { if (UISounds.MissionFailed) PlaySound2D(UISounds.MissionFailed, MasterVolume); }
}

void UAudioFeedbackComponent::PlayToastSound(FColor ToastColor)
{
	float R = ToastColor.R, G = ToastColor.G, B = ToastColor.B;
	if (G > 200 && R < 100)
	{
		if (UISounds.ToastSuccess) PlaySound2D(UISounds.ToastSuccess, UIVolume);
	}
	else if (R > 200 && G > 100 && B < 100)
	{
		if (UISounds.ToastWarning) PlaySound2D(UISounds.ToastWarning, UIVolume);
	}
	else if (R > 200 && G < 100)
	{
		if (UISounds.ToastError) PlaySound2D(UISounds.ToastError, UIVolume);
	}
	else
	{
		if (UISounds.ToastSuccess) PlaySound2D(UISounds.ToastSuccess, UIVolume * 0.7f);
	}
}

void UAudioFeedbackComponent::PlaySound2D(USoundBase* Sound, float VolumeMultiplier)
{
	if (!Sound || !GetWorld()) return;
	UGameplayStatics::PlaySound2D(GetWorld(), Sound, VolumeMultiplier * MasterVolume);
}

void UAudioFeedbackComponent::SetMasterVolume(float NewVolume)
{
	MasterVolume = FMath::Clamp(NewVolume, 0.f, 2.f);
}

void UAudioFeedbackComponent::BindToGameEvents()
{
	AActor* Owner = GetOwner();
	AMountainRescueGameMode* GM = Cast<AMountainRescueGameMode>(Owner);
	if (GM)
	{
		UE_LOG(LogMountainRescue, Log, TEXT("音频反馈组件: 已绑定到游戏模式事件"));
	}
}
