#include "DailyLedger.h"
#include <iomanip>
#include <sstream>
#include <chrono>

static std::string GetCurrentTimestamp()
{
    auto Now = std::chrono::system_clock::now();
    auto TimeT = std::chrono::system_clock::to_time_t(Now);
    std::stringstream SS;
    SS << std::put_time(std::localtime(&TimeT), "%Y-%m-%d %H:%M:%S");
    return SS.str();
}

void UDailyLedger::StartDay(int32_t DayNumber)
{
    Current = FDailyLedger();
    Current.DayNumber = DayNumber;
}

void UDailyLedger::RecordIncome(const std::string& Description, int32_t Amount)
{
    FLedgerEntry Entry;
    Entry.Timestamp = GetCurrentTimestamp();
    Entry.Category = "Income";
    Entry.Description = Description;
    Entry.Amount = Amount;
    Entry.bIsIncome = true;
    Current.Entries.push_back(Entry);
    Current.TotalIncome += Amount;
    Current.NetProfit = Current.TotalIncome - Current.TotalExpense;
}

void UDailyLedger::RecordExpense(const std::string& Description, int32_t Amount)
{
    FLedgerEntry Entry;
    Entry.Timestamp = GetCurrentTimestamp();
    Entry.Category = "Expense";
    Entry.Description = Description;
    Entry.Amount = Amount;
    Entry.bIsIncome = false;
    Current.Entries.push_back(Entry);
    Current.TotalExpense += Amount;
    Current.NetProfit = Current.TotalIncome - Current.TotalExpense;
}

const FDailyLedger& UDailyLedger::GetCurrentLedger() const
{
    return Current;
}

int32_t UDailyLedger::GetNetProfit() const
{
    return Current.NetProfit;
}

int32_t UDailyLedger::GetTotalIncome() const
{
    return Current.TotalIncome;
}

int32_t UDailyLedger::GetTotalExpense() const
{
    return Current.TotalExpense;
}

void UDailyLedger::CloseDay()
{
    History.push_back(Current);
}

const std::vector<FDailyLedger>& UDailyLedger::GetHistory() const
{
    return History;
}
