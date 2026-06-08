#include "StickerDesignComponent.h"

UStickerDesignComponent::UStickerDesignComponent()
{
	PrimaryComponentTick.bCanEverTick = false;
}

bool UStickerDesignComponent::DesignSticker(const FString& Name, EThemeType Theme, EStickerRarity Rarity)
{
	if (Name.IsEmpty())
	{
		return false;
	}

	FStickerDesign Design;
	Design.DesignId = NextDesignId++;
	Design.Name = Name;
	Design.Theme = Theme;
	Design.Rarity = Rarity;
	Design.DesignTime = 1.0f + static_cast<float>(Rarity) * 0.5f;

	int32 BaseCost = 5;
	int32 BasePrice = 15;
	Design.PrintCost = BaseCost + static_cast<int32>(Rarity) * 8 + static_cast<int32>(Theme) * 2;
	Design.SellPrice = BasePrice + static_cast<int32>(Rarity) * 15 + static_cast<int32>(Theme) * 3;
	Design.Popularity = 0.3f + static_cast<float>(Rarity) * 0.15f;
	Design.Description = Name + TEXT(" - ") + UEnum::GetDisplayValueAsText(Theme).ToString()
		+ TEXT(" ") + UEnum::GetDisplayValueAsText(Rarity).ToString();

	DesignedStickers.Add(Design);

	OnStickerDesigned.Broadcast(Design.DesignId, Design);
	return true;
}

const TArray<FStickerDesign>& UStickerDesignComponent::GetDesignedStickers() const
{
	return DesignedStickers;
}

bool UStickerDesignComponent::HasDesign(int32 DesignId) const
{
	for (const auto& D : DesignedStickers)
	{
		if (D.DesignId == DesignId) return true;
	}
	return false;
}

const FStickerDesign& UStickerDesignComponent::GetDesign(int32 DesignId) const
{
	static FStickerDesign InvalidDesign;
	for (const auto& D : DesignedStickers)
	{
		if (D.DesignId == DesignId) return D;
	}
	return InvalidDesign;
}

void UStickerDesignComponent::ClearDesigns()
{
	DesignedStickers.Empty();
	NextDesignId = 0;
}

int32 UStickerDesignComponent::GetDesignCount() const
{
	return DesignedStickers.Num();
}
