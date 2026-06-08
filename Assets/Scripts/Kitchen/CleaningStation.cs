using UnityEngine;

public class CleaningStation : KitchenStation
{
    public float cleanTime = 3f;
    public int dirtyDishes;

    private void Awake()
    {
        stationType = StationType.Cleaning;
    }

    public override bool CanInteract(PlayerController player)
    {
        if (isOccupied)
            return false;
        return dirtyDishes > 0;
    }

    public override void Interact(PlayerController player)
    {
        if (!CanInteract(player))
            return;

        isOccupied = true;
        processingTimer = new Timer(cleanTime);
        processingTimer.OnFinished += OnCleanComplete;
        processingTimer.Start();
    }

    private void OnCleanComplete()
    {
        dirtyDishes--;
        isOccupied = false;
        processingTimer = null;
        NotifyStationComplete();
    }

    public float GetCleaningProgress()
    {
        if (processingTimer == null)
            return 0f;
        return processingTimer.Progress;
    }

    protected override void OnDestroy()
    {
        if (processingTimer != null)
            processingTimer.OnFinished -= OnCleanComplete;
        base.OnDestroy();
    }
}
