#include "StickerShopGameMode.h"
#include "StickerShopPlayerController.h"
#include "StickerShopGameInstance.h"
#include "StickerDesignComponent.h"
#include "InventoryComponent.h"
#include "CustomerSystemComponent.h"
#include "StallLayoutComponent.h"
#include "DailyLedgerComponent.h"
#include "LevelSystemComponent.h"
#include "SettlementComponent.h"
#include "SaveSystemComponent.h"
#include "StickerShopSaveGame.h"
#include "UObject/ConstructorHelpers.h"

AStickerShopGameMode::AStickerShopGameMode()
{
	PrimaryActorTick.bCanEverTick = true;
	PlayerControllerClass = AStickerShopPlayerController::StaticClass();

	DesignComp = CreateDefaultSubobject<UStickerDesignComponent>(TEXT("DesignComp"));
	InventoryComp = CreateDefaultSubobject<UInventoryComponent>(TEXT("InventoryComp"));
	CustomerComp = CreateDefaultSubobject<UCustomerSystemComponent>(TEXT("CustomerComp"));
	StallComp = CreateDefaultSubobject<UStallLayoutComponent>(TEXT("StallComp"));
	LedgerComp = CreateDefaultSubobject<UDailyLedgerComponent>(TEXT("LedgerComp"));
	LevelComp = CreateDefaultSubobject<ULevelSystemComponent>(TEXT("LevelComp"));
	SettlementComp = CreateDefaultSubobject<USettlementComponent>(TEXT("SettlementComp"));
	SaveComp = CreateDefaultSubobject<USaveSystemComponent>(TEXT("SaveComp"));
}

void AStickerShopGameMode::BeginPlay()
{
	Super::BeginPlay();
	InitializeGame();

	UStickerShopGameInstance* GI = GetGameInstance<UStickerShopGameInstance>();
	int32 LevelToStart = 0;
	if (GI)
	{
		LevelToStart = GI->GetCurrentLevelId();
	}
	StartLevel(LevelToStart);
}

void AStickerShopGameMode::InitializeGame()
{
	LevelComp->RegisterBuiltinLevels();
	CurrentSave = SaveComp->CreateNewSaveData();
	CurrentSave->PlayerName = TEXT("Player");
	CurrentSave->SlotIndex = 0;
}

void AStickerShopGameMode::StartLevel(int32 LevelId)
{
	const FLevelDefinition* Level = LevelComp->GetLevel(LevelId);
	if (!Level) return;

	CurrentLevelId = LevelId;
	Phase = EGamePhase::Design;
	LevelErrors.Empty();
	LevelCollections.Empty();
	LevelScore = 0;

	InventoryComp->Initialize(Level->StartingBudget);
	CustomerComp->Initialize(Level->CustomerCount, Level->AvailableThemes, Level->DifficultyMultiplier);
	StallComp->Initialize(Level->StallSlots);
	LedgerComp->StartDay(LevelId);

	LevelStartTime = GetWorld()->GetTimeSeconds();

	if (CurrentSave)
	{
		SaveComp->RecordPlayerInput(CurrentSave, LevelId, TEXT("StartLevel"), Level->LevelName, 0.0f, TEXT("OK"));
	}

	OnLevelStarted.Broadcast(LevelId);
	OnPhaseChanged.Broadcast(Phase);
}

bool AStickerShopGameMode::DesignSticker(const FString& Name, EThemeType Theme, EStickerRarity Rarity)
{
	if (Name.IsEmpty())
	{
		LevelErrors.Add(TEXT("Empty sticker name"));
		RecordAction(TEXT("DesignSticker"), Name, TEXT("FAIL:EmptyName"));
		return false;
	}

	bool bSuccess = DesignComp->DesignSticker(Name, Theme, Rarity);
	if (bSuccess)
	{
		RecordAction(TEXT("DesignSticker"), Name, TEXT("OK"));
	}
	return bSuccess;
}

