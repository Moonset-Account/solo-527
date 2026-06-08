#include "DailyLedgerComponent.h"
#include "Misc/DateTime.h"

UDailyLedgerComponent::UDailyLedgerComponent()
{
	PrimaryComponentTick.bCanEverTick = false;
}

void UDailyLedgerComponent::StartDay(int32 DayNumber)
{
	Current = FDailyLedger();
	Current.DayNumber = DayNumber;
}

void UDailyLedgerComponent::RecordIncome(const FString& Description, int32 Amount)
{
	FLedgerEntry Entry;
	Entry.Timestamp = FDateTime::Now().ToString();
	Entry.Category = TEXT("Income");
	Entry.Description = Description;
	Entry.Amount = Amount;
	Entry.bIsIncome = true;
	Current.Entries.Add(Entry);
	Current.TotalIncome += Amount;
	Current.NetProfit = Current.TotalIncome - Current.TotalExpense;

	OnLedgerEntry.Broadcast(Entry.Category, Entry.Description, Entry.Amount);
}

void UDailyLedgerComponent::RecordExpense(const FString& Description, int32 Amount)
{
	FLedgerEntry Entry;
	Entry.Timestamp = FDateTime::Now().ToString();
	Entry.Category = TEXT("Expense");
	Entry.Description = Description;
	Entry.Amount = Amount;
	Entry.bIsIncome = false;
	Current.Entries.Add(Entry);
	Current.TotalExpense += Amount;
	Current.NetProfit = Current.TotalIncome - Current.TotalExpense;

	OnLedgerEntry.Broadcast(Entry.Category, Entry.Description, Entry.Amount);
}

void UDailyLedgerComponent::CloseDay()
{
	History.Add(Current);
	OnDayClosed.Broadcast(Current.NetProfit);
}

const FDailyLedger& UDailyLedgerComponent::GetCurrentLedger() const
{
	return Current;
}

int32 UDailyLedgerComponent::GetNetProfit() const
{
	return Current.NetProfit;
}

int32 UDailyLedgerComponent::GetTotalIncome() const
{
	return Current.TotalIncome;
}

int32 UDailyLedgerComponent::GetTotalExpense() const
{
	return Current.TotalExpense;
}

const TArray<FDailyLedger>& UDailyLedgerComponent::GetHistory() const
{
	return History;
}
