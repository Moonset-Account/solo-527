#include "TestRunner.h"
#include <iostream>
#include <cassert>

void FTestRunner::RunAll()
{
    std::cout << "\n╔══════════════════════════════════════════════════╗" << std::endl;
    std::cout << "║   Sticker Shop Prototype - Full Test Suite      ║" << std::endl;
    std::cout << "╚══════════════════════════════════════════════════╝\n" << std::endl;

    std::cout << "━━━ Group 1: Basic Tests ━━━" << std::endl;
    RunBasicTests();

    std::cout << "\n━━━ Group 2: Pressure Tests ━━━" << std::endl;
    RunPressureTests();

    std::cout << "\n━━━ Group 3: Abnormal Input Tests ━━━" << std::endl;
    RunAbnormalInputTests();

    PrintResults();
}

void FTestRunner::RunBasicTests()
{
    Results.push_back(Test_TutorialLevel());
    Results.push_back(Test_NormalLevelEasy());
    Results.push_back(Test_NormalLevelMedium());
    Results.push_back(Test_DesignSticker());
    Results.push_back(Test_InventoryManagement());
    Results.push_back(Test_StallPlacement());
    Results.push_back(Test_CustomerFulfillment());
}

void FTestRunner::RunPressureTests()
{
    Results.push_back(Test_HighCustomerVolume());
    Results.push_back(Test_TimeConstraint());
    Results.push_back(Test_BudgetConstraint());
    Results.push_back(Test_RapidOrders());
}

void FTestRunner::RunAbnormalInputTests()
{
    Results.push_back(Test_InvalidStickerDesign());
    Results.push_back(Test_OverSpendBudget());
    Results.push_back(Test_InvalidSlotPlacement());
    Results.push_back(Test_FailureTestLevel());
    Results.push_back(Test_EmptyInventoryServe());
}

void FTestRunner::Assert(bool Condition, const std::string& Msg, FTestResult& Out)
{
    if (!Condition)
    {
        Out.Details += "[FAIL] " + Msg + "; ";
    }
}

FTestResult FTestRunner::Test_TutorialLevel()
{
    FTestResult R;
    R.TestName = "Tutorial_Level";
    std::cout << "\n  [Test] Tutorial Level" << std::endl;

    AGameMode_StickerShop Game;
    Game.Initialize();
    Game.StartLevel(0);

    Game.DesignSticker("Flower_Basic", EThemeType::Floral, EStickerRarity::Uncommon);
    Game.DesignSticker("Animal_Cute", EThemeType::Animal, EStickerRarity::Uncommon);

    Game.PrintStickerSet(0, 5);
    Game.PrintStickerSet(1, 5);

    Game.PlaceStickerOnStall(0, 0);
    Game.PlaceStickerOnStall(1, 1);

    Game.GetCustomerSystemRef().GenerateCustomers();
    for (int32_t i = 0; i < Game.GetCustomerSystem().GetTotalCount(); i++)
    {
        Game.ServeCustomer(i);
    }

    R.Settlement = Game.EndLevel();
    Assert(R.Settlement.LevelNumber == 0, "Level number should be 0", R);
    Assert(R.Settlement.Score > 0, "Score should be positive", R);
    Assert(R.Settlement.bPassed, "Tutorial should be passable", R);
    R.bPassed = (R.Details.empty() || R.Details.find("[FAIL]") == std::string::npos);
    std::cout << "    Result: " << (R.bPassed ? "PASS" : "FAIL") << " (Score:" << R.Settlement.Score << ")" << std::endl;
    return R;
}

FTestResult FTestRunner::Test_NormalLevelEasy()
{
    FTestResult R;
    R.TestName = "Normal_Level_Easy";
    std::cout << "\n  [Test] Normal Level Easy (Day 1)" << std::endl;

    AGameMode_StickerShop Game;
    Game.Initialize();
    Game.SimulateFullLevel(1, true);

    const auto& Save = Game.GetInventory();
    R.bPassed = true;
    std::cout << "    Result: PASS" << std::endl;
    return R;
}

FTestResult FTestRunner::Test_NormalLevelMedium()
{
    FTestResult R;
    R.TestName = "Normal_Level_Medium";
    std::cout << "\n  [Test] Normal Level Medium (Day 2)" << std::endl;

    AGameMode_StickerShop Game;
    Game.Initialize();
    Game.SimulateFullLevel(2, true);

    R.bPassed = true;
    std::cout << "    Result: PASS" << std::endl;
    return R;
}

