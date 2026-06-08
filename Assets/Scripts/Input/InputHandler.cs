using UnityEngine;

namespace InkMountainBridge
{
    public class InputHandler : MonoBehaviour
    {
        [SerializeField] private BridgeBuilder bridgeBuilder;
        [SerializeField] private new Camera camera;
        [SerializeField] private float inputCooldown = 0.1f;

        private float lastInputTime;
        private bool isDragging;
        private Vector2 dragStart;

        private void Update()
        {
            if (Time.unscaledTime - lastInputTime < inputCooldown) return;

            HandleMouseInput();
            HandleTouchInput();
            HandleMaterialSwitch();
            HandleUtilityKeys();
        }

        private void HandleMouseInput()
        {
            if (camera == null) return;

            Vector2 worldPos = camera.ScreenToWorldPoint(Input.mousePosition);

            if (Input.GetMouseButtonDown(0))
            {
                isDragging = true;
                dragStart = worldPos;
                RecordInput("DragStart", dragStart);
            }

            if (Input.GetMouseButtonUp(0) && isDragging)
            {
                isDragging = false;
                if (bridgeBuilder != null)
                {
                    bridgeBuilder.PlaceElement(dragStart, worldPos);
                }
                RecordInput("PlaceElement", worldPos);
                lastInputTime = Time.unscaledTime;
            }

            if (Input.GetMouseButtonDown(1))
            {
                RaycastHit2D hit = Physics2D.Raycast(worldPos, Vector2.zero);
                if (hit.collider != null)
                {
                    BridgeElement element = hit.collider.GetComponent<BridgeElement>();
                    if (element != null && bridgeBuilder != null)
                    {
                        bridgeBuilder.RemoveElement(element);
                        RecordInput("RemoveElement", worldPos);
                        lastInputTime = Time.unscaledTime;
                    }
                }
            }
        }

        private void HandleTouchInput()
        {
            if (Input.touchCount == 0) return;

            Touch touch = Input.GetTouch(0);
            Vector2 worldPos = camera.ScreenToWorldPoint(touch.position);

            if (touch.phase == TouchPhase.Began)
            {
                isDragging = true;
                dragStart = worldPos;
                RecordInput("DragStart", dragStart);
            }

            if (touch.phase == TouchPhase.Ended && isDragging)
            {
                isDragging = false;
                if (bridgeBuilder != null)
                {
                    bridgeBuilder.PlaceElement(dragStart, worldPos);
                }
                RecordInput("PlaceElement", worldPos);
                lastInputTime = Time.unscaledTime;
            }
        }

        private void HandleMaterialSwitch()
        {
            MaterialType? nextMaterial = null;

            if (Input.GetAxis("Mouse ScrollWheel") > 0f || Input.GetKeyDown(KeyCode.Alpha1))
                nextMaterial = MaterialType.Beam;
            else if (Input.GetAxis("Mouse ScrollWheel") < 0f || Input.GetKeyDown(KeyCode.Alpha2))
                nextMaterial = MaterialType.Rope;
            else if (Input.GetKeyDown(KeyCode.Alpha3))
                nextMaterial = MaterialType.StonePier;

            if (nextMaterial.HasValue && bridgeBuilder != null)
            {
                bridgeBuilder.SelectMaterial(nextMaterial.Value);
                RecordInput("SwitchMaterial", transform.position);
                lastInputTime = Time.unscaledTime;
            }
        }

        private void HandleUtilityKeys()
        {
            if (Input.GetKeyDown(KeyCode.R))
            {
                GameEvents.OnInputRecorded?.Invoke(new InputRecord
                {
                    timestamp = System.DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    action = "Retry",
                    position = Vector2.zero,
                    materialType = MaterialType.Beam,
                    levelId = 0
                });
                lastInputTime = Time.unscaledTime;
            }

            if (Input.GetKeyDown(KeyCode.Escape))
            {
                GameEvents.OnInputRecorded?.Invoke(new InputRecord
                {
                    timestamp = System.DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    action = "Pause",
                    position = Vector2.zero,
                    materialType = MaterialType.Beam,
                    levelId = 0
                });
                lastInputTime = Time.unscaledTime;
            }
        }

        private void RecordInput(string action, Vector2 position)
        {
            GameEvents.OnInputRecorded?.Invoke(new InputRecord
            {
                timestamp = System.DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                action = action,
                position = position,
                materialType = bridgeBuilder != null ? bridgeBuilder.CurrentMaterial : MaterialType.Beam,
                levelId = 0
            });
        }
    }
}
