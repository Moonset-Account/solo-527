#include "W_Settlement.h"

void UW_Settlement::DisplaySettlement(const FSettlementData& Data)
{
	CurrentSettlement = Data;
	bCanRetry = !Data.bPassed;
	BP_OnSettlementDisplayed(Data);
	BP_OnRetryAvailable(bCanRetry);
}

void UW_Settlement::DismissSettlement()
{
	BP_OnSettlementDismissed();
	OnSettlementDismissed.Broadcast();
}

void UW_Settlement::RequestRetry()
{
	if (bCanRetry)
	{
		OnRetryRequested.Broadcast(CurrentSettlement.LevelNumber);
	}
}

bool UW_Settlement::IsRetryAvailable() const
{
	return bCanRetry;
}
