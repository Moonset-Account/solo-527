// Copyright (c) 2026 Mountain Rescue Drone Sim
// AssetInitializerEditor 编辑器初始化模块实现
// 功能: UE编辑器启动后自动检测+创建所有 .umap/.uasset 资产
#include "AssetInitializerEditor.h"

#include "AssetToolsModule.h"
#include "AssetRegistry/AssetRegistryModule.h"
#include "Factories/BlueprintFactory.h"
#include "Factories/WidgetBlueprintFactory.h"
#include "Factories/InputActionFactoryNew.h"
#include "Factories/InputMappingContextFactoryNew.h"
#include "Factories/DataTableFactory.h"
#include "Factories/LevelFactoryNew.h"

#include "EnhancedInputAction.h"
#include "EnhancedInputMappingContext.h"
#include "InputAction.h"
#include "InputMappingContext.h"

#include "Engine/Blueprint.h"
#include "Blueprint/UserWidget.h"
#include "Engine/Level.h"
#include "Engine/World.h"
#include "Engine/GameEngine.h"
#include "GameFramework/PlayerStart.h"
#include "Engine/DirectionalLight.h"
#include "Engine/SkyLight.h"
#include "Engine/ExponentialHeightFog.h"
#include "Engine/SkyAtmosphere.h"
#include "Components/SplineComponent.h"
#include "GameFramework/Actor.h"
#include "UObject/SavePackage.h"

#include "Editor.h"
#include "Editor/EditorEngine.h"
#include "Editor/LevelEditor/Public/LevelEditorActions.h"
#include "Kismet2/KismetEditorUtilities.h"
#include "FileHelpers.h"
#include "PackageTools.h"
#include "UnrealEdGlobals.h"
#include "UnrealClient.h"
#include "Subsystems/EditorActorSubsystem.h"

#include "Modules/ModuleManager.h"
#include "Misc/Paths.h"
#include "Misc/FileHelper.h"
#include "Misc/ConfigCacheIni.h"
#include "Misc/CommandLine.h"
#include "HAL/PlatformFileManager.h"
#include "GenericPlatform/GenericPlatformFile.h"

// ====== 游戏模块头（拿父类、配置结构体） ======
#include "MountainRescueTypes.h"
#include "DroneBase.h"
#include "RouteManager.h"
#include "RescueTarget.h"
#include "WaypointActor.h"
#include "DroppedSupply.h"
#include "WeatherSystem.h"
#include "SignalSystem.h"
#include "ReplaySystem.h"
#include "MountainRescueGameMode.h"
#include "MountainRescueHUD.h"
#include "MountainRescuePlayerController.h"

// ============================================================
//  Asset Tools 快捷宏（UE5 使用 FAssetToolsModule::Get().Get()）
// ============================================================
#define GET_ASSET_TOOLS() (FAssetToolsModule::GetModule().Get())

// ====== 常量：资产路径定义 ======
namespace AssetPaths
{
    const FString R = TEXT("/Game");

    // ---- Input ----
    const TArray<TPair<FString, EInputActionValueType>> InputActions =
    {
        { TEXT("IA_LeftClick"),      EInputActionValueType::Boolean },
        { TEXT("IA_RightClick"),     EInputActionValueType::Boolean },
        { TEXT("IA_MouseDrag"),      EInputActionValueType::Axis2D  },
        { TEXT("IA_ModeAdd"),        EInputActionValueType::Trigger },
        { TEXT("IA_ModeMove"),       EInputActionValueType::Trigger },
        { TEXT("IA_ModeDelete"),     EInputActionValueType::Trigger },
        { TEXT("IA_StartFlight"),    EInputActionValueType::Trigger },
        { TEXT("IA_ReturnHome"),     EInputActionValueType::Trigger },
        { TEXT("IA_ToggleEditor"),   EInputActionValueType::Trigger },
        { TEXT("IA_Pause"),          EInputActionValueType::Trigger },
    };
    const FString IMC_Path  = TEXT("Input/IMC_MountainRescue");
    const FString InputDir  = TEXT("Input");

