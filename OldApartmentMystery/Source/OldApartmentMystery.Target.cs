// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

using UnrealBuildTool;
using System.Collections.Generic;

public class OldApartmentMysteryTarget : TargetRules
{
	public OldApartmentMysteryTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.V5;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_3;
		ExtraModuleNames.Add("OldApartmentMystery");
		bUsesExplicitOrSharedPCHs = true;
		WindowsPlatform.bStrictConformanceMode = true;
	}
}