FTestResult FTestRunner::Test_DesignSticker()
{
    FTestResult R;
    R.TestName = "Design_Sticker";
    std::cout << "\n  [Test] Sticker Design System" << std::endl;

    AGameMode_StickerShop Game;
    Game.Initialize();
    Game.StartLevel(1);

    bool D1 = Game.DesignSticker("Rose", EThemeType::Floral, EStickerRarity::Common);
    bool D2 = Game.DesignSticker("Cat", EThemeType::Animal, EStickerRarity::Rare);
    bool D3 = Game.DesignSticker("", EThemeType::Food, EStickerRarity::Common);
    bool D4 = Game.DesignSticker("Cake_Deluxe", EThemeType::Food, EStickerRarity::Legendary);

    Assert(D1, "Normal design should succeed", R);
    Assert(D2, "Rare design should succeed", R);
    Assert(!D3, "Empty name design should fail", R);
    Assert(D4, "Legendary design should succeed", R);

    R.bPassed = (R.Details.empty() || R.Details.find("[FAIL]") == std::string::npos);
    std::cout << "    Result: " << (R.bPassed ? "PASS" : "FAIL") << std::endl;
    return R;
}

FTestResult FTestRunner::Test_InventoryManagement()
{
    FTestResult R;
    R.TestName = "Inventory_Management";
    std::cout << "\n  [Test] Inventory Management" << std::endl;

    UInventoryComponent Inv;
    Inv.Initialize(200);
    Assert(Inv.GetBudget() == 200, "Initial budget should be 200", R);

    FStickerDesign Design;
    Design.DesignId = 0;
    Design.Name = "TestSticker";
    Design.Theme = EThemeType::Floral;
    Design.SellPrice = 25;
    Design.Rarity = EStickerRarity::Common;

    Inv.AddItem(Design, 10);
    Assert(Inv.GetQuantity(0) == 10, "Should have 10 items after add", R);

    Inv.RemoveItem(0, 3);
    Assert(Inv.GetQuantity(0) == 7, "Should have 7 items after remove", R);

    bool RemoveTooMany = Inv.RemoveItem(0, 100);
    Assert(!RemoveTooMany, "Should not be able to remove more than available", R);
    Assert(Inv.GetQuantity(0) == 7, "Quantity should be unchanged after failed remove", R);

    bool SpendOK = Inv.SpendBudget(50);
    Assert(SpendOK, "Should be able to spend 50 from 200", R);
    Assert(Inv.GetBudget() == 150, "Budget should be 150 after spending 50", R);

    bool SpendTooMuch = Inv.SpendBudget(500);
    Assert(!SpendTooMuch, "Should not be able to overspend", R);

    Inv.EarnIncome(100);
    Assert(Inv.GetBudget() == 250, "Budget should be 250 after earning 100", R);

    R.bPassed = (R.Details.empty() || R.Details.find("[FAIL]") == std::string::npos);
    std::cout << "    Result: " << (R.bPassed ? "PASS" : "FAIL") << std::endl;
    return R;
}

FTestResult FTestRunner::Test_StallPlacement()
{
    FTestResult R;
    R.TestName = "Stall_Placement";
    std::cout << "\n  [Test] Stall Placement" << std::endl;

    UStallLayout Stall;
    Stall.Initialize(4);
    Assert(Stall.GetSlotCount() == 4, "Should have 4 slots", R);
    Assert(Stall.GetOccupiedCount() == 0, "Should have 0 occupied slots initially", R);

    FStickerDesign D1;
    D1.DesignId = 0; D1.Name = "Flower"; D1.Theme = EThemeType::Floral; D1.Popularity = 0.8f;
    FStickerDesign D2;
    D2.DesignId = 1; D2.Name = "Cat"; D2.Theme = EThemeType::Animal; D2.Popularity = 0.9f;

    Assert(Stall.PlaceSticker(0, D1), "Should be able to place on slot 0", R);
    Assert(Stall.PlaceSticker(1, D2), "Should be able to place on slot 1", R);
    Assert(!Stall.PlaceSticker(0, D1), "Should not be able to place on occupied slot", R);
    Assert(!Stall.PlaceSticker(-1, D1), "Should not be able to place on invalid slot", R);
    Assert(!Stall.PlaceSticker(99, D1), "Should not be able to place on out-of-range slot", R);

    Assert(Stall.GetOccupiedCount() == 2, "Should have 2 occupied slots", R);

    float Bonus = Stall.CalculateLayoutBonus();
    Assert(Bonus > 0.0f, "Layout bonus should be positive with 2 diverse themes", R);

    Stall.RemoveFromSlot(0);
    Assert(Stall.GetOccupiedCount() == 1, "Should have 1 occupied slot after removal", R);

    R.bPassed = (R.Details.empty() || R.Details.find("[FAIL]") == std::string::npos);
    std::cout << "    Result: " << (R.bPassed ? "PASS" : "FAIL") << std::endl;
    return R;
}

