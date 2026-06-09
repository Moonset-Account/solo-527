using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using DecorMatch3.Core;
using DecorMatch3.UI;
using DecorMatch3.Utils;

namespace DecorMatch3.Scenes
{
    public class SceneStarter : MonoBehaviour
    {
        [SerializeField] public string TargetSceneName = "MainMenu";
        [SerializeField] public float DelaySeconds = 0.5f;
        [SerializeField] public bool UseAsyncLoad = true;

        private IEnumerator Start()
        {
            yield return new WaitForSecondsRealtime(DelaySeconds);

            if (UIManager.Instance != null)
            {
                UIManager.Instance.ShowLoadingScreen(true, "正在进入游戏...");
            }

            if (UseAsyncLoad)
            {
                AsyncOperation asyncOp = SceneManager.LoadSceneAsync(TargetSceneName, LoadSceneMode.Single);
                asyncOp.allowSceneActivation = false;

                float timer = 0f;
                while (!asyncOp.isDone)
                {
                    timer += Time.unscaledDeltaTime;
                    float progress = Mathf.Clamp01(asyncOp.progress / 0.9f);
                    if (UIManager.Instance != null)
                    {
                        UIManager.Instance.UpdateLoadingProgress(progress);
                    }

                    if (asyncOp.progress >= 0.9f && timer > 0.5f)
                    {
                        asyncOp.allowSceneActivation = true;
                    }
                    yield return null;
                }
            }
            else
            {
                SceneManager.LoadScene(TargetSceneName, LoadSceneMode.Single);
            }
        }
    }
}
