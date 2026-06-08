#pragma once

#include "CoreMinimal.h"
#include "StickerShopTypes.generated.h"

UENUM(BlueprintType)
enum class EThemeType : uint8
{
	Floral     UMETA(DisplayName = "Floral"),
	Animal     UMETA(DisplayName = "Animal"),
	Food       UMETA(DisplayName = "Food"),
	Travel     UMETA(DisplayName = "Travel"),
	Seasonal   UMETA(DisplayName = "Seasonal"),
	Minimalist UMETA(DisplayName = "Minimalist"),
	Vintage    UMETA(DisplayName = "Vintage"),
	Kawaii     UMETA(DisplayName = "Kawaii")
};

UENUM(BlueprintType)
enum class EStickerRarity : uint8
{
	Common    UMETA(DisplayName = "Common"),
	Uncommon  UMETA(DisplayName = "Uncommon"),
	Rare      UMETA(DisplayName = "Rare"),
	Legendary UMETA(DisplayName = "Legendary")
};

UENUM(BlueprintType)
enum class EGamePhase : uint8
{
	Design   UMETA(DisplayName = "Design"),
	Print    UMETA(DisplayName = "Print"),
	Setup    UMETA(DisplayName = "Setup"),
	Sell     UMETA(DisplayName = "Sell"),
	Settle   UMETA(DisplayName = "Settle"),
	GameOver UMETA(DisplayName = "GameOver")
};

UENUM(BlueprintType)
enum class ELevelType : uint8
{
	Tutorial    UMETA(DisplayName = "Tutorial"),
	Normal      UMETA(DisplayName = "Normal"),
	Challenge   UMETA(DisplayName = "Challenge"),
	FailureTest UMETA(DisplayName = "FailureTest")
};

USTRUCT(BlueprintType)
struct FStickerDesign
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Sticker")
	int32 DesignId = -1;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Sticker")
	FString Name;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Sticker")
	EThemeType Theme = EThemeType::Floral;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Sticker")
	EStickerRarity Rarity = EStickerRarity::Common;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Sticker")
	float DesignTime = 1.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Sticker")
	int32 PrintCost = 10;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Sticker")
	int32 SellPrice = 20;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Sticker")
	float Popularity = 0.5f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Sticker")
	FString Description;

	bool IsValid() const { return DesignId >= 0 && !Name.IsEmpty(); }
};

USTRUCT(BlueprintType)
struct FInventoryItem
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
	int32 DesignId = -1;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
	FString DesignName;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
	EThemeType Theme = EThemeType::Floral;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
	int32 Quantity = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
	int32 SellPrice = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
	EStickerRarity Rarity = EStickerRarity::Common;

	bool IsEmpty() const { return Quantity <= 0; }
};

USTRUCT(BlueprintType)
struct FCustomerPreference
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Customer")
	EThemeType PreferredTheme = EThemeType::Floral;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Customer")
	float ThemeWeight = 1.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Customer")
	EStickerRarity MinRarity = EStickerRarity::Common;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Customer")
	int32 Budget = 50;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Customer")
	int32 DesiredQuantity = 1;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Customer")
	float Patience = 1.0f;
};

USTRUCT(BlueprintType)
struct FCustomerOrder
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Customer")
	int32 OrderId = -1;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Customer")
	FCustomerPreference Preference;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Customer")
	bool bFulfilled = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Customer")
	int32 SpentAmount = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Customer")
	int32 ItemsReceived = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Customer")
	float Satisfaction = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Customer")
	FString RejectionReason;

	bool IsSatisfied() const { return bFulfilled && Satisfaction >= 0.6f; }
};

USTRUCT(BlueprintType)
struct FStallSlot
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stall")
	int32 SlotIndex = -1;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stall")
	int32 DesignId = -1;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stall")
	FString DesignName;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stall")
	EThemeType Theme = EThemeType::Floral;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stall")
	bool bOccupied = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stall")
	float Visibility = 1.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stall")
	float Attractiveness = 0.5f;
};

USTRUCT(BlueprintType)
struct FLedgerEntry
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ledger")
	FString Timestamp;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ledger")
	FString Category;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ledger")
	FString Description;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ledger")
	int32 Amount = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ledger")
	bool bIsIncome = false;
};

USTRUCT(BlueprintType)
struct FDailyLedger
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ledger")
	int32 DayNumber = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ledger")
	TArray<FLedgerEntry> Entries;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ledger")
	int32 TotalIncome = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ledger")
	int32 TotalExpense = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Ledger")
	int32 NetProfit = 0;
};

USTRUCT(BlueprintType)
struct FSettlementData
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settlement")
	int32 LevelNumber = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settlement")
	int32 Score = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settlement")
	float TimeUsed = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settlement")
	int32 CustomersSatisfied = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settlement")
	int32 CustomersTotal = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settlement")
	int32 CollectionsObtained = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settlement")
	int32 NetProfit = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settlement")
	TArray<FString> ErrorReasons;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settlement")
	TArray<FString> CollectedItems;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settlement")
	bool bPassed = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settlement")
	float SatisfactionRate = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Settlement")
	FString Grade;
};

USTRUCT(BlueprintType)
struct FPlayerInputRecord
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Record")
	int32 LevelNumber = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Record")
	FString ActionType;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Record")
	FString ActionDetail;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Record")
	float Timestamp = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Record")
	FString Result;
};

USTRUCT(BlueprintType)
struct FLevelDefinition
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	int32 LevelId = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	FString LevelName;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	ELevelType Type = ELevelType::Normal;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	FString Description;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	int32 TargetScore = 100;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	float TimeLimit = 120.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	int32 CustomerCount = 5;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	TArray<EThemeType> AvailableThemes;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	int32 StartingBudget = 200;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	int32 StallSlots = 4;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	float DifficultyMultiplier = 1.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	TArray<FString> SpecialRules;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	TMap<FString, float> WinConditions;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	TMap<FString, float> LoseConditions;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Level")
	bool bForceFailure = false;

	bool CheckWinCondition(const FSettlementData& Result) const;
	bool CheckLoseCondition(const FSettlementData& Result) const;
};
