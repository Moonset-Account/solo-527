#pragma once

#include "StickerTypes.h"
#include "InventoryComponent.h"
#include "CustomerSystem.h"
#include "StallLayout.h"
#include "DailyLedger.h"
#include "LevelSystem.h"
#include "SettlementSystem.h"
#include "SaveSystem.h"

enum class EGamePhase : uint8_t
{
    Design = 0,
    Print = 1,
    Setup = 2,
    Sell = 3,
    Settle = 4,
    GameOver = 5
};

class AGameMode_StickerShop
{
public:
    AGameMode_StickerShop() = default;

    void Initialize();
    void StartLevel(int32_t LevelId);

    bool DesignSticker(const std::string& Name, EThemeType Theme, EStickerRarity Rarity);
    bool PrintStickerSet(int32_t DesignId, int32_t Quantity);
    bool PlaceStickerOnStall(int32_t SlotIndex, int32_t DesignId);
    bool ServeCustomer(int32_t OrderIndex);
    bool SkipCustomer(int32_t OrderIndex, const std::string& Reason);

    FSettlementData EndLevel();

    EGamePhase GetCurrentPhase() const;
    const FLevelDefinition* GetCurrentLevel() const;
    float GetElapsedTime() const;

    const UInventoryComponent& GetInventory() const;
    const UCustomerSystem& GetCustomerSystem() const;
    UCustomerSystem& GetCustomerSystemRef();
    const UStallLayout& GetStallLayout() const;
    const UDailyLedger& GetLedger() const;

    void AdvancePhase();

    void RecordAction(const std::string& ActionType, const std::string& Detail, const std::string& Result);

    void SimulateFullLevel(int32_t LevelId, bool bOptimal = true);

private:
    UInventoryComponent Inventory;
    UCustomerSystem Customers;
    UStallLayout Stall;
    UDailyLedger Ledger;
    ULevelSystem LevelSys;
    USettlementSystem Settlement;
    USaveSystem Save;

    FSaveSlot CurrentSave;
    EGamePhase Phase = EGamePhase::Design;
    int32_t CurrentLevelId = -1;
    std::chrono::steady_clock::time_point LevelStartTime;
    std::vector<std::string> LevelErrors;
    std::vector<std::string> LevelCollections;
    std::vector<FStickerDesign> DesignedStickers;

    int32_t NextDesignId = 0;
    int32_t LevelScore = 0;

    void ExecuteDesignPhase();
    void ExecutePrintPhase();
    void ExecuteSetupPhase();
    void ExecuteSellPhase();
    void ExecuteSettlePhase();
    FStickerDesign CreateDesign(const std::string& Name, EThemeType Theme, EStickerRarity Rarity);
};
