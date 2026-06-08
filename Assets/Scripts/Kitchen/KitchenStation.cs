using UnityEngine;
using System;

public abstract class KitchenStation : MonoBehaviour
{
    public StationType stationType;
    public string stationName;
    public Transform interactPoint;
    public bool isOccupied;

    protected Ingredient currentIngredient;
    protected Timer processingTimer;

    public float processingProgress => processingTimer != null ? processingTimer.Progress : 0f;

    public event Action<KitchenStation> OnStationComplete;

    public abstract bool CanInteract(PlayerController player);
    public abstract void Interact(PlayerController player);

    protected virtual void Update()
    {
        if (processingTimer != null && !processingTimer.IsFinished)
        {
            processingTimer.Tick(Time.deltaTime);
        }
    }

    protected virtual void ProcessItem(float deltaTime)
    {
        if (processingTimer != null && !processingTimer.IsFinished)
        {
            processingTimer.Tick(deltaTime);
        }
    }

    protected void NotifyStationComplete()
    {
        OnStationComplete?.Invoke(this);
    }

    protected virtual void OnDestroy()
    {
        OnStationComplete = null;
    }
}
