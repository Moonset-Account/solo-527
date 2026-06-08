#pragma once

#include "CoreMinimal.h"
#include "GameFramework/SaveGame.h"
#include "StickerShopTypes.h"
#include "StickerShopSaveGame.generated.h"

UCLASS()
class STICKERSHOP_API UStickerShopSaveGame : public USaveGame
{
	GENERATED_BODY()

public:
	UStickerShopSaveGame();

	UPROPERTY(SaveGame, BlueprintReadWrite, Category = "Save")
	int32 SlotIndex = 0;

	UPROPERTY(SaveGame, BlueprintReadWrite, Category = "Save")
	FString PlayerName;

	UPROPERTY(SaveGame, BlueprintReadWrite, Category = "Save")
	int32 CurrentLevel = 0;

	UPROPERTY(SaveGame, BlueprintReadWrite, Category = "Save")
	int32 TotalScore = 0;

	UPROPERTY(SaveGame, BlueprintReadWrite, Category = "Save")
	int32 TotalCollections = 0;

	UPROPERTY(SaveGame, BlueprintReadWrite, Category = "Save")
	TArray<FSettlementData> LevelResults;

	UPROPERTY(SaveGame, BlueprintReadWrite, Category = "Save")
	TArray<FPlayerInputRecord> InputRecords;

	UPROPERTY(SaveGame, BlueprintReadWrite, Category = "Save")
	TArray<FInventoryItem> Inventory;

	UPROPERTY(SaveGame, BlueprintReadWrite, Category = "Save")
	FDailyLedger Ledger;

	UPROPERTY(SaveGame, BlueprintReadWrite, Category = "Save")
	FString SaveTime;

	UFUNCTION(BlueprintCallable, Category = "Save")
	void RecordInput(int32 Level, const FString& ActionType, const FString& Detail, float Timestamp, const FString& Result);

	UFUNCTION(BlueprintCallable, Category = "Save")
	void RecordSettlement(const FSettlementData& Data);
};
