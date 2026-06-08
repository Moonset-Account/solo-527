// Copyright (c) 2026. Old Apartment Mystery. All Rights Reserved.

using UnrealBuildTool;

public class OldApartmentMystery : ModuleRules
{
	public OldApartmentMystery(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
		PublicDependencyModuleNames.AddRange(new string[]
		{
			"Core",
			"CoreUObject",
			"Engine",
			"InputCore",
			"EnhancedInput",
			"UMG",
			"Slate",
			"SlateCore",
			"Json",
			"JsonUtilities",
			"AudioMixer",
			"LevelStreamer"
		});
		PrivateDependencyModuleNames.AddRange(new string[] { "HeadMountedDisplay" });
		PublicIncludePaths.AddRange(new string[] { "OldApartmentMystery/Public" });
	}
}
