#include "StickerShopTypes.h"

bool FLevelDefinition::CheckWinCondition(const FSettlementData& Result) const
{
	if (Result.Score < TargetScore) return false;
	if (!WinConditions.IsEmpty())
	{
		if (const float* Val = WinConditions.Find(TEXT("SatisfactionRate")))
		{
			if (Result.SatisfactionRate < *Val) return false;
		}
	}
	return true;
}

bool FLevelDefinition::CheckLoseCondition(const FSettlementData& Result) const
{
	if (bForceFailure) return true;
	for (const auto& [Key, Val] : LoseConditions)
	{
		if (Key == TEXT("MaxErrors") && static_cast<float>(Result.ErrorReasons.Num()) >= Val) return true;
		if (Key == TEXT("MinSatisfactionRate"))
		{
			if (Result.SatisfactionRate < Val) return true;
		}
	}
	return false;
}