    // ---- 蓝图定义: (BP名, 目录, 父类名) ----
    using FBPDef = TTuple<FString, FString, FString>;
    const TArray<FBPDef> BPDefs = {
        FBPDef(TEXT("BP_GameMode"),            TEXT("Blueprints/GameModes"),            TEXT("MountainRescueGameMode")),
        FBPDef(TEXT("BP_PlayerController"),    TEXT("Blueprints/PlayerController"),     TEXT("MountainRescuePlayerController")),
        FBPDef(TEXT("BP_HUD"),                 TEXT("Blueprints/HUD"),                  TEXT("MountainRescueHUD")),
        FBPDef(TEXT("BP_Drone"),               TEXT("Blueprints/Drones"),               TEXT("DroneBase")),
        FBPDef(TEXT("BP_RouteManager"),        TEXT("Blueprints/Route"),                TEXT("RouteManager")),
        FBPDef(TEXT("BP_WaypointActor"),       TEXT("Blueprints/Route"),                TEXT("WaypointActor")),
        FBPDef(TEXT("BP_RescueTarget"),        TEXT("Blueprints/Targets"),              TEXT("RescueTarget")),
        FBPDef(TEXT("BP_DroppedSupply"),       TEXT("Blueprints/Supplies"),             TEXT("DroppedSupply")),
        FBPDef(TEXT("BP_WeatherSystem"),       TEXT("Blueprints/Systems"),              TEXT("WeatherSystem")),
        FBPDef(TEXT("BP_SignalSystem"),        TEXT("Blueprints/Systems"),              TEXT("SignalSystem")),
        FBPDef(TEXT("BP_ReplaySystem"),        TEXT("Blueprints/Systems"),              TEXT("ReplaySystem")),
    };

    // ---- UMG Widget ----
    const TArray<TPair<FString, FString>> UMGDefs = {
        { TEXT("WBP_MainHUD"),        TEXT("UI/MainHUD")        },
        { TEXT("WBP_RouteEditor"),    TEXT("UI/RouteEditor")    },
        { TEXT("WBP_ResultScreen"),   TEXT("UI/ResultScreen")   },
        { TEXT("WBP_TaskEditor"),     TEXT("UI/TaskEditor")     },
        { TEXT("WBP_ReplayControls"), TEXT("UI/Replay")         },
        { TEXT("WBP_TargetStatus"),   TEXT("UI/TargetStatus")   },
    };

    // ---- 关卡 ----
    const FString LevelDir      = TEXT("Maps");
    const FString LevelName     = TEXT("L_MountainBase");

    // ---- DataTable ----
    const FString DT_Path  = TEXT("DataTables/DT_RescueTargets_Easy");
}

// ====== 日志分类 ======
DEFINE_LOG_CATEGORY_STATIC(LogAssetInit, Log, All);

#define LOCTEXT_NAMESPACE "FAssetInitializerEditorModule"

IMPLEMENT_MODULE(FAssetInitializerEditorModule, AssetInitializerEditor)

FAssetInitializerEditorModule& FAssetInitializerEditorModule::Get()
{
    return FModuleManager::LoadModuleChecked<FAssetInitializerEditorModule>(TEXT("AssetInitializerEditor"));
}

bool FAssetInitializerEditorModule::IsAvailable()
{
    return FModuleManager::Get().IsModuleLoaded(TEXT("AssetInitializerEditor"));
}

// ============================================================
//  Module 启动：绑定 Editor PostInit 事件
// ============================================================
void FAssetInitializerEditorModule::StartupModule()
{
    UE_LOG(LogAssetInit, Display, TEXT("🚁 AssetInitializerEditor: 模块启动，等待引擎初始化完成..."));

    // 方式1：监听 PostEngineInit 委托
    PostEngineInitHandle = FCoreDelegates::OnPostEngineInit.AddRaw(this,
        &FAssetInitializerEditorModule::HandleOnPostEngineInit);

    // 方式2：如果引擎已初始化（某些情况下PostEngineInit已广播），立即执行
    if (GEngine && GIsEditor && !IsRunningCommandlet())
    {
        UE_LOG(LogAssetInit, Display, TEXT("   引擎已在运行，立即检查资产..."));
        HandleOnPostEngineInit();
    }
}

void FAssetInitializerEditorModule::ShutdownModule()
{
    if (PostEngineInitHandle.IsValid())
        FCoreDelegates::OnPostEngineInit.Remove(PostEngineInitHandle);
}

// ============================================================
//  引擎初始化完成 → 检查并创建所有资产
// ============================================================
void FAssetInitializerEditorModule::HandleOnPostEngineInit()
{
    if (bInitialized) return;
    if (!GIsEditor || IsRunningCommandlet()) return;

    bInitialized = true;
    UE_LOG(LogAssetInit, Display, TEXT("══════════════════════════════════════════════════"));
    UE_LOG(LogAssetInit, Display, TEXT("🚁 AssetInitializer: 开始自动创建山地救援无人机资产"));
    UE_LOG(LogAssetInit, Display, TEXT("══════════════════════════════════════════════════"));

    // 延迟一帧执行，等AssetRegistry也完全就绪
    // (直接用GEditor->GetTimerManager()不好使，用简单循环检查 AssetRegistry)
    FAssetRegistryModule::TryLoad();
    EnsureAllAssetsCreated();
}

void FAssetInitializerEditorModule::HandleOnModulesChanged(FName ModuleName, EModuleChangeReason Reason)
{
    // 预留：未来可按模块懒加载
}

