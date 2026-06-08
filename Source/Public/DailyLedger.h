#pragma once

#include "StickerTypes.h"

class UDailyLedger
{
public:
    UDailyLedger() = default;

    void StartDay(int32_t DayNumber);
    void RecordIncome(const std::string& Description, int32_t Amount);
    void RecordExpense(const std::string& Description, int32_t Amount);

    const FDailyLedger& GetCurrentLedger() const;
    int32_t GetNetProfit() const;
    int32_t GetTotalIncome() const;
    int32_t GetTotalExpense() const;

    void CloseDay();
    const std::vector<FDailyLedger>& GetHistory() const;

private:
    FDailyLedger Current;
    std::vector<FDailyLedger> History;
};
