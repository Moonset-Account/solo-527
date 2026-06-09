using UnrealBuildTool;
using System.Collections.Generic;

public class MountainRescueDroneEditorTarget : TargetRules
{
	public MountainRescueDroneEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.V4;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_3;
		ExtraModuleNames.AddRange( new string[] { "MountainRescueDrone" } );
	}
}
