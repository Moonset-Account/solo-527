#include "GameMode_StickerShop.h"
#include <iostream>

void AGameMode_StickerShop::Initialize()
{
    LevelSys.RegisterBuiltinLevels();
    CurrentSave = FSaveSlot();
    CurrentSave.SlotIndex = 0;
    CurrentSave.PlayerName = "Player";
}

void AGameMode_StickerShop::StartLevel(int32_t LevelId)
{
    const FLevelDefinition* Level = LevelSys.GetLevel(LevelId);
    if (!Level)
    {
        std::cerr << "Level " << LevelId << " not found!" << std::endl;
        return;
    }

    CurrentLevelId = LevelId;
    Phase = EGamePhase::Design;
    LevelErrors.clear();
    LevelCollections.clear();
    DesignedStickers.clear();
    LevelScore = 0;
    NextDesignId = 0;

    Inventory.Initialize(Level->StartingBudget);
    Customers.Initialize(Level->CustomerCount, Level->AvailableThemes, Level->DifficultyMultiplier);
    Stall.Initialize(Level->StallSlots);
    Ledger.StartDay(LevelId);

    LevelStartTime = std::chrono::steady_clock::now();

    Save.RecordInput(CurrentSave, LevelId, "StartLevel", Level->LevelName, 0.0f, "OK");

    std::cout << "\n--- Starting Level: " << Level->LevelName
              << " (Type: " << LevelTypeToString(Level->Type) << ") ---" << std::endl;
    std::cout << "Budget: " << Level->StartingBudget
              << " | Customers: " << Level->CustomerCount
              << " | Time Limit: " << Level->TimeLimit << "s" << std::endl;
}

FStickerDesign AGameMode_StickerShop::CreateDesign(const std::string& Name, EThemeType Theme, EStickerRarity Rarity)
{
    FStickerDesign Design;
    Design.DesignId = NextDesignId++;
    Design.Name = Name;
    Design.Theme = Theme;
    Design.Rarity = Rarity;
    Design.DesignTime = 1.0f + static_cast<float>(Rarity) * 0.5f;

    int32_t BaseCost = 5;
    int32_t BasePrice = 15;
    Design.PrintCost = BaseCost + static_cast<int32_t>(Rarity) * 8 + static_cast<int32_t>(Theme) * 2;
    Design.SellPrice = BasePrice + static_cast<int32_t>(Rarity) * 15 + static_cast<int32_t>(Theme) * 3;
    Design.Popularity = 0.3f + static_cast<float>(Rarity) * 0.15f;
    Design.Description = Name + " - " + ThemeTypeToString(Theme) + " " + RarityToString(Rarity);

    return Design;
}

bool AGameMode_StickerShop::DesignSticker(const std::string& Name, EThemeType Theme, EStickerRarity Rarity)
{
    if (Name.empty())
    {
        LevelErrors.push_back("Empty sticker name");
        Save.RecordInput(CurrentSave, CurrentLevelId, "DesignSticker", Name, GetElapsedTime(), "FAIL:EmptyName");
        return false;
    }

    FStickerDesign Design = CreateDesign(Name, Theme, Rarity);
    DesignedStickers.push_back(Design);

    Save.RecordInput(CurrentSave, CurrentLevelId, "DesignSticker", Design.Description, GetElapsedTime(), "OK");
    std::cout << "  Designed: " << Design.Description
              << " (Cost:" << Design.PrintCost << " Sell:" << Design.SellPrice << ")" << std::endl;
    return true;
}

bool AGameMode_StickerShop::PrintStickerSet(int32_t DesignId, int32_t Quantity)
{
    if (DesignId < 0 || DesignId >= static_cast<int32_t>(DesignedStickers.size()))
    {
        LevelErrors.push_back("Invalid design ID: " + std::to_string(DesignId));
        Save.RecordInput(CurrentSave, CurrentLevelId, "PrintStickerSet", std::to_string(DesignId), GetElapsedTime(), "FAIL:InvalidDesignId");
        return false;
    }
    if (Quantity <= 0)
    {
        LevelErrors.push_back("Invalid print quantity: " + std::to_string(Quantity));
        Save.RecordInput(CurrentSave, CurrentLevelId, "PrintStickerSet", "Qty=" + std::to_string(Quantity), GetElapsedTime(), "FAIL:InvalidQuantity");
        return false;
    }

    const auto& Design = DesignedStickers[DesignId];
    int32_t TotalCost = Design.PrintCost * Quantity;

    if (!Inventory.SpendBudget(TotalCost))
    {
        LevelErrors.push_back("Insufficient budget for printing: need " + std::to_string(TotalCost) + " have " + std::to_string(Inventory.GetBudget()));
        Save.RecordInput(CurrentSave, CurrentLevelId, "PrintStickerSet", "Cost=" + std::to_string(TotalCost), GetElapsedTime(), "FAIL:InsufficientBudget");
        return false;
    }

    Inventory.AddItem(Design, Quantity);
    Ledger.RecordExpense("Print: " + Design.Name + " x" + std::to_string(Quantity), TotalCost);

    std::string CollectName = Design.Name + " (x" + std::to_string(Quantity) + ")";
    if (Design.Rarity >= EStickerRarity::Rare)
    {
        LevelCollections.push_back(CollectName);
    }

    Save.RecordInput(CurrentSave, CurrentLevelId, "PrintStickerSet", CollectName, GetElapsedTime(), "OK");
    std::cout << "  Printed: " << Design.Name << " x" << Quantity
              << " (Cost: " << TotalCost << ", Budget left: " << Inventory.GetBudget() << ")" << std::endl;
    return true;
}

