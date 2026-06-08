using UnityEngine;
using Kitchen.Config;

namespace Kitchen.Core
{
    public class PlayerController : MonoBehaviour
    {
        private static System.Reflection.MethodInfo _reportAction;
        public static void TriggerTutorialAction(TutorialAction action, string id = null)
        {
            try
            {
                if (_reportAction == null)
                {
                    System.Type t = System.Type.GetType("Kitchen.UI.TutorialController, Kitchen.UI");
                    if (t != null) _reportAction = t.GetMethod("ReportAction", new[] { typeof(TutorialAction), typeof(string) });
                }
                if (_reportAction != null)
                {
                    UnityEngine.Object[] all = UnityEngine.Object.FindObjectsOfType(System.Type.GetType("Kitchen.UI.TutorialController, Kitchen.UI"));
                    if (all != null && all.Length > 0) _reportAction.Invoke(all[0], new object[] { action, id });
                }
            }
            catch { }
        }

        [Header("Movement")]
        public float moveSpeed = 5f;
        public float rotationSpeed = 10f;
        public float interactRange = 1.5f;
        public LayerMask stationLayer;

        [Header("References")]
        public Transform holdPoint;
        public Renderer bodyRenderer;

        private int playerId;
        private Color playerColor;
        private Vector2 moveInput;
        private bool isControllable = true;
        private bool isHoldingItem;
        private IInteractable currentInteractable;
        private HeldItem heldItem;
        private Rigidbody rb;

        public int PlayerId => playerId;
        public bool IsControllable => isControllable;
        public bool IsHoldingItem => isHoldingItem;
        public HeldItem HeldItem => heldItem;
        public IInteractable CurrentInteractable => currentInteractable;

        private void Awake()
        {
            rb = GetComponent<Rigidbody>();
            if (rb == null) rb = gameObject.AddComponent<Rigidbody>();
            rb.interpolation = RigidbodyInterpolation.Interpolate;
            rb.collisionDetectionMode = CollisionDetectionMode.Continuous;
        }

        public void Initialize(int id, Color color)
        {
            playerId = id;
            playerColor = color;
            if (bodyRenderer != null && bodyRenderer.material != null)
            {
                bodyRenderer.material.color = color;
            }
        }

        public void SetControllable(bool value)
        {
            isControllable = value;
            if (value)
            {
                gameObject.layer = LayerMask.NameToLayer("Default");
            }
        }

        public void SetMoveInput(Vector2 input)
        {
            if (!isControllable) return;
            moveInput = input;
            if (input.sqrMagnitude > 0.01f)
            {
                TriggerTutorialAction(TutorialAction.PressMove);
            }
        }

        public void TryInteract()
        {
            if (!isControllable) return;

            if (currentInteractable != null)
            {
                TriggerTutorialAction(TutorialAction.PressInteract);
                currentInteractable.Interact(this);
            }
            else if (isHoldingItem)
            {
                DropHeldItem();
            }
        }

        public bool PickUpItem(HeldItem item, string tutorialStationId = null)
        {
            if (isHoldingItem) return false;
            isHoldingItem = true;
            heldItem = item;
            item.transform.SetParent(holdPoint);
            item.transform.localPosition = Vector3.zero;
            item.transform.localRotation = Quaternion.identity;
            TriggerTutorialAction(TutorialAction.PickUpIngredient, tutorialStationId);
            return true;
        }

        public HeldItem PlaceItem(string tutorialStationId = null)
        {
            if (!isHoldingItem) return null;
            HeldItem item = heldItem;
            heldItem = null;
            isHoldingItem = false;
            item.transform.SetParent(null);
            TriggerTutorialAction(TutorialAction.PlaceItem, tutorialStationId);
            return item;
        }

        private void DropHeldItem()
        {
            TriggerTutorialAction(TutorialAction.DiscardItem);
            if (!isHoldingItem) return;
            heldItem.transform.SetParent(null);
            heldItem = null;
            isHoldingItem = false;
        }

        private void FixedUpdate()
        {
            if (!isControllable || rb == null) return;

            Vector3 movement = new Vector3(moveInput.x, 0f, moveInput.y) * moveSpeed * Time.fixedDeltaTime;
            rb.MovePosition(rb.position + movement);

            if (moveInput.sqrMagnitude > 0.01f)
            {
                Quaternion targetRotation = Quaternion.LookRotation(new Vector3(moveInput.x, 0f, moveInput.y));
                rb.MoveRotation(Quaternion.Slerp(rb.rotation, targetRotation, rotationSpeed * Time.fixedDeltaTime));
            }
        }

        private void Update()
        {
            DetectNearbyInteractable();
        }

        private void DetectNearbyInteractable()
        {
            Collider[] hits = Physics.OverlapSphere(transform.position, interactRange, stationLayer);
            IInteractable closest = null;
            float minDist = float.MaxValue;

            foreach (var hit in hits)
            {
                var interactable = hit.GetComponent<IInteractable>();
                if (interactable == null) continue;
                float dist = Vector3.Distance(transform.position, hit.transform.position);
                if (dist < minDist)
                {
                    minDist = dist;
                    closest = interactable;
                }
            }

            if (currentInteractable != closest)
            {
                if (currentInteractable?.IsHighlighted ?? false) currentInteractable.SetHighlight(false, this);
                currentInteractable = closest;
                currentInteractable?.SetHighlight(true, this);
            }
        }

        private void OnDrawGizmosSelected()
        {
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(transform.position, interactRange);
        }
    }

    public interface IInteractable
    {
        void Interact(PlayerController player);
        void SetHighlight(bool highlighted, PlayerController player);
        bool IsHighlighted { get; }
    }
}