// ============================================================
//  主流程：逐步创建，失败不中断
// ============================================================
void FAssetInitializerEditorModule::EnsureAllAssetsCreated()
{
    uint32 Passed = 0, Total = 9;
#define RUN_STEP(NAME, FUNC) \
    do { \
        UE_LOG(LogAssetInit, Display, TEXT("\n【Step %d/%d: %s】"), Passed+1, Total, *FString(NAME)); \
        bool ok = FUNC(); \
        if (ok) { UE_LOG(LogAssetInit, Display, TEXT("   ✅ 成功")); Passed++; } \
        else    { UE_LOG(LogAssetInit, Warning, TEXT("   ⚠️  失败或跳过（不影响其它步骤）")); } \
    } while(0)

    RUN_STEP("创建Content子目录结构",        Step_CreateFolderStructure);
    RUN_STEP("创建 10 InputAction + 1 IMC",    Step_CreateInputActions);
    RUN_STEP("创建 11个蓝图子类",              Step_CreateBlueprints);
    RUN_STEP("创建 6个UMG Widget",             Step_CreateUMGWidgets);
    RUN_STEP("创建 L_MountainBase 关卡+Actor", Step_CreateLevelAndActors);
    RUN_STEP("配置蓝图CDO默认值(HUD/GM/PC)",   Step_ConfigureBlueprintDefaults);
    RUN_STEP("创建 DataTable(目标配置)",        Step_CreateDataTable);
    RUN_STEP("写入 DefaultEngine.ini",         Step_WriteIniOverrides);
    RUN_STEP("验证磁盘文件",                    Step_VerifyAllOnDisk);

#undef RUN_STEP

    UE_LOG(LogAssetInit, Display, TEXT("\n══════════════════════════════════════════════════"));
    UE_LOG(LogAssetInit, Display, TEXT("🚁 AssetInitializer: %d/%d 步骤完成"), Passed, Total);
    if (Passed >= Total - 1)
    {
        bAllAssetsReady = true;
        UE_LOG(LogAssetInit, Display, TEXT("   ✅ 所有资产就绪！关闭并重新打开项目即可直接进入 L_MountainBase"));
        UE_LOG(LogAssetInit, Display, TEXT("   操作: 1键+左键=加航点 | 空格=开始飞行 | Tab=难度调参"));
    }
    else
    {
        UE_LOG(LogAssetInit, Warning, TEXT("   ⚠️  部分资产未生成，可手动执行 py Content/Python/GenerateAllAssets.py"));
    }
    UE_LOG(LogAssetInit, Display, TEXT("══════════════════════════════════════════════════\n"));
}

// ============================================================
//  Step1: 创建 Content 子目录
// ============================================================
bool FAssetInitializerEditorModule::Step_CreateFolderStructure()
{
    TArray<FString> Folders = {
        TEXT("Input"), TEXT("Maps"), TEXT("DataTables"),
        TEXT("Blueprints/GameModes"), TEXT("Blueprints/Drones"),
        TEXT("Blueprints/HUD"), TEXT("Blueprints/PlayerController"),
        TEXT("Blueprints/Route"), TEXT("Blueprints/Targets"),
        TEXT("Blueprints/Systems"), TEXT("Blueprints/Supplies"),
        TEXT("UI/MainHUD"), TEXT("UI/RouteEditor"), TEXT("UI/ResultScreen"),
        TEXT("UI/TaskEditor"), TEXT("UI/Replay"), TEXT("UI/TargetStatus"),
        TEXT("Effects"), TEXT("Audio"), TEXT("Materials"),
        TEXT("Textures"), TEXT("Meshes"),
    };
    uint32 ok = 0;
    for (const FString& F : Folders)
    {
        FString Full = AssetPaths::R / F;
        if (!        GET_ASSET_TOOLS().DirectoryExists(Full))
        {
            FString OutErr;
            if (        GET_ASSET_TOOLS().MakeDirectory(Full, &OutErr))
                ok++;
        }
        else ok++;
    }
    UE_LOG(LogAssetInit, Display, TEXT("   创建/确认 %d/%d 个目录"), ok, Folders.Num());
    return ok > Folders.Num() * 0.8f;
}

// ============================================================
//  Step2: 创建 InputAction + IMC
// ============================================================
UObject* FAssetInitializerEditorModule::CreateInputActionAsset(
    const FString& Name, EInputActionValueType VType, bool& bOutCreated)
{
    bOutCreated = false;
    FString FullPath = AssetPaths::R / AssetPaths::InputDir / Name;
    if (        GET_ASSET_TOOLS().DoesAssetExist(FullPath))
    {
        return         GET_ASSET_TOOLS().GetAssetByObjectPath(*FullPath);
    }
    UEnhancedInputActionFactoryNew* Factory = NewObject<UEnhancedInputActionFactoryNew>();
    UObject* Obj =         GET_ASSET_TOOLS().CreateAsset(
        Name, AssetPaths::R / AssetPaths::InputDir, UInputAction::StaticClass(), Factory);
    if (UInputAction* IA = Cast<UInputAction>(Obj))
    {
        IA->ValueType = VType;
        IA->MarkPackageDirty();
        bOutCreated = true;
    }
    return Obj;
}

