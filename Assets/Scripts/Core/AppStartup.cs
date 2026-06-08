using UnityEngine;

public class AppStartup : MonoBehaviour
{
    [SerializeField] private bool startOnAwake = true;

    private void Awake()
    {
        if (!startOnAwake) return;

        GameObject root = new GameObject("[AppRoot]");
        DontDestroyOnLoad(root);

        GameObject managerObj = new GameObject("Managers");
        managerObj.transform.SetParent(root.transform);
        managerObj.AddComponent<GameManager>();
        managerObj.AddComponent<LevelManager>();
        managerObj.AddComponent<OrderManager>();
        managerObj.AddComponent<ScoringManager>();
        managerObj.AddComponent<PlayerManager>();
        managerObj.AddComponent<StationManager>();
        managerObj.AddComponent<AudioManager>();
        managerObj.AddComponent<AnalyticsManager>();
        managerObj.AddComponent<DebugLogger>();
        managerObj.AddComponent<LevelProgression>();
        managerObj.AddComponent<GameBootstrapper>();

        GameObject gameObj = new GameObject("Game");
        gameObj.transform.SetParent(root.transform);
        gameObj.AddComponent<GameOrchestrator>();

        Camera mainCam = Camera.main;
        if (mainCam == null)
        {
            GameObject camObj = new GameObject("Main Camera");
            camObj.transform.SetParent(root.transform);
            camObj.tag = "MainCamera";
            mainCam = camObj.AddComponent<Camera>();
            mainCam.orthographic = true;
            mainCam.orthographicSize = 5f;
            camObj.AddComponent<AudioListener>();
            camObj.transform.position = new Vector3(0f, 0f, -10f);
        }
        else
        {
            mainCam.orthographic = true;
            mainCam.orthographicSize = 5f;
        }

        Destroy(gameObject);
    }
}
