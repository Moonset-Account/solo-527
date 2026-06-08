using System;
using System.Collections.Generic;
using Kitchen.Config;
using UnityEngine;

namespace Kitchen.Gameplay
{
    [System.Serializable]
    public class Order
    {
        public int orderId;
        public RecipeConfig recipe;
        public float timeRemaining;
        public float maxTime;
        public bool isCompleted;
        public bool isFailed;
        public int tipBonus;

        public event Action<Order> OnCompleted;
        public event Action<Order> OnFailed;
        public event Action<float> OnTick;

        public Order(int id, RecipeConfig r)
        {
            orderId = id;
            recipe = r;
            timeRemaining = r.timeLimitSeconds;
            maxTime = r.timeLimitSeconds;
            tipBonus = Mathf.RoundToInt(r.baseScore * 0.2f);
        }

        public void Tick(float dt)
        {
            if (isCompleted || isFailed) return;
            timeRemaining -= dt;
            OnTick?.Invoke(timeRemaining);

            if (timeRemaining <= 0)
            {
                timeRemaining = 0;
                isFailed = true;
                OnFailed?.Invoke(this);
            }
        }

        public int CalculateScore()
        {
            float timeRatio = timeRemaining / maxTime;
            int timeBonus = Mathf.RoundToInt(recipe.baseScore * 0.5f * timeRatio);
            int score = recipe.baseScore + (timeRatio > 0.5f ? tipBonus : 0) + timeBonus;
            return score;
        }

        public void Complete()
        {
            isCompleted = true;
            OnCompleted?.Invoke(this);
        }
    }

    public class OrderManager : MonoBehaviour
    {
        public static OrderManager Instance { get; private set; }

        [Header("Prefabs")]
        public GameObject heldItemPrefab;

        [Header("Spawn Settings")]
        public Transform[] servingPoints;

        [Header("Runtime")]
        [SerializeField] private List<Order> activeOrders = new List<Order>();
        [SerializeField] private int orderIdCounter = 1;
        [SerializeField] private float spawnTimer;
        [SerializeField] private float currentSpawnInterval;

        public IReadOnlyList<Order> ActiveOrders => activeOrders;
        public event Action<Order> OnOrderAdded;
        public event Action<Order> OnOrderRemoved;
        public event Action<Order> OnOrderCompleted;
        public event Action<Order> OnOrderFailed;

        private Kitchen.Config.LevelConfig levelConfig;
        private System.Random rng = new System.Random();

        private void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
        }

        public void Initialize(Kitchen.Config.LevelConfig config)
        {
            levelConfig = config;
            activeOrders.Clear();
            orderIdCounter = 1;
            spawnTimer = 3f;
            currentSpawnInterval = config.orderSpawnInterval;
        }

        private void Update()
        {
            if (levelConfig == null) return;
            if (Kitchen.Core.GameManager.Instance?.CurrentState != Kitchen.Core.GameManager.GameState.Playing) return;

            float dt = Time.deltaTime;
            spawnTimer -= dt;

            foreach (var order in activeOrders)
            {
                order.Tick(dt);
            }

            if (spawnTimer <= 0f && activeOrders.Count < levelConfig.maxActiveOrders)
            {
                SpawnOrder();
                spawnTimer = currentSpawnInterval;
                currentSpawnInterval = Mathf.Max(
                    levelConfig.difficultyCurve.minOrderSpawnInterval,
                    currentSpawnInterval * levelConfig.difficultyCurve.orderSpawnMultiplier
                );
            }
        }

        private void SpawnOrder()
        {
            if (levelConfig.availableRecipes.Count == 0) return;

            float elapsed = levelConfig.levelDurationSeconds - Kitchen.Core.GameManager.Instance.LevelTimer;
            float progress = elapsed / levelConfig.levelDurationSeconds;
            int complexityBoost = Mathf.FloorToInt(progress * levelConfig.difficultyCurve.maxComplexityIncrease);

            var candidates = levelConfig.availableRecipes.FindAll(r =>
                Mathf.RoundToInt(r.difficultyWeight * 10) <= (5 + complexityBoost));

            if (candidates.Count == 0) candidates = levelConfig.availableRecipes;

            RecipeConfig recipe = candidates[rng.Next(candidates.Count)];
            Order order = new Order(orderIdCounter++, recipe);
            order.OnFailed += HandleOrderFailed;
            order.OnCompleted += HandleOrderCompleted;
            activeOrders.Add(order);
            OnOrderAdded?.Invoke(order);
        }

        private void HandleOrderFailed(Order order)
        {
            OnOrderFailed?.Invoke(order);
            Kitchen.Core.GameManager.Instance?.FailOrder();
            RemoveOrder(order);
        }

        private void HandleOrderCompleted(Order order)
        {
            OnOrderCompleted?.Invoke(order);
            RemoveOrder(order);
        }

        private void RemoveOrder(Order order)
        {
            activeOrders.Remove(order);
            OnOrderRemoved?.Invoke(order);
        }

        public Order FindMatchingOrder(RecipeConfig candidate)
        {
            if (candidate == null) return null;
            return activeOrders.Find(o => !o.isCompleted && !o.isFailed && o.recipe.id == candidate.id);
        }

        public int SubmitPlatedItem(RecipeConfig recipe)
        {
            Order order = FindMatchingOrder(recipe);
            if (order == null)
            {
                Kitchen.Core.GameManager.Instance?.AddScore(20, "错误配送");
                return 20;
            }
            int score = order.CalculateScore();
            order.Complete();
            Kitchen.Core.GameManager.Instance?.CompleteOrder(score, order.recipe.rewardCoins);
            return score;
        }

        public void ClearAllOrders()
        {
            foreach (var o in activeOrders)
            {
                o.OnFailed -= HandleOrderFailed;
                o.OnCompleted -= HandleOrderCompleted;
            }
            activeOrders.Clear();
        }
    }
}
