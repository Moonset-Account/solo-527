// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

using UnrealBuildTool;
using System.Collections.Generic;

public class OldApartmentMysteryEditorTarget : TargetRules
{
	public OldApartmentMysteryEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.V5;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_3;
		ExtraModuleNames.Add("OldApartmentMystery");
		bUsesExplicitOrSharedPCHs = true;
		WindowsPlatform.bStrictConformanceMode = true;
	}
}
