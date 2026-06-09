using UnrealBuildTool;
using System.Collections.Generic;

public class MountainRescueDroneEditorTarget : TargetRules
{
	public MountainRescueDroneEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.V4;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_3;
		ExtraModuleNames.AddRange(new string[]
		{
			"MountainRescueDrone",
			// 🚁 AssetInitializer 编辑器自启动模块：启动时自动创建L_MountainBase+所有蓝图/UMG/Input资产
			"AssetInitializerEditor"
		});
	}
}
