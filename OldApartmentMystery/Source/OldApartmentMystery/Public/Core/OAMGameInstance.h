// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Engine/GameInstance.h"
#include "OAMTypes.h"
#include "OAMGameInstance.generated.h"

class UOAMSaveManager;
class UOAMAudioManager;
class UOAMTelemetryManager;
class UOAMChapterManager;
class UInputMappingContext;

UCLASS()
class OLDAPARTMENTMYSTERY_API UOAMGameInstance : public UGameInstance
{
	GENERATED_BODY()
public:
	UOAMGameInstance();
	virtual void Init() override;
	virtual void Shutdown() override;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Managers")
	TObjectPtr<UOAMSaveManager> SaveManager;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Managers")
	TObjectPtr<UOAMAudioManager> AudioManager;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Managers")
	TObjectPtr<UOAMTelemetryManager> Telemetry;

	UPROPERTY(BlueprintReadOnly, Category = "OAM|Managers")
	TObjectPtr<UOAMChapterManager> ChapterManager;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "OAM|Settings")
	FOAMGameSettings Settings;

	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "OAM|Settings")
	TObjectPtr<UInputMappingContext> DefaultInputContext;

	UFUNCTION(BlueprintCallable, Category = "OAM|Flow")
	void StartNewGame(int32 FromChapterID = 1);

	UFUNCTION(BlueprintCallable, Category = "OAM|Flow")
	void ReturnToMainMenu();

	UFUNCTION(BlueprintCallable, Category = "OAM|Settings")
	void ApplySettings(const FOAMGameSettings& NewSettings);

	UFUNCTION(BlueprintCallable, Category = "OAM|Flow")
	void TransitionToLevel(FName LevelName, FVector2D SpawnLocation = FVector2D(-1, -1));

	UPROPERTY(BlueprintAssignable)
	FOAM_OnInputModeChanged OnInputModeChanged;

	UFUNCTION(BlueprintCallable, Category = "OAM|Input")
	void SetInputMode(EOAMInputMode NewMode);

	UFUNCTION(BlueprintPure, Category = "OAM|Input")
	EOAMInputMode GetCurrentInputMode() const { return CurrentInputMode; }

	UFUNCTION(BlueprintPure, Category = "OAM|Flow")
	static UOAMGameInstance* GetOAM(const UObject* WorldContext);

private:
	EOAMInputMode CurrentInputMode = EOAMInputMode::UI;
	void CreateManagers();
};
