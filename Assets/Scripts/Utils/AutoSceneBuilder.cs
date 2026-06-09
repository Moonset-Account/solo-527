using UnityEngine;

namespace PixelPlantLab
{
    public class AutoSceneBuilder : MonoBehaviour
    {
        public bool AutoBuildOnStart = true;

        private void Start()
        {
            if (AutoBuildOnStart) BuildScene();
        }

        public void BuildScene()
        {
            EnsureDontDestroy<GameManager>("GameManager");
            EnsureDontDestroy<DexManager>("DexManager");
            EnsureDontDestroy<ExperimentLogManager>("ExperimentLogManager");
            EnsureDontDestroy<ResourceManager>("ResourceManager");
            EnsureDontDestroy<QuestManager>("QuestManager");
            EnsureDontDestroy<DailyChallengeManager>("DailyChallengeManager");

            Debug.Log("[PixelPlantLab] 场景核心管理器已初始化。请在Inspector中为GameManager绑定UI组件引用。");
            Debug.Log("[PixelPlantLab] 推荐通过以下步骤构建场景：");
            Debug.Log("  1. 创建Canvas，添加ParameterPanel + 6个Slider（光照/水分/N/P/K/时间）");
            Debug.Log("  2. 添加SampleDisplay（进度条、计时器、结果面板）");
            Debug.Log("  3. 添加DexPanel（图鉴列表、筛选、详情）");
            Debug.Log("  4. 添加ExperimentLogPanel（日志、特征筛选）");
            Debug.Log("  5. 添加QuestAndChallengePanel（3组教程 + 每日挑战 + 资源）");
        }

        private static T EnsureDontDestroy<T>(string goName) where T : MonoBehaviour
        {
            var existing = FindObjectOfType<T>();
            if (existing != null) return existing;
            var go = new GameObject(goName);
            var comp = go.AddComponent<T>();
            DontDestroyOnLoad(go);
            return comp;
        }
    }
}