bool AStickerShopGameMode::PrintStickerSet(int32 DesignId, int32 Quantity)
{
	if (!DesignComp->HasDesign(DesignId))
	{
		LevelErrors.Add(FString::Printf(TEXT("Invalid design ID: %d"), DesignId));
		RecordAction(TEXT("PrintStickerSet"), FString::FromInt(DesignId), TEXT("FAIL:InvalidDesignId"));
		return false;
	}
	if (Quantity <= 0)
	{
		LevelErrors.Add(FString::Printf(TEXT("Invalid print quantity: %d"), Quantity));
		RecordAction(TEXT("PrintStickerSet"), FString::FromInt(Quantity), TEXT("FAIL:InvalidQuantity"));
		return false;
	}

	const FStickerDesign& Design = DesignComp->GetDesign(DesignId);
	int32 TotalCost = Design.PrintCost * Quantity;

	if (!InventoryComp->SpendBudget(TotalCost))
	{
		FString Err = FString::Printf(TEXT("Insufficient budget: need %d have %d"), TotalCost, InventoryComp->GetBudget());
		LevelErrors.Add(Err);
		RecordAction(TEXT("PrintStickerSet"), FString::FromInt(TotalCost), TEXT("FAIL:InsufficientBudget"));
		return false;
	}

	InventoryComp->AddItem(Design, Quantity);
	LedgerComp->RecordExpense(FString::Printf(TEXT("Print: %s x%d"), *Design.Name, Quantity), TotalCost);

	if (Design.Rarity >= EStickerRarity::Rare)
	{
		LevelCollections.Add(Design.Name + TEXT(" (x") + FString::FromInt(Quantity) + TEXT(")"));
	}

	RecordAction(TEXT("PrintStickerSet"), Design.Name, TEXT("OK"));
	return true;
}

bool AStickerShopGameMode::PlaceStickerOnStall(int32 SlotIndex, int32 DesignId)
{
	if (!DesignComp->HasDesign(DesignId))
	{
		LevelErrors.Add(TEXT("Cannot place invalid design on stall"));
		RecordAction(TEXT("PlaceStickerOnStall"), FString::FromInt(SlotIndex), TEXT("FAIL:InvalidDesignId"));
		return false;
	}
	if (!InventoryComp->HasDesign(DesignId))
	{
		LevelErrors.Add(TEXT("Design not in inventory for stall placement"));
		RecordAction(TEXT("PlaceStickerOnStall"), FString::FromInt(DesignId), TEXT("FAIL:NotInInventory"));
		return false;
	}

	const FStickerDesign& Design = DesignComp->GetDesign(DesignId);
	if (!StallComp->PlaceSticker(SlotIndex, Design))
	{
		LevelErrors.Add(FString::Printf(TEXT("Cannot place sticker on slot %d"), SlotIndex));
		RecordAction(TEXT("PlaceStickerOnStall"), FString::FromInt(SlotIndex), TEXT("FAIL:SlotUnavailable"));
		return false;
	}

	RecordAction(TEXT("PlaceStickerOnStall"),
		Design.Name + TEXT("->Slot") + FString::FromInt(SlotIndex), TEXT("OK"));
	return true;
}

bool AStickerShopGameMode::ServeCustomer(int32 OrderIndex)
{
	bool bResult = CustomerComp->FulfillOrder(OrderIndex, InventoryComp);
	if (bResult)
	{
		const auto& Orders = CustomerComp->GetOrders();
		if (Orders.IsValidIndex(OrderIndex))
		{
			const auto& Order = Orders[OrderIndex];
			LedgerComp->RecordIncome(
				FString::Printf(TEXT("Sale: Customer #%d"), OrderIndex), Order.SpentAmount);
			LevelScore += static_cast<int32>(Order.Satisfaction * 100);
			RecordAction(TEXT("ServeCustomer"),
				FString::Printf(TEXT("Customer#%d Revenue:%d"), OrderIndex, Order.SpentAmount), TEXT("OK"));
		}
	}
	else
	{
		const auto& Orders = CustomerComp->GetOrders();
		if (Orders.IsValidIndex(OrderIndex))
		{
			const auto& Order = Orders[OrderIndex];
			LevelErrors.Add(FString::Printf(TEXT("Customer #%d rejected: %s"), OrderIndex, *Order.RejectionReason));
			RecordAction(TEXT("ServeCustomer"),
				FString::FromInt(OrderIndex), TEXT("FAIL:") + Order.RejectionReason);
		}
	}
	return bResult;
}

bool AStickerShopGameMode::SkipCustomer(int32 OrderIndex, const FString& Reason)
{
	CustomerComp->SkipOrder(OrderIndex, Reason);
	LevelErrors.Add(FString::Printf(TEXT("Skipped customer #%d: %s"), OrderIndex, *Reason));
	RecordAction(TEXT("SkipCustomer"), FString::FromInt(OrderIndex), TEXT("SKIP:") + Reason);
	return true;
}

