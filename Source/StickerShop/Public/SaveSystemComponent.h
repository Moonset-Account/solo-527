#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "StickerShopSaveGame.h"
#include "SaveSystemComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSaveComplete, bool, bSuccess);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnLoadComplete, bool, bSuccess, const FString&, SlotName);

UCLASS(ClassGroup=(StickerShop), meta=(BlueprintSpawnableComponent))
class STICKERSHOP_API USaveSystemComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	USaveSystemComponent();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Save")
	bool SaveGame(UStickerShopSaveGame* SaveData, const FString& SlotName, int32 UserIndex = 0);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Save")
	UStickerShopSaveGame* LoadGame(const FString& SlotName, int32 UserIndex = 0);

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Save")
	bool HasSaveGame(const FString& SlotName, int32 UserIndex = 0) const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Save")
	bool DeleteSaveGame(const FString& SlotName, int32 UserIndex = 0);

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Save")
	UStickerShopSaveGame* CreateNewSaveData() const;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Save")
	void RecordPlayerInput(UStickerShopSaveGame* SaveData, int32 Level, const FString& ActionType,
		const FString& Detail, float Timestamp, const FString& Result);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Save")
	void RecordLevelSettlement(UStickerShopSaveGame* SaveData, const FSettlementData& Data);

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Save")
	void PrintSaveSummary(const UStickerShopSaveGame* SaveData) const;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Save")
	FOnSaveComplete OnSaveComplete;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Save")
	FOnLoadComplete OnLoadComplete;

private:
	static FString GetSaveSlotName(const FString& SlotName, int32 UserIndex);
};
