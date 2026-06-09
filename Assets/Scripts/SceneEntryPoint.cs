using UnityEngine;

namespace BeatRunner
{
    public class SceneEntryPoint : MonoBehaviour
    {
        [SerializeField] private GameManager _gameManagerPrefab;

        private void Awake()
        {
            if (GameManager.Instance != null) return;

            if (_gameManagerPrefab != null)
            {
                Instantiate(_gameManagerPrefab);
            }
            else
            {
                var go = new GameObject("[GameManager]");
                go.AddComponent<GameManager>();
            }

            var boot = FindObjectOfType<Core.Bootstrap>();
            if (boot == null)
            {
                var bootGo = new GameObject("[Bootstrap]");
                bootGo.AddComponent<Core.Bootstrap>();
            }
        }
    }
}
