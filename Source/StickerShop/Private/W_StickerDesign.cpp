#include "W_StickerDesign.h"

void UW_StickerDesign::SetDesignOptions(const TArray<EThemeType>& InAvailableThemes)
{
	AvailableThemes = InAvailableThemes;
	BP_OnDesignOptionsUpdated();
}

void UW_StickerDesign::ConfirmDesign(const FString& Name, EThemeType Theme, EStickerRarity Rarity)
{
	if (Name.IsEmpty()) return;
	OnDesignConfirmed.Broadcast(Name, Theme, Rarity);
}

void UW_StickerDesign::CancelDesign()
{
	OnDesignCancelled.Broadcast();
}

int32 UW_StickerDesign::GetBudgetRemaining() const
{
	return CurrentBudget;
}

void UW_StickerDesign::UpdateBudgetDisplay(int32 Budget)
{
	CurrentBudget = Budget;
	BP_OnBudgetUpdated(Budget);
}
