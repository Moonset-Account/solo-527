using UnityEngine;
using System;

namespace ShadowPlatformer.Core
{
    public class EventBus
    {
        private static EventBus _instance;
        public static EventBus Instance => _instance ??= new EventBus();

        private EventBus() { }

        public event Action OnPlayerDeath;
        public event Action OnPlayerRespawn;
        public event Action<string> OnLevelStarted;
        public event Action<string> OnLevelCompleted;
        public event Action OnLightSwitched;
        public event Action OnCheckpointReached;
        public event Action OnMechanismActivated;
        public event Action OnPauseToggled;

        public void RaisePlayerDeath() => OnPlayerDeath?.Invoke();
        public void RaisePlayerRespawn() => OnPlayerRespawn?.Invoke();
        public void RaiseLevelStarted(string id) => OnLevelStarted?.Invoke(id);
        public void RaiseLevelCompleted(string id) => OnLevelCompleted?.Invoke(id);
        public void RaiseLightSwitched() => OnLightSwitched?.Invoke();
        public void RaiseCheckpointReached() => OnCheckpointReached?.Invoke();
        public void RaiseMechanismActivated() => OnMechanismActivated?.Invoke();
        public void RaisePauseToggled() => OnPauseToggled?.Invoke();
    }
}
