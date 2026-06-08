using UnityEngine;

namespace LightShadowPlatformer.Runtime
{
    public static class RuntimeAnimationFactory
    {
        private static bool _initialized;

        public static void EnsureAnimators()
        {
            if (_initialized) return;
            _initialized = true;

            var players = Object.FindObjectsOfType<LightShadowPlatformer.Player.PlayerController>();
            for (int i = 0; i < players.Length; i++)
            {
                var p = players[i];
                if (p != null && p.gameObject.GetComponent<Animator>() == null)
                {
                    p.gameObject.AddComponent<Animator>();
                }
            }
        }
    }
}