FSettlementData AStickerShopGameMode::EndLevel()
{
	float Elapsed = GetWorld()->GetTimeSeconds() - LevelStartTime;

	const FLevelDefinition* Level = LevelComp->GetLevel(CurrentLevelId);
	if (!Level) return FSettlementData();

	FSettlementData Result = SettlementComp->Calculate(
		*Level, LevelScore, Elapsed,
		CustomerComp->GetSatisfiedCount(), CustomerComp->GetTotalCount(),
		LedgerComp->GetNetProfit(), LevelErrors, LevelCollections);

	LedgerComp->CloseDay();

	if (CurrentSave)
	{
		CurrentSave->Inventory = InventoryComp->GetAllItems();
		CurrentSave->Ledger = LedgerComp->GetCurrentLedger();
		SaveComp->RecordLevelSettlement(CurrentSave, Result);
		SaveComp->RecordPlayerInput(CurrentSave, CurrentLevelId, TEXT("EndLevel"),
			FString::Printf(TEXT("Score=%d"), Result.Score), Elapsed,
			Result.bPassed ? TEXT("PASSED") : TEXT("FAILED"));
		SaveComp->SaveGame(CurrentSave, TEXT("AutoSave"), 0);
	}

	SettlementComp->ShowSettlement(Result);

	for (FConstPlayerControllerIterator It = GetWorld()->GetPlayerControllerIterator(); It; ++It)
	{
		AStickerShopPlayerController* PC = Cast<AStickerShopPlayerController>(It->Get());
		if (PC)
		{
			PC->ShowSettlementUI(Result);

			if (!Result.bPassed)
			{
				FString FailureReason;
				if (!LevelErrors.IsEmpty())
				{
					FailureReason = LevelErrors[0];
				}
				else
				{
					FailureReason = FString::Printf(TEXT("Score %d < Target %d"), Result.Score, Level->TargetScore);
				}
				SettlementComp->RequestRetry(CurrentLevelId, FailureReason);
				PC->ShowRetryPrompt(CurrentLevelId, FailureReason);
			}
		}
	}

	UStickerShopGameInstance* GI = GetGameInstance<UStickerShopGameInstance>();
	if (GI)
	{
		GI->OnLevelCompleted(Result);
	}

	Phase = EGamePhase::Settle;
	OnPhaseChanged.Broadcast(Phase);
	OnLevelEnded.Broadcast(Result);

	return Result;
}

void AStickerShopGameMode::AdvancePhase()
{
	switch (Phase)
	{
	case EGamePhase::Design: Phase = EGamePhase::Print; break;
	case EGamePhase::Print:  Phase = EGamePhase::Setup; break;
	case EGamePhase::Setup:  Phase = EGamePhase::Sell;  break;
	case EGamePhase::Sell:   Phase = EGamePhase::Settle; break;
	default: break;
	}
	OnPhaseChanged.Broadcast(Phase);
}

EGamePhase AStickerShopGameMode::GetCurrentPhase() const { return Phase; }
const FLevelDefinition* AStickerShopGameMode::GetCurrentLevelDef() const { return LevelComp->GetLevel(CurrentLevelId); }

float AStickerShopGameMode::GetElapsedTime() const
{
	if (!GetWorld()) return 0.0f;
	return GetWorld()->GetTimeSeconds() - LevelStartTime;
}

UStickerDesignComponent* AStickerShopGameMode::GetDesignComponent() const { return DesignComp; }
UInventoryComponent* AStickerShopGameMode::GetInventoryComponent() const { return InventoryComp; }
UCustomerSystemComponent* AStickerShopGameMode::GetCustomerComponent() const { return CustomerComp; }
UStallLayoutComponent* AStickerShopGameMode::GetStallComponent() const { return StallComp; }
UDailyLedgerComponent* AStickerShopGameMode::GetLedgerComponent() const { return LedgerComp; }
ULevelSystemComponent* AStickerShopGameMode::GetLevelComponent() const { return LevelComp; }
USettlementComponent* AStickerShopGameMode::GetSettlementComponent() const { return SettlementComp; }
USaveSystemComponent* AStickerShopGameMode::GetSaveComponent() const { return SaveComp; }
UStickerShopSaveGame* AStickerShopGameMode::GetCurrentSaveData() const { return CurrentSave; }

void AStickerShopGameMode::RecordAction(const FString& ActionType, const FString& Detail, const FString& Result)
{
	if (CurrentSave)
	{
		SaveComp->RecordPlayerInput(CurrentSave, CurrentLevelId, ActionType, Detail, GetElapsedTime(), Result);
	}
}
