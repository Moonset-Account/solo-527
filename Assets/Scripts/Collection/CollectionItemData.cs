using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "CollectionItemData", menuName = "Sailing/CollectionItemData")]
public class CollectionItemData : ScriptableObject
{
    public string itemId;
    public string displayName;
    [TextArea] public string description;
    public string loreText;
    public CollectionCategory category;
    public string iconPath;
    public string modelPath;
    public string unlockAudioId;
    public List<string> relatedItemIds = new List<string>();
    public int rarity;
    public string requiredMissionId;
    public string requiredPhotoTargetId;
}

public enum CollectionCategory
{
    Wildlife,
    Landmark,
    Weather,
    Flora,
    ShipType,
    Special
}
