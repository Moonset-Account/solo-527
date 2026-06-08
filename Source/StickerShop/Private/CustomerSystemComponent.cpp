#include "CustomerSystemComponent.h"
#include "InventoryComponent.h"

UCustomerSystemComponent::UCustomerSystemComponent()
{
	PrimaryComponentTick.bCanEverTick = false;
}

void UCustomerSystemComponent::Initialize(int32 CustomerCount, const TArray<EThemeType>& AvailableThemes, float DifficultyMultiplier)
{
	ConfigCustomerCount = CustomerCount;
	ConfigThemes = AvailableThemes;
	ConfigDifficulty = DifficultyMultiplier;
	Orders.Empty();
	NextOrderId = 0;
}

void UCustomerSystemComponent::GenerateCustomers()
{
	Orders.Empty();
	NextOrderId = 0;
	for (int32 i = 0; i < ConfigCustomerCount; i++)
	{
		FCustomerOrder Order;
		Order.OrderId = NextOrderId++;
		Order.Preference = GeneratePreference();
		Orders.Add(Order);
	}
}

const TArray<FCustomerOrder>& UCustomerSystemComponent::GetOrders() const
{
	return Orders;
}

int32 UCustomerSystemComponent::GetActiveOrderCount() const
{
	int32 Count = 0;
	for (const auto& O : Orders) if (!O.bFulfilled) Count++;
	return Count;
}

bool UCustomerSystemComponent::FulfillOrder(int32 OrderIndex, UInventoryComponent* Inventory)
{
	if (!Inventory || !Orders.IsValidIndex(OrderIndex)) return false;
	FCustomerOrder& Order = Orders[OrderIndex];
	if (Order.bFulfilled) return false;

	const auto& Pref = Order.Preference;
	auto DisplayItems = Inventory->GetAllItems();

	float BestScore = 0.0f;
	int32 BestItemIdx = -1;
	int32 BestCount = 0;

	for (int32 i = 0; i < DisplayItems.Num(); i++)
	{
		const auto& Item = DisplayItems[i];
		if (Item.Quantity <= 0) continue;
		if (static_cast<int32>(Item.Rarity) < static_cast<int32>(Pref.MinRarity)) continue;

		float Score = CalculateSatisfaction(Pref, Item);
		if (Score > BestScore)
		{
			BestScore = Score;
			BestItemIdx = i;
			BestCount = FMath::Min(Item.Quantity, Pref.DesiredQuantity);
		}
	}

	if (BestItemIdx < 0 || BestCount <= 0)
	{
		Order.bFulfilled = false;
		FString Reason = TEXT("No matching sticker for theme: ") + UEnum::GetDisplayValueAsText(Pref.PreferredTheme).ToString();
		Order.RejectionReason = Reason;
		OnCustomerRejected.Broadcast(OrderIndex, Reason);
		return false;
	}

	const auto& ChosenItem = DisplayItems[BestItemIdx];
	int32 TotalPrice = ChosenItem.SellPrice * BestCount;
	if (TotalPrice > Pref.Budget)
	{
		BestCount = Pref.Budget / FMath::Max(1, ChosenItem.SellPrice);
		if (BestCount <= 0)
		{
			Order.bFulfilled = false;
			Order.RejectionReason = TEXT("Customer budget too low");
			OnCustomerRejected.Broadcast(OrderIndex, Order.RejectionReason);
			return false;
		}
		TotalPrice = ChosenItem.SellPrice * BestCount;
	}

	if (!Inventory->RemoveItem(ChosenItem.DesignId, BestCount))
	{
		Order.bFulfilled = false;
		Order.RejectionReason = TEXT("Inventory removal failed");
		OnCustomerRejected.Broadcast(OrderIndex, Order.RejectionReason);
		return false;
	}

	Order.bFulfilled = true;
	Order.SpentAmount = TotalPrice;
	Order.ItemsReceived = BestCount;
	Order.Satisfaction = BestScore;
	Order.RejectionReason.Empty();

	Inventory->EarnIncome(TotalPrice);
	OnCustomerServed.Broadcast(OrderIndex, Order.Satisfaction, TotalPrice);

	if (GetActiveOrderCount() == 0)
	{
		OnAllCustomersProcessed.Broadcast();
	}
	return true;
}

void UCustomerSystemComponent::SkipOrder(int32 OrderIndex, const FString& Reason)
{
	if (!Orders.IsValidIndex(OrderIndex)) return;
	FCustomerOrder& Order = Orders[OrderIndex];
	if (Order.bFulfilled) return;
	Order.bFulfilled = true;
	Order.Satisfaction = 0.0f;
	Order.RejectionReason = Reason;
	OnCustomerRejected.Broadcast(OrderIndex, Reason);

	if (GetActiveOrderCount() == 0)
	{
		OnAllCustomersProcessed.Broadcast();
	}
}

int32 UCustomerSystemComponent::GetSatisfiedCount() const
{
	int32 Count = 0;
	for (const auto& O : Orders) if (O.IsSatisfied()) Count++;
	return Count;
}

int32 UCustomerSystemComponent::GetTotalCount() const
{
	return Orders.Num();
}

float UCustomerSystemComponent::GetSatisfactionRate() const
{
	if (Orders.Num() == 0) return 0.0f;
	return static_cast<float>(GetSatisfiedCount()) / static_cast<float>(Orders.Num());
}

void UCustomerSystemComponent::Reset()
{
	Orders.Empty();
	NextOrderId = 0;
}

FCustomerPreference UCustomerSystemComponent::GeneratePreference()
{
	FCustomerPreference Pref;

	if (ConfigThemes.Num() > 0)
	{
		int32 Idx = FMath::RandRange(0, ConfigThemes.Num() - 1);
		Pref.PreferredTheme = ConfigThemes[Idx];
	}
	else
	{
		Pref.PreferredTheme = static_cast<EThemeType>(FMath::RandRange(0, 7));
	}

	Pref.ThemeWeight = FMath::FRandRange(0.5f, 1.5f);

	int32 RarityRoll = static_cast<int32>(ConfigDifficulty * 10) + FMath::RandRange(0, 20);
	if (RarityRoll > 25) Pref.MinRarity = EStickerRarity::Rare;
	else if (RarityRoll > 15) Pref.MinRarity = EStickerRarity::Uncommon;
	else Pref.MinRarity = EStickerRarity::Common;

	Pref.Budget = FMath::RandRange(30, static_cast<int32>(100 * ConfigDifficulty + 50));
	Pref.DesiredQuantity = FMath::RandRange(1, 3);
	Pref.Patience = FMath::FRandRange(0.3f / ConfigDifficulty, 1.0f);

	return Pref;
}

float UCustomerSystemComponent::CalculateSatisfaction(const FCustomerPreference& Pref, const FInventoryItem& Item) const
{
	float Score = 0.0f;
	if (Item.Theme == Pref.PreferredTheme)
	{
		Score += 0.6f * Pref.ThemeWeight;
	}
	Score += static_cast<float>(Item.Rarity) * 0.1f;
	if (Item.SellPrice <= Pref.Budget)
	{
		Score += 0.2f;
	}
	return FMath::Min(Score, 1.0f);
}
