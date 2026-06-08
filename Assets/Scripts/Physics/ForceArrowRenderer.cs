using UnityEngine;
using System.Collections.Generic;

namespace InkMountainBridge
{
    public class ForceArrowRenderer : MonoBehaviour
    {
        [SerializeField] private GameObject arrowPrefab;
        [SerializeField] private float maxArrowLength = 3f;
        [SerializeField] private bool showCompression = true;
        [SerializeField] private bool showTension = true;
        [SerializeField] private bool showWind = true;

        private List<GameObject> activeArrows = new List<GameObject>();

        public void UpdateArrows(Dictionary<BridgeElement, Vector2> forces)
        {
            ClearArrows();

            if (arrowPrefab == null || forces == null) return;

            foreach (var kvp in forces)
            {
                BridgeElement element = kvp.Key;
                Vector2 force = kvp.Value;

                if (element == null || element.IsBroken) continue;

                float magnitude = force.magnitude;
                if (magnitude < 0.01f) continue;

                bool isCompression = force.y < 0f;
                bool isTension = force.y > 0f;
                bool isWind = Mathf.Abs(force.x) > Mathf.Abs(force.y);

                if (isCompression && !showCompression) continue;
                if (isTension && !showTension) continue;
                if (isWind && !showWind) continue;

                GameObject arrow = Instantiate(arrowPrefab, element.transform.position, Quaternion.identity, transform);

                Vector2 direction = force.normalized;
                float arrowLength = Mathf.Min(magnitude / 10f, maxArrowLength);

                arrow.transform.localScale = new Vector3(arrowLength, arrowLength, 1f);

                float angle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg;
                arrow.transform.rotation = Quaternion.Euler(0f, 0f, angle);

                SpriteRenderer renderer = arrow.GetComponent<SpriteRenderer>();
                if (renderer != null)
                {
                    if (isWind) renderer.color = Color.cyan;
                    else if (isCompression) renderer.color = Color.red;
                    else renderer.color = Color.blue;
                }

                activeArrows.Add(arrow);
            }
        }

        public void ClearArrows()
        {
            foreach (var arrow in activeArrows)
            {
                if (arrow != null) Destroy(arrow);
            }
            activeArrows.Clear();
        }

        private void OnDestroy()
        {
            ClearArrows();
        }
    }
}
