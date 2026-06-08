#pragma once

#include "StickerTypes.h"

class UInventoryComponent;

class UCustomerSystem
{
public:
    UCustomerSystem() = default;

    void Initialize(int32_t CustomerCount, const std::vector<EThemeType>& AvailableThemes, float DifficultyMultiplier = 1.0f);
    void GenerateCustomers();

    const std::vector<FCustomerOrder>& GetOrders() const;
    FCustomerOrder& GetOrder(int32_t Index);
    int32_t GetActiveOrderCount() const;

    bool FulfillOrder(int32_t OrderIndex, const std::vector<FInventoryItem>& AvailableItems, UInventoryComponent& Inventory);
    void SkipOrder(int32_t OrderIndex, const std::string& Reason);

    int32_t GetSatisfiedCount() const;
    int32_t GetTotalCount() const;
    float GetSatisfactionRate() const;

    void Reset();

private:
    int32_t ConfigCustomerCount = 5;
    std::vector<EThemeType> ConfigThemes;
    float ConfigDifficulty = 1.0f;
    std::vector<FCustomerOrder> Orders;
    int32_t NextOrderId = 0;

    FCustomerPreference GeneratePreference();
    float CalculateSatisfaction(const FCustomerPreference& Pref, const FInventoryItem& Item) const;
};
