// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "OAMTypes.h"
#include "OAMAudioManager.generated.h"

class USoundClass;
class USoundMix;
class UOAMGameInstance;
class USoundBase;

UENUM(BlueprintType)
enum class EOAMSFXKey : uint8
{
	None, UI_Click, UI_Hover, UI_OpenMenu, UI_CloseMenu, UI_OpenPuzzle, UI_ClosePuzzle,
	UI_Typewriter, UI_Clear, UI_Interact, UI_PageFlip, UI_Save, UI_Load,
	Item_Pickup, Item_Drop, Note_Open, Note_Close, Note_TurnPage,
	Puzzle_Digit, Puzzle_Clear, Puzzle_Shake, Puzzle_Success, Puzzle_Fail, Puzzle_Locked,
	Door_Open, Door_Close, Door_Unlock, Door_Shake,
	Ambient_FloorCreak, Ambient_WindowRattle, Ambient_Drip, Ambient_Rattle,
	Objective_Complete, Chapter_Complete
};

UCLASS()
class OLDAPARTMENTMYSTERY_API UOAMAudioManager : public UObject
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category = "OAM|Audio")
	void Initialize(UOAMGameInstance* InGI);

	UFUNCTION(BlueprintCallable, Category = "OAM|Audio")
	float PlaySFX(FName Key, float VolumeMultiplier = 1.f, float PitchMultiplier = 1.f);

	UFUNCTION(BlueprintCallable, Category = "OAM|Audio")
	void PlaySFXEnum(EOAMSFXKey Key, float VolMul = 1.f);

	UFUNCTION(BlueprintCallable, Category = "OAM|Audio")
	void SetAmbient(USoundBase* AmbientSound, float TargetVolume = 0.8f, float FadeSeconds = 2.f);

	UFUNCTION(BlueprintCallable, Category = "OAM|Audio")
	void FadeOutAmbient(float FadeSeconds = 2.f);

	UFUNCTION(BlueprintCallable, Category = "OAM|Audio")
	void ApplyVolumeSettings(const FOAMGameSettings& Settings);

	UFUNCTION(BlueprintPure, Category = "OAM|Audio")
	static FString SFXKeyToString(EOAMSFXKey K);

private:
	UPROPERTY()
	TObjectPtr<UOAMGameInstance> GI;

	UPROPERTY()
	FOAMGameSettings CurrentSettings;

	UPROPERTY()
	TMap<FName, TSoftObjectPtr<USoundBase>> SFXCache;

	UPROPERTY()
	UAudioComponent* CurrentAmbientComp = nullptr;

	void BuildSFXCache();
};
