using UnityEngine;
using ShadowPlatformer.Mechanics;
using ShadowPlatformer.Player;

namespace ShadowPlatformer.Mechanics
{
    public class MechanismLinker : MonoBehaviour
    {
        public MechanismTrigger[] triggers;
        public MechanismReceiver[] receivers;

        private void Start()
        {
            foreach (var trigger in triggers)
            {
                if (trigger == null) continue;
                trigger.OnActivated += OnTriggerActivated;
                trigger.OnDeactivated += OnTriggerDeactivated;
            }
        }

        private void OnDestroy()
        {
            foreach (var trigger in triggers)
            {
                if (trigger == null) continue;
                trigger.OnActivated -= OnTriggerActivated;
                trigger.OnDeactivated -= OnTriggerDeactivated;
            }
        }

        private void OnTriggerActivated(MechanismTrigger trigger)
        {
            foreach (var receiver in receivers)
            {
                if (receiver != null)
                    receiver.OnTriggerActivated(trigger);
            }
        }

        private void OnTriggerDeactivated(MechanismTrigger trigger)
        {
            foreach (var receiver in receivers)
            {
                if (receiver != null)
                    receiver.OnTriggerDeactivated(trigger);
            }
        }
    }
}
