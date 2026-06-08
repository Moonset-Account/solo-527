using UnityEngine;

public class PrepStation : KitchenStation
{
    private PlayerController _pendingPlayer;

    private void Awake()
    {
        stationType = StationType.Prep;
    }

    public override bool CanInteract(PlayerController player)
    {
        if (isOccupied)
            return false;
        return player != null && player.CarriedIngredient != null && player.CarriedIngredient.CanChop();
    }

    public override void Interact(PlayerController player)
    {
        if (!CanInteract(player))
            return;

        currentIngredient = player.CarriedIngredient;
        player.CarriedIngredient = null;
        isOccupied = true;
        _pendingPlayer = player;

        processingTimer = new Timer(currentIngredient.prepTime);
        processingTimer.OnFinished += OnPrepComplete;
        processingTimer.Start();
    }

    private void OnPrepComplete()
    {
        if (currentIngredient != null)
        {
            currentIngredient.currentState = IngredientState.Chopped;
        }

        if (_pendingPlayer != null && _pendingPlayer.CarriedIngredient == null)
        {
            _pendingPlayer.CarriedIngredient = currentIngredient;
        }

        currentIngredient = null;
        isOccupied = false;
        _pendingPlayer = null;
        NotifyStationComplete();
    }

    protected override void OnDestroy()
    {
        if (processingTimer != null)
            processingTimer.OnFinished -= OnPrepComplete;
        base.OnDestroy();
    }
}
