using UnrealBuildTool;

public class StickerShop : ModuleRules
{
	public StickerShop(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = ModuleRules.PCHUsageMode.UseExplicitOrSharedPCHs;

		PublicDependencyModuleNames.AddRange(new string[]
		{
			"Core",
			"CoreUObject",
			"Engine",
			"UMG",
			"UMGEditor",
			"Slate",
			"SlateCore",
			"GameplayTags",
			"DeveloperSettings"
		});

		PrivateDependencyModuleNames.AddRange(new string[]
		{
			"InputCore",
			"EnhancedInput"
		});

		PublicIncludePaths.AddRange(new string[] { "StickerShop/Public" });
		PrivateIncludePaths.AddRange(new string[] { "StickerShop/Private" });
	}
}
