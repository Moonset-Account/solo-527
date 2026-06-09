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
            EditorApplication.delayCall += () =>
            {
                // 静默修复：如果当前就是Main场景，确保有SceneAutoBuilder组件
                var scene = SceneManager.GetActiveScene();
                if (scene.path == ScenePath) EnsureCurrentSceneHasAutoBuilder(save: true);
            };
        }

        [MenuItem("BalloonPost/🎈 1. 打开游戏主场景 (Main)", false, 10)]
        public static void OpenMainScene()
        {
            if (!File.Exists(Path.GetFullPath(Path.Combine(Application.dataPath, "..", ScenePath))))
            {
                Debug.LogWarning("[BalloonPost] Main.unity 不存在，正在自动创建...");
                CreateMainScene();
            }
            EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            EditorApplication.delayCall += () => EnsureCurrentSceneHasAutoBuilder(save: true);
        }

        [MenuItem("BalloonPost/🔧 2. 永久保存 SceneAutoBuilder 到 Main.unity (关键)", false, 20)]
        public static void InjectSceneAutoBuilderToScene()
        {
            var scene = EditorSceneManager.GetActiveScene();
            bool isMain = scene.path == ScenePath;
            if (!isMain)
            {
                if (EditorUtility.DisplayDialog("切换场景",
                    "当前不是Main.unity场景，需要先打开并保存Main.unity才能把SceneAutoBuilder永久写入场景。是否继续？",
                    "继续", "取消"))
                {
                    OpenMainScene();
                    EditorApplication.delayCall += () =>
                    {
                        EnsureCurrentSceneHasAutoBuilder(save: true);
                        ShowDoneDialog();
                    };
                    return;
                }
                return;
            }
            EnsureCurrentSceneHasAutoBuilder(save: true);
            ShowDoneDialog();
        }

        [MenuItem("BalloonPost/📖 3. 打开README说明", false, 90)]
        public static void ShowReadmeDialog()
        {
            EditorUtility.DisplayDialog("🎈 热气球邮差 - Unity启动说明",
                "启动方式（任选其一）：\n\n" +
                "🚀 方式1（最快，零配置）：任何场景下直接点 ▶ Play\n" +
                "   原理：[RuntimeInitializeOnLoadMethod] 在Play时自动创建SceneAutoBuilder\n\n" +
                "✅ 方式2（推荐，永久保存）：执行菜单 BalloonPost → 🔧 永久保存 SceneAutoBuilder 到 Main.unity\n" +
                "   然后打开 Assets/Scenes/Main.unity → 点 Play\n\n" +
                "两种方式Play后都会自动出现：\n" +
                "  ⬡ 星格地图（点击交互）\n" +
                "  📋 合同队列 / ⭐ 路线评分 / 📚 教程\n" +
                "  ↩ 撤销 / 🔒 锁定+改路线（扣1时间2燃料）\n" +
                "  💾 保存 / 📂 载入存档\n" +
                "  📊 结算复盘弹窗（完成后显示）\n\n" +
                "相机操作：WASD平移 / QE或滚轮缩放",
                "知道了");
        }

        private static void ShowDoneDialog()
        {
            EditorUtility.DisplayDialog("✅ 完成！",
                "SceneAutoBuilder 组件已永久写入 Main.unity！\n\n" +
                "现在你可以：\n" +
                "① 打开 Assets/Scenes/Main.unity（菜单第1项）\n" +
                "② 看Inspector里AutoBuilder对象已经挂了SceneAutoBuilder组件\n" +
                "③ 点 ▶ Play → 所有功能立刻出现并可操作",
                "去点Play");
        }

        private static void OnSceneOpened(Scene scene, OpenSceneMode mode)
        {
            if (scene.path == ScenePath)
            {
                EditorApplication.delayCall += () => EnsureCurrentSceneHasAutoBuilder(save: false);
            }
        }

        private static void EnsureCurrentSceneHasAutoBuilder(bool save)
        {
            var autoGo = GameObject.Find(AutoBuilderGoName);
            if (autoGo == null)
            {
                autoGo = new GameObject(AutoBuilderGoName);
                Debug.Log("[BalloonPost] AutoBuilder GameObject 不存在，已创建。");
            }

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
                    Undo.AddComponent(autoGo, scriptType);
                    EditorUtility.SetDirty(autoGo);
                    Debug.Log($"[BalloonPost] ✅ 已添加 SceneAutoBuilder 组件到 {AutoBuilderGoName}。{(save ? "场景已保存" : "未保存，请Ctrl+S保存场景")}");
                    if (save) MarkSceneDirty();
                }
                else
                {
                    Debug.LogError("[BalloonPost] 找不到 SceneAutoBuilder 脚本，请先等脚本编译通过！");
                }
            }
            else
            {
                Debug.Log("[BalloonPost] ✅ 场景已正确配置：AutoBuilder对象上已有SceneAutoBuilder组件。");
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
                AssetDatabase.SaveAssets();
                AssetDatabase.Refresh();
            }
        }

        private static void CreateMainScene()
        {
            string dir = Path.GetDirectoryName(ScenePath);
            if (!Directory.Exists(Path.GetFullPath(Path.Combine(Application.dataPath, "..", dir))))
            {
                Directory.CreateDirectory(Path.GetFullPath(Path.Combine(Application.dataPath, "..", dir)));
                AssetDatabase.Refresh();
            }
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var go = new GameObject(AutoBuilderGoName);
            Undo.RegisterCreatedObjectUndo(go, "Create AutoBuilder");
            EditorSceneManager.SaveScene(scene, ScenePath);
            Debug.Log("[BalloonPost] ✅ 已创建空 Main.unity 场景");
        }
    }
}
#endif