bool AGameMode_StickerShop::PlaceStickerOnStall(int32_t SlotIndex, int32_t DesignId)
{
    if (DesignId < 0 || DesignId >= static_cast<int32_t>(DesignedStickers.size()))
    {
        LevelErrors.push_back("Cannot place invalid design on stall");
        Save.RecordInput(CurrentSave, CurrentLevelId, "PlaceStickerOnStall", "Slot=" + std::to_string(SlotIndex), GetElapsedTime(), "FAIL:InvalidDesignId");
        return false;
    }
    if (!Inventory.HasDesign(DesignId))
    {
        LevelErrors.push_back("Design not in inventory for stall placement");
        Save.RecordInput(CurrentSave, CurrentLevelId, "PlaceStickerOnStall", "DesignId=" + std::to_string(DesignId), GetElapsedTime(), "FAIL:NotInInventory");
        return false;
    }

    const auto& Design = DesignedStickers[DesignId];
    if (!Stall.PlaceSticker(SlotIndex, Design))
    {
        LevelErrors.push_back("Cannot place sticker on slot " + std::to_string(SlotIndex));
        Save.RecordInput(CurrentSave, CurrentSave.CurrentLevel, "PlaceStickerOnStall", "Slot=" + std::to_string(SlotIndex), GetElapsedTime(), "FAIL:SlotUnavailable");
        return false;
    }

    Save.RecordInput(CurrentSave, CurrentLevelId, "PlaceStickerOnStall", Design.Name + "->Slot" + std::to_string(SlotIndex), GetElapsedTime(), "OK");
    std::cout << "  Placed: " << Design.Name << " on slot " << SlotIndex << std::endl;
    return true;
}

bool AGameMode_StickerShop::ServeCustomer(int32_t OrderIndex)
{
    auto DisplayItems = Stall.GetDisplayItems(Inventory.GetAllItems());
    bool Result = Customers.FulfillOrder(OrderIndex, DisplayItems, Inventory);

    if (Result)
    {
        const auto& Order = Customers.GetOrders()[OrderIndex];
        std::string Desc = "Customer #" + std::to_string(OrderIndex) + " paid " + std::to_string(Order.SpentAmount);
        Ledger.RecordIncome("Sale: " + Desc, Order.SpentAmount);
        LevelScore += static_cast<int32_t>(Order.Satisfaction * 100);
        Save.RecordInput(CurrentSave, CurrentLevelId, "ServeCustomer", Desc, GetElapsedTime(), "OK");
        std::cout << "  Served customer #" << OrderIndex
                  << " (Satisfaction: " << static_cast<int>(Order.Satisfaction * 100) << "%"
                  << " Revenue: " << Order.SpentAmount << ")" << std::endl;
    }
    else
    {
        const auto& Order = Customers.GetOrders()[OrderIndex];
        LevelErrors.push_back("Customer #" + std::to_string(OrderIndex) + " rejected: " + Order.RejectionReason);
        Save.RecordInput(CurrentSave, CurrentLevelId, "ServeCustomer", "Customer#" + std::to_string(OrderIndex), GetElapsedTime(), "FAIL:" + Order.RejectionReason);
        std::cout << "  Failed to serve customer #" << OrderIndex << ": " << Order.RejectionReason << std::endl;
    }
    return Result;
}

bool AGameMode_StickerShop::SkipCustomer(int32_t OrderIndex, const std::string& Reason)
{
    Customers.SkipOrder(OrderIndex, Reason);
    LevelErrors.push_back("Skipped customer #" + std::to_string(OrderIndex) + ": " + Reason);
    Save.RecordInput(CurrentSave, CurrentLevelId, "SkipCustomer", "Customer#" + std::to_string(OrderIndex), GetElapsedTime(), "SKIP:" + Reason);
    std::cout << "  Skipped customer #" << OrderIndex << ": " << Reason << std::endl;
    return true;
}

