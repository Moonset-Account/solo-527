#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "GameplayTagContainer.h"
#include "OldApartmentPlayerCharacter.generated.h"

class UCameraComponent;
class USpringArmComponent;
class UStaticMeshComponent;
class USpotLightComponent;
class UAudioComponent;
class UNiagaraComponent;
class UOldApartmentSaveGame;

USTRUCT(BlueprintType)
struct FFootstepSurfaceData
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Footstep")
	USoundBase* FootstepSound;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Footstep")
	float Volume;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Footstep")
	FName SurfaceTag;
};

UCLASS()
class OLDAPARTMENTMYSTERY_API AOldApartmentPlayerCharacter : public ACharacter
{
	GENERATED_BODY()

public:
	AOldApartmentPlayerCharacter();

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	UCameraComponent* FirstPersonCamera;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	USpringArmComponent* CameraBoom;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	UStaticMeshComponent* FlashlightMesh;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	USpotLightComponent* FlashlightSpotLight;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
	UAudioComponent* BreathingAudio;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
	float NormalWalkSpeed;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
	float CrouchWalkSpeed;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
	float SprintSpeed;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
	float FootstepIntervalWalk;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
	float FootstepIntervalCrouch;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
	float FootstepIntervalSprint;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Footsteps")
	TArray<FFootstepSurfaceData> FootstepSurfaces;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Headbob")
	bool bEnableHeadbob;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Headbob")
	float HeadbobFrequency;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Headbob")
	float HeadbobAmplitude;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Headbob")
	float SwayFrequency;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Headbob")
	float SwayAmplitude;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Flashlight")
	bool bFlashlightEnabled;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Flashlight")
	float FlashlightBatteryLife;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "State")
	float CurrentBattery;

	UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "State")
	FGameplayTagContainer ActiveCharacterTags;

	UFUNCTION(BlueprintCallable, Category = "Flashlight")
	void ToggleFlashlight();

	UFUNCTION(BlueprintCallable, Category = "Flashlight")
	void SetFlashlightEnabled(bool bEnabled);

	UFUNCTION(BlueprintCallable, Category = "Movement")
	bool IsSprinting() const;

	UFUNCTION(BlueprintCallable, Category = "Footsteps")
	void PlayFootstepSound();

	UFUNCTION(BlueprintCallable, Category = "Audio")
	void StartBreathingAudio();

	UFUNCTION(BlueprintCallable, Category = "Audio")
	void StopBreathingAudio();

	UFUNCTION(BlueprintCallable, Category = "Headbob")
	void UpdateCameraAnimation(float DeltaTime);

	UFUNCTION(BlueprintCallable, Category = "State")
	void AddTagToCharacter(FGameplayTag Tag);

	UFUNCTION(BlueprintCallable, Category = "State")
	void RemoveTagFromCharacter(FGameplayTag Tag);

	UFUNCTION(BlueprintPure, Category = "State")
	bool HasCharacterTag(FGameplayTag Tag) const;

	UFUNCTION(BlueprintCallable, Category = "Save")
	void SavePositionToSave(UOldApartmentSaveGame* SaveGame);

	UFUNCTION(BlueprintCallable, Category = "Save")
	void LoadPositionFromSave(UOldApartmentSaveGame* SaveGame);

protected:
	virtual void BeginPlay() override;
	virtual void Tick(float DeltaSeconds) override;
	virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

	virtual void OnMovementModeChanged(EMovementMode PrevMovementMode, uint8 PreviousCustomMode) override;

private:
	float TimeSinceLastFootstep;
	float HeadbobTime;
	FVector OriginalCameraLoc;
	FRotator OriginalCameraRot;
};
