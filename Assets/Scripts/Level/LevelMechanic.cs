using UnityEngine;
using System.Collections.Generic;
using System;

public abstract class LevelMechanic : MonoBehaviour
{
    public string mechanicName;
    public bool isActive;

    public abstract void Activate();
    public abstract void Deactivate();
    public abstract void Tick(float deltaTime);
}

public class ConveyorBeltMechanic : LevelMechanic
{
    public float conveyorSpeed;
    public Vector2 direction = Vector2.right;
    private List<Transform> itemsOnBelt = new List<Transform>();

    public override void Activate()
    {
        isActive = true;
    }

    public override void Deactivate()
    {
        isActive = false;
        itemsOnBelt.Clear();
    }

    public override void Tick(float deltaTime)
    {
        if (!isActive) return;

        foreach (var item in itemsOnBelt)
        {
            if (item != null)
            {
                item.Translate(direction * conveyorSpeed * deltaTime);
            }
        }
    }

    public void AddItem(Transform item)
    {
        if (!itemsOnBelt.Contains(item))
        {
            itemsOnBelt.Add(item);
        }
    }

    public void RemoveItem(Transform item)
    {
        itemsOnBelt.Remove(item);
    }
}

public class RotatingObstacleMechanic : LevelMechanic
{
    public float moveSpeed;
    public float moveRange;
    public Vector2 constraintPosition;
    private float currentOffset;

    public override void Activate()
    {
        isActive = true;
        currentOffset = 0f;
    }

    public override void Deactivate()
    {
        isActive = false;
    }

    public override void Tick(float deltaTime)
    {
        if (!isActive) return;

        currentOffset += moveSpeed * deltaTime;
        float offset = Mathf.Sin(currentOffset) * moveRange;
        transform.position = new Vector3(constraintPosition.x + offset, constraintPosition.y, transform.position.z);
        transform.Rotate(0f, 0f, moveSpeed * deltaTime * 60f);
    }
}

public class TimeWarpMechanic : LevelMechanic
{
    public float timeScale = 1.5f;
    public float duration = 10f;
    private Timer warpTimer;

    public override void Activate()
    {
        isActive = true;
        warpTimer = new Timer(duration);
        warpTimer.Start();
    }

    public override void Deactivate()
    {
        isActive = false;
        timeScale = 1f;
    }

    public override void Tick(float deltaTime)
    {
        if (!isActive) return;

        warpTimer.Tick(deltaTime);
        if (warpTimer.IsFinished)
        {
            Deactivate();
        }
    }

    public void SetTimeWarp(float scale, float warpDuration)
    {
        timeScale = scale;
        duration = warpDuration;
        warpTimer = new Timer(duration);
        warpTimer.Start();
    }
}
