using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public int playerIndex;
    public float moveSpeed = GameConstants.PLAYER_SPEED;
    public float interactRange = GameConstants.STATION_INTERACT_RANGE;
    public bool isControlled;
    public SpriteRenderer spriteRenderer;
    public Rigidbody2D rb;

    public Ingredient CarriedIngredient { get; set; }
    public Dish CarriedDish { get; set; }

    private float switchCooldown;
    private GameObject carryVisual;

    public void Move(Vector2 direction)
    {
        if (rb != null)
        {
            rb.velocity = direction * moveSpeed;
        }
        else
        {
            transform.Translate(direction * moveSpeed * Time.deltaTime);
        }

        if (spriteRenderer != null && direction.x != 0f)
        {
            spriteRenderer.flipX = direction.x < 0f;
        }
    }

    public bool TryInteract()
    {
        if (CarriedDish != null)
        {
            return TryDeliverDish();
        }

        KitchenStation nearest = StationManager.Instance.GetNearestStation(transform.position, interactRange);
        if (nearest != null && nearest.CanInteract(this))
        {
            nearest.Interact(this);
            EventBus.Publish(new GameEvents.PlayerInteractEvent { PlayerIndex = playerIndex, StationType = nearest.stationType });
            return true;
        }
        return false;
    }

    private bool TryDeliverDish()
    {
        if (CarriedDish == null || !CarriedDish.isPlated)
            return false;

        OrderManager orderMgr = OrderManager.Instance;
        if (orderMgr == null || orderMgr.activeOrders == null || orderMgr.activeOrders.Count == 0)
            return false;

        Order matchingOrder = null;
        for (int i = 0; i < orderMgr.activeOrders.Count; i++)
        {
            Order order = orderMgr.activeOrders[i];
            if (order.recipe != null && CarriedDish.recipe != null &&
                order.recipe.recipeName == CarriedDish.recipe.recipeName)
            {
                matchingOrder = order;
                break;
            }
        }

        if (matchingOrder == null && orderMgr.activeOrders.Count > 0)
            matchingOrder = orderMgr.activeOrders[0];

        if (matchingOrder != null)
        {
            DishRating rating = CarriedDish.CalculateRating();
            float timeBonus = Mathf.Max(0f, matchingOrder.timeRemaining * 2f);
            int baseScore = CarriedDish.recipe != null ? CarriedDish.recipe.scoreValue : 50;

            ScoringManager.Instance.AddScore(baseScore, rating, timeBonus);
            orderMgr.CompleteOrder(matchingOrder, CarriedDish);

            CarriedDish = null;
            UpdateCarryVisual();
            return true;
        }

        return false;
    }

    public void PickUp(object item)
    {
        if (item is Ingredient ingredient)
            CarriedIngredient = ingredient;
        else if (item is Dish dish)
            CarriedDish = dish;

        UpdateCarryVisual();
    }

    public object Drop()
    {
        object dropped = null;
        if (CarriedDish != null)
        {
            dropped = CarriedDish;
            CarriedDish = null;
        }
        else if (CarriedIngredient != null)
        {
            dropped = CarriedIngredient;
            CarriedIngredient = null;
        }
        UpdateCarryVisual();
        return dropped;
    }

    public void SwitchToNextCharacter()
    {
        if (switchCooldown > 0f) return;

        PlayerManager.Instance.SwitchControlledPlayer(playerIndex + 1);
        switchCooldown = GameConstants.CHARACTER_SWITCH_COOLDOWN;
    }

    private void Update()
    {
        if (!isControlled) return;

        switchCooldown -= Time.deltaTime;
        if (switchCooldown < 0f) switchCooldown = 0f;

        Vector2 moveDir = Vector2.zero;
        if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)) moveDir.y += 1f;
        if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow)) moveDir.y -= 1f;
        if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) moveDir.x -= 1f;
        if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) moveDir.x += 1f;

        if (moveDir.sqrMagnitude > 0.01f)
            moveDir.Normalize();

        Move(moveDir);

        if (Input.GetKeyDown(KeyCode.E))
        {
            TryInteract();
        }

        if (Input.GetKeyDown(KeyCode.Q))
        {
            Drop();
        }

        if (Input.GetKeyDown(KeyCode.Tab))
        {
            SwitchToNextCharacter();
        }

        UpdateCarryColor();
    }

    private void UpdateCarryVisual()
    {
        bool carrying = CarriedIngredient != null || CarriedDish != null;
        if (carrying)
        {
            if (carryVisual == null)
            {
                carryVisual = new GameObject("CarryVisual");
                carryVisual.transform.SetParent(transform);
                carryVisual.transform.localPosition = new Vector3(0f, 0.6f, 0f);
                var sr = carryVisual.AddComponent<SpriteRenderer>();
                sr.sortingOrder = 5;
            }

            if (CarriedDish != null)
            {
                var sr = carryVisual.GetComponent<SpriteRenderer>();
                sr.color = Color.yellow;
            }
            else if (CarriedIngredient != null)
            {
                var sr = carryVisual.GetComponent<SpriteRenderer>();
                switch (CarriedIngredient.currentState)
                {
                    case IngredientState.Raw: sr.color = Color.red; break;
                    case IngredientState.Chopped: sr.color = Color.cyan; break;
                    case IngredientState.Cooked: sr.color = new Color(1f, 0.5f, 0f); break;
                    case IngredientState.Burned: sr.color = Color.black; break;
                    default: sr.color = Color.white; break;
                }
            }

            carryVisual.SetActive(true);
        }
        else if (carryVisual != null)
        {
            carryVisual.SetActive(false);
        }
    }

    private void UpdateCarryColor()
    {
        if (carryVisual == null || !carryVisual.activeSelf) return;

        var sr = carryVisual.GetComponent<SpriteRenderer>();
        if (sr == null) return;

        if (CarriedDish != null)
        {
            sr.color = Color.yellow;
        }
        else if (CarriedIngredient != null)
        {
            switch (CarriedIngredient.currentState)
            {
                case IngredientState.Raw: sr.color = Color.red; break;
                case IngredientState.Chopped: sr.color = Color.cyan; break;
                case IngredientState.Cooked: sr.color = new Color(1f, 0.5f, 0f); break;
                case IngredientState.Burned: sr.color = Color.black; break;
                default: sr.color = Color.white; break;
            }
        }
    }

    public void SetInputData(PlayerInputData data)
    {
    }
}
