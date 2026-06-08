using UnityEngine;

public class CookingStation : KitchenStation
{
    public bool hasBurnTimer;
    public Timer burnTimer;

    private SpriteRenderer _spriteRenderer;
    private Color _baseColor;

    private void Awake()
    {
        stationType = StationType.Cooking;
        _spriteRenderer = GetComponent<SpriteRenderer>();
        if (_spriteRenderer != null)
            _baseColor = _spriteRenderer.color;
    }

    public override bool CanInteract(PlayerController player)
    {
        if (isOccupied)
            return false;
        return player != null && player.CarriedIngredient != null && player.CarriedIngredient.CanCook();
    }

    public override void Interact(PlayerController player)
    {
        if (!CanInteract(player))
            return;

        currentIngredient = player.CarriedIngredient;
        player.CarriedIngredient = null;
        isOccupied = true;
        hasBurnTimer = currentIngredient.burnTime > 0f;

        processingTimer = new Timer(currentIngredient.cookTime);
        processingTimer.OnFinished += OnCookComplete;
        processingTimer.Start();
    }

    private void OnCookComplete()
    {
        if (currentIngredient != null)
        {
            currentIngredient.currentState = IngredientState.Cooked;
        }

        if (hasBurnTimer && currentIngredient != null)
        {
            burnTimer = new Timer(currentIngredient.burnTime);
            burnTimer.OnFinished += OnBurnComplete;
            burnTimer.Start();
        }
        else
        {
            isOccupied = false;
            NotifyStationComplete();
        }
    }

    private void OnBurnComplete()
    {
        if (currentIngredient != null)
        {
            currentIngredient.currentState = IngredientState.Burned;
        }

        isOccupied = false;
        currentIngredient = null;
        burnTimer = null;
        hasBurnTimer = false;
        NotifyStationComplete();
    }

    protected override void Update()
    {
        base.Update();

        if (burnTimer != null && !burnTimer.IsFinished)
        {
            burnTimer.Tick(Time.deltaTime);
        }

        UpdateVisual();
    }

    private void UpdateVisual()
    {
        if (_spriteRenderer == null || currentIngredient == null)
        {
            if (_spriteRenderer != null)
                _spriteRenderer.color = _baseColor;
            return;
        }

        if (processingTimer != null && !processingTimer.IsFinished)
        {
            float progress = processingTimer.Progress;
            _spriteRenderer.color = Color.Lerp(_baseColor, new Color(1f, 0.6f, 0.2f), progress);
        }
        else if (burnTimer != null && !burnTimer.IsFinished)
        {
            float burnProgress = burnTimer.Progress;
            _spriteRenderer.color = Color.Lerp(new Color(1f, 0.6f, 0.2f), Color.black, burnProgress);
        }
    }

    protected override void OnDestroy()
    {
        if (processingTimer != null)
            processingTimer.OnFinished -= OnCookComplete;
        if (burnTimer != null)
            burnTimer.OnFinished -= OnBurnComplete;
        base.OnDestroy();
    }
}
