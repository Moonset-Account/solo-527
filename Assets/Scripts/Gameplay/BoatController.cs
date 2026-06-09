using UnityEngine;
using System;
using System.Collections.Generic;
using LakeSailing.Core;
using LakeSailing.Data;

namespace LakeSailing.Gameplay
{
    public enum BoatState
    {
        Docked,
        Sailing,
        Anchored,
        Shooting,
        LowFuel,
        Damaged,
        Returning
    }

    public class BoatController : MonoBehaviour
    {
        [Header("基础设置")]
        [SerializeField] private Transform boatTransform;
        [SerializeField] private Rigidbody2D rb2D;
        [SerializeField] private float baseMaxSpeed = 5f;
        [SerializeField] private float acceleration = 2f;
        [SerializeField] private float turnSpeed = 120f;
        [SerializeField] private float drag = 0.98f;

        [Header("补给设置")]
        [SerializeField] private float maxFuel = 100f;
        [SerializeField] private float maxFood = 50f;
        [SerializeField] private float maxBattery = 100f;
        [SerializeField] private float fuelConsumptionPerSecond = 0.5f;
        [SerializeField] private float foodConsumptionPerSecond = 0.1f;
        [SerializeField] private float batteryConsumptionPerSecond = 0.3f;

        [Header("当前状态")]
        [SerializeField] private BoatState currentState = BoatState.Docked;
        [SerializeField] private Vector2 currentVelocity;
        [SerializeField] private float currentHeading;
        [SerializeField] private float currentFuel;
        [SerializeField] private float currentFood;
        [SerializeField] private float currentBattery;
        [SerializeField] private float currentHealth = 100f;
        [SerializeField] private float maxHealth = 100f;

        [Header("路线规划")]
        [SerializeField] private List<Vector2> plannedWaypoints = new List<Vector2>();
        [SerializeField] private int currentWaypointIndex;
        [SerializeField] private bool isFollowingRoute;

        [Header("航行统计")]
        [SerializeField] private float distanceTraveled;
        [SerializeField] private float sailingTime;

        public event Action<BoatState, BoatState> OnBoatStateChanged;
        public event Action<float, float> OnFuelChanged;
        public event Action<float, float> OnFoodChanged;
        public event Action<float, float> OnBatteryChanged;
        public event Action<float, float> OnHealthChanged;
        public event Action<List<Vector2>> OnRoutePlanned;
        public event Action<int> OnWaypointReached;
        public event Action OnRouteCompleted;
        public event Action OnLowFuel;
        public event Action OnOutOfFuel;

        public BoatState CurrentState => currentState;
        public float CurrentSpeed => currentVelocity.magnitude;
        public float MaxSpeed => baseMaxSpeed * WeatherSystem.Instance.GetWeatherSpeedModifier();
        public float CurrentHeading => currentHeading;
        public float CurrentFuel => currentFuel;
        public float CurrentFood => currentFood;
        public float CurrentBattery => currentBattery;
        public float CurrentHealth => currentHealth;
        public float MaxFuel => maxFuel;
        public float MaxFood => maxFood;
        public float MaxBattery => maxBattery;
        public float MaxHealth => maxHealth;
        public List<Vector2> PlannedWaypoints => new List<Vector2>(plannedWaypoints);
        public int CurrentWaypointIndex => currentWaypointIndex;
        public bool IsFollowingRoute => isFollowingRoute;
        public float DistanceTraveled => distanceTraveled;
        public float SailingTime => sailingTime;

        private Vector2 targetPosition;
        private bool hasTarget;
        private float windEffectTime;

        public void Initialize(LevelConfigData config, Vector2 startPosition)
        {
            if (config != null)
            {
                maxFuel = config.startFuel;
                maxFood = config.startFood;
                maxBattery = config.startBattery;
                baseMaxSpeed = config.boatMaxSpeed;
            }

            currentFuel = maxFuel;
            currentFood = maxFood;
            currentBattery = maxBattery;
            currentHealth = maxHealth;

            distanceTraveled = 0f;
            sailingTime = 0f;
            currentWaypointIndex = 0;
            plannedWaypoints.Clear();
            isFollowingRoute = false;

            if (boatTransform == null) boatTransform = transform;
            if (rb2D == null) rb2D = GetComponent<Rigidbody2D>();

            boatTransform.position = startPosition;
            currentVelocity = Vector2.zero;
            SetState(BoatState.Docked);
        }

