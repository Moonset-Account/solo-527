#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "StickerShopTypes.h"
#include "StickerShopGameMode.generated.h"

class UStickerDesignComponent;
class UInventoryComponent;
class UCustomerSystemComponent;
class UStallLayoutComponent;
class UDailyLedgerComponent;
class ULevelSystemComponent;
class USettlementComponent;
class USaveSystemComponent;
class UStickerShopSaveGame;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnPhaseChanged, EGamePhase, NewPhase);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnLevelStarted, int32, LevelId);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnLevelEnded, const FSettlementData&, Settlement);

UCLASS()
class STICKERSHOP_API AStickerShopGameMode : public AGameModeBase
{
	GENERATED_BODY()

public:
	AStickerShopGameMode();

	virtual void BeginPlay() override;

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Game")
	void InitializeGame();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Game")
	void StartLevel(int32 LevelId);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Game")
	FSettlementData EndLevel();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Game")
	void AdvancePhase();

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Game")
	bool DesignSticker(const FString& Name, EThemeType Theme, EStickerRarity Rarity);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Game")
	bool PrintStickerSet(int32 DesignId, int32 Quantity);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Game")
	bool PlaceStickerOnStall(int32 SlotIndex, int32 DesignId);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Game")
	bool ServeCustomer(int32 OrderIndex);

	UFUNCTION(BlueprintCallable, Category = "StickerShop|Game")
	bool SkipCustomer(int32 OrderIndex, const FString& Reason);

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Game")
	EGamePhase GetCurrentPhase() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Game")
	const FLevelDefinition* GetCurrentLevelDef() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Game")
	float GetElapsedTime() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Game")
	UStickerDesignComponent* GetDesignComponent() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Game")
	UInventoryComponent* GetInventoryComponent() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Game")
	UCustomerSystemComponent* GetCustomerComponent() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Game")
	UStallLayoutComponent* GetStallComponent() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Game")
	UDailyLedgerComponent* GetLedgerComponent() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Game")
	ULevelSystemComponent* GetLevelComponent() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Game")
	USettlementComponent* GetSettlementComponent() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Game")
	USaveSystemComponent* GetSaveComponent() const;

	UFUNCTION(BlueprintCallable, BlueprintPure, Category = "StickerShop|Game")
	UStickerShopSaveGame* GetCurrentSaveData() const;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Game")
	FOnPhaseChanged OnPhaseChanged;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Game")
	FOnLevelStarted OnLevelStarted;

	UPROPERTY(BlueprintAssignable, Category = "StickerShop|Game")
	FOnLevelEnded OnLevelEnded;

protected:
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "StickerShop|Components")
	UStickerDesignComponent* DesignComp;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "StickerShop|Components")
	UInventoryComponent* InventoryComp;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "StickerShop|Components")
	UCustomerSystemComponent* CustomerComp;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "StickerShop|Components")
	UStallLayoutComponent* StallComp;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "StickerShop|Components")
	UDailyLedgerComponent* LedgerComp;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "StickerShop|Components")
	ULevelSystemComponent* LevelComp;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "StickerShop|Components")
	USettlementComponent* SettlementComp;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "StickerShop|Components")
	USaveSystemComponent* SaveComp;

	UPROPERTY()
	UStickerShopSaveGame* CurrentSave;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "StickerShop|State")
	EGamePhase Phase = EGamePhase::Design;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "StickerShop|State")
	int32 CurrentLevelId = -1;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "StickerShop|State")
	int32 LevelScore = 0;

	UPROPERTY()
	TArray<FString> LevelErrors;

	UPROPERTY()
	TArray<FString> LevelCollections;

	UPROPERTY()
	float LevelStartTime = 0.0f;

	void RecordAction(const FString& ActionType, const FString& Detail, const FString& Result);
};
