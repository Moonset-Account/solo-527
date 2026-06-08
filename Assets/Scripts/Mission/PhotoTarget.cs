using UnityEngine;

public class PhotoTarget : MonoBehaviour
{
    public string targetId;
    public float detectionRadius = 5f;
    public float optimalAngle = 0f;
    public float angleTolerance = 45f;
    public float optimalDistance = 8f;
    public float distanceTolerance = 4f;
    public ParticleSystem highlightEffect;
    public GameObject highlightRing;
    public string collectionItemId;

    private bool _isHighlighted;
    private Transform _boatTransform;

    public bool IsHighlighted => _isHighlighted;

    private void Start()
    {
        if (highlightRing != null)
            highlightRing.SetActive(false);
    }

    private void Update()
    {
        if (_boatTransform == null)
        {
            var boat = FindObjectOfType<BoatController>();
            if (boat != null) _boatTransform = boat.transform;
            return;
        }

        Vector2 targetPos2D = new Vector2(transform.position.x, transform.position.z);
        Vector2 boatPos2D = new Vector2(_boatTransform.position.x, _boatTransform.position.z);
        float distance = Vector2.Distance(targetPos2D, boatPos2D);

        bool inRange = distance <= detectionRadius;

        if (inRange && !_isHighlighted)
        {
            _isHighlighted = true;
            OnHighlightStart();
        }
        else if (!inRange && _isHighlighted)
        {
            _isHighlighted = false;
            OnHighlightEnd();
        }
    }

    public PhotoQuality CalculatePhotoQuality(Vector2 boatPos, float boatHeading)
    {
        Vector2 targetPos2D = new Vector2(transform.position.x, transform.position.z);
        float distance = Vector2.Distance(targetPos2D, boatPos);

        float distanceScore = 1f - Mathf.Clamp01(Mathf.Abs(distance - optimalDistance) / distanceTolerance);

        Vector2 toTarget = (targetPos2D - boatPos).normalized;
        float angleToTarget = Mathf.Atan2(toTarget.y, toTarget.x) * Mathf.Rad2Deg;
        float angleDiff = Mathf.DeltaAngle(boatHeading, angleToTarget);
        float angleScore = 1f - Mathf.Clamp01(Mathf.Abs(angleDiff - optimalAngle) / angleTolerance);

        WeatherState weather = WeatherSystem.Instance.GetCurrentState();
        float visibilityScore = weather.visibility;

        float rawQuality = (distanceScore * 0.4f + angleScore * 0.3f + visibilityScore * 0.3f);
        return EvaluateQuality(rawQuality);
    }

    private PhotoQuality EvaluateQuality(float raw)
    {
        if (raw >= 0.85f) return PhotoQuality.Perfect;
        if (raw >= 0.65f) return PhotoQuality.Great;
        if (raw >= 0.4f) return PhotoQuality.Good;
        if (raw >= 0.2f) return PhotoQuality.Fair;
        return PhotoQuality.Poor;
    }

    private void OnHighlightStart()
    {
        if (highlightRing != null) highlightRing.SetActive(true);
        if (highlightEffect != null && !highlightEffect.isEmitting) highlightEffect.Play();
        GameEvents.TriggerPhotoTargetInRange(targetId);
    }

    private void OnHighlightEnd()
    {
        if (highlightRing != null) highlightRing.SetActive(false);
        if (highlightEffect != null && highlightEffect.isEmitting) highlightEffect.Stop();
        GameEvents.TriggerPhotoTargetOutOfRange(targetId);
    }

    private void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.cyan;
        Gizmos.DrawWireSphere(transform.position, detectionRadius);
        Gizmos.color = Color.green;
        Gizmos.DrawWireSphere(transform.position, optimalDistance);
    }
}

public enum PhotoQuality
{
    Poor,
    Fair,
    Good,
    Great,
    Perfect
}
