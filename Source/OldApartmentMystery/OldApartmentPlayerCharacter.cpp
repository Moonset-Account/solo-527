#include "OldApartmentPlayerCharacter.h"
#include "Camera/CameraComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Components/SpotLightComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Components/AudioComponent.h"
#include "Kismet/GameplayStatics.h"
#include "PhysicalMaterials/PhysicalMaterial.h"
#include "OldApartmentSaveGame.h"

AOldApartmentPlayerCharacter::AOldApartmentPlayerCharacter()
{
	PrimaryActorTick.bCanEverTick = true;

	NormalWalkSpeed = 600.0f;
	CrouchWalkSpeed = 300.0f;
	SprintSpeed = 960.0f;

	FootstepIntervalWalk = 0.55f;
	FootstepIntervalCrouch = 0.8f;
	FootstepIntervalSprint = 0.35f;

	bEnableHeadbob = true;
	HeadbobFrequency = 1.8f;
	HeadbobAmplitude = 0.8f;
	SwayFrequency = 1.5f;
	SwayAmplitude = 0.5f;

	bFlashlightEnabled = false;
	FlashlightBatteryLife = 600.0f;
	CurrentBattery = 600.0f;

	TimeSinceLastFootstep = 0.0f;
	HeadbobTime = 0.0f;
	OriginalCameraLoc = FVector::ZeroVector;
	OriginalCameraRot = FRotator::ZeroRotator;

	GetCharacterMovement()->MaxWalkSpeed = NormalWalkSpeed;
	GetCharacterMovement()->MaxWalkSpeedCrouched = CrouchWalkSpeed;
	GetCharacterMovement()->bCanWalkOffLedges = true;
	GetCharacterMovement()->NavAgentProps.bCanCrouch = true;
	GetCharacterMovement()->CrouchedHalfHeight = 60.0f;

	FirstPersonCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FirstPersonCamera"));
	FirstPersonCamera->SetupAttachment(GetMesh(), TEXT("head"));
	FirstPersonCamera->bUsePawnControlRotation = true;
	FirstPersonCamera->FieldOfView = 90.0f;
	FirstPersonCamera->SetRelativeLocation(FVector(0, 0, 50));

	FlashlightMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("FlashlightMesh"));
	FlashlightMesh->SetupAttachment(FirstPersonCamera);
	FlashlightMesh->SetRelativeLocation(FVector(30.0f, -15.0f, -10.0f));
	FlashlightMesh->SetRelativeRotation(FRotator(0.0f, 0.0f, -5.0f));
	FlashlightMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

	FlashlightSpotLight = CreateDefaultSubobject<USpotLightComponent>(TEXT("FlashlightSpotLight"));
	FlashlightSpotLight->SetupAttachment(FlashlightMesh);
	FlashlightSpotLight->SetRelativeLocation(FVector(40.0f, 0.0f, 0.0f));
	FlashlightSpotLight->SetRelativeRotation(FRotator(0.0f, 0.0f, 0.0f));
	FlashlightSpotLight->InnerConeAngle = 12.0f;
	FlashlightSpotLight->OuterConeAngle = 28.0f;
	FlashlightSpotLight->Intensity = 8000.0f;
	FlashlightSpotLight->AttenuationRadius = 1500.0f;
	FlashlightSpotLight->SetVisibility(false);

	BreathingAudio = CreateDefaultSubobject<UAudioComponent>(TEXT("BreathingAudio"));
	BreathingAudio->SetupAttachment(FirstPersonCamera);
	BreathingAudio->bAutoActivate = false;
	BreathingAudio->VolumeMultiplier = 0.4f;
}

void AOldApartmentPlayerCharacter::BeginPlay()
{
	Super::BeginPlay();
	OriginalCameraLoc = FirstPersonCamera->GetRelativeLocation();
	OriginalCameraRot = FirstPersonCamera->GetRelativeRotation();
	StartBreathingAudio();
}

