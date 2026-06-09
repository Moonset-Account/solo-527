using System;
using System.Collections.Generic;
using UnityEngine;
using DecorMatch3.Core;

namespace DecorMatch3.Decoration
{
    public class OrderManager
    {
        private readonly List<DecorationOrder> _allOrders;
        private readonly List<DecorationOrder> _availableOrders;
        private readonly Dictionary<int, OrderStatus> _orderStatuses;
        private DecorationManager _activeDecorationManager;
        private DecorationOrder _activeOrder;

        public IReadOnlyList<DecorationOrder> AllOrders => _allOrders;
        public IReadOnlyList<DecorationOrder> AvailableOrders => _availableOrders;
        public DecorationManager ActiveDecorationManager => _activeDecorationManager;
        public DecorationOrder ActiveOrder => _activeOrder;

        public event Action<DecorationOrder> OnOrderAccepted;
        public event Action<DecorationOrder, ScoringResult> OnOrderCompleted;
        public event Action<DecorationOrder> OnOrderAbandoned;
        public event Action<DecorationOrder> OnActiveOrderChanged;

        public OrderManager()
        {
            _allOrders = new List<DecorationOrder>();
            _availableOrders = new List<DecorationOrder>();
            _orderStatuses = new Dictionary<int, OrderStatus>();
        }

        public void RegisterOrders(IEnumerable<DecorationOrder> orders)
        {
            foreach (DecorationOrder order in orders)
            {
                if (!_allOrders.Contains(order))
                {
                    _allOrders.Add(order);
                    InitializeOrderStatus(order);
                }
            }
            RefreshAvailableOrders();
        }

        private void InitializeOrderStatus(DecorationOrder order)
        {
            if (SaveSystem.Instance != null)
            {
                if (SaveSystem.Instance.CurrentSave.CompletedOrderIds.Contains(order.OrderId))
                {
                    _orderStatuses[order.OrderId] = OrderStatus.Completed;
                }
                else if (SaveSystem.Instance.CurrentSave.ActiveOrderIds.Contains(order.OrderId))
                {
                    _orderStatuses[order.OrderId] = OrderStatus.InProgress;
                }
                else
                {
                    _orderStatuses[order.OrderId] = OrderStatus.Available;
                }
            }
            else
            {
                _orderStatuses[order.OrderId] = OrderStatus.Available;
            }
        }

        public void RefreshAvailableOrders()
        {
            _availableOrders.Clear();

            foreach (DecorationOrder order in _allOrders)
            {
                if (IsOrderUnlocked(order) && GetOrderStatus(order.OrderId) == OrderStatus.Available)
                {
                    _availableOrders.Add(order);
                }
            }
        }

        private bool IsOrderUnlocked(DecorationOrder order)
        {
            if (SaveSystem.Instance == null) return true;

            if (order.MinLevelRequirement > 0 &&
                SaveSystem.Instance.CurrentSave.HighestLevel < order.MinLevelRequirement)
                return false;

            if (order.UnlockOrderId >= 0 &&
                !SaveSystem.Instance.CurrentSave.CompletedOrderIds.Contains(order.UnlockOrderId))
                return false;

            if (order.RequiredLevelIds != null && order.RequiredLevelIds.Length > 0)
            {
                foreach (int levelId in order.RequiredLevelIds)
                {
                    if (!SaveSystem.Instance.CurrentSave.LevelStars.ContainsKey(levelId) ||
                        SaveSystem.Instance.CurrentSave.LevelStars[levelId] == 0)
                        return false;
                }
            }

            return true;
        }

        public OrderStatus GetOrderStatus(int orderId)
        {
            return _orderStatuses.TryGetValue(orderId, out OrderStatus status) ? status : OrderStatus.Available;
        }

        public void AcceptOrder(DecorationOrder order)
        {
            if (order == null || GetOrderStatus(order.OrderId) != OrderStatus.Available)
            {
                Debug.LogWarning($"[OrderManager] Cannot accept order: {order?.OrderId}");
                return;
            }

            _activeOrder = order;
            _activeDecorationManager = new DecorationManager(order);
            _orderStatuses[order.OrderId] = OrderStatus.InProgress;

            if (_availableOrders.Contains(order))
                _availableOrders.Remove(order);

            AnalyticsSystem.Instance?.RecordOrderAccept(order.OrderId, order.Customer?.CustomerId);
            OnOrderAccepted?.Invoke(order);
            OnActiveOrderChanged?.Invoke(order);
        }