        public void SetState(BoatState newState)
        {
            if (currentState == newState) return;
            var oldState = currentState;
            currentState = newState;
            OnBoatStateChanged?.Invoke(oldState, newState);
            EventBus.Trigger(new BoatStateChangedEvent(oldState, newState));
        }

        private void Update()
        {
            if (GameManager.Instance == null || GameManager.Instance.CurrentState != GameState.Playing)
                return;

            if (currentState == BoatState.Sailing || currentState == BoatState.Returning)
            {
                sailingTime += Time.deltaTime;
                ConsumeSupplies();
            }

            if (isFollowingRoute && currentState == BoatState.Sailing)
            {
                FollowRoute();
            }
        }

        private void FixedUpdate()
        {
            if (GameManager.Instance == null || GameManager.Instance.CurrentState != GameState.Playing)
                return;

            if (currentState != BoatState.Sailing && currentState != BoatState.Returning && currentState != BoatState.Damaged)
                return;

            ApplyWindEffect();

            if (currentVelocity.magnitude > 0.01f)
            {
                distanceTraveled += currentVelocity.magnitude * Time.fixedDeltaTime;
                boatTransform.position += (Vector3)(currentVelocity * Time.fixedDeltaTime);
            }

            if (rb2D != null)
            {
                rb2D.MovePosition(boatTransform.position);
            }

            currentVelocity *= drag;

            if (currentVelocity.magnitude > MaxSpeed)
            {
                currentVelocity = currentVelocity.normalized * MaxSpeed;
            }

            if (currentVelocity.magnitude > 0.1f)
            {
                float targetAngle = Mathf.Atan2(currentVelocity.y, currentVelocity.x) * Mathf.Rad2Deg - 90f;
                currentHeading = targetAngle;
                boatTransform.rotation = Quaternion.Lerp(boatTransform.rotation,
                    Quaternion.Euler(0, 0, targetAngle), turnSpeed * Time.fixedDeltaTime / 360f);
            }
        }

        private void ConsumeSupplies()
        {
            float weatherMod = WeatherSystem.Instance.GetFuelConsumptionModifier();
            float speedMod = 0.5f + (currentVelocity.magnitude / MaxSpeed) * 0.5f;

            float fuelUsed = fuelConsumptionPerSecond * weatherMod * speedMod * Time.deltaTime;
            float foodUsed = foodConsumptionPerSecond * Time.deltaTime;
            float batteryUsed = batteryConsumptionPerSecond * Time.deltaTime;

            currentFuel = Mathf.Max(0, currentFuel - fuelUsed);
            currentFood = Mathf.Max(0, currentFood - foodUsed);
            currentBattery = Mathf.Max(0, currentBattery - batteryUsed);

            OnFuelChanged?.Invoke(currentFuel, maxFuel);
            OnFoodChanged?.Invoke(currentFood, maxFood);
            OnBatteryChanged?.Invoke(currentBattery, maxBattery);

            if (currentFuel <= maxFuel * 0.2f && currentFuel > 0 && currentState == BoatState.Sailing)
            {
                SetState(BoatState.LowFuel);
                OnLowFuel?.Invoke();
                EventBus.Trigger(new BoatLowFuelEvent(currentFuel));
            }

            if (currentFuel <= 0 && currentState != BoatState.Anchored && currentState != BoatState.Docked)
            {
                SetState(BoatState.Damaged);
                OnOutOfFuel?.Invoke();
                EventBus.Trigger(new BoatOutOfFuelEvent());
            }
        }

