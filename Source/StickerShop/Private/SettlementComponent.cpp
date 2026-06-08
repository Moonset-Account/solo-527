#include "SettlementComponent.h"

USettlementComponent::USettlementComponent()
{
	PrimaryComponentTick.bCanEverTick = false;
}

FSettlementData USettlementComponent::Calculate(const FLevelDefinition& Level, int32 Score, float TimeUsed,
	int32 CustomersSatisfied, int32 CustomersTotal, int32 NetProfit,
	const TArray<FString>& ErrorReasons, const TArray<FString>& CollectedItems)
{
	FSettlementData Data;
	Data.LevelNumber = Level.LevelId;
	Data.Score = Score;
	Data.TimeUsed = TimeUsed;
	Data.CustomersSatisfied = CustomersSatisfied;
	Data.CustomersTotal = CustomersTotal;
	Data.CollectionsObtained = CollectedItems.Num();
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
	Data.Score += static_cast<int32>(TimeBonus);

	float ProfitBonus = FMath::Max(0.0f, static_cast<float>(NetProfit) / 100.0f) * 20.0f;
	Data.Score += static_cast<int32>(ProfitBonus);

	Data.bPassed = Level.CheckWinCondition(Data) && !Level.CheckLoseCondition(Data);

	return Data;
}

FString USettlementComponent::CalculateGrade(int32 Score)
{
	if (Score >= 300) return TEXT("S");
	if (Score >= 200) return TEXT("A");
	if (Score >= 150) return TEXT("B");
	if (Score >= 100) return TEXT("C");
	if (Score >= 50)  return TEXT("D");
	return TEXT("F");
}

float USettlementComponent::CalculateSatisfactionRate(int32 Satisfied, int32 Total)
{
	if (Total <= 0) return 0.0f;
	return static_cast<float>(Satisfied) / static_cast<float>(Total);
}

void USettlementComponent::ShowSettlement(const FSettlementData& Data)
{
	OnSettlementComplete.Broadcast(Data);
}

void USettlementComponent::RequestRetry(int32 LevelId, const FString& FailureReason)
{
	OnRetryPrompt.Broadcast(LevelId, FailureReason);
}

bool USettlementComponent::ShouldShowRetry(const FSettlementData& Data) const
{
	return !Data.bPassed;
}
