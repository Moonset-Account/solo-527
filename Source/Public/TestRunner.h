#pragma once

#include "GameMode_StickerShop.h"

struct FTestResult
{
    std::string TestName;
    bool bPassed = false;
    std::string Details;
    FSettlementData Settlement;
};

class FTestRunner
{
public:
    FTestRunner() = default;

    void RunAll();

private:
    std::vector<FTestResult> Results;

    void RunBasicTests();
    void RunPressureTests();
    void RunAbnormalInputTests();

    FTestResult Test_TutorialLevel();
    FTestResult Test_NormalLevelEasy();
    FTestResult Test_NormalLevelMedium();
    FTestResult Test_DesignSticker();
    FTestResult Test_InventoryManagement();
    FTestResult Test_StallPlacement();
    FTestResult Test_CustomerFulfillment();

    FTestResult Test_HighCustomerVolume();
    FTestResult Test_TimeConstraint();
    FTestResult Test_BudgetConstraint();
    FTestResult Test_RapidOrders();

    FTestResult Test_InvalidStickerDesign();
    FTestResult Test_OverSpendBudget();
    FTestResult Test_InvalidSlotPlacement();
    FTestResult Test_FailureTestLevel();
    FTestResult Test_EmptyInventoryServe();

    void PrintResults() const;
    void Assert(bool Condition, const std::string& Msg, FTestResult& Out);
};
