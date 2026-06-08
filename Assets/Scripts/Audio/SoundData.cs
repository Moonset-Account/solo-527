using UnityEngine;

[CreateAssetMenu(fileName = "SoundData", menuName = "Kitchen/SoundData")]
public class SoundData : ScriptableObject
{
    public string soundName;
    public AudioClip clip;
    public float volume = 1f;
    public float pitch = 1f;
    public bool loop;
    public SoundCategory category;
}

public enum SoundCategory
{
    Music,
    SFX,
    UI
}
