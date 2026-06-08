#include "CustomerSystem.h"
#include "InventoryComponent.h"
#include <random>

static std::mt19937& GetRNG()
{
    static std::mt19937 RNG(42);
    return RNG;
}

void UCustomerSystem::Initialize(int32_t CustomerCount, const std::vector<EThemeType>& AvailableThemes, float DifficultyMultiplier)
{
    ConfigCustomerCount = CustomerCount;
    ConfigThemes = AvailableThemes;
    ConfigDifficulty = DifficultyMultiplier;
    Orders.clear();
    NextOrderId = 0;
}

void UCustomerSystem::GenerateCustomers()
{
    Orders.clear();
    NextOrderId = 0;
    for (int32_t i = 0; i < ConfigCustomerCount; i++)
    {
        FCustomerOrder Order;
        Order.OrderId = NextOrderId++;
        Order.Preference = GeneratePreference();
        Orders.push_back(Order);
    }
}

const std::vector<FCustomerOrder>& UCustomerSystem::GetOrders() const
{
    return Orders;
}

FCustomerOrder& UCustomerSystem::GetOrder(int32_t Index)
{
    return Orders.at(Index);
}

int32_t UCustomerSystem::GetActiveOrderCount() const
{
    int32_t Count = 0;
    for (const auto& O : Orders) if (!O.bFulfilled) Count++;
    return Count;
}

bool UCustomerSystem::FulfillOrder(int32_t OrderIndex, const std::vector<FInventoryItem>& AvailableItems, UInventoryComponent& Inventory)
{
    if (OrderIndex < 0 || OrderIndex >= static_cast<int32_t>(Orders.size())) return false;
    FCustomerOrder& Order = Orders[OrderIndex];
    if (Order.bFulfilled) return false;

    const auto& Pref = Order.Preference;
    float BestScore = 0.0f;
    int32_t BestItemIdx = -1;
    int32_t BestCount = 0;

    for (int32_t i = 0; i < static_cast<int32_t>(AvailableItems.size()); i++)
    {
        const auto& Item = AvailableItems[i];
        if (Item.Quantity <= 0) continue;
        if (static_cast<int32_t>(Item.Rarity) < static_cast<int32_t>(Pref.MinRarity)) continue;

        float Score = CalculateSatisfaction(Pref, Item);
        if (Score > BestScore)
        {
            BestScore = Score;
            BestItemIdx = i;
            BestCount = std::min(Item.Quantity, Pref.DesiredQuantity);
        }
    }

    if (BestItemIdx < 0 || BestCount <= 0)
    {
        Order.bFulfilled = false;
        Order.RejectionReason = "No matching sticker available for theme: " + std::string(ThemeTypeToString(Pref.PreferredTheme));
        return false;
    }

    const auto& ChosenItem = AvailableItems[BestItemIdx];
    int32_t TotalPrice = ChosenItem.SellPrice * BestCount;
    if (TotalPrice > Pref.Budget)
    {
        BestCount = Pref.Budget / ChosenItem.SellPrice;
        if (BestCount <= 0)
        {
            Order.bFulfilled = false;
            Order.RejectionReason = "Customer budget too low";
            return false;
        }
        TotalPrice = ChosenItem.SellPrice * BestCount;
    }

    if (!Inventory.RemoveItem(ChosenItem.DesignId, BestCount))
    {
        Order.bFulfilled = false;
        Order.RejectionReason = "Inventory removal failed";
        return false;
    }

    Order.bFulfilled = true;
    Order.SpentAmount = TotalPrice;
    Order.ItemsReceived = BestCount;
    Order.Satisfaction = BestScore;
    Order.RejectionReason.clear();

    Inventory.EarnIncome(TotalPrice);
    return true;
}

void UCustomerSystem::SkipOrder(int32_t OrderIndex, const std::string& Reason)
{
    if (OrderIndex < 0 || OrderIndex >= static_cast<int32_t>(Orders.size())) return;
    FCustomerOrder& Order = Orders[OrderIndex];
    if (Order.bFulfilled) return;
    Order.bFulfilled = true;
    Order.Satisfaction = 0.0f;
    Order.RejectionReason = Reason;
}

int32_t UCustomerSystem::GetSatisfiedCount() const
{
    int32_t Count = 0;
    for (const auto& O : Orders) if (O.IsSatisfied()) Count++;
    return Count;
}

int32_t UCustomerSystem::GetTotalCount() const
{
    return static_cast<int32_t>(Orders.size());
}

float UCustomerSystem::GetSatisfactionRate() const
{
    if (Orders.empty()) return 0.0f;
    return static_cast<float>(GetSatisfiedCount()) / static_cast<float>(Orders.size());
}

void UCustomerSystem::Reset()
{
    Orders.clear();
    NextOrderId = 0;
}

FCustomerPreference UCustomerSystem::GeneratePreference()
{
    FCustomerPreference Pref;
    if (!ConfigThemes.empty())
    {
        std::uniform_int_distribution<int32_t> ThemeDist(0, static_cast<int32_t>(ConfigThemes.size()) - 1);
        Pref.PreferredTheme = ConfigThemes[ThemeDist(GetRNG())];
    }
    else
    {
        std::uniform_int_distribution<int32_t> ThemeDist(0, static_cast<int32_t>(EThemeType::Max) - 1);
        Pref.PreferredTheme = static_cast<EThemeType>(ThemeDist(GetRNG()));
    }

    std::uniform_real_distribution<float> WeightDist(0.5f, 1.5f);
    Pref.ThemeWeight = WeightDist(GetRNG());

    int32_t RarityRoll = static_cast<int32_t>(ConfigDifficulty * 10) + (GetRNG()() % 20);
    if (RarityRoll > 25) Pref.MinRarity = EStickerRarity::Rare;
    else if (RarityRoll > 15) Pref.MinRarity = EStickerRarity::Uncommon;
    else Pref.MinRarity = EStickerRarity::Common;

    std::uniform_int_distribution<int32_t> BudgetDist(30, static_cast<int32_t>(100 * ConfigDifficulty + 50));
    Pref.Budget = BudgetDist(GetRNG());

    std::uniform_int_distribution<int32_t> QtyDist(1, 3);
    Pref.DesiredQuantity = QtyDist(GetRNG());

    std::uniform_real_distribution<float> PatDist(0.3f / ConfigDifficulty, 1.0f);
    Pref.Patience = PatDist(GetRNG());

    return Pref;
}

float UCustomerSystem::CalculateSatisfaction(const FCustomerPreference& Pref, const FInventoryItem& Item) const
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
    return std::min(Score, 1.0f);
}
