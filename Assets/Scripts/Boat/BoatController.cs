using System.Collections.Generic;
using UnityEngine;

public struct BoatState
{
    public float fuel;
    public float food;
    public int film;
    public float speed;
    public Vector2 position;
    public float heading;
    public bool isDrifting;
}

public class BoatController : MonoBehaviour
{
    public float moveSpeed = 5f;
    public float turnSpeed = 3f;
    public float maxSpeed = 10f;
    public float windInfluence = 0.5f;
    public float fuelPerUnit = 0.1f;
    public float foodPerSecond = 0.05f;
    public float maxFuel = 100f;
    public float maxFood = 100f;
    public int maxFilm = 30;
    public float collisionRadius = 1f;
    public ParticleSystem wakeEffect;

    public float Fuel => _supply != null ? _supply.Fuel : _fallbackFuel;
    public float Food => _supply != null ? _supply.Food : _fallbackFood;
    public int Film => _supply != null ? _supply.Film : _fallbackFilm;

    private SupplySystem _supply;
    private float _fallbackFuel;
    private float _fallbackFood;
    private int _fallbackFilm;

    private Vector2 velocity;
    private float heading;
    private bool isDrifting;
    private float hungerSpeedFactor = 1f;
    private Vector2 lastPosition;
    private List<Transform> obstacles = new List<Transform>();

    public BoatState GetState()
    {
        return new BoatState
        {
            fuel = Fuel,
            food = Food,
            film = Film,
            speed = velocity.magnitude,
            position = new Vector2(transform.position.x, transform.position.z),
            heading = heading,
            isDrifting = isDrifting
        };
    }

    public void ApplyDamage(float amount)
    {
        float fuelDmg = amount * 0.5f;
        float foodDmg = amount * 0.3f;

        if (_supply != null)
        {
            _supply.ConsumeFuel(fuelDmg);
            _supply.ConsumeFood(foodDmg);
        }
        else
        {
            _fallbackFuel = Mathf.Max(0f, _fallbackFuel - fuelDmg);
            _fallbackFood = Mathf.Max(0f, _fallbackFood - foodDmg);
        }

        if (Fuel <= 0f) isDrifting = true;
    }

    public void Refuel(float amount)
    {
        if (_supply != null)
            _supply.RefillFuel(amount);
        else
            _fallbackFuel = Mathf.Clamp(_fallbackFuel + amount, 0f, maxFuel);
        if (Fuel > 0f) isDrifting = false;
    }

    public void Feed(float amount)
    {
        if (_supply != null)
            _supply.RefillFood(amount);
        else
            _fallbackFood = Mathf.Clamp(_fallbackFood + amount, 0f, maxFood);
    }

    public void RestockFilm(int amount)
    {
        if (amount < 0)
        {
            ConsumeFilm();
            return;
        }

        if (_supply != null)
            _supply.RefillFilm(amount);
        else
            _fallbackFilm = Mathf.Clamp(_fallbackFilm + amount, 0, maxFilm);
    }

    public bool ConsumeFilm()
    {
        if (_supply != null)
            return _supply.ConsumeFilm();
        else
        {
            if (_fallbackFilm <= 0) return false;
            _fallbackFilm--;
            GameEvents.TriggerSupplyConsumed(SupplyType.Film, 1f);
            if (_fallbackFilm <= 0)
                GameEvents.TriggerSupplyDepleted(SupplyType.Film);
            return true;
        }
    }

    public void SetObstacles(List<Transform> obstacleList)
    {
        obstacles = obstacleList ?? new List<Transform>();
    }

    private void Awake()
    {
        _supply = FindObjectOfType<SupplySystem>();

        if (_supply != null)
        {
            _supply.boatTransform = transform;
        }
        else
        {
            _fallbackFuel = maxFuel;
            _fallbackFood = maxFood;
            _fallbackFilm = maxFilm;
        }

        lastPosition = new Vector2(transform.position.x, transform.position.z);
        heading = transform.eulerAngles.y;
    }