FSettlementData AGameMode_StickerShop::EndLevel()
{
    auto EndTime = std::chrono::steady_clock::now();
    float Elapsed = std::chrono::duration<float>(EndTime - LevelStartTime).count();

    const FLevelDefinition* Level = LevelSys.GetLevel(CurrentLevelId);
    if (!Level) return FSettlementData();

    FSettlementData Result = Settlement.Calculate(
        *Level,
        LevelScore,
        Elapsed,
        Customers.GetSatisfiedCount(),
        Customers.GetTotalCount(),
        Ledger.GetNetProfit(),
        LevelErrors,
        LevelCollections
    );

    Ledger.CloseDay();
    Save.RecordSettlement(CurrentSave, Result);
    Save.RecordInput(CurrentSave, CurrentLevelId, "EndLevel", "Score=" + std::to_string(Result.Score), Elapsed,
                     Result.bPassed ? "PASSED" : "FAILED");

    Settlement.PrintSettlement(Result);

    Phase = EGamePhase::Settle;
    return Result;
}

EGamePhase AGameMode_StickerShop::GetCurrentPhase() const { return Phase; }
const FLevelDefinition* AGameMode_StickerShop::GetCurrentLevel() const { return LevelSys.GetLevel(CurrentLevelId); }

float AGameMode_StickerShop::GetElapsedTime() const
{
    auto Now = std::chrono::steady_clock::now();
    return std::chrono::duration<float>(Now - LevelStartTime).count();
}

const UInventoryComponent& AGameMode_StickerShop::GetInventory() const { return Inventory; }
const UCustomerSystem& AGameMode_StickerShop::GetCustomerSystem() const { return Customers; }
UCustomerSystem& AGameMode_StickerShop::GetCustomerSystemRef() { return Customers; }
const UStallLayout& AGameMode_StickerShop::GetStallLayout() const { return Stall; }
const UDailyLedger& AGameMode_StickerShop::GetLedger() const { return Ledger; }

void AGameMode_StickerShop::AdvancePhase()
{
    switch (Phase)
    {
    case EGamePhase::Design:  Phase = EGamePhase::Print;  break;
    case EGamePhase::Print:   Phase = EGamePhase::Setup;  break;
    case EGamePhase::Setup:   Phase = EGamePhase::Sell;   break;
    case EGamePhase::Sell:    Phase = EGamePhase::Settle;  break;
    default: break;
    }
}

void AGameMode_StickerShop::RecordAction(const std::string& ActionType, const std::string& Detail, const std::string& Result)
{
    Save.RecordInput(CurrentSave, CurrentLevelId, ActionType, Detail, GetElapsedTime(), Result);
}

void AGameMode_StickerShop::SimulateFullLevel(int32_t LevelId, bool bOptimal)
{
    StartLevel(LevelId);
    const FLevelDefinition* Level = LevelSys.GetLevel(LevelId);
    if (!Level) return;

    Phase = EGamePhase::Design;
    int32_t DesignCount = 0;
    for (auto Theme : Level->AvailableThemes)
    {
        std::string Name = std::string(ThemeTypeToString(Theme)) + "_Sticker";
        EStickerRarity Rarity = bOptimal ? EStickerRarity::Uncommon : EStickerRarity::Common;
        DesignSticker(Name, Theme, Rarity);
        DesignCount++;
        if (DesignCount >= Level->StallSlots + 2) break;
    }

    Phase = EGamePhase::Print;
    for (int32_t i = 0; i < static_cast<int32_t>(DesignedStickers.size()); i++)
    {
        int32_t Qty = bOptimal ? 5 : 2;
        PrintStickerSet(i, Qty);
    }

    Phase = EGamePhase::Setup;
    int32_t SlotIdx = 0;
    for (int32_t i = 0; i < static_cast<int32_t>(DesignedStickers.size()) && SlotIdx < Level->StallSlots; i++)
    {
        if (Inventory.HasDesign(i))
        {
            PlaceStickerOnStall(SlotIdx, i);
            SlotIdx++;
        }
    }

    Phase = EGamePhase::Sell;
    Customers.GenerateCustomers();
    for (int32_t i = 0; i < Customers.GetTotalCount(); i++)
    {
        if (!ServeCustomer(i))
        {
            if (bOptimal)
                SkipCustomer(i, "No matching stock");
        }
    }

    EndLevel();
}
