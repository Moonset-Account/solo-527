using UnrealBuildTool;
using System.Collections.Generic;

public class StickerShopEditorTarget : TargetRules
{
	public StickerShopEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.V4;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_4;
		ExtraModuleNames.AddRange(new string[] { "StickerShop" });
	}
}
