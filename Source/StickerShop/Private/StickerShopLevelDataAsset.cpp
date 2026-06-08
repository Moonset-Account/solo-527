#include "StickerShopLevelDataAsset.h"

UStickerShopLevelCollection* UStickerShopLevelCollection::GetCollection(UObject* Context)
{
	return nullptr;
}

int32 UStickerShopLevelCollection::GetUnlockedCount() const
{
	int32 Count = 0;
	for (const auto& L : Levels)
	{
		if (L && L->CanPlay()) Count++;
	}
	return Count;
}

UStickerShopLevelDataAsset* UStickerShopLevelCollection::GetLevelByIndex(int32 Index) const
{
	if (Levels.IsValidIndex(Index)) return Levels[Index];
	return nullptr;
}

UStickerShopLevelDataAsset* UStickerShopLevelCollection::FindLevelById(int32 LevelId) const
{
	for (const auto& L : Levels)
	{
		if (L && L->LevelDef.LevelId == LevelId) return L;
	}
	return nullptr;
}