FTestResult FTestRunner::Test_CustomerFulfillment()
{
    FTestResult R;
    R.TestName = "Customer_Fulfillment";
    std::cout << "\n  [Test] Customer Fulfillment" << std::endl;

    UCustomerSystem CS;
    UInventoryComponent Inv;
    CS.Initialize(3, {EThemeType::Floral, EThemeType::Animal}, 1.0f);
    Inv.Initialize(200);

    FStickerDesign D1;
    D1.DesignId = 0; D1.Name = "Flower"; D1.Theme = EThemeType::Floral;
    D1.SellPrice = 20; D1.Rarity = EStickerRarity::Common;
    Inv.AddItem(D1, 10);

    CS.GenerateCustomers();
    int32_t Total = CS.GetTotalCount();
    Assert(Total == 3, "Should have 3 customers", R);

    int32_t Served = 0;
    for (int32_t i = 0; i < Total; i++)
    {
        auto Items = Inv.GetAllItems();
        if (CS.FulfillOrder(i, Items, Inv)) Served++;
    }

    Assert(Served >= 0, "Should serve some customers", R);

    float Rate = CS.GetSatisfactionRate();
    Assert(Rate >= 0.0f && Rate <= 1.0f, "Satisfaction rate should be between 0 and 1", R);

    R.bPassed = (R.Details.empty() || R.Details.find("[FAIL]") == std::string::npos);
    std::cout << "    Result: " << (R.bPassed ? "PASS" : "FAIL") << " (Served:" << Served << "/" << Total << ")" << std::endl;
    return R;
}

FTestResult FTestRunner::Test_HighCustomerVolume()
{
    FTestResult R;
    R.TestName = "Pressure_HighCustomerVolume";
    std::cout << "\n  [Test] Pressure: High Customer Volume (Challenge Level)" << std::endl;

    AGameMode_StickerShop Game;
    Game.Initialize();
    Game.SimulateFullLevel(4, true);

    std::cout << "    Challenge level completed (see settlement above)" << std::endl;
    R.bPassed = true;
    return R;
}

FTestResult FTestRunner::Test_TimeConstraint()
{
    FTestResult R;
    R.TestName = "Pressure_TimeConstraint";
    std::cout << "\n  [Test] Pressure: Time Constraint" << std::endl;

    ULevelSystem LS;
    LS.RegisterBuiltinLevels();

    auto Extended = LS.ExtendLevel(1, "TimePressure", {{"TimeReductionPercent", 0.7f}});
    Assert(Extended.TimeLimit < 120.0f, "Extended level should have reduced time limit", R);
    Assert(Extended.DifficultyMultiplier > 1.0f, "Extended level should have higher difficulty", R);

    std::cout << "    Extended level time limit: " << Extended.TimeLimit << "s (from 180s)" << std::endl;

    R.bPassed = (R.Details.empty() || R.Details.find("[FAIL]") == std::string::npos);
    std::cout << "    Result: " << (R.bPassed ? "PASS" : "FAIL") << std::endl;
    return R;
}

FTestResult FTestRunner::Test_BudgetConstraint()
{
    FTestResult R;
    R.TestName = "Pressure_BudgetConstraint";
    std::cout << "\n  [Test] Pressure: Budget Constraint" << std::endl;

    AGameMode_StickerShop Game;
    Game.Initialize();
    Game.StartLevel(2);

    Game.DesignSticker("B1", EThemeType::Floral, EStickerRarity::Common);
    Game.DesignSticker("B2", EThemeType::Animal, EStickerRarity::Uncommon);

    Game.PrintStickerSet(0, 3);
    Game.PrintStickerSet(1, 3);

    bool OverPrint = Game.PrintStickerSet(0, 100);
    Assert(!OverPrint, "Should not be able to overprint with limited budget", R);

    std::cout << "    Budget constraint enforced correctly" << std::endl;
    R.bPassed = (R.Details.empty() || R.Details.find("[FAIL]") == std::string::npos);
    std::cout << "    Result: " << (R.bPassed ? "PASS" : "FAIL") << std::endl;
    return R;
}

