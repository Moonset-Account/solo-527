#include "StickerShopSaveGame.h"

UStickerShopSaveGame::UStickerShopSaveGame()
{
	SaveTime = FDateTime::Now().ToString();
}

void UStickerShopSaveGame::RecordInput(int32 Level, const FString& ActionType, const FString& Detail, float Timestamp, const FString& Result)
{
	FPlayerInputRecord Record;
	Record.LevelNumber = Level;
	Record.ActionType = ActionType;
	Record.ActionDetail = Detail;
	Record.Timestamp = Timestamp;
	Record.Result = Result;
	InputRecords.Add(Record);
}

void UStickerShopSaveGame::RecordSettlement(const FSettlementData& Data)
{
	LevelResults.Add(Data);
	TotalScore += Data.Score;
	TotalCollections += Data.CollectionsObtained;
	CurrentLevel = FMath::Max(CurrentLevel, Data.LevelNumber + 1);
}
