#include "StickerShopGameInstance.h"
#include "StickerShopSaveGame.h"
#include "Kismet/GameplayStatics.h"
#include "W_StickerDesign.h"
#include "W_Printing.h"
#include "W_StallLayout.h"
#include "W_Settlement.h"
#include "W_RetryPrompt.h"

UStickerShopGameInstance::UStickerShopGameInstance()
{
	TutorialMapPath = TEXT("/Game/StickerShop/Maps/Tutorial");
	ChallengeMapPath = TEXT("/Game/StickerShop/Maps/Challenge");
	FailureTestMapPath = TEXT("/Game/StickerShop/Maps/FailureTest");
	NormalMapPath = TEXT("/Game/StickerShop/Maps/Normal");
	CurrentSaveData = nullptr;
}

void UStickerShopGameInstance::Init()
{
	Super::Init();

	CurrentSaveData = NewObject<UStickerShopSaveGame>();
	CurrentSaveData->PlayerName = TEXT("Player");
	CurrentSaveData->SlotIndex = 0;

	UE_LOG(LogTemp, Log, TEXT("StickerShopGameInstance initialized"));
}

void UStickerShopGameInstance::Shutdown()
{
	if (CurrentSaveData)
	{
		SaveCurrentGame(TEXT("AutoSave"));
	}
	Super::Shutdown();
}

void UStickerShopGameInstance::StartNewGame()
{
	CurrentSaveData = NewObject<UStickerShopSaveGame>();
	CurrentSaveData->PlayerName = TEXT("Player");
	CurrentSaveData->SlotIndex = 0;
	CurrentLevelId = 0;
	LoadLevelById(0);
}

void UStickerShopGameInstance::ContinueGame()
{
	if (LoadSavedGame(TEXT("AutoSave")))
	{
		LoadLevelById(CurrentLevelId);
	}
	else
	{
		StartNewGame();
	}
}

void UStickerShopGameInstance::LoadLevelById(int32 LevelId)
{
	CurrentLevelId = LevelId;
	FString MapPath = GetMapPathForLevel(LevelId);
	UGameplayStatics::OpenLevel(this, FName(*MapPath));
}

void UStickerShopGameInstance::OnLevelCompleted(const FSettlementData& SettlementData)
{
	if (CurrentSaveData)
	{
		CurrentSaveData->RecordSettlement(SettlementData);
		SaveCurrentGame(TEXT("AutoSave"));
	}
}

void UStickerShopGameInstance::RetryCurrentLevel()
{
	LoadLevelById(CurrentLevelId);
}

int32 UStickerShopGameInstance::GetCurrentLevelId() const
{
	return CurrentLevelId;
}

UStickerShopSaveGame* UStickerShopGameInstance::GetSaveData() const
{
	return CurrentSaveData;
}

bool UStickerShopGameInstance::SaveCurrentGame(const FString& SlotName)
{
	if (!CurrentSaveData) return false;
	CurrentSaveData->SaveTime = FDateTime::Now().ToString();
	FString FullSlot = FString::Printf(TEXT("StickerShop_%s"), *SlotName);
	return UGameplayStatics::SaveGameToSlot(CurrentSaveData, FullSlot, 0);
}

bool UStickerShopGameInstance::LoadSavedGame(const FString& SlotName)
{
	FString FullSlot = FString::Printf(TEXT("StickerShop_%s"), *SlotName);
	if (!UGameplayStatics::DoesSaveGameExist(FullSlot, 0)) return false;

	UStickerShopSaveGame* Loaded = Cast<UStickerShopSaveGame>(UGameplayStatics::LoadGameFromSlot(FullSlot, 0));
	if (Loaded)
	{
		CurrentSaveData = Loaded;
		CurrentLevelId = Loaded->CurrentLevel;
		return true;
	}
	return false;
}

void UStickerShopGameInstance::RegisterWidgetClasses()
{
}

FString UStickerShopGameInstance::GetMapPathForLevel(int32 LevelId) const
{
	switch (LevelId)
	{
	case 0: return TutorialMapPath;
	case 4: return ChallengeMapPath;
	case 5: return FailureTestMapPath;
	default: return NormalMapPath;
	}
}