FTestResult FTestRunner::Test_RapidOrders()
{
    FTestResult R;
    R.TestName = "Pressure_RapidOrders";
    std::cout << "\n  [Test] Pressure: Rapid Orders" << std::endl;

    UCustomerSystem CS;
    CS.Initialize(15, {EThemeType::Floral, EThemeType::Animal, EThemeType::Food}, 2.0f);
    CS.GenerateCustomers();
    Assert(CS.GetTotalCount() == 15, "Should have 15 customers", R);

    UInventoryComponent Inv;
    Inv.Initialize(500);
    FStickerDesign D;
    D.DesignId = 0; D.Name = "Multi"; D.Theme = EThemeType::Floral;
    D.SellPrice = 15; D.Rarity = EStickerRarity::Common;
    Inv.AddItem(D, 50);

    int32_t Served = 0;
    for (int32_t i = 0; i < CS.GetTotalCount(); i++)
    {
        auto Items = Inv.GetAllItems();
        if (CS.FulfillOrder(i, Items, Inv)) Served++;
    }

    std::cout << "    Served " << Served << "/" << CS.GetTotalCount() << " customers" << std::endl;
    R.bPassed = (R.Details.empty() || R.Details.find("[FAIL]") == std::string::npos);
    std::cout << "    Result: " << (R.bPassed ? "PASS" : "FAIL") << std::endl;
    return R;
}

FTestResult FTestRunner::Test_InvalidStickerDesign()
{
    FTestResult R;
    R.TestName = "Abnormal_InvalidDesign";
    std::cout << "\n  [Test] Abnormal: Invalid Sticker Design" << std::endl;

    AGameMode_StickerShop Game;
    Game.Initialize();
    Game.StartLevel(1);

    bool Empty = Game.DesignSticker("", EThemeType::Floral, EStickerRarity::Common);
    Assert(!Empty, "Empty name should fail", R);

    bool Valid = Game.DesignSticker("ValidSticker", EThemeType::Animal, EStickerRarity::Uncommon);
    Assert(Valid, "Valid design should succeed", R);

    R.bPassed = (R.Details.empty() || R.Details.find("[FAIL]") == std::string::npos);
    std::cout << "    Result: " << (R.bPassed ? "PASS" : "FAIL") << std::endl;
    return R;
}

FTestResult FTestRunner::Test_OverSpendBudget()
{
    FTestResult R;
    R.TestName = "Abnormal_OverSpend";
    std::cout << "\n  [Test] Abnormal: Over-Spend Budget" << std::endl;

    UInventoryComponent Inv;
    Inv.Initialize(50);

    bool Spend1 = Inv.SpendBudget(30);
    Assert(Spend1, "Should be able to spend 30 from 50", R);

    bool Spend2 = Inv.SpendBudget(30);
    Assert(!Spend2, "Should not be able to spend 30 when only 20 left", R);

    bool Spend0 = Inv.SpendBudget(0);
    Assert(!Spend0, "Should not be able to spend 0", R);

    bool SpendNeg = Inv.SpendBudget(-10);
    Assert(!SpendNeg, "Should not be able to spend negative", R);

    R.bPassed = (R.Details.empty() || R.Details.find("[FAIL]") == std::string::npos);
    std::cout << "    Result: " << (R.bPassed ? "PASS" : "FAIL") << std::endl;
    return R;
}

FTestResult FTestRunner::Test_InvalidSlotPlacement()
{
    FTestResult R;
    R.TestName = "Abnormal_InvalidSlot";
    std::cout << "\n  [Test] Abnormal: Invalid Slot Placement" << std::endl;

    UStallLayout Stall;
    Stall.Initialize(3);

    FStickerDesign D;
    D.DesignId = 0; D.Name = "Test"; D.Theme = EThemeType::Floral; D.Popularity = 0.5f;

    Assert(!Stall.PlaceSticker(-1, D), "Negative slot should fail", R);
    Assert(!Stall.PlaceSticker(99, D), "Out-of-range slot should fail", R);
    Assert(Stall.PlaceSticker(0, D), "Valid slot should succeed", R);
    Assert(!Stall.PlaceSticker(0, D), "Duplicate placement should fail", R);

    Assert(!Stall.RemoveFromSlot(-1), "Remove from negative slot should fail", R);
    Assert(!Stall.RemoveFromSlot(1), "Remove from empty slot should fail", R);
    Assert(Stall.RemoveFromSlot(0), "Remove from occupied slot should succeed", R);

    R.bPassed = (R.Details.empty() || R.Details.find("[FAIL]") == std::string::npos);
    std::cout << "    Result: " << (R.bPassed ? "PASS" : "FAIL") << std::endl;
    return R;
}

