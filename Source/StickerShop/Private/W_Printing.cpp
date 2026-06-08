#include "W_Printing.h"

void UW_Printing::SetAvailableDesigns(const TArray<FStickerDesign>& Designs)
{
	AvailableDesigns = Designs;
	BP_OnDesignsUpdated();
}

void UW_Printing::ConfirmPrint(int32 DesignId, int32 Quantity)
{
	if (Quantity <= 0) return;
	for (const auto& D : AvailableDesigns)
	{
		if (D.DesignId == DesignId)
		{
			OnPrintConfirmed.Broadcast(DesignId, Quantity);
			return;
		}
	}
}

void UW_Printing::CancelPrint()
{
	OnPrintCancelled.Broadcast();
}

int32 UW_Printing::GetPrintCost(int32 DesignId, int32 Quantity) const
{
	for (const auto& D : AvailableDesigns)
	{
		if (D.DesignId == DesignId)
		{
			return D.PrintCost * Quantity;
		}
	}
	return 0;
}

void UW_Printing::UpdateBudgetDisplay(int32 Budget)
{
	CurrentBudget = Budget;
	BP_OnBudgetUpdated(Budget);
}
