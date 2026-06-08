using UnityEngine;
using Kitchen.Core;
using Kitchen.Save;
using Kitchen.Performance;
using Kitchen.Input;
using Kitchen.Gameplay;
using Kitchen.Levels;
using Kitchen.UI;

namespace Kitchen.Setup
{
    public class GameBootstrap : MonoBehaviour
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void PreBootstrap()
        {
            QualitySettings.vSyncCount = 1;
            Application.targetFrameRate = 60;
            Application.runInBackground = false;
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void AutoBoot()
        {
            if (FindObjectOfType<RuntimeGameBuilder>() != null) return;
            if (FindObjectOfType<GameManager>() != null) return;

            GameObject go = new GameObject("~RuntimeGameBuilder");
            go.AddComponent<RuntimeGameBuilder>();
        }

        private void Awake()
        {
            if (FindObjectOfType<RuntimeGameBuilder>() == null)
            {
                GameObject go = new GameObject("~RuntimeGameBuilder");
                go.AddComponent<RuntimeGameBuilder>();
            }
            Destroy(this);
        }
    }
}
