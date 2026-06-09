using UnrealBuildTool;
using System.Collections.Generic;

public class OldApartmentMysteryTarget : TargetRules
{
	public OldApartmentMysteryTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.V2;
		IncludeOrderVersion = EngineIncludeOrderVersion.Unreal5_3;
		ExtraModuleNames.AddRange(new string[] { "OldApartmentMystery" });

		// ---------- Build Environment ----------
		WindowsPlatform.TargetedSDKArchitecture = UnrealTargetArchitecture.x64;

		bUsesSteam = false;
		bUseLoggingInShipping = true;
		bUseChecksInShipping = true;

		// ---------- LTO for faster shipping builds
		bWithOodleData = true;
		bWithOodleNetwork = false;
		bUseLoggingInShipping = true;
		bUseChecksInShipping = true;
	}

	// ---------- Target Configuration Override per-config settings
	public override void ConfigureGlobalEnvironment(UEBuildTarget InTarget,
		TargetInfo TargetInfo,
		TargetConfiguration Configuration)
	{
		base.ConfigureGlobalEnvironment(InTarget, TargetInfo, Configuration);

		if (Configuration == TargetConfiguration.Shipping)
		{
			// Remove all debug facilities in the build for Shipping
			bUseLoggingInShipping = true; // Keep logging for BETA telemetry
			bUseChecksInShipping = false;
			bWithTraceLog = true;
			bUseMallocProfiler = false;
			bUseMallocProfiler = false;
		}
	}
}
