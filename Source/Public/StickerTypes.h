#pragma once

#include <string>
#include <vector>
#include <map>
#include <chrono>
#include <functional>
#include <algorithm>
#include <numeric>
#include <random>
#include <sstream>
#include <iomanip>
#include <iostream>
#include <fstream>
#include <memory>
#include <optional>
#include <cmath>

enum class EThemeType : uint8_t
{
    Floral = 0,
    Animal = 1,
    Food = 2,
    Travel = 3,
    Seasonal = 4,
    Minimalist = 5,
    Vintage = 6,
    Kawaii = 7,
    Max
};

inline const char* ThemeTypeToString(EThemeType T)
{
    switch (T)
    {
    case EThemeType::Floral:     return "Floral";
    case EThemeType::Animal:     return "Animal";
    case EThemeType::Food:       return "Food";
    case EThemeType::Travel:     return "Travel";
    case EThemeType::Seasonal:   return "Seasonal";
    case EThemeType::Minimalist: return "Minimalist";
    case EThemeType::Vintage:    return "Vintage";
    case EThemeType::Kawaii:     return "Kawaii";
    default:                     return "Unknown";
    }
}

enum class EStickerRarity : uint8_t
{
    Common = 0,
    Uncommon = 1,
    Rare = 2,
    Legendary = 3
};

inline const char* RarityToString(EStickerRarity R)
{
    switch (R)
    {
    case EStickerRarity::Common:    return "Common";
    case EStickerRarity::Uncommon:  return "Uncommon";
    case EStickerRarity::Rare:      return "Rare";
    case EStickerRarity::Legendary: return "Legendary";
    default:                        return "Unknown";
    }
}

struct FStickerDesign
{
    int32_t DesignId = -1;
    std::string Name;
    EThemeType Theme = EThemeType::Floral;
    EStickerRarity Rarity = EStickerRarity::Common;
    float DesignTime = 1.0f;
    int32_t PrintCost = 10;
    int32_t SellPrice = 20;
    float Popularity = 0.5f;
    std::string Description;

    bool IsValid() const { return DesignId >= 0 && !Name.empty(); }
};

struct FStickerSet
{
    int32_t SetId = -1;
    std::string SetName;
    EThemeType PrimaryTheme = EThemeType::Floral;
    std::vector<FStickerDesign> Stickers;
    int32_t PrintQuantity = 0;
    float TotalPrintCost = 0.0f;
    float TotalSellValue = 0.0f;

    bool IsValid() const { return SetId >= 0 && !Stickers.empty(); }
    float GetProfitMargin() const
    {
        if (TotalPrintCost <= 0) return 0.0f;
        return (TotalSellValue - TotalPrintCost) / TotalPrintCost;
    }
};

struct FInventoryItem
{
    int32_t DesignId = -1;
    std::string DesignName;
    EThemeType Theme = EThemeType::Floral;
    int32_t Quantity = 0;
    int32_t SellPrice = 0;
    EStickerRarity Rarity = EStickerRarity::Common;

    bool IsEmpty() const { return Quantity <= 0; }
};

struct FCustomerPreference
{
    EThemeType PreferredTheme = EThemeType::Floral;
    float ThemeWeight = 1.0f;
    EStickerRarity MinRarity = EStickerRarity::Common;
    int32_t Budget = 50;
    int32_t DesiredQuantity = 1;
    float Patience = 1.0f;
};

struct FCustomerOrder
{
    int32_t OrderId = -1;
    FCustomerPreference Preference;
    bool bFulfilled = false;
    int32_t SpentAmount = 0;
    int32_t ItemsReceived = 0;
    float Satisfaction = 0.0f;
    std::string RejectionReason;

    bool IsSatisfied() const { return bFulfilled && Satisfaction >= 0.6f; }
};

struct FStallSlot
{
    int32_t SlotIndex = -1;
    int32_t DesignId = -1;
    std::string DesignName;
    EThemeType Theme = EThemeType::Floral;
    bool bOccupied = false;
    float Visibility = 1.0f;
    float Attractiveness = 0.5f;

    bool IsAvailable() const { return !bOccupied; }
};

struct FStallLayout
{
    int32_t StallId = -1;
    std::vector<FStallSlot> Slots;
    float LayoutBonus = 0.0f;
    std::map<EThemeType, int32_t> ThemeCounts;

    int32_t GetOccupiedCount() const
    {
        int32_t Count = 0;
        for (const auto& S : Slots) if (S.bOccupied) Count++;
        return Count;
    }
    int32_t GetCapacity() const { return static_cast<int32_t>(Slots.size()); }
};

