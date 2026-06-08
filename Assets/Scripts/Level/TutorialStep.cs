using UnityEngine;
using System;

[Serializable]
public class TutorialStep
{
    public int stepIndex;
    public string description;
    public StationType targetStationType;
    public string requiredAction;
    public bool isCompleted;
    public Vector2 highlightPosition;
    public float highlightRadius;
}
