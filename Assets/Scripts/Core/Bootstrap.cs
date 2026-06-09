using UnityEngine;

namespace BeatRunner.Core
{
    public class Bootstrap : MonoBehaviour
    {
        [SerializeField] private GameSettings _gameSettings;
        [SerializeField] private RuntimeGameData _runtimeData;

        private void Awake()
        {
            InitializeSystems();
        }

        private void InitializeSystems()
        {
            SaveSystem.LoadSaveData();

            if (_gameSettings == null)
            {
                _gameSettings = GameSettings.Default;
            }

            if (_runtimeData == null)
            {
                _runtimeData = ScriptableObject.CreateInstance<RuntimeGameData>();
            }

            QualitySettings.vSyncCount = 0;
            Application.targetFrameRate = _gameSettings.targetFrameRate;

            Time.fixedDeltaTime = 1f / _gameSettings.physicsFrameRate;

            ServiceLocator.Initialize();
            ServiceLocator.Register(_gameSettings);
            ServiceLocator.Register(_runtimeData);
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void PreInitialize()
        {
            var go = new GameObject("[Bootstrap]");
            DontDestroyOnLoad(go);
            go.AddComponent<Bootstrap>();
        }
    }
}
