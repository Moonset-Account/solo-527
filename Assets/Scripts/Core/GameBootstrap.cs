using UnityEngine;

namespace Kitchen.Core
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
    }
}
