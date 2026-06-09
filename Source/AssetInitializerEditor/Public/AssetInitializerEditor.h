// Copyright (c) 2026 Mountain Rescue Drone Sim
// Editor 模块头：编辑器启动时自动创建所有必需的 .umap/.uasset 资产
#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"
#include "Modules/ModuleInterface.h"

class FToolBarBuilder;
class FMenuBuilder;
class FUICommandList;

/**
 * AssetInitializerEditor 模块 - 编辑器启动时自检并自动创建全部缺失资产
 *   - 创建 L_MountainBase.umap 关卡 + 布置Actor
 *   - 创建 11个 蓝图子类（BP_Drone/BP_GameMode/BP_HUD/...）
 *   - 创建 6个 UMG Widget 蓝图
 *   - 创建 10个 InputAction + 1个 IMC
 *   - 创建 DataTable + 配置 GameMode 中的 3个救援目标/物资/天气/盲区
 *   - 最后写入 DefaultEngine.ini，下次启动直接进入关卡
 */
class FAssetInitializerEditorModule : public IModuleInterface
{
public:
    // ----- IModuleInterface 接口 -----
    virtual void StartupModule() override;
    virtual void ShutdownModule() override;

    // ----- 单例访问 -----
    static FAssetInitializerEditorModule& Get();
    static bool IsAvailable();

    /** 执行一次完整的资产初始化（检查是否存在，不存在则创建） */
    void EnsureAllAssetsCreated();

    /** 返回：true=所有资产已就绪 false=仍有缺失（请重启编辑器） */
    bool IsAssetReady() const { return bAllAssetsReady; }

protected:
    // ----- 编辑器事件绑定 -----
    void HandleOnPostEngineInit();       // 引擎初始化完成后触发
    void HandleOnModulesChanged(FName ModuleName, EModuleChangeReason Reason);

    // ----- 子步骤：每项独立创建，失败不影响其它 -----
    bool Step_CreateFolderStructure();
    bool Step_CreateInputActions();
    bool Step_CreateBlueprints();
    bool Step_CreateUMGWidgets();
    bool Step_CreateLevelAndActors();
    bool Step_ConfigureBlueprintDefaults();
    bool Step_CreateDataTable();
    bool Step_WriteIniOverrides();
    bool Step_VerifyAllOnDisk();

private:
    /** 是否已执行过初始化（防止重复） */
    bool bInitialized = false;
    /** 最终所有资产是否都在磁盘上 */
    bool bAllAssetsReady = false;
    /** 延迟初始化的Ticker句柄 */
    FDelegateHandle PostEngineInitHandle;

    /** 创建单个蓝图子类的工具函数 */
    UObject* CreateBlueprintAsset(const FString& Folder, const FString& BPName,
                                   UClass* ParentClass, bool& bOutCreated);

    /** 创建单个UMG Widget蓝图的工具函数 */
    UObject* CreateWidgetAsset(const FString& Folder, const FString& WidgetName,
                                bool& bOutCreated);

    /** 创建单个InputAction资产的工具函数 */
    UObject* CreateInputActionAsset(const FString& Name,
                                      EInputActionValueType ValueType,
                                      bool& bOutCreated);

    /** 检查磁盘文件是否存在 */
    static bool FileExistsOnDisk(const FString& RelativeContentPath);
};