struct FLedgerEntry
{
    std::string Timestamp;
    std::string Category;
    std::string Description;
    int32_t Amount = 0;
    bool bIsIncome = false;
};

struct FDailyLedger
{
    int32_t DayNumber = 0;
    std::vector<FLedgerEntry> Entries;
    int32_t TotalIncome = 0;
    int32_t TotalExpense = 0;
    int32_t NetProfit = 0;

    void AddIncome(const std::string& Desc, int32_t Amount)
    {
        Entries.push_back({"", "Income", Desc, Amount, true});
        TotalIncome += Amount;
        NetProfit = TotalIncome - TotalExpense;
    }
    void AddExpense(const std::string& Desc, int32_t Amount)
    {
        Entries.push_back({"", "Expense", Desc, Amount, false});
        TotalExpense += Amount;
        NetProfit = TotalIncome - TotalExpense;
    }
};

struct FSettlementData
{
    int32_t LevelNumber = 0;
    int32_t Score = 0;
    float TimeUsed = 0.0f;
    int32_t CustomersSatisfied = 0;
    int32_t CustomersTotal = 0;
    int32_t CollectionsObtained = 0;
    int32_t NetProfit = 0;
    std::vector<std::string> ErrorReasons;
    std::vector<std::string> CollectedItems;
    bool bPassed = false;
    float SatisfactionRate = 0.0f;
    std::string Grade;
};

struct FPlayerInputRecord
{
    int32_t LevelNumber = 0;
    std::string ActionType;
    std::string ActionDetail;
    float Timestamp = 0.0f;
    std::string Result;
};

struct FSaveSlot
{
    int32_t SlotIndex = 0;
    std::string PlayerName;
    int32_t CurrentLevel = 0;
    int32_t TotalScore = 0;
    int32_t TotalCollections = 0;
    std::vector<FSettlementData> LevelResults;
    std::vector<FPlayerInputRecord> InputRecords;
    std::vector<FInventoryItem> Inventory;
    FDailyLedger Ledger;
    std::string SaveTime;
};

enum class ELevelType : uint8_t
{
    Tutorial = 0,
    Normal = 1,
    Challenge = 2,
    FailureTest = 3
};

inline const char* LevelTypeToString(ELevelType T)
{
    switch (T)
    {
    case ELevelType::Tutorial:     return "Tutorial";
    case ELevelType::Normal:       return "Normal";
    case ELevelType::Challenge:    return "Challenge";
    case ELevelType::FailureTest:  return "FailureTest";
    default:                       return "Unknown";
    }
}

struct FLevelDefinition
{
    int32_t LevelId = 0;
    std::string LevelName;
    ELevelType Type = ELevelType::Normal;
    std::string Description;
    int32_t TargetScore = 100;
    float TimeLimit = 120.0f;
    int32_t CustomerCount = 5;
    std::vector<EThemeType> AvailableThemes;
    int32_t StartingBudget = 200;
    int32_t StallSlots = 4;
    float DifficultyMultiplier = 1.0f;
    std::vector<std::string> SpecialRules;
    std::map<std::string, float> WinConditions;
    std::map<std::string, float> LoseConditions;
    bool bForceFailure = false;

    bool CheckWinCondition(const FSettlementData& Result) const
    {
        if (Result.Score < TargetScore) return false;
        if (!WinConditions.empty())
        {
            float satRate = (Result.CustomersTotal > 0)
                ? static_cast<float>(Result.CustomersSatisfied) / Result.CustomersTotal
                : 0.0f;
            auto It = WinConditions.find("SatisfactionRate");
            if (It != WinConditions.end() && satRate < It->second) return false;
        }
        return true;
    }
    bool CheckLoseCondition(const FSettlementData& Result) const
    {
        if (bForceFailure) return true;
        for (const auto& [Key, Val] : LoseConditions)
        {
            if (Key == "MaxErrors" && static_cast<float>(Result.ErrorReasons.size()) >= Val) return true;
            if (Key == "MinSatisfactionRate")
            {
                float satRate = (Result.CustomersTotal > 0)
                    ? static_cast<float>(Result.CustomersSatisfied) / Result.CustomersTotal
                    : 0.0f;
                if (satRate < Val) return true;
            }
        }
        return false;
    }
};

struct FLevelExtensionConfig
{
    std::string MethodName;
    std::string Description;
    std::vector<std::string> Parameters;
    std::function<FLevelDefinition(const FLevelDefinition&, const std::map<std::string, float>&)> Generator;
};