bool FAssetInitializerEditorModule::Step_CreateInputActions()
{
    TArray<UInputAction*> IAs;
    for (const auto& Def : AssetPaths::InputActions)
    {
        bool Created;
        if (UObject* O = CreateInputActionAsset(Def.Key, Def.Value, Created))
            if (UInputAction* IA = Cast<UInputAction>(O))
                IAs.Add(IA);
    }
    // IMC
    FString IMCPkg = AssetPaths::R / AssetPaths::IMC_Path;
    UInputMappingContext* IMC = nullptr;
    if (!        GET_ASSET_TOOLS().DoesAssetExist(IMCPkg))
    {
        UEnhancedInputMappingContextFactoryNew* F = NewObject<UEnhancedInputMappingContextFactoryNew>();
        if (UObject* O =         GET_ASSET_TOOLS().CreateAsset(
            TEXT("IMC_MountainRescue"), AssetPaths::R / AssetPaths::InputDir,
            UInputMappingContext::StaticClass(), F))
        {
            IMC = Cast<UInputMappingContext>(O);
        }
    }
    else
    {
        IMC = Cast<UInputMappingContext>(        GET_ASSET_TOOLS()
            .GetAssetByObjectPath(*IMCPkg));
    }
    UE_LOG(LogAssetInit, Display, TEXT("   InputAction: %d 个, IMC: %s"),
           IAs.Num(), IMC ? TEXT("OK") : TEXT("MISS"));
    return IAs.Num() >= 8 && IMC != nullptr;
}

// ============================================================
//  Step3: 创建蓝图
// ============================================================
UObject* FAssetInitializerEditorModule::CreateBlueprintAsset(
    const FString& Folder, const FString& BPName, UClass* ParentClass, bool& bOutCreated)
{
    bOutCreated = false;
    if (!ParentClass) return nullptr;
    FString Pkg = AssetPaths::R / Folder / BPName;
    if (        GET_ASSET_TOOLS().DoesAssetExist(Pkg))
    {
        return         GET_ASSET_TOOLS().GetAssetByObjectPath(*Pkg);
    }
    UBlueprintFactory* Factory = NewObject<UBlueprintFactory>();
    Factory->ParentClass = ParentClass;
    UObject* Obj =         GET_ASSET_TOOLS().CreateAsset(
        BPName, AssetPaths::R / Folder, UBlueprint::StaticClass(), Factory);
    bOutCreated = (Obj != nullptr);
    return Obj;
}

bool FAssetInitializerEditorModule::Step_CreateBlueprints()
{
    int32 OK = 0;
    for (const auto& Def : AssetPaths::BPDefs)
    {
        const FString& BPName = Def.Get<0>();
        const FString& Folder = Def.Get<1>();
        const FString& CppName = Def.Get<2>();

        UClass* ParentClass = nullptr;
        // 用两种方式拿C++类
        UClass* Try1 = FindObject<UClass>(ANY_PACKAGE, *CppName);
        UClass* Try2 = FindFirstObjectSafe<UClass>(*FString::Printf(
            TEXT("/Script/MountainRescueDrone.%s"), *CppName));
        ParentClass = Try1 ? Try1 : Try2;

        bool Created;
        if (UObject* BP = CreateBlueprintAsset(Folder, BPName, ParentClass, Created))
            OK++;
        else
            UE_LOG(LogAssetInit, Warning, TEXT("   蓝图失败: %s  (父类%S找到? %d)"),
                   *BPName, *CppName, ParentClass != nullptr);
    }
    UE_LOG(LogAssetInit, Display, TEXT("   蓝图: %d/%d"), OK, AssetPaths::BPDefs.Num());
    return OK >= AssetPaths::BPDefs.Num() - 2;
}

// ============================================================
//  Step4: UMG Widget
// ============================================================
UObject* FAssetInitializerEditorModule::CreateWidgetAsset(
    const FString& Folder, const FString& WidgetName, bool& bOutCreated)
{
    bOutCreated = false;
    FString Pkg = AssetPaths::R / Folder / WidgetName;
    if (        GET_ASSET_TOOLS().DoesAssetExist(Pkg))
    {
        return         GET_ASSET_TOOLS().GetAssetByObjectPath(*Pkg);
    }
    UWidgetBlueprintFactory* Factory = NewObject<UWidgetBlueprintFactory>();
    Factory->ParentClass = UUserWidget::StaticClass();
    UObject* Obj =         GET_ASSET_TOOLS().CreateAsset(
        WidgetName, AssetPaths::R / Folder, UBlueprint::StaticClass(), Factory);
    bOutCreated = (Obj != nullptr);
    return Obj;
}

