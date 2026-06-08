using UnityEngine;
using System;

[Serializable]
public class StationLayoutEntry
{
    public StationType stationType;
    public Vector3 position;
    public float rotation;
    public string stationName;
    public bool isLocked;
}
