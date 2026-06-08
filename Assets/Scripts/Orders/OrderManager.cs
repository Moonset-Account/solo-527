using UnityEngine;
using System.Collections.Generic;

public class OrderManager : Singleton<OrderManager>
{
    public List<Order> activeOrders;
    public List<Order> completedOrders;
    public List<Order> failedOrders;

    private List<Recipe> availableRecipes = new List<Recipe>();
    private Timer orderSpawnTimer;
    private int nextOrderID;
    private static readonly System.Random rng = new System.Random();

    protected override void Awake()
    {
        base.Awake();
        activeOrders = new List<Order>();
        completedOrders = new List<Order>();
        failedOrders = new List<Order>();
        nextOrderID = 0;
    }

    public void SetAvailableRecipes(List<Recipe> recipes)
    {
        availableRecipes = recipes ?? new List<Recipe>();
    }

    public void InitializeSpawnTimer(float interval)
    {
        orderSpawnTimer = new Timer(interval);
        orderSpawnTimer.OnFinished += OnSpawnTimerComplete;
        orderSpawnTimer.Start();
    }

    private void OnSpawnTimerComplete()
    {
        SpawnOrder();
        orderSpawnTimer.Start();
    }

    public void SpawnOrder()
    {
        if (activeOrders.Count >= GameConstants.MAX_ORDERS_ON_SCREEN)
            return;

        Recipe recipe = GetRandomRecipe();
        if (recipe == null)
            return;

        float maxTime = GameConstants.ORDER_TIMEOUT_BASE;
        Order order = new Order(nextOrderID++, recipe, maxTime);
        order.OnExpired += () => FailOrder(order);

        activeOrders.Add(order);
        EventBus.Publish(new GameEvents.OrderSpawnedEvent { Order = order });
    }

    public void CompleteOrder(Order order, Dish dish)
    {
        if (order == null || !activeOrders.Contains(order))
            return;

        order.rating = dish != null ? dish.CalculateRating() : DishRating.None;
        activeOrders.Remove(order);
        completedOrders.Add(order);

        EventBus.Publish(new GameEvents.OrderCompletedEvent { Order = order, Dish = dish });
    }

    public void FailOrder(Order order)
    {
        if (order == null || !activeOrders.Contains(order))
            return;

        activeOrders.Remove(order);
        failedOrders.Add(order);

        EventBus.Publish(new GameEvents.OrderFailedEvent { Order = order });
    }

    public Order GetNextOrder()
    {
        if (activeOrders.Count == 0)
            return null;

        Order mostUrgent = activeOrders[0];
        for (int i = 1; i < activeOrders.Count; i++)
        {
            if (activeOrders[i].timeRemaining < mostUrgent.timeRemaining)
                mostUrgent = activeOrders[i];
        }
        return mostUrgent;
    }

    private void Update()
    {
        for (int i = activeOrders.Count - 1; i >= 0; i--)
        {
            activeOrders[i].Tick(Time.deltaTime);
        }

        if (orderSpawnTimer != null && !orderSpawnTimer.IsFinished)
        {
            orderSpawnTimer.Tick(Time.deltaTime);
        }
    }

    private Recipe GetRandomRecipe()
    {
        if (availableRecipes == null || availableRecipes.Count == 0)
            return null;

        int index = rng.Next(availableRecipes.Count);
        return availableRecipes[index];
    }

    protected override void OnDestroy()
    {
        if (orderSpawnTimer != null)
            orderSpawnTimer.OnFinished -= OnSpawnTimerComplete;
        base.OnDestroy();
    }
}