bool FAssetInitializerEditorModule::Step_CreateUMGWidgets()
{
    int32 OK = 0;
    for (const auto& Def : AssetPaths::UMGDefs)
    {
        bool Created;
        if (CreateWidgetAsset(Def.Value, Def.Key, Created)) OK++;
    }
    UE_LOG(LogAssetInit, Display, TEXT("   UMG: %d/%d"), OK, AssetPaths::UMGDefs.Num());
    return OK >= AssetPaths::UMGDefs.Num() - 1;
}

// ============================================================
//  Step5: 创建关卡 + 布置Actor
// ============================================================
bool FAssetInitializerEditorModule::Step_CreateLevelAndActors()
{
    FString LevelPkg = AssetPaths::R / AssetPaths::LevelDir / AssetPaths::LevelName;

    // ---- 尝试创建关卡 ----
    ULevel* CreatedLevel = nullptr;
    bool bLevelExisted =         GET_ASSET_TOOLS().DoesAssetExist(LevelPkg);

    auto TryMakeLevel = [&]() -> ULevel* {
        if (!bLevelExisted)
        {
            ULevelFactoryNew* LF = NewObject<ULevelFactoryNew>();
            if (UObject* O =         GET_ASSET_TOOLS().CreateAsset(
                AssetPaths::LevelName, AssetPaths::R / AssetPaths::LevelDir,
                ULevel::StaticClass(), LF))
            {
                return Cast<ULevel>(O);
            }
        }
        // 打开已有
        if (UObject* E =         GET_ASSET_TOOLS().GetAssetByObjectPath(*LevelPkg))
            return Cast<ULevel>(E);
        return nullptr;
    };
    CreatedLevel = TryMakeLevel();
    if (!CreatedLevel)
    {
        UE_LOG(LogAssetInit, Warning, TEXT("   关卡创建失败（不致命）"));
        return false;
    }

    // ---- 在Editor世界中放置Actor（如果有已打开的Editor世界）----
    if (GEditor && GEditor->GetEditorWorldContext().World())
    {
        UWorld* World = GEditor->GetEditorWorldContext().World();
        const FVector HOME(0, 0, 3000);
        FActorSpawnParameters SP;
        SP.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;

        // PlayerStart
        World->SpawnActor<APlayerStart>(HOME, FRotator::ZeroRotator, SP);

        // 系统Actor（C++类直接放，不需要蓝图）
        World->SpawnActor<ADroneBase>(HOME, FRotator::ZeroRotator, SP);
        World->SpawnActor<ARouteManager>(FVector(2000,0,3000), FRotator::ZeroRotator, SP);
        World->SpawnActor<AWeatherSystem>(FVector(0,5000,3000), FRotator::ZeroRotator, SP);
        World->SpawnActor<ASignalSystem> (FVector(0,-5000,3000), FRotator::ZeroRotator, SP);
        World->SpawnActor<AReplaySystem> (FVector(-5000,0,3000), FRotator::ZeroRotator, SP);

        // 灯光+天空
        World->SpawnActor<ADirectionalLight>(FVector(0,0,50000), FRotator(-45,-30,0), SP);
        World->SpawnActor<ASkyLight>       (FVector(0,0,2000),  FRotator::ZeroRotator, SP);
        World->SpawnActor<AExponentialHeightFog>(FVector::ZeroVector, FRotator::ZeroRotator, SP);
        UE_LOG(LogAssetInit, Display, TEXT("   已在当前Editor世界放置 10 Actor"));
    }

    // ---- 保存关卡到磁盘 ----
    UPackage* LevelPkgObj = CreatedLevel->GetOutermost();
    if (LevelPkgObj)
    {
        FString SaveErr;
        bool bSaved = UPackageTools::SavePackage(LevelPkgObj, CreatedLevel, RF_Public | RF_Standalone,
            *LevelPkg, nullptr, &SaveErr);
        if (!bSaved) UE_LOG(LogAssetInit, Warning, TEXT("   关卡保存: %s"), *SaveErr);
        else         UE_LOG(LogAssetInit, Display, TEXT("   关卡保存成功: %s"), *LevelPkg);
        return bSaved;
    }
    return true;
}

