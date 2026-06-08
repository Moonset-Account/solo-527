#pragma once

#include "StickerTypes.h"

class USettlementSystem
{
public:
    USettlementSystem() = default;

    FSettlementData Calculate(const FLevelDefinition& Level,
                              int32_t Score,
                              float TimeUsed,
                              int32_t CustomersSatisfied,
                              int32_t CustomersTotal,
                              int32_t NetProfit,
                              const std::vector<std::string>& ErrorReasons,
                              const std::vector<std::string>& CollectedItems);

    static std::string CalculateGrade(int32_t Score);
    static float CalculateSatisfactionRate(int32_t Satisfied, int32_t Total);

    void PrintSettlement(const FSettlementData& Data) const;
};
