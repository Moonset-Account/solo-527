using System;
using UnityEngine;

public class Order
{
    public int orderID;
    public Recipe recipe;
    public float timeRemaining;
    public float maxTime;
    public DishRating rating;

    public bool IsExpired => timeRemaining <= 0f;
    public float Urgency => maxTime > 0f ? Mathf.Clamp01(timeRemaining / maxTime) : 0f;

    public event Action OnExpired;

    public Order(int id, Recipe recipe, float maxTime)
    {
        this.orderID = id;
        this.recipe = recipe;
        this.maxTime = maxTime;
        this.timeRemaining = maxTime;
        this.rating = DishRating.None;
    }

    public void Tick(float deltaTime)
    {
        if (IsExpired)
            return;

        timeRemaining -= deltaTime;

        if (IsExpired)
        {
            timeRemaining = 0f;
            OnExpired?.Invoke();
        }
    }
}