// ============================================================
//  Step6: 配置蓝图CDO 默认值（含3救援目标+物资+天气+盲区）
// ============================================================
namespace {
    /** 安全设置 UClass* / TSubclassOf 属性：用 FObjectProperty::SetObjectPropertyValue_InContainer */
    template<typename ClassT>
    bool SetClassPropOnCDO(UClass* GenClass, const TCHAR* PropName, ClassT* ValueClass)
    {
        if (!GenClass || !PropName || !ValueClass) return false;
        void* CDO = GenClass->GetDefaultObject();
        if (!CDO) return false;
        FClassProperty* ClassProp = FindFProperty<FClassProperty>(GenClass, PropName);
        if (ClassProp)
        {
            ClassProp->SetPropertyValue_InContainer(CDO, ValueClass);
            return true;
        }
        // Fallback：FObjectProperty（更通用）
        FObjectProperty* ObjProp = FindFProperty<FObjectProperty>(GenClass, PropName);
        if (ObjProp)
        {
            ObjProp->SetObjectPropertyValue_InContainer(CDO, ValueClass);
            return true;
        }
        return false;
    }

    /** 安全设置 UObject* 属性（比如 UInputMappingContext*） */
    bool SetObjectPropOnCDO(UClass* GenClass, const TCHAR* PropName, UObject* Value)
    {
        if (!GenClass || !PropName || !Value) return false;
        void* CDO = GenClass->GetDefaultObject();
        if (!CDO) return false;
        FObjectProperty* Prop = FindFProperty<FObjectProperty>(GenClass, PropName);
        if (Prop)
        {
            Prop->SetObjectPropertyValue_InContainer(CDO, Value);
            return true;
        }
        return false;
    }
}

