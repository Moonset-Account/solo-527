using System.Collections;
using UnityEngine;
using ShadowPlatformer.Level;
using ShadowPlatformer.Player;
using ShadowPlatformer.Light;
using ShadowPlatformer.Core;

namespace ShadowPlatformer.Game
{
    public class LevelSceneBootstrapper : MonoBehaviour
    {
        public LevelDataLoader dataLoader;
        public LevelBuilder levelBuilder;
        public string levelId;

        private IEnumerator Start()
        {
            while (LevelManager.Instance == null)
                yield return null;

            LevelManager.Instance.StartLevel(levelId);

            var layout = dataLoader?.LoadLayout(levelId);
            if (layout != null && levelBuilder != null)
            {
                levelBuilder.BuildLevel(layout);

                if (LightManager.Instance != null)
                    LightManager.Instance.SetDirection(layout.startLightDirection);

                var player = FindObjectOfType<PlayerController>();
                if (player != null)
                    player.SetSpawnPoint(layout.playerSpawn);
            }

            GameManager.Instance.SetGameMode(GameMode.Playing);
        }
    }
}
