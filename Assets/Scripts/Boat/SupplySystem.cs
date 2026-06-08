using System.Collections.Generic;
using UnityEngine;

public struct SupplyState
{
    public float fuel;
    public float maxFuel;
    public float food;
    public float maxFood;
    public int film;
    public int maxFilm;
}

public class SupplySystem : MonoBehaviour
{
    public float maxFuel = 100f;
    public float maxFood = 100f;
    public int maxFilm = 30;
    public float dockRefillRate = 5f;
    public float dockDetectionRadius = 3f;
    public Transform boatTransform;
    public List<Transform> supplyDocks = new List<Transform>();

    public System.Action<SupplyType, float, float> OnSupplyChanged;

    public float Fuel { get; private set; }
    public float Food { get; private set; }
    public int Film { get; private set; }

    private bool fuelDepletedFired;
    private bool foodDepletedFired;
    private bool filmDepletedFired;

    public SupplyState GetSupplyState()
    {
        return new SupplyState
        {
            fuel = Fuel,
            maxFuel = maxFuel,
            food = Food,
            maxFood = maxFood,
            film = Film,
            maxFilm = maxFilm
        };
    }

    public float GetSupplyPercentage(SupplyType type)
    {
        switch (type)
        {
            case SupplyType.Fuel: return maxFuel > 0f ? Fuel / maxFuel : 0f;
            case SupplyType.Food: return maxFood > 0f ? Food / maxFood : 0f;
            case SupplyType.Film: return maxFilm > 0 ? (float)Film / maxFilm : 0f;
            default: return 0f;
        }
    }

    public bool ConsumeFuel(float amount)
    {
        bool hadEnough = Fuel >= amount;
        Fuel = Mathf.Max(0f, Fuel - amount);
        GameEvents.TriggerSupplyConsumed(SupplyType.Fuel, amount);
        OnSupplyChanged?.Invoke(SupplyType.Fuel, Fuel, maxFuel);

        if (Fuel <= 0f && !fuelDepletedFired)
        {
            fuelDepletedFired = true;
            GameEvents.TriggerSupplyDepleted(SupplyType.Fuel);
        }

        return hadEnough;
    }

    public bool ConsumeFood(float amount)
    {
        bool hadEnough = Food >= amount;
        Food = Mathf.Max(0f, Food - amount);
        GameEvents.TriggerSupplyConsumed(SupplyType.Food, amount);
        OnSupplyChanged?.Invoke(SupplyType.Food, Food, maxFood);

        if (Food <= 0f && !foodDepletedFired)
        {
            foodDepletedFired = true;
            GameEvents.TriggerSupplyDepleted(SupplyType.Food);
        }

        return hadEnough;
    }

    public bool ConsumeFilm()
    {
        if (Film <= 0) return false;

        Film--;
        GameEvents.TriggerSupplyConsumed(SupplyType.Film, 1f);
        OnSupplyChanged?.Invoke(SupplyType.Film, Film, maxFilm);

        if (Film <= 0 && !filmDepletedFired)
        {
            filmDepletedFired = true;
            GameEvents.TriggerSupplyDepleted(SupplyType.Film);
        }

        return true;
    }

    public void RefillFuel(float amount)
    {
        Fuel = Mathf.Clamp(Fuel + amount, 0f, maxFuel);
        fuelDepletedFired = Fuel <= 0f;
        OnSupplyChanged?.Invoke(SupplyType.Fuel, Fuel, maxFuel);
    }

    public void RefillFood(float amount)
    {
        Food = Mathf.Clamp(Food + amount, 0f, maxFood);
        foodDepletedFired = Food <= 0f;
        OnSupplyChanged?.Invoke(SupplyType.Food, Food, maxFood);
    }

    public void RefillFilm(int amount)
    {
        Film = Mathf.Clamp(Film + amount, 0, maxFilm);
        filmDepletedFired = Film <= 0;
        OnSupplyChanged?.Invoke(SupplyType.Film, Film, maxFilm);
    }

    public void SetStartValues(float fuel, float food, int film)
    {
        Fuel = Mathf.Clamp(fuel, 0f, maxFuel);
        Food = Mathf.Clamp(food, 0f, maxFood);
        Film = Mathf.Clamp(film, 0, maxFilm);
        fuelDepletedFired = Fuel <= 0f;
        foodDepletedFired = Food <= 0f;
        filmDepletedFired = Film <= 0;
    }

    private void Awake()
    {
        Fuel = maxFuel;
        Food = maxFood;
        Film = maxFilm;
    }

    private void Update()
    {
        if (boatTransform == null) return;

        Vector2 boatPos2D = new Vector2(boatTransform.position.x, boatTransform.position.z);

        for (int i = 0; i < supplyDocks.Count; i++)
        {
            if (supplyDocks[i] == null) continue;

            Vector2 dockPos2D = new Vector2(supplyDocks[i].position.x, supplyDocks[i].position.z);
            float dist = Vector2.Distance(boatPos2D, dockPos2D);

            if (dist <= dockDetectionRadius)
            {
                float refillAmount = dockRefillRate * Time.deltaTime;

                if (Fuel < maxFuel) RefillFuel(refillAmount);
                if (Food < maxFood) RefillFood(refillAmount);
                if (Film < maxFilm) RefillFilm(1);
                break;
            }
        }
    }
}
