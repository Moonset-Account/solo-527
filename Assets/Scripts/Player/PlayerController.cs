using UnityEngine;
using System;

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

    private PlayerInputData inputData;
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
        KitchenStation nearest = StationManager.Instance.GetNearestStation(transform.position, interactRange);
        if (nearest != null && nearest.CanInteract(this))
        {
            nearest.Interact(this);
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

        Move(inputData.MoveInput);

        if (inputData.InteractPressed)
        {
            TryInteract();
            inputData.InteractPressed = false;
        }

        if (inputData.SwitchPressed)
        {
            SwitchToNextCharacter();
            inputData.SwitchPressed = false;
        }

        if (inputData.PickUpPressed)
        {
            inputData.PickUpPressed = false;
        }

        if (inputData.DropPressed)
        {
            Drop();
            inputData.DropPressed = false;
        }
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
                carryVisual.transform.localPosition = new Vector3(0f, 0.5f, 0f);
                carryVisual.AddComponent<SpriteRenderer>();
            }
            carryVisual.SetActive(true);
        }
        else if (carryVisual != null)
        {
            carryVisual.SetActive(false);
        }
    }

    public void SetInputData(PlayerInputData data)
    {
        inputData = data;
    }
}
