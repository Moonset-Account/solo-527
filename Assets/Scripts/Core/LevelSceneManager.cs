using UnityEngine;

namespace LakeSailing.Core.Legacy
{
    [System.Obsolete("已迁移到 LakeSailing.Bootstrap.LevelSceneManager，请勿使用")]
    public class LevelSceneManager : MonoBehaviour
    {
        private void Awake()
        {
            Debug.LogWarning("[Core/Legacy/LevelSceneManager] 检测到已废弃版本，请使用 Bootstrap 目录下的 LevelSceneManager。此对象将自毁。");
            Destroy(gameObject);
        }
    }
}