    private void Update()
    {
        float dt = Time.deltaTime;

        float currentFood = Food;

        if (currentFood > 0f)
        {
            float foodConsumed = foodPerSecond * dt;
            if (_supply != null)
            {
                _supply.ConsumeFood(foodConsumed);
            }
            else
            {
                _fallbackFood = Mathf.Max(0f, _fallbackFood - foodConsumed);
                GameEvents.TriggerSupplyConsumed(SupplyType.Food, foodConsumed);
                if (_fallbackFood <= 0f)
                    GameEvents.TriggerSupplyDepleted(SupplyType.Food);
            }
        }
        else
        {
            hungerSpeedFactor = Mathf.Max(0.2f, hungerSpeedFactor - 0.1f * dt);
        }

        if (Food > 0f)
        {
            hungerSpeedFactor = Mathf.Min(1f, hungerSpeedFactor + 0.2f * dt);
        }

        Vector2 input = InputMapper.Instance.GetAxis("Move");

        WeatherState weather = WeatherSystem.Instance.GetCurrentState();
        Vector2 windForce = WeatherSystem.Instance.GetWindForceAt(new Vector2(transform.position.x, transform.position.z));
        Vector2 windEffect = windForce * windInfluence;

        float fogPenalty = weather.visibility < 0.3f ? Mathf.Lerp(0.5f, 1f, weather.visibility / 0.3f) : 1f;

        Vector2 acceleration = Vector2.zero;

        if (!isDrifting && Fuel > 0f)
        {
            Vector2 thrust = input * moveSpeed * hungerSpeedFactor * fogPenalty;
            acceleration += thrust;

            if (input.sqrMagnitude > 0.01f)
            {
                float targetHeading = Mathf.Atan2(input.y, input.x) * Mathf.Rad2Deg;
                heading = Mathf.LerpAngle(heading, targetHeading, turnSpeed * dt);
            }
        }

        acceleration += windEffect;

        velocity += acceleration * dt;
        velocity = Vector2.ClampMagnitude(velocity, maxSpeed);

        Vector2 newPos2D = new Vector2(transform.position.x, transform.position.z) + velocity * dt;

        bool collided = false;
        for (int i = 0; i < obstacles.Count; i++)
        {
            if (obstacles[i] == null) continue;
            Vector2 obsPos = new Vector2(obstacles[i].position.x, obstacles[i].position.z);
            if (Vector2.Distance(newPos2D, obsPos) < collisionRadius)
            {
                collided = true;
                velocity = Vector2.Reflect(velocity, (newPos2D - obsPos).normalized) * 0.3f;
                break;
            }
        }

        if (!collided)
        {
            transform.position = new Vector3(newPos2D.x, transform.position.y, newPos2D.y);
        }

        transform.rotation = Quaternion.Euler(0f, heading, 0f);

        Vector2 currentPos2D = new Vector2(transform.position.x, transform.position.z);
        float distanceTraveled = Vector2.Distance(currentPos2D, lastPosition);

        if (distanceTraveled > 0.001f && Fuel > 0f && !isDrifting)
        {
            float fuelConsumed = fuelPerUnit * distanceTraveled;
            if (_supply != null)
            {
                _supply.ConsumeFuel(fuelConsumed);
            }
            else
            {
                _fallbackFuel = Mathf.Max(0f, _fallbackFuel - fuelConsumed);
                GameEvents.TriggerSupplyConsumed(SupplyType.Fuel, fuelConsumed);
            }

            if (Fuel <= 0f && !isDrifting)
            {
                isDrifting = true;
                if (_supply == null)
                    GameEvents.TriggerSupplyDepleted(SupplyType.Fuel);
            }
        }

        lastPosition = currentPos2D;

        if (wakeEffect != null)
        {
            if (velocity.sqrMagnitude > 0.1f && !wakeEffect.isEmitting)
            {
                wakeEffect.Play();
            }
            else if (velocity.sqrMagnitude <= 0.1f && wakeEffect.isEmitting)
            {
                wakeEffect.Stop();
            }
        }

        GameEvents.TriggerBoatMoved(currentPos2D, heading);
    }
}