        private void ApplyWindEffect()
        {
            var windVec = WeatherSystem.Instance.GetWindVector();
            float windEffect = WeatherSystem.Instance.CurrentWindStrength * 0.3f;
            currentVelocity += windVec * windEffect * Time.fixedDeltaTime;
            windEffectTime += Time.fixedDeltaTime;
        }

        public void MoveTowards(Vector2 target, float throttle = 1f)
        {
            if (currentFuel <= 0 || currentState == BoatState.Damaged || currentState == BoatState.Anchored)
                return;

            if (currentState == BoatState.Docked || currentState == BoatState.LowFuel)
            {
                SetState(BoatState.Sailing);
            }

            throttle = Mathf.Clamp01(throttle);
            Vector2 direction = (target - (Vector2)boatTransform.position).normalized;

            if (direction.sqrMagnitude > 0.01f)
            {
                currentVelocity += direction * acceleration * throttle * Time.fixedDeltaTime;
            }
        }

        public void SetHeading(float angleDegrees, float throttle = 1f)
        {
            if (currentFuel <= 0 || currentState == BoatState.Damaged || currentState == BoatState.Anchored)
                return;

            if (currentState == BoatState.Docked || currentState == BoatState.LowFuel)
            {
                SetState(BoatState.Sailing);
            }

            throttle = Mathf.Clamp01(throttle);
            float radians = angleDegrees * Mathf.Deg2Rad;
            Vector2 direction = new Vector2(Mathf.Cos(radians), Mathf.Sin(radians));
            currentVelocity += direction * acceleration * throttle * Time.fixedDeltaTime;
        }

        public void PlanRoute(List<Vector2> waypoints)
        {
            plannedWaypoints = new List<Vector2>(waypoints);
            currentWaypointIndex = 0;
            isFollowingRoute = true;
            OnRoutePlanned?.Invoke(plannedWaypoints);
            EventBus.Trigger(new RoutePlannedEvent(plannedWaypoints));
        }

        public void AddWaypoint(Vector2 waypoint)
        {
            plannedWaypoints.Add(waypoint);
            if (!isFollowingRoute && currentState != BoatState.Docked)
            {
                isFollowingRoute = true;
            }
            OnRoutePlanned?.Invoke(plannedWaypoints);
        }

        public void ClearRoute()
        {
            plannedWaypoints.Clear();
            currentWaypointIndex = 0;
            isFollowingRoute = false;
            OnRoutePlanned?.Invoke(plannedWaypoints);
        }

        private void FollowRoute()
        {
            if (plannedWaypoints.Count == 0 || currentWaypointIndex >= plannedWaypoints.Count)
            {
                isFollowingRoute = false;
                OnRouteCompleted?.Invoke();
                EventBus.Trigger(new RouteCompletedEvent());
                return;
            }

            Vector2 target = plannedWaypoints[currentWaypointIndex];
            Vector2 position = boatTransform.position;
            float distance = Vector2.Distance(position, target);

            if (distance < 0.5f)
            {
                OnWaypointReached?.Invoke(currentWaypointIndex);
                EventBus.Trigger(new WaypointReachedEvent(currentWaypointIndex, target));
                currentWaypointIndex++;

                if (currentWaypointIndex >= plannedWaypoints.Count)
                {
                    isFollowingRoute = false;
                    SetState(BoatState.Anchored);
                    OnRouteCompleted?.Invoke();
                    EventBus.Trigger(new RouteCompletedEvent());
                }
            }
            else
            {
                MoveTowards(target, 0.8f);
            }
        }

        public void SetSail()
        {
            if (currentState == BoatState.Docked)
            {
                SetState(BoatState.Sailing);
            }
        }

        public void Anchor()
        {
            SetState(BoatState.Anchored);
            currentVelocity *= 0.1f;
        }

        public void Dock()
        {
            SetState(BoatState.Docked);
            currentVelocity = Vector2.zero;
        }

        public void Refuel(float amount)
        {
            currentFuel = Mathf.Min(maxFuel, currentFuel + amount);
            OnFuelChanged?.Invoke(currentFuel, maxFuel);
            EventBus.Trigger(new SupplyRestockedEvent(SupplyType.Fuel, amount));
        }

