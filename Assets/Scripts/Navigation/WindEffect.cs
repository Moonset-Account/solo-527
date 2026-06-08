using UnityEngine;

namespace LakeNavigation
{
    public static class WindEffect
    {
        public static float GetSpeedMultiplier(Vector2 moveDirection, Vector2 windDirection, float windSpeed)
        {
            float moveMagnitude = moveDirection.magnitude;
            float windMagnitude = windDirection.magnitude;

            if (moveMagnitude < 0.001f || windMagnitude < 0.001f)
                return 1f;

            Vector2 normalizedMove = moveDirection / moveMagnitude;
            float dot = Vector2.Dot(normalizedMove, windDirection.normalized);

            float multiplier;
            if (dot > 0.01f)
            {
                multiplier = 1f + 0.3f * dot * windSpeed / 10f;
            }
            else if (dot < -0.01f)
            {
                multiplier = 1f + 0.4f * dot * windSpeed / 10f;
            }
            else
            {
                multiplier = 0.95f;
            }

            return Mathf.Clamp(multiplier, 0.3f, 1.8f);
        }

        public static float GetFuelConsumptionMultiplier(Vector2 moveDirection, Vector2 windDirection, float windSpeed)
        {
            float moveMagnitude = moveDirection.magnitude;
            float windMagnitude = windDirection.magnitude;

            if (moveMagnitude < 0.001f || windMagnitude < 0.001f)
                return 1f;

            Vector2 normalizedMove = moveDirection / moveMagnitude;
            float dot = Vector2.Dot(normalizedMove, windDirection.normalized);

            float multiplier;
            if (dot < -0.01f)
            {
                multiplier = 1.5f;
            }
            else if (dot > 0.01f)
            {
                multiplier = 0.8f;
            }
            else
            {
                multiplier = 1f;
            }

            return Mathf.Clamp(multiplier, 0.6f, 2.5f);
        }

        public static Vector2 GetDriftVector(Vector2 windDirection, float windSpeed)
        {
            return windDirection * windSpeed * 0.01f;
        }
    }
}
