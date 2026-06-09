using System;
using System.Collections.Generic;
using UnityEngine;
using KitchenChaos.Core;
using KitchenChaos.Ingredients;
using KitchenChaos.Config;
using RecipeStep = KitchenChaos.Ingredients.RecipeStep;
using Recipe = KitchenChaos.Ingredients.Recipe;

namespace KitchenChaos.OrderSystem
{
    public enum DeliveryMatchResult
    {
        NoOrder,
        Wrong,
        Partial,
        Success
    }

    [Serializable]
    public class OrderMatchResult
    {
        public bool PerfectTiming;
        public float TimeRemainingRatio;
        public int MissingSteps;
        public int ExtraSteps;
        public int WrongStateCount;
    }

    [Serializable]
    public class Order
    {
        public Guid Id;
        public int Index;
        public Recipe Recipe;
        public float TimeLimit;
        public float SpawnTime;
        public float CreateTime;
        public bool IsCompleted;
        public bool IsFailed;
        public int BaseScore;

        public float Age => Time.time - CreateTime;
        public float TimeRemaining => Mathf.Max(0, TimeLimit - Age);
        public float RemainingRatio => Mathf.Clamp01(TimeRemaining / Mathf.Max(0.01f, TimeLimit));
    }

    public class OrderManager : MonoBehaviour
    {
        [SerializeField] int _seed;

        readonly List<Order> _active = new();
        LevelConfig _levelConfig;
        System.Random _rng;
        float _nextSpawnTime;
        int _orderCounter;

        public IReadOnlyList<Order> ActiveOrders => _active;
        public LevelConfig Config => _levelConfig;

        void Awake() => ServiceLocator.Register(this);

        public void InitializeForLevel(LevelConfig level)
        {
            _levelConfig = level;
            _active.Clear();
            _orderCounter = 0;
            _seed = Environment.TickCount;
            _rng = new System.Random(_seed);
            _nextSpawnTime = Time.time + UnityEngine.Random.Range(2f, 4f);
        }

        void Update()
        {
            var gm = ServiceLocator.Get<GameManager>();
            if (gm == null || gm.State != GameState.Playing) return;
            if (_levelConfig == null) return;

            for (int i = _active.Count - 1; i >= 0; i--)
            {
                if (_active[i].TimeRemaining <= 0 && !_active[i].IsCompleted)
                    FailOrder(_active[i]);
            }

            if (Time.time >= _nextSpawnTime && _active.Count < _levelConfig.MaxActiveOrders)
            {
                SpawnOrder();
                var baseI = _levelConfig.OrderSpawnInterval;
                var var = _levelConfig.OrderSpawnIntervalVariance;
                _nextSpawnTime = Time.time + baseI + (float)(_rng.NextDouble() * 2 - 1) * var;
            }
        }

        void SpawnOrder()
        {
            if (_levelConfig.AvailableRecipeNames == null || _levelConfig.AvailableRecipeNames.Length == 0) return;
            string name = _levelConfig.AvailableRecipeNames[_rng.Next(_levelConfig.AvailableRecipeNames.Length)];
            var recipe = RecipeLibrary.Get(name);
            float tLimit = _levelConfig.OrderTimeLimitBase + recipe.Steps.Count * _levelConfig.OrderTimeLimitPerIngredient;

            var order = new Order
            {
                Id = Guid.NewGuid(),
                Index = ++_orderCounter,
                Recipe = recipe,
                TimeLimit = tLimit,
                CreateTime = Time.time,
                BaseScore = recipe.BaseScore
            };
            _active.Add(order);

            EventBus.Raise(new OrderCreatedEvent
            {
                OrderId = order.Id,
                RecipeName = recipe.Name,
                Ingredients = recipe.Steps.ConvertAll(s => s.IngredientName),
                TimeLimit = tLimit,
                BaseScore = recipe.BaseScore,
                OrderIndex = order.Index
            });
        }

        public DeliveryMatchResult TryMatchAndComplete(List<IngredientItem> delivered, out Order matchedOrder, out OrderMatchResult matchResult)
        {
            matchedOrder = null;
            matchResult = null;
            if (_active.Count == 0) return DeliveryMatchResult.NoOrder;

            foreach (var order in _active)
            {
                if (order.IsCompleted || order.IsFailed) continue;
                var mr = EvaluateMatch(order, delivered);
                if (mr.MissingSteps == 0 && mr.WrongStateCount == 0 && mr.ExtraSteps == 0)
                {
                    matchedOrder = order;
                    matchResult = mr;
                    CompleteOrder(order);
                    return DeliveryMatchResult.Success;
                }
            }

            foreach (var order in _active)
            {
                if (order.IsCompleted || order.IsFailed) continue;
                var mr = EvaluateMatch(order, delivered);
                if (mr.MissingSteps == 0 && mr.WrongStateCount == 0)
                {
                    matchedOrder = order;
                    matchResult = mr;
                    CompleteOrder(order);
                    return DeliveryMatchResult.Success;
                }
            }

            foreach (var order in _active)
            {
                if (order.IsCompleted || order.IsFailed) continue;
                var mr = EvaluateMatch(order, delivered);
                if (mr.MissingSteps < order.Recipe.Steps.Count)
                {
                    matchedOrder = order;
                    matchResult = mr;
                    return DeliveryMatchResult.Partial;
                }
            }
            return DeliveryMatchResult.Wrong;
        }

        OrderMatchResult EvaluateMatch(Order order, List<IngredientItem> delivered)
        {
            var result = new OrderMatchResult
            {
                TimeRemainingRatio = order.RemainingRatio,
                PerfectTiming = order.RemainingRatio > 0.5f
            };

            var required = new List<RecipeStep>(order.Recipe.Steps);
            var consumed = new HashSet<int>();

            foreach (var item in delivered)
            {
                int matchedIdx = -1;
                for (int i = 0; i < required.Count; i++)
                {
                    if (consumed.Contains(i)) continue;
                    var step = required[i];
                    if (step.IngredientName.Equals(item.Definition.Name, StringComparison.OrdinalIgnoreCase))
                    {
                        if ((int)item.State >= (int)step.RequiredState && item.State != IngredientState.Burned)
                        {
                            if ((int)item.State > (int)step.RequiredState)
                                result.WrongStateCount++;
                            matchedIdx = i;
                            break;
                        }
                        result.WrongStateCount++;
                        matchedIdx = i;
                        break;
                    }
                }
                if (matchedIdx >= 0) consumed.Add(matchedIdx);
                else result.ExtraSteps++;
            }

            result.MissingSteps = required.Count - consumed.Count;
            return result;
        }

        void CompleteOrder(Order order)
        {
            order.IsCompleted = true;
            _active.Remove(order);
        }

        void FailOrder(Order order)
        {
            order.IsFailed = true;
            _active.Remove(order);
            var cfg = ServiceLocator.Get<GameConfig>();
            int penalty = cfg != null ? cfg.FailPenaltyScore : 100;
            EventBus.Raise(new OrderFailedEvent
            {
                OrderId = order.Id,
                RecipeName = order.Recipe.Name,
                PenaltyScore = penalty
            });
        }

        public void ClearAll()
        {
            _active.Clear();
            _orderCounter = 0;
        }
    }
}