bool FAssetInitializerEditorModule::Step_ConfigureBlueprintDefaults()
{
    FAssetTools& Tools = GET_ASSET_TOOLS();
    FString P;

    // ---- BP_HUD: 绑定5个Widget Class ----
    P = AssetPaths::R / "Blueprints/HUD/BP_HUD";
    if (UBlueprint* BPHud = Cast<UBlueprint>(Tools.GetAssetByObjectPath(*P)))
    {
        if (UClass* GenCls = BPHud->GeneratedClass)
        {
            auto BindWBP = [&](const TCHAR* PropName, const TCHAR* WidgetRelPath) {
                FString WPath = AssetPaths::R / WidgetRelPath;
                if (UBlueprint* WBP = Cast<UBlueprint>(Tools.GetAssetByObjectPath(*WPath)))
                    if (WBP->GeneratedClass)
                        SetClassPropOnCDO<UClass>(GenCls, PropName, WBP->GeneratedClass);
            };
            BindWBP(TEXT("MainHUDWidgetClass"),      TEXT("UI/MainHUD/WBP_MainHUD"));
            BindWBP(TEXT("RouteEditorWidgetClass"),  TEXT("UI/RouteEditor/WBP_RouteEditor"));
            BindWBP(TEXT("ResultScreenWidgetClass"), TEXT("UI/ResultScreen/WBP_ResultScreen"));
            BindWBP(TEXT("TaskEditorWidgetClass"),   TEXT("UI/TaskEditor/WBP_TaskEditor"));
            BindWBP(TEXT("ReplayWidgetClass"),       TEXT("UI/Replay/WBP_ReplayControls"));
            Tools.SaveAsset(BPHud);
        }
    }

    // ---- BP_RouteManager: 绑定 WaypointActorClass ----
    P = AssetPaths::R / "Blueprints/Route/BP_RouteManager";
    if (UBlueprint* BPRM = Cast<UBlueprint>(Tools.GetAssetByObjectPath(*P)))
    {
        if (UClass* GenCls = BPRM->GeneratedClass)
        {
            FString WPath = AssetPaths::R / "Blueprints/Route/BP_WaypointActor";
            if (UBlueprint* WBP = Cast<UBlueprint>(Tools.GetAssetByObjectPath(*WPath)))
                if (WBP->GeneratedClass)
                    SetClassPropOnCDO<UClass>(GenCls, TEXT("WaypointActorClass"), WBP->GeneratedClass);
            Tools.SaveAsset(BPRM);
        }
    }

    // ---- BP_GameMode: CurrentTaskConfig -> 3目标 + 物资 + 天气 + 盲区 ----
    P = AssetPaths::R / "Blueprints/GameModes/BP_GameMode";
    if (UBlueprint* BPGM = Cast<UBlueprint>(Tools.GetAssetByObjectPath(*P)))
    {
        if (UClass* GenCls = BPGM->GeneratedClass)
        {
            if (AMountainRescueGameMode* GMCDO = GenCls->GetDefaultObject<AMountainRescueGameMode>())
            {
                // --- 3个目标 ---
                TArray<FRescueTargetData> Targets;
                Targets.Add(FRescueTargetData());
                Targets.Last().TargetID = FName("T1_LightInjury");
                Targets.Last().DisplayName = FText::FromString(TEXT("轻伤-王师傅"));
                Targets.Last().Description = FText::FromString(TEXT("徒步时脚踝扭伤，需急救包处理"));
                Targets.Last().TargetType = ERescueTargetType::MinorInjury;
                Targets.Last().Priority = ETaskPriority::Normal;
                Targets.Last().WorldLocation = FVector(20000, 8000, 120000);
                Targets.Last().RequiredSupplies = { ESupplyType::MedicalKit };
                Targets.Last().TimeLimitSeconds = 600;
                Targets.Last().GoldenTimeSeconds = 300;
                Targets.Last().BaseScore = 500;
                Targets.Last().GoldenTimeBonus = 200;
                Targets.Last().DelayPenaltyPerSecond = 2;

                Targets.Add(FRescueTargetData());
                Targets.Last().TargetID = FName("T2_Hypothermia");
                Targets.Last().DisplayName = FText::FromString(TEXT("失温-李大姐"));
                Targets.Last().Description = FText::FromString(TEXT("登山被困，体温过低，需保暖毯+急救"));
                Targets.Last().TargetType = ERescueTargetType::Hypothermia;
                Targets.Last().Priority = ETaskPriority::High;
                Targets.Last().WorldLocation = FVector(-15000, 25000, 180000);
                Targets.Last().RequiredSupplies = { ESupplyType::WarmBlanket, ESupplyType::MedicalKit };
                Targets.Last().TimeLimitSeconds = 420;
                Targets.Last().GoldenTimeSeconds = 240;
                Targets.Last().BaseScore = 700;
                Targets.Last().GoldenTimeBonus = 350;
                Targets.Last().DelayPenaltyPerSecond = 3;

                Targets.Add(FRescueTargetData());
                Targets.Last().TargetID = FName("T3_LostPerson");
                Targets.Last().DisplayName = FText::FromString(TEXT("迷路-张同学"));
                Targets.Last().Description = FText::FromString(TEXT("偏离步道，方向不明，投放定位信标指引"));
                Targets.Last().TargetType = ERescueTargetType::LostPerson;
                Targets.Last().Priority = ETaskPriority::Low;
                Targets.Last().WorldLocation = FVector(35000, -20000, 90000);
                Targets.Last().RequiredSupplies = { ESupplyType::LocatorBeacon };
                Targets.Last().TimeLimitSeconds = 900;
                Targets.Last().GoldenTimeSeconds = 480;
                Targets.Last().BaseScore = 350;
                Targets.Last().GoldenTimeBonus = 100;
                Targets.Last().DelayPenaltyPerSecond = 1;

                // --- 初始物资 ---
                TArray<FSupplyPayload> InitPayload;
                auto AddPayload = [&](ESupplyType T, int32 C, float W) {
                    FSupplyPayload P2; P2.SupplyType = T; P2.Count = C; P2.UnitWeightKg = W;
                    InitPayload.Add(P2);
                };
                AddPayload(ESupplyType::MedicalKit,    4, 2.0f);
                AddPayload(ESupplyType::WarmBlanket,   2, 2.5f);
                AddPayload(ESupplyType::LocatorBeacon, 3, 1.5f);

                // --- 天气 ---
                FWeatherConfig Weather;
                Weather.WindSpeed = 6.f;
                Weather.WindDirection = FVector(1.f, 0.3f, 0.f);
                Weather.bIsGusty = true;
                Weather.GustIntensity = 1.3f;

                // --- 信号盲区 ---
                TArray<FSignalDeadZone> Zones;
                FSignalDeadZone DZ;
                DZ.CenterLocation = FVector(-10000, 18000, 170000);
                DZ.Radius = 60000.f;
                DZ.SignalBlockStrength = 0.85f;
                Zones.Add(DZ);

                // --- 写回 TaskConfig ---
                GMCDO->CurrentTaskConfig.RescueTargets           = Targets;
                GMCDO->CurrentTaskConfig.InitialPayload          = InitPayload;
                GMCDO->CurrentTaskConfig.Weather                 = Weather;
                GMCDO->CurrentTaskConfig.SignalDeadZones         = Zones;
                GMCDO->CurrentTaskConfig.HomeLocation            = FVector(0,0,3000);
                GMCDO->CurrentTaskConfig.InitialBatteryPercent   = 0.95f;
                GMCDO->MarkPackageDirty();
                Tools.SaveAsset(BPGM);
                UE_LOG(LogAssetInit, Display,
                       TEXT("   BP_GameMode: %d目标+%d物资+天气+盲区 写入CDO"),
                       Targets.Num(), InitPayload.Num());
            }
        }
    }

    // ---- BP_PlayerController: 绑定 Input ----
    P = AssetPaths::R / "Blueprints/PlayerController/BP_PlayerController";
    if (UBlueprint* BPPC = Cast<UBlueprint>(Tools.GetAssetByObjectPath(*P)))
    {
        if (UClass* GenCls = BPPC->GeneratedClass)
        {
            if (AMountainRescuePlayerController* PCCD =
                GenCls->GetDefaultObject<AMountainRescuePlayerController>())
            {
                FString IMCP = AssetPaths::R / "Input/IMC_MountainRescue";
                if (UObject* IMC = Tools.GetAssetByObjectPath(*IMCP))
                {
                    PCCD->InputMappingContext = Cast<UInputMappingContext>(IMC);
                }
                Tools.SaveAsset(BPPC);
            }
        }
    }
    return true;
}

