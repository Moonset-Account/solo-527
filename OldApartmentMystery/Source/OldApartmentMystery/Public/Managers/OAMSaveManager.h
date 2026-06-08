// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "OAMTypes.h"
#include "OAMSaveManager.generated.h"

class UOAMGameInstance;

UCLASS()
class OLDAPARTMENTMYSTERY_API UOAMSaveManager : public UObject
{
	GENERATED_BODY()
public:
	static constexpr int32 SLOT_COUNT = 5;
	static constexpr int32 AUTO_SLOT = SLOT_COUNT;

	UFUNCTION(BlueprintCallable, Category = "OAM|Save")
	void Initialize();

	UFUNCTION(BlueprintCallable, Category = "OAM|Save")
	bool SaveGame(int32 SlotIndex);

	UFUNCTION(BlueprintCallable, Category = "OAM|Save")
	bool LoadGame(int32 SlotIndex);

	UFUNCTION(BlueprintCallable, Category = "OAM|Save")
	void AutoSave();

	UFUNCTION(BlueprintCallable, Category = "OAM|Save")
	bool DeleteSave(int32 SlotIndex);

	UFUNCTION(BlueprintPure, Category = "OAM|Save")
	const FOAMSaveSlot* GetSlot(int32 SlotIndex) const;

	UFUNCTION(BlueprintPure, Category = "OAM|Save")
	TArray<FOAMSaveSlot> GetAllSlots() const { return Slots; }

	UFUNCTION(BlueprintPure, Category = "OAM|Save")
	bool HasSave() const { return Slots.Num() > 0; }

	UFUNCTION(BlueprintCallable, Category = "OAM|Save")
	void SaveSettings(const FOAMGameSettings& Settings);

	UFUNCTION(BlueprintCallable, Category = "OAM|Save")
	bool LoadSettings(FOAMGameSettings& OutSettings);

	UFUNCTION(BlueprintPure, Category = "OAM|Save")
	FString FormatSaveTime(const FOAMSaveSlot& Slot) const;

private:
	UPROPERTY()
	TArray<FOAMSaveSlot> Slots;

	FString SlotSaveDir() const;
	void PersistToDisk(int32 SlotIndex, const FOAMSaveSlot& Slot) const;
	bool LoadFromDisk(int32 SlotIndex, FOAMSaveSlot& OutSlot) const;
};