void AOldApartmentPlayerCharacter::Tick(float DeltaSeconds)
{
	Super::Tick(DeltaSeconds);

	UpdateCameraAnimation(DeltaSeconds);

	if (bFlashlightEnabled && CurrentBattery > 0.0f)
	{
		CurrentBattery = FMath::Max(0.0f, CurrentBattery - DeltaSeconds);
		if (CurrentBattery <= 0.0f)
		{
			SetFlashlightEnabled(false);
		}
	}

	const float Speed = GetVelocity().Size();
	if (Speed > 50.0f)
	{
		float Interval;
		if (IsSprinting()) Interval = FootstepIntervalSprint;
		else if (GetCharacterMovement()->IsCrouching()) Interval = FootstepIntervalCrouch;
		else Interval = FootstepIntervalWalk;

		TimeSinceLastFootstep += DeltaSeconds;
		if (TimeSinceLastFootstep >= Interval)
		{
			PlayFootstepSound();
			TimeSinceLastFootstep = 0.0f;
		}
	}
	else
	{
		TimeSinceLastFootstep = 0.0f;
	}
}

void AOldApartmentPlayerCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);

	check(PlayerInputComponent);

	// === Legacy Axis Bindings (no IMC/IA assets required) ===
	// These work with the AddAxisMapping() calls done in BootstrapActor::BindFallbackKeys()
	PlayerInputComponent->BindAxis(FName(TEXT("MoveForward")), this, &AOldApartmentPlayerCharacter::Legacy_MoveForward);
	PlayerInputComponent->BindAxis(FName(TEXT("MoveRight")),   this, &AOldApartmentPlayerCharacter::Legacy_MoveRight);
	PlayerInputComponent->BindAxis(FName(TEXT("Turn")),        this, &AOldApartmentPlayerCharacter::Legacy_Turn);
	PlayerInputComponent->BindAxis(FName(TEXT("LookUp")),      this, &AOldApartmentPlayerCharacter::Legacy_LookUp);

	// Also bind some commonly used actions via legacy system (fallback)
	PlayerInputComponent->BindAction(FName(TEXT("FlashlightToggle")), IE_Pressed, this, &AOldApartmentPlayerCharacter::ToggleFlashlight);
}

void AOldApartmentPlayerCharacter::Legacy_MoveForward(float Value)
{
	if (Value == 0.0f) return;
	if (Controller == nullptr) return;

	const FRotator YawRotation(0, Controller->GetControlRotation().Yaw, 0);
	const FVector ForwardDirection = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X);
	AddMovementInput(ForwardDirection, Value);
}

void AOldApartmentPlayerCharacter::Legacy_MoveRight(float Value)
{
	if (Value == 0.0f) return;
	if (Controller == nullptr) return;

	const FRotator YawRotation(0, Controller->GetControlRotation().Yaw, 0);
	const FVector RightDirection = FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y);
	AddMovementInput(RightDirection, Value);
}

void AOldApartmentPlayerCharacter::Legacy_Turn(float Value)
{
	AddControllerYawInput(Value);
}

void AOldApartmentPlayerCharacter::Legacy_LookUp(float Value)
{
	AddControllerPitchInput(Value);
}

void AOldApartmentPlayerCharacter::OnMovementModeChanged(EMovementMode PrevMovementMode, uint8 PreviousCustomMode)
{
	Super::OnMovementModeChanged(PrevMovementMode, PreviousCustomMode);

	if (GetCharacterMovement()->IsCrouching())
	{
		GetCharacterMovement()->MaxWalkSpeed = CrouchWalkSpeed;
	}
}

void AOldApartmentPlayerCharacter::ToggleFlashlight()
{
	SetFlashlightEnabled(!bFlashlightEnabled);
}

void AOldApartmentPlayerCharacter::SetFlashlightEnabled(bool bEnabled)
{
	bFlashlightEnabled = bEnabled && CurrentBattery > 0.0f;
	if (FlashlightSpotLight)
	{
		FlashlightSpotLight->SetVisibility(bFlashlightEnabled);
	}
	if (FlashlightMesh)
	{
		FlashlightMesh->SetVisibility(bFlashlightEnabled || true);
	}
}

