using System;

[Serializable]
public class CheckpointData
{
    public float timestamp;
    public int score;
    public int ordersCompleted;
    public int activeOrders;
    public int failureCount;
}
