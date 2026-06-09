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
class UOAMBootstrapData;
class UOAMItemData;
class UOAMNoteData;
class UOAMPuzzleData;
class UOAMChapterData;
class UOAMLevelDataAsset;
class UInputMappingContext;
class UInputAction;

UCLASS()
class OLDAPARTMENTMYSTERY_API UOAMGameInstance : public UGameInstance
{
	GENERATED_BODY()
public:
	UOAMGameInstance();
	virtual void Init() override;
	virtual void Shutdown() override;

	/* ================= Bootstrap 数据查询（当 Content 下 .uasset 缺失时使用内存数据） ================= */
	UFUNCTION(BlueprintPure, Category = "OAM|Bootstrap")
	UOAMBootstrapData* GetBootstrap() const { return Bootstrap; }

	UFUNCTION(BlueprintPure, Category = "OAM|Bootstrap")
	UOAMItemData* ResolveItem(FName ItemID) const;
	UFUNCTION(BlueprintPure, Category = "OAM|Bootstrap")
	UOAMNoteData* ResolveNote(FName NoteID) const;
	UFUNCTION(BlueprintPure, Category = "OAM|Bootstrap")
	UOAMPuzzleData* ResolvePuzzle(FName PuzzleID) const;
	UFUNCTION(BlueprintPure, Category = "OAM|Bootstrap")
	UOAMChapterData* ResolveChapter(int32 ChapterID) const;
	UFUNCTION(BlueprintPure, Category = "OAM|Bootstrap")
	UOAMLevelDataAsset* ResolveLevel(FName LevelName) const;

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

	UFUNCTION(BlueprintPure, Category = "OAM|Flow")
	FName GetCurrentLevelName() const { return CurrentLogicalLevel; }

	UFUNCTION(BlueprintPure, Category = "OAM|Flow")
	bool IsInMainMenu() const { return bMainMenuMode; }

	UFUNCTION(BlueprintCallable, Category = "OAM|Flow")
	void RebuildCurrentLevelUI();

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

	UPROPERTY() FName CurrentLogicalLevel = NAME_None;
	UPROPERTY() bool bMainMenuMode = true;
	UPROPERTY() FVector2D PendingSpawnTile = FVector2D(-1, -1);

	UPROPERTY() TObjectPtr<UOAMBootstrapData> Bootstrap;

	UPROPERTY() TObjectPtr<UInputAction> InputCache_IA_Move;
	UPROPERTY() TObjectPtr<UInputAction> InputCache_IA_Look;
	UPROPERTY() TObjectPtr<UInputAction> InputCache_IA_Interact;
	UPROPERTY() TObjectPtr<UInputAction> InputCache_IA_Notebook;
	UPROPERTY() TObjectPtr<UInputAction> InputCache_IA_Inventory;
	UPROPERTY() TObjectPtr<UInputAction> InputCache_IA_Pause;
	UPROPERTY() TObjectPtr<UInputAction> InputCache_IA_Back;
	UPROPERTY() TArray<TObjectPtr<UInputAction>> InputCache_IA_Digits;

	void CreateManagers();
	void BuildRuntimeInputAssets();
	void BuildInputContextAndMappings();

	friend class AOAMPlayerController;
};
