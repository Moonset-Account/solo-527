using UnrealBuildTool;

public class OldApartmentMysteryModule : ModuleRules
{
	public OldApartmentMysteryModule(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_3;
		bEnableExceptions = true;

		PublicDependencyModuleNames.AddRange(new string[]
	{
		"Core",
		"CoreUObject",
		"Engine",
		"InputCore",
		"EnhancedInput",
		"Slate",
		"SlateCore",
		"UMG",
		"Json",
		"JsonUtilities",
		"GameplayTags",
		"Niagara",
		"LevelSequence",
		"MovieScene",
		"MovieSceneTracks",
		"CinematicCamera",
		"AudioModulation",
		"MetasoundEngine",
		"CommonUI",
		"CommonInput",
		"StructUtils",
		"ModelingComponents"
	});

	PrivateDependencyModuleNames.AddRange(new string[]
	{
		"AIModule",
		"NavigationSystem",
		"RenderCore",
		"Renderer",
		"RHI",
		"Projects",
		"DeveloperSettings"
	});
}
