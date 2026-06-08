using UnityEngine;
using System.Collections.Generic;
using System;

[Serializable]
public class SpatialConstraint
{
    public string constraintName;
    public ConstraintType constraintType;
    public Vector2 position;
    public Vector2 size;
    public float moveSpeed;
    public float moveRange;

    public enum ConstraintType
    {
        BlockedArea,
        NarrowPassage,
        MovingObstacle
    }

    public bool IsBlocked(Vector2 point)
    {
        Vector2 halfSize = size * 0.5f;
        Vector2 min = position - halfSize;
        Vector2 max = position + halfSize;
        return point.x >= min.x && point.x <= max.x && point.y >= min.y && point.y <= max.y;
    }
}
