using UnityEngine;

[CreateAssetMenu(fileName = "WeatherData", menuName = "Sailing/WeatherData")]
public class WeatherData : ScriptableObject
{
    public WeatherType type;
    public float minWindSpeed = 0f;
    public float maxWindSpeed = 5f;
    [Range(0f, 1f)] public float minVisibility = 0.2f;
    [Range(0f, 1f)] public float maxVisibility = 1f;
    public float minDuration = 30f;
    public float maxDuration = 120f;
    public float transitionDuration = 5f;
    public string ambientAudioClipId;
    public Color fogColor = Color.gray;
    public float fogDensity;
}
