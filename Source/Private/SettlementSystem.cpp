#include "SettlementSystem.h"
#include <iostream>
#include <iomanip>

FSettlementData USettlementSystem::Calculate(const FLevelDefinition& Level,
                                              int32_t Score,
                                              float TimeUsed,
                                              int32_t CustomersSatisfied,
                                              int32_t CustomersTotal,
                                              int32_t NetProfit,
                                              const std::vector<std::string>& ErrorReasons,
                                              const std::vector<std::string>& CollectedItems)
{
    FSettlementData Data;
    Data.LevelNumber = Level.LevelId;
    Data.Score = Score;
    Data.TimeUsed = TimeUsed;
    Data.CustomersSatisfied = CustomersSatisfied;
    Data.CustomersTotal = CustomersTotal;
    Data.CollectionsObtained = static_cast<int32_t>(CollectedItems.size());
    Data.NetProfit = NetProfit;
    Data.ErrorReasons = ErrorReasons;
    Data.CollectedItems = CollectedItems;
    Data.SatisfactionRate = CalculateSatisfactionRate(CustomersSatisfied, CustomersTotal);
    Data.Grade = CalculateGrade(Score);

    float TimeBonus = 0.0f;
    if (TimeUsed < Level.TimeLimit)
    {
        float TimeRatio = 1.0f - (TimeUsed / Level.TimeLimit);
        TimeBonus = TimeRatio * 50.0f;
    }
    Data.Score += static_cast<int32_t>(TimeBonus);

    float ProfitBonus = std::max(0.0f, static_cast<float>(NetProfit) / 100.0f) * 20.0f;
    Data.Score += static_cast<int32_t>(ProfitBonus);

    Data.bPassed = Level.CheckWinCondition(Data) && !Level.CheckLoseCondition(Data);

    return Data;
}

std::string USettlementSystem::CalculateGrade(int32_t Score)
{
    if (Score >= 300) return "S";
    if (Score >= 200) return "A";
    if (Score >= 150) return "B";
    if (Score >= 100) return "C";
    if (Score >= 50)  return "D";
    return "F";
}

float USettlementSystem::CalculateSatisfactionRate(int32_t Satisfied, int32_t Total)
{
    if (Total <= 0) return 0.0f;
    return static_cast<float>(Satisfied) / static_cast<float>(Total);
}

void USettlementSystem::PrintSettlement(const FSettlementData& Data) const
{
    std::cout << "\n========== SETTLEMENT ==========" << std::endl;
    std::cout << "Level:          " << Data.LevelNumber << std::endl;
    std::cout << "Score:          " << Data.Score << std::endl;
    std::cout << "Grade:          " << Data.Grade << std::endl;
    std::cout << "Time Used:      " << std::fixed << std::setprecision(1) << Data.TimeUsed << "s" << std::endl;
    std::cout << "Satisfaction:   " << Data.CustomersSatisfied << "/" << Data.CustomersTotal
              << " (" << std::fixed << std::setprecision(0) << Data.SatisfactionRate * 100 << "%)" << std::endl;
    std::cout << "Net Profit:     " << Data.NetProfit << std::endl;
    std::cout << "Collections:    " << Data.CollectionsObtained << std::endl;
    std::cout << "Result:         " << (Data.bPassed ? "PASSED" : "FAILED") << std::endl;

    if (!Data.ErrorReasons.empty())
    {
        std::cout << "Errors:" << std::endl;
        for (const auto& E : Data.ErrorReasons)
        {
            std::cout << "  - " << E << std::endl;
        }
    }
    if (!Data.CollectedItems.empty())
    {
        std::cout << "Collected:" << std::endl;
        for (const auto& C : Data.CollectedItems)
        {
            std::cout << "  + " << C << std::endl;
        }
    }
    std::cout << "================================\n" << std::endl;
}