        public ScoringResult SubmitOrder()
        {
            if (_activeOrder == null || _activeDecorationManager == null)
            {
                Debug.LogError("[OrderManager] No active order to submit");
                return null;
            }

            if (!_activeDecorationManager.AreAllRequiredSlotsFilled())
            {
                Debug.LogWarning("[OrderManager] Not all required slots filled");
                return null;
            }

            Dictionary<int, int> materialsToSpend = new Dictionary<int, int>();
            foreach (var kvp in _activeDecorationManager.MaterialsSpent)
            {
                materialsToSpend[kvp.Key] = kvp.Value;
            }

            if (SaveSystem.Instance != null)
            {
                if (!SaveSystem.Instance.SpendMaterials(materialsToSpend))
                {
                    Debug.LogWarning("[OrderManager] Insufficient materials");
                    return null;
                }
            }

            ScoringSystem scoringSystem = new ScoringSystem();
            ScoringResult result = scoringSystem.Evaluate(_activeOrder, _activeDecorationManager);

            int coinReward = _activeOrder.BaseReward + result.Stars * _activeOrder.StarRewardMultiplier;
            int gemReward = result.Stars >= 4 ? _activeOrder.GemReward : 0;

            if (SaveSystem.Instance != null)
            {
                SaveSystem.Instance.AddCoins(coinReward);
                if (gemReward > 0) SaveSystem.Instance.AddGems(gemReward);
            }

            _orderStatuses[_activeOrder.OrderId] = OrderStatus.Completed;

            AnalyticsSystem.Instance?.RecordOrderComplete(
                _activeOrder.OrderId,
                _activeOrder.Customer?.CustomerId,
                result.TotalScore,
                result.CustomerSatisfaction,
                result.CategoryBreakdown);

            DecorationOrder completedOrder = _activeOrder;
            OnOrderCompleted?.Invoke(completedOrder, result);

            _activeOrder = null;
            _activeDecorationManager = null;
            OnActiveOrderChanged?.Invoke(null);

            RefreshAvailableOrders();

            return result;
        }

        public void AbandonActiveOrder()
        {
            if (_activeOrder == null) return;

            _orderStatuses[_activeOrder.OrderId] = OrderStatus.Available;
            _availableOrders.Add(_activeOrder);

            DecorationOrder abandonedOrder = _activeOrder;
            OnOrderAbandoned?.Invoke(abandonedOrder);

            _activeOrder = null;
            _activeDecorationManager = null;
            OnActiveOrderChanged?.Invoke(null);
        }

        public DecorationOrder GetOrderById(int orderId)
        {
            return _allOrders.Find(o => o.OrderId == orderId);
        }

        public List<DecorationOrder> GetCompletedOrders()
        {
            List<DecorationOrder> result = new List<DecorationOrder>();
            foreach (DecorationOrder order in _allOrders)
            {
                if (GetOrderStatus(order.OrderId) == OrderStatus.Completed)
                    result.Add(order);
            }
            return result;
        }

        public List<DecorationOrder> GetOrdersByCategory(OrderCategory category)
        {
            List<DecorationOrder> result = new List<DecorationOrder>();
            foreach (DecorationOrder order in _allOrders)
            {
                if (order.Category == category && IsOrderUnlocked(order))
                    result.Add(order);
            }
            return result;
        }

        public int GetTotalCompletedOrders()
        {
            int count = 0;
            foreach (DecorationOrder order in _allOrders)
            {
                if (GetOrderStatus(order.OrderId) == OrderStatus.Completed)
                    count++;
            }
            return count;
        }

        public int GetAverageOrderStars()
        {
            if (SaveSystem.Instance == null) return 0;

            int totalStars = 0;
            int count = 0;

            foreach (DecorationOrder order in _allOrders)
            {
                if (SaveSystem.Instance.CurrentSave.OrderScores.TryGetValue(order.OrderId, out int score))
                {
                    totalStars += score;
                    count++;
                }
            }

            return count > 0 ? totalStars / count : 0;
        }
    }
}
