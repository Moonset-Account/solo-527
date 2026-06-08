#include "SaveSystemComponent.h"
#include "Kismet/GameplayStatics.h"

USaveSystemComponent::USaveSystemComponent()
{
	PrimaryComponentTick.bCanEverTick = false;
}

bool USaveSystemComponent::SaveGame(UStickerShopSaveGame* SaveData, const FString& SlotName, int32 UserIndex)
{
	if (!SaveData) return false;

	SaveData->SaveTime = FDateTime::Now().ToString();
	FString FullSlotName = GetSaveSlotName(SlotName, UserIndex);
	bool bSuccess = UGameplayStatics::SaveGameToSlot(SaveData, FullSlotName, UserIndex);
	OnSaveComplete.Broadcast(bSuccess);
	return bSuccess;
}

UStickerShopSaveGame* USaveSystemComponent::LoadGame(const FString& SlotName, int32 UserIndex)
{
	FString FullSlotName = GetSaveSlotName(SlotName, UserIndex);
	if (!HasSaveGame(SlotName, UserIndex))
	{
		OnLoadComplete.Broadcast(false, SlotName);
		return nullptr;
	}

	UStickerShopSaveGame* Loaded = Cast<UStickerShopSaveGame>(UGameplayStatics::LoadGameFromSlot(FullSlotName, UserIndex));
	OnLoadComplete.Broadcast(Loaded != nullptr, SlotName);
	return Loaded;
}

bool USaveSystemComponent::HasSaveGame(const FString& SlotName, int32 UserIndex) const
{
	FString FullSlotName = GetSaveSlotName(SlotName, UserIndex);
	return UGameplayStatics::DoesSaveGameExist(FullSlotName, UserIndex);
}

bool USaveSystemComponent::DeleteSaveGame(const FString& SlotName, int32 UserIndex)
{
	FString FullSlotName = GetSaveSlotName(SlotName, UserIndex);
	return UGameplayStatics::DeleteGameInSlot(FullSlotName, UserIndex);
}

UStickerShopSaveGame* USaveSystemComponent::CreateNewSaveData() const
{
	return NewObject<UStickerShopSaveGame>();
}

void USaveSystemComponent::RecordPlayerInput(UStickerShopSaveGame* SaveData, int32 Level, const FString& ActionType,
	const FString& Detail, float Timestamp, const FString& Result)
{
	if (SaveData)
	{
		SaveData->RecordInput(Level, ActionType, Detail, Timestamp, Result);
	}
}

void USaveSystemComponent::RecordLevelSettlement(UStickerShopSaveGame* SaveData, const FSettlementData& Data)
{
	if (SaveData)
	{
		SaveData->RecordSettlement(Data);
	}
}

void USaveSystemComponent::PrintSaveSummary(const UStickerShopSaveGame* SaveData) const
{
	if (!SaveData) return;
	UE_LOG(LogTemp, Log, TEXT("=== Save Slot %d ==="), SaveData->SlotIndex);
	UE_LOG(LogTemp, Log, TEXT("Player: %s | Level: %d | Score: %d | Collections: %d"),
		*SaveData->PlayerName, SaveData->CurrentLevel, SaveData->TotalScore, SaveData->TotalCollections);
	UE_LOG(LogTemp, Log, TEXT("Level Results: %d | Input Records: %d"),
		SaveData->LevelResults.Num(), SaveData->InputRecords.Num());
}

FString USaveSystemComponent::GetSaveSlotName(const FString& SlotName, int32 UserIndex)
{
	return FString::Printf(TEXT("StickerShop_%s_%d"), *SlotName, UserIndex);
}
