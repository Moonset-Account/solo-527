#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace BalloonPost.EditorTools
{
    [InitializeOnLoad]
    public static class SceneAutoInitializer
    {
        private const string ScenePath = "Assets/Scenes/Main.unity";
        private const string AutoBuilderGoName = "AutoBuilder";

        static SceneAutoInitializer()
        {
            EditorSceneManager.sceneOpened += OnSceneOpened;
            EditorApplication.delayCall += EnsureSceneSetupOnLoad;
        }

        [MenuItem("BalloonPost/🎈 打开游戏主场景 (Main)", false, 10)]
        public static void OpenMainScene()
        {
            if (!File.Exists(Path.GetFullPath(Path.Combine(Application.dataPath, "..", ScenePath))))
            {
                Debug.LogWarning("[BalloonPost] Main.unity 场景不存在，正在创建...");
                CreateMainScene();
            }
            EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
        }

        [MenuItem("BalloonPost/🔧 修复当前场景 - 自动添加SceneAutoBuilder", false, 20)]
        public static void FixCurrentScene()
        {
            EnsureCurrentSceneHasAutoBuilder();
        }

        private static void EnsureSceneSetupOnLoad()
        {
            var scene = SceneManager.GetActiveScene();
            if (string.IsNullOrEmpty(scene.path) || scene.path != ScenePath)
            {
                if (EditorSceneManager.GetActiveScene().buildIndex == -1 &&
                    EditorSceneManager.sceneCount == 1 &&
                    string.IsNullOrEmpty(EditorSceneManager.GetSceneAt(0).path))
                {
                    return;
                }
                if (File.Exists(Path.GetFullPath(Path.Combine(Application.dataPath, "..", ScenePath))))
                {
                    bool userWantsAuto = EditorPrefs.GetBool("BalloonPost_AutoOpen", true);
                    if (userWantsAuto && EditorSceneManager.GetActiveScene().path != ScenePath)
                    {
                        Debug.Log("[BalloonPost] 检测到项目已加载，你可以点击菜单 BalloonPost → 打开游戏主场景 来开始。");
                    }
                }
                return;
            }
            EnsureCurrentSceneHasAutoBuilder();
        }

        private static void OnSceneOpened(Scene scene, OpenSceneMode mode)
        {
            if (scene.path == ScenePath)
            {
                EditorApplication.delayCall += EnsureCurrentSceneHasAutoBuilder;
            }
        }

        private static void EnsureCurrentSceneHasAutoBuilder()
        {
            var autoGo = GameObject.Find(AutoBuilderGoName);
            if (autoGo == null)
            {
                autoGo = new GameObject(AutoBuilderGoName);
                Debug.Log("[BalloonPost] AutoBuilder GameObject 不存在，已自动创建。");
            }

            var sceneAutoBuilder = autoGo.GetComponent<MonoBehaviour>();
            bool hasScript = false;
            var allComponents = autoGo.GetComponents<Component>();
            foreach (var comp in allComponents)
            {
                if (comp != null && comp.GetType().Name == "SceneAutoBuilder")
                {
                    hasScript = true;
                    break;
                }
            }

            if (!hasScript)
            {
                var scriptType = FindSceneAutoBuilderType();
                if (scriptType != null)
                {
                    autoGo.AddComponent(scriptType);
                    EditorUtility.SetDirty(autoGo);
                    Debug.Log($"[BalloonPost] ✅ 已自动为 {AutoBuilderGoName} 添加 SceneAutoBuilder 组件。按 Play 开始游戏！");
                    MarkSceneDirty();
                }
                else
                {
                    Debug.LogError("[BalloonPost] 找不到 SceneAutoBuilder 脚本。请确保脚本编译通过！");
                }
            }
            else
            {
                Debug.Log("[BalloonPost] ✅ 场景已正确设置。按 Play 开始游戏！");
            }
        }

        private static System.Type FindSceneAutoBuilderType()
        {
            System.Type result = null;
            foreach (var asm in System.AppDomain.CurrentDomain.GetAssemblies())
            {
                try
                {
                    var types = asm.GetTypes();
                    foreach (var t in types)
                    {
                        if (t.Name == "SceneAutoBuilder" && typeof(MonoBehaviour).IsAssignableFrom(t))
                        {
                            result = t;
                            break;
                        }
                    }
                    if (result != null) break;
                }
                catch
                {
                    // 忽略加载失败的程序集
                }
            }
            return result;
        }

        private static void MarkSceneDirty()
        {
            var activeScene = EditorSceneManager.GetActiveScene();
            if (!string.IsNullOrEmpty(activeScene.path))
            {
                EditorSceneManager.MarkSceneDirty(activeScene);
                EditorSceneManager.SaveScene(activeScene);
            }
        }

        private static void CreateMainScene()
        {
            string dir = Path.GetDirectoryName(ScenePath);
            if (!Directory.Exists(Path.GetFullPath(Path.Combine(Application.dataPath, "..", dir))))
            {
                Directory.CreateDirectory(Path.GetFullPath(Path.Combine(Application.dataPath, "..", dir)));
            }
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var go = new GameObject(AutoBuilderGoName);
            EditorSceneManager.SaveScene(scene, ScenePath);
        }
    }
}
#endif