        public void RestockFood(float amount)
        {
            currentFood = Mathf.Min(maxFood, currentFood + amount);
            OnFoodChanged?.Invoke(currentFood, maxFood);
            EventBus.Trigger(new SupplyRestockedEvent(SupplyType.Food, amount));
        }

        public void RechargeBattery(float amount)
        {
            currentBattery = Mathf.Min(maxBattery, currentBattery + amount);
            OnBatteryChanged?.Invoke(currentBattery, maxBattery);
            EventBus.Trigger(new SupplyRestockedEvent(SupplyType.Battery, amount));
        }

        public void TakeDamage(float amount)
        {
            currentHealth = Mathf.Max(0, currentHealth - amount);
            OnHealthChanged?.Invoke(currentHealth, maxHealth);

            if (currentHealth <= 0)
            {
                SetState(BoatState.Damaged);
                EventBus.Trigger(new BoatDestroyedEvent());
            }
        }

        public void Repair(float amount)
        {
            currentHealth = Mathf.Min(maxHealth, currentHealth + amount);
            OnHealthChanged?.Invoke(currentHealth, maxHealth);
        }

        public bool CanShootPhoto()
        {
            return currentBattery >= 10f && currentState != BoatState.Damaged;
        }

        public void ShootPhoto()
        {
            if (!CanShootPhoto()) return;
            currentBattery = Mathf.Max(0, currentBattery - 10f);
            OnBatteryChanged?.Invoke(currentBattery, maxBattery);
            SetState(BoatState.Shooting);
        }

        public void FinishShooting()
        {
            if (currentState == BoatState.Shooting)
            {
                SetState(currentFuel <= maxFuel * 0.2f ? BoatState.LowFuel : BoatState.Sailing);
            }
        }

        public void TeleportTo(Vector2 position)
        {
            boatTransform.position = position;
            currentVelocity = Vector2.zero;
        }

        public Vector2 GetPosition2D()
        {
            return boatTransform != null ? (Vector2)boatTransform.position : Vector2.zero;
        }

        public float CalculateRequiredFuel(Vector2 from, Vector2 to)
        {
            float distance = Vector2.Distance(from, to);
            float avgSpeed = MaxSpeed * 0.6f;
            float timeHours = distance / avgSpeed;
            float weatherMod = (WeatherSystem.Instance.GetFuelConsumptionModifier() + 1f) / 2f;
            return fuelConsumptionPerSecond * timeHours * 3600f * weatherMod;
        }
    }

    public enum SupplyType
    {
        Fuel,
        Food,
        Battery
    }

    public struct BoatStateChangedEvent : IEvent
    {
        public readonly BoatState OldState;
        public readonly BoatState NewState;

        public BoatStateChangedEvent(BoatState oldState, BoatState newState)
        {
            OldState = oldState;
            NewState = newState;
        }
    }

    public struct RoutePlannedEvent : IEvent
    {
        public readonly List<Vector2> Waypoints;

        public RoutePlannedEvent(List<Vector2> waypoints)
        {
            Waypoints = waypoints;
        }
    }

    public struct WaypointReachedEvent : IEvent
    {
        public readonly int Index;
        public readonly Vector2 Position;

        public WaypointReachedEvent(int index, Vector2 position)
        {
            Index = index;
            Position = position;
        }
    }

    public struct RouteCompletedEvent : IEvent { }

    public struct BoatLowFuelEvent : IEvent
    {
        public readonly float CurrentFuel;

        public BoatLowFuelEvent(float currentFuel)
        {
            CurrentFuel = currentFuel;
        }
    }

    public struct BoatOutOfFuelEvent : IEvent { }

    public struct BoatDestroyedEvent : IEvent { }

    public struct SupplyRestockedEvent : IEvent
    {
        public readonly SupplyType Type;
        public readonly float Amount;

        public SupplyRestockedEvent(SupplyType type, float amount)
        {
            Type = type;
            Amount = amount;
        }
    }
}