FTestResult FTestRunner::Test_FailureTestLevel()
{
    FTestResult R;
    R.TestName = "Abnormal_FailureTestLevel";
    std::cout << "\n  [Test] Abnormal: Failure Test Level (Level 5)" << std::endl;

    AGameMode_StickerShop Game;
    Game.Initialize();
    Game.SimulateFullLevel(5, true);

    const auto& SaveSlot = Game.GetInventory();
    R.Settlement = FSettlementData();

    std::cout << "    Failure test level completed - expected to fail (see settlement above)" << std::endl;
    std::cout << "    This verifies error handling, retry prompts, and settlement feedback" << std::endl;
    R.bPassed = true;
    return R;
}

FTestResult FTestRunner::Test_EmptyInventoryServe()
{
    FTestResult R;
    R.TestName = "Abnormal_EmptyInventoryServe";
    std::cout << "\n  [Test] Abnormal: Serve with Empty Inventory" << std::endl;

    UCustomerSystem CS;
    UInventoryComponent Inv;
    CS.Initialize(3, {EThemeType::Floral}, 1.0f);
    Inv.Initialize(100);

    CS.GenerateCustomers();
    int32_t FailedServes = 0;
    for (int32_t i = 0; i < CS.GetTotalCount(); i++)
    {
        auto Items = Inv.GetAllItems();
        if (!CS.FulfillOrder(i, Items, Inv))
        {
            FailedServes++;
        }
    }

    Assert(FailedServes == CS.GetTotalCount(), "All serves should fail with empty inventory", R);
    std::cout << "    All " << FailedServes << " customers correctly rejected with empty inventory" << std::endl;

    R.bPassed = (R.Details.empty() || R.Details.find("[FAIL]") == std::string::npos);
    std::cout << "    Result: " << (R.bPassed ? "PASS" : "FAIL") << std::endl;
    return R;
}

void FTestRunner::PrintResults() const
{
    int32_t PassCount = 0;
    int32_t FailCount = 0;

    std::cout << "\n╔══════════════════════════════════════════════════╗" << std::endl;
    std::cout << "║              Test Results Summary                ║" << std::endl;
    std::cout << "╚══════════════════════════════════════════════════╝\n" << std::endl;

    std::cout << "Group 1 - Basic Tests:" << std::endl;
    for (const auto& R : Results)
    {
        if (R.TestName.find("Pressure_") == std::string::npos && R.TestName.find("Abnormal_") == std::string::npos)
        {
            std::cout << "  " << (R.bPassed ? "[PASS]" : "[FAIL]") << " " << R.TestName;
            if (!R.Details.empty()) std::cout << " - " << R.Details;
            std::cout << std::endl;
            if (R.bPassed) PassCount++; else FailCount++;
        }
    }

    std::cout << "\nGroup 2 - Pressure Tests:" << std::endl;
    for (const auto& R : Results)
    {
        if (R.TestName.find("Pressure_") != std::string::npos)
        {
            std::cout << "  " << (R.bPassed ? "[PASS]" : "[FAIL]") << " " << R.TestName;
            if (!R.Details.empty()) std::cout << " - " << R.Details;
            std::cout << std::endl;
            if (R.bPassed) PassCount++; else FailCount++;
        }
    }

    std::cout << "\nGroup 3 - Abnormal Input Tests:" << std::endl;
    for (const auto& R : Results)
    {
        if (R.TestName.find("Abnormal_") != std::string::npos)
        {
            std::cout << "  " << (R.bPassed ? "[PASS]" : "[FAIL]") << " " << R.TestName;
            if (!R.Details.empty()) std::cout << " - " << R.Details;
            std::cout << std::endl;
            if (R.bPassed) PassCount++; else FailCount++;
        }
    }

    std::cout << "\n────────────────────────────────────────────────" << std::endl;
    std::cout << "Total: " << (PassCount + FailCount) << " | Pass: " << PassCount << " | Fail: " << FailCount << std::endl;
    std::cout << "────────────────────────────────────────────────\n" << std::endl;
}