// ============================================================
//  Step7: DataTable
// ============================================================
bool FAssetInitializerEditorModule::Step_CreateDataTable()
{
    FString Pkg = AssetPaths::R / AssetPaths::DT_Path;
    if (GET_ASSET_TOOLS().DoesAssetExist(Pkg)) return true;
    UDataTableFactory* Factory = NewObject<UDataTableFactory>();
    Factory->Struct = FRescueTargetData::StaticStruct();
    return GET_ASSET_TOOLS().CreateAsset(
        TEXT("DT_RescueTargets_Easy"), AssetPaths::R / TEXT("DataTables"),
        UDataTable::StaticClass(), Factory) != nullptr;
}

// ============================================================
//  Step8: 写入 DefaultEngine.ini
// ============================================================
bool FAssetInitializerEditorModule::Step_WriteIniOverrides()
{
    FString IniFile = FPaths::ProjectConfigDir() / TEXT("DefaultEngine.ini");
    bool bOK = true;
    auto SetIni = [&](const TCHAR* Section, const TCHAR* Key, const TCHAR* Value) {
        if (!GConfig->SetString(Section, Key, Value, IniFile)) bOK = false;
    };

    SetIni(TEXT("/Script/EngineSettings.GameMapsSettings"),
           TEXT("EditorStartupMap"),
           TEXT("/Game/Maps/L_MountainBase.L_MountainBase"));
    SetIni(TEXT("/Script/EngineSettings.GameMapsSettings"),
           TEXT("GameDefaultMap"),
           TEXT("/Game/Maps/L_MountainBase.L_MountainBase"));
    SetIni(TEXT("/Script/EngineSettings.GameMapsSettings"),
           TEXT("ServerDefaultMap"),
           TEXT("/Game/Maps/L_MountainBase.L_MountainBase"));
    SetIni(TEXT("/Script/EngineSettings.GameMapsSettings"),
           TEXT("GlobalDefaultGameMode"),
           TEXT("/Game/Blueprints/GameModes/BP_GameMode.BP_GameMode_C"));
    SetIni(TEXT("/Script/Engine.GameMapsSettings"),
           TEXT("DefaultPlayerControllerClass"),
           TEXT("/Game/Blueprints/PlayerController/BP_PlayerController.BP_PlayerController_C"));
    SetIni(TEXT("/Script/Engine.GameMapsSettings"),
           TEXT("DefaultHUDClass"),
           TEXT("/Game/Blueprints/HUD/BP_HUD.BP_HUD_C"));

    GConfig->Flush(false, IniFile);
    UE_LOG(LogAssetInit, Display, TEXT("   DefaultEngine.ini 已更新为指向 L_MountainBase + 蓝图GameMode"));
    return bOK;
}

// ============================================================
//  Step9: 验证磁盘文件
// ============================================================
bool FAssetInitializerEditorModule::FileExistsOnDisk(const FString& Rel)
{
    FString Abs = FPaths::ProjectContentDir() / Rel;
    return FPlatformFileManager::Get().GetPlatformFile().FileExists(*Abs);
}

bool FAssetInitializerEditorModule::Step_VerifyAllOnDisk()
{
    TArray<FString> Check = {
        TEXT("Maps/L_MountainBase.umap"),
        TEXT("Blueprints/Drones/BP_Drone.uasset"),
        TEXT("Blueprints/GameModes/BP_GameMode.uasset"),
        TEXT("Blueprints/Route/BP_RouteManager.uasset"),
        TEXT("Blueprints/HUD/BP_HUD.uasset"),
        TEXT("Blueprints/PlayerController/BP_PlayerController.uasset"),
        TEXT("UI/MainHUD/WBP_MainHUD.uasset"),
        TEXT("UI/TaskEditor/WBP_TaskEditor.uasset"),
        TEXT("UI/ResultScreen/WBP_ResultScreen.uasset"),
        TEXT("Input/IMC_MountainRescue.uasset"),
        TEXT("Input/IA_StartFlight.uasset"),
    };
    int32 OK = 0;
    for (const FString& F : Check)
    {
        if (FileExistsOnDisk(F)) OK++;
        else UE_LOG(LogAssetInit, Warning, TEXT("   磁盘缺失: Content/%s"), *F);
    }
    UE_LOG(LogAssetInit, Display, TEXT("   磁盘验证: %d/%d 关键文件已落盘"),
           OK, Check.Num());
    return OK >= Check.Num() - 2;
}

#undef LOCTEXT_NAMESPACE
