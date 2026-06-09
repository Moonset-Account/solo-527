using UnityEngine;

namespace LakeSailing.Core.Legacy
{
    [System.Obsolete("已迁移到 LakeSailing.Bootstrap.GameBootstrapper，请勿使用")]
    public class GameBootstrapper : MonoBehaviour
    {
        private void Awake()
        {
            Debug.LogWarning("[Core/Legacy/GameBootstrapper] 检测到已废弃版本，请使用 Bootstrap 目录下的 GameBootstrapper。此对象将自毁。");
            Destroy(gameObject);
        }
    }
}
