using UnityEngine;

namespace LakeSailing.Core.Legacy
{
    [System.Obsolete("已迁移到 LakeSailing.Bootstrap.SceneInitializer，请勿使用")]
    public class SceneInitializer : MonoBehaviour
    {
        [SerializeField] public bool autoBoot = true;

        private void Awake()
        {
            Debug.LogWarning("[Core/Legacy/SceneInitializer] 检测到已废弃版本，请使用 Bootstrap 目录下的 SceneInitializer。此对象将自毁。");
            Destroy(gameObject);
        }
    }
}
