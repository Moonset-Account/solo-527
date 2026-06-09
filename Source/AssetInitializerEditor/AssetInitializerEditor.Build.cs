// Copyright (c) 2026 Mountain Rescue Drone Sim
// AssetInitializerEditor Editor 模块 - 启动时自动创建所有必要的 .umap/.uasset 资产
using UnrealBuildTool;

public class AssetInitializerEditor : ModuleRules
{
    public AssetInitializerEditor(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        // ----- 公共依赖（必须） -----
        PublicDependencyModuleNames.AddRange(new string[]
        {
            "Core",
            "CoreUObject",
            "Engine",
            "InputCore",
            "UnrealEd",               // AssetTools, AssetRegistry, BlueprintEditor
            "AssetTools",             // UAssetToolsHelpers, UFactory 创建资产
            "AssetRegistry",          // 注册新资产到Content Browser
            "Blutility",              // EditorUtilityBlueprint
            "UMGEditor",              // WidgetBlueprintFactory
            "BlueprintGraph",         // UBlueprint 基类工厂
            "EnhancedInput",          // InputAction / IMC 工厂
            "EnhancedInputEditor",    // EnhancedInput Editor
            "EditorStyle",            // Slate样式
            "ToolMenus",              // 菜单注册
            "Slate",
            "SlateCore",
            "Projects",               // FPaths::ProjectContentDir
            "Json",
            "JsonUtilities",
            "MountainRescueDrone",    // 我们的游戏模块（拿C++类作为蓝图父类）
        });

        // ----- 私有依赖 -----
        PrivateDependencyModuleNames.AddRange(new string[]
        {
            "MainFrame",              // IMainFrameModule::OnEditorClosed
            "AppFramework",
            "EditorSubsystem",
            "Kismet",                 // UBlueprintEditorLibrary 相关
            "GraphEditor",
            "PropertyEditor",
            "RenderCore",
            "RHI",
        });

        PrivateIncludePaths.AddRange(new string[]
        {
            "AssetInitializerEditor/Public",
            "AssetInitializerEditor/Private"
        });
    }
}