bool AOldApartmentPlayerCharacter::IsSprinting() const
{
	return GetCharacterMovement()->MaxWalkSpeed > NormalWalkSpeed + 10.0f;
}

void AOldApartmentPlayerCharacter::PlayFootstepSound()
{
	if (FootstepSurfaces.Num() == 0) return;

	FHitResult Hit;
	FVector TraceStart = GetActorLocation();
	FVector TraceEnd = TraceStart - FVector(0, 0, 100);
	FCollisionQueryParams Params;
	Params.AddIgnoredActor(this);

	if (GetWorld()->LineTraceSingleByChannel(Hit, TraceStart, TraceEnd, ECC_Visibility, Params))
	{
		UPhysicalMaterial* PhysMat = Hit.PhysMaterial.Get();
		FName SurfaceName = NAME_None;
		if (PhysMat)
		{
			SurfaceName = PhysMat->SurfaceType;
		}
		for (const FFootstepSurfaceData& Surface : FootstepSurfaces)
		{
			if (Surface.SurfaceTag == SurfaceName && Surface.FootstepSound)
			{
				UGameplayStatics::PlaySoundAtLocation(this, Surface.FootstepSound, Hit.ImpactPoint,
					FRotator::ZeroRotator, Surface.Volume);
				return;
			}
		}
		if (FootstepSurfaces[0].FootstepSound)
		{
			UGameplayStatics::PlaySoundAtLocation(this, FootstepSurfaces[0].FootstepSound, Hit.ImpactPoint,
				FRotator::ZeroRotator, FootstepSurfaces[0].Volume);
		}
	}
}

void AOldApartmentPlayerCharacter::StartBreathingAudio()
{
	if (BreathingAudio && !BreathingAudio->IsPlaying())
	{
		BreathingAudio->Play();
	}
}

void AOldApartmentPlayerCharacter::StopBreathingAudio()
{
	if (BreathingAudio && BreathingAudio->IsPlaying())
	{
		BreathingAudio->Stop();
	}
}

void AOldApartmentPlayerCharacter::UpdateCameraAnimation(float DeltaTime)
{
	if (!bEnableHeadbob) return;

	const float Speed = GetVelocity().Size();
	if (Speed > 20.0f)
	{
		float SpeedFactor = FMath::Clamp(Speed / NormalWalkSpeed, 0.3f, 2.0f);
		HeadbobTime += DeltaTime * HeadbobFrequency * SpeedFactor;

		const float Bob = FMath::Sin(HeadbobTime) * HeadbobAmplitude * SpeedFactor;
		const float Sway = FMath::Sin(HeadbobTime * SwayFrequency) * SwayAmplitude * SpeedFactor;

		FVector NewLoc = OriginalCameraLoc;
		NewLoc.Z += Bob;
		FirstPersonCamera->SetRelativeLocation(NewLoc);

		FRotator NewRot = OriginalCameraRot;
		NewRot.Yaw += Sway;
		FirstPersonCamera->SetRelativeRotation(NewRot);
	}
}

void AOldApartmentPlayerCharacter::AddTagToCharacter(FGameplayTag Tag)
{
	ActiveCharacterTags.AddTag(Tag);
}

void AOldApartmentPlayerCharacter::RemoveTagFromCharacter(FGameplayTag Tag)
{
	ActiveCharacterTags.RemoveTag(Tag);
}

bool AOldApartmentPlayerCharacter::HasCharacterTag(FGameplayTag Tag) const
{
	return ActiveCharacterTags.HasTag(Tag);
}

void AOldApartmentPlayerCharacter::SavePositionToSave(UOldApartmentSaveGame* SaveGame)
{
	if (SaveGame)
	{
		SaveGame->PlayerWorldLocation = GetActorLocation();
		SaveGame->PlayerWorldRotation = GetActorRotation();
	}
}

void AOldApartmentPlayerCharacter::LoadPositionFromSave(UOldApartmentSaveGame* SaveGame)
{
	if (SaveGame)
	{
		SetActorLocationAndRotation(SaveGame->PlayerWorldLocation, SaveGame->PlayerWorldRotation);
	}
}
