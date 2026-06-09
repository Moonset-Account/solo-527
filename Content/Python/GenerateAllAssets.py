# -*- coding: utf-8 -*-
"""
山地救援无人机模拟 - 一键生成所有可玩资产
使用方法：
  1. 打开 UE 编辑器，编译 C++ 模块成功
  2. 菜单 Window → Developer Tools → Output Log
  3. 输入命令:  py "Content/Python/GenerateAllAssets.py"
  4. 等待执行完成（约30-60秒），保存所有，Play即可试玩
"""
import unreal
import os
import sys

CONTENT_ROOT = "/Game/"
PROJECT_CONTENT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ========== 工具函数 ==========
def save_asset(asset, package_path):
    """保存资产到指定路径"""
    full_path = CONTENT_ROOT + package_path
    unreal.EditorAssetLibrary.save_loaded_asset(asset, False)
    unreal.log(f"  ✅ Saved: {full_path}")

def find_or_create_folder(folder_name):
    """创建Content子目录"""
    full = CONTENT_ROOT + folder_name
    if not unreal.EditorAssetLibrary.does_directory_exist(full):
        unreal.EditorAssetLibrary.make_directory(full)
        unreal.log(f"  📁 Created folder: {folder_name}")

def create_blueprint(base_class, bp_name, folder):
    """创建C++类的蓝图子类"""
    factory = unreal.BlueprintFactory()
    factory.set_editor_property("ParentClass", base_class)

    tools = unreal.AssetToolsHelpers.get_asset_tools()
    asset = tools.create_asset(bp_name, CONTENT_ROOT + folder, None, factory)
    unreal.log(f"  🧬 Created Blueprint: {folder}/{bp_name} (parent: {base_class.get_name()})")
    return asset

def create_widget_bp(widget_name, folder):
    """创建UMG Widget蓝图"""
    factory = unreal.WidgetBlueprintFactory()
    factory.set_editor_property("ParentClass", unreal.UserWidget)

    tools = unreal.AssetToolsHelpers.get_asset_tools()
    asset = tools.create_asset(widget_name, CONTENT_ROOT + folder, None, factory)
    unreal.log(f"  🎨 Created Widget: {folder}/{widget_name}")
    return asset

def create_input_action(action_name, folder, value_type=unreal.InputActionValueType.BOOLEAN):
    """创建增强输入InputAction"""
    factory = unreal.InputActionFactoryNew()
    asset = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        action_name, CONTENT_ROOT + folder, None, factory)
    asset.set_editor_property("ValueType", value_type)
    save_asset(asset, f"{folder}/{action_name}")
    return asset

# ========== Step 1: 创建InputAction & InputMappingContext ==========
def step_1_create_input():
    unreal.log("\n" + "="*60)
    unreal.log("STEP 1: 创建 InputAction + InputMappingContext")
    unreal.log("="*60)
    find_or_create_folder("Input")

    actions = {}
    action_defs = [
        ("IA_LeftClick",      unreal.InputActionValueType.BOOLEAN),
        ("IA_RightClick",     unreal.InputActionValueType.BOOLEAN),
        ("IA_MouseDrag",      unreal.InputActionValueType.AXIS2D),
        ("IA_ModeAdd",        unreal.InputActionValueType.TRIGGER),
        ("IA_ModeMove",       unreal.InputActionValueType.TRIGGER),
        ("IA_ModeDelete",     unreal.InputActionValueType.TRIGGER),
        ("IA_StartFlight",    unreal.InputActionValueType.TRIGGER),
        ("IA_ReturnHome",     unreal.InputActionValueType.TRIGGER),
        ("IA_ToggleEditor",   unreal.InputActionValueType.TRIGGER),
        ("IA_Pause",          unreal.InputActionValueType.TRIGGER),
    ]
    for name, vtype in action_defs:
        actions[name] = create_input_action(name, "Input", vtype)

    # InputMappingContext
    imc_factory = unreal.InputMappingContextFactoryNew()
    imc = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        "IMC_MountainRescue", CONTENT_ROOT + "Input", None, imc_factory)

    def add_mapping(action_name, key_str, mod=None):
        """便捷添加键位映射"""
        mapping = unreal.InputMapping()
        mapping.action = actions[action_name]
        mapping.key = unreal.Key(key_str)
        if mod:
            m = unreal.InputModifier()
            m.modifier = mod
            mapping.modifiers.append(m)
        imc.get_editor_property("Mappings").append(mapping)

    # LeftMouse = 左键点击 + 拖拽起始
    add_mapping("IA_LeftClick", "LeftMouseButton")
    add_mapping("IA_RightClick", "RightMouseButton")

    # 模式切换键：1/2/3
    add_mapping("IA_ModeAdd", "One")
    add_mapping("IA_ModeMove", "Two")
    add_mapping("IA_ModeDelete", "Three")

    # 开始任务：空格或Enter
    add_mapping("IA_StartFlight", "SpaceBar")
    add_mapping("IA_StartFlight", "Enter")

    # 返航：R；编辑器Tab；暂停Esc/P
    add_mapping("IA_ReturnHome", "R")
    add_mapping("IA_ToggleEditor", "Tab")
    add_mapping("IA_Pause", "Escape")
    add_mapping("IA_Pause", "P")

    save_asset(imc, "Input/IMC_MountainRescue")
    unreal.log("  🎮 输入系统配置完成: 10个InputAction + 1个IMC")

# ========== Step 2: 创建所有C++基类的蓝图子类 ==========
def step_2_create_blueprints():
    unreal.log("\n" + "="*60)
    unreal.log("STEP 2: 创建 11 个蓝图子类")
    unreal.log("="*60)

    folders = {
        "GameModes": "Blueprints/GameModes",
        "Drones":    "Blueprints/Drones",
        "HUD":       "Blueprints/HUD",
        "PC":        "Blueprints/PlayerController",
        "Route":     "Blueprints/Route",
        "Targets":   "Blueprints/Targets",
        "Systems":   "Blueprints/Systems",
        "Supplies":  "Blueprints/Supplies",
    }
    for f in folders.values():
        find_or_create_folder(f)

    # 拿 C++ 类（通过系统查找）
    all_classes = unreal.EditorAssetLibrary.list_assets("/Script/", False, False)
    cpp_classes = {}
    # 通过系统API直接拿class
    def get_class(class_name, package="MountainRescueDrone"):
        try:
            module = __import__("unreal")
            cls = getattr(module, class_name, None)
            if cls and isinstance(cls, type) and issubclass(cls, unreal.Object):
                return cls
        except: pass
        # fallback: dynamic class loading
        path = f"/Script/{package}.{class_name}"
        obj = unreal.EditorAssetLibrary.load_asset(path)
        if obj: return obj
        return unreal.Class(path) if hasattr(unreal, "Class") else None

    # 蓝图列表：(蓝图名, 文件夹key, C++类名)
    bp_list = [
        ("BP_GameMode",            "GameModes", "MountainRescueGameMode"),
        ("BP_PlayerController",    "PC",        "MountainRescuePlayerController"),
        ("BP_HUD",                 "HUD",       "MountainRescueHUD"),
        ("BP_Drone",               "Drones",    "DroneBase"),
        ("BP_RouteManager",        "Route",     "RouteManager"),
        ("BP_WaypointActor",       "Route",     "WaypointActor"),
        ("BP_RescueTarget",        "Targets",   "RescueTarget"),
        ("BP_DroppedSupply",       "Supplies",  "DroppedSupply"),
        ("BP_WeatherSystem",       "Systems",   "WeatherSystem"),
        ("BP_SignalSystem",        "Systems",   "SignalSystem"),
        ("BP_ReplaySystem",        "Systems",   "ReplaySystem"),
    ]

    created = {}
    for bp_name, folder_key, cpp_name in bp_list:
        folder = folders[folder_key]
        try:
            # 动态获取C++类
            cls = None
            try:
                cls = getattr(unreal, cpp_name)
            except:
                # fallback: try package path class load
                cls = unreal.load_class(None, f"/Script/MountainRescueDrone.{cpp_name}",
                                         f"/Script/MountainRescueDrone.{cpp_name}", None)

            if cls is None:
                unreal.log_error(f"  ❌ 找不到C++类: {cpp_name}，请先编译项目!")
                continue

            bp = create_blueprint(cls, bp_name, folder)
            created[bp_name] = bp

            # === GameMode特殊: 配置默认的 PlayerController / HUD 类 ===
            if bp_name == "BP_GameMode":
                generated_bp = bp.generated_class()
                try:
                    cd = bp.get_editor_property("SimpleConstructionScript")
                except: pass
                unreal.log(f"    ℹ️ 后续将在WorldSettings中绑定GameMode")

            # === WaypointActor特殊: RouteManager引用它 ===
            if bp_name == "BP_WaypointActor":
                unreal.log(f"    ℹ️ RouteManager中手动将WaypointActorClass设为BP_WaypointActor")

            save_asset(bp, f"{folder}/{bp_name}")
        except Exception as e:
            unreal.log_error(f"  ❌ 创建蓝图 {bp_name} 失败: {e}")
            import traceback; traceback.print_exc()

    unreal.log(f"  🧩 蓝图创建完成: {len(created)}/{len(bp_list)} 成功")
    return created

# ========== Step 3: 创建 UMG Widget ==========
def step_3_create_umg():
    unreal.log("\n" + "="*60)
    unreal.log("STEP 3: 创建 UMG Widget 蓝图（6个核心界面）")
    unreal.log("="*60)

    folders = [
        "UI/MainHUD", "UI/RouteEditor", "UI/ResultScreen",
        "UI/TaskEditor", "UI/Replay", "UI/TargetStatus"
    ]
    for f in folders: find_or_create_folder(f)

    widgets = [
        ("WBP_MainHUD",        "UI/MainHUD"),
        ("WBP_RouteEditor",    "UI/RouteEditor"),
        ("WBP_ResultScreen",   "UI/ResultScreen"),
        ("WBP_TaskEditor",     "UI/TaskEditor"),
        ("WBP_ReplayControls", "UI/Replay"),
        ("WBP_TargetStatus",   "UI/TargetStatus"),
    ]
    for name, folder in widgets:
        try:
            wb = create_widget_bp(name, folder)
            save_asset(wb, f"{folder}/{name}")
        except Exception as e:
            unreal.log_error(f"  ❌ 创建UMG {name} 失败: {e}")

    unreal.log("  🖼️  核心UMG创建完成（蓝图内部需手动添加控件，参考BLUEPRINT_IMPLEMENTATION_GUIDE.md第4章）")

# ========== Step 4: 创建关卡 L_MountainBase（含自动布置Actor + 真正保存到磁盘） ==========
def step_4_create_level():
    unreal.log("\n" + "="*60)
    unreal.log("STEP 4: 创建关卡 L_MountainBase + 自动布置Actor + 保存")
    unreal.log("="*60)
    find_or_create_folder("Maps")

    # 计算关卡文件系统实际路径（用于验证磁盘文件）
    level_relpath = "Maps/L_MountainBase"
    level_pkgpath = CONTENT_ROOT + level_relpath
    level_disk_dir  = os.path.join(PROJECT_CONTENT, "Maps")
    level_disk_file = os.path.join(level_disk_dir, "L_MountainBase.umap")

    # 确保磁盘目录存在
    try:
        os.makedirs(level_disk_dir, exist_ok=True)
        unreal.log(f"  📁 磁盘目录就绪: {level_disk_dir}")
    except Exception as e:
        unreal.log(f"  ⚠️  创建磁盘目录跳过: {e}")

    # 方法A：new_level（带保存路径）
    saved_ok = False
    try:
        # new_level会在Content相对路径创建并立即激活，不会自动保存
        created_level = unreal.EditorLevelLibrary.new_level(level_pkgpath)
        unreal.log(f"  🏔️  关卡已在内存创建: {level_pkgpath}")

        # 如果关卡已存在同名，new_level可能返回None，我们先删除已存在的
        if unreal.EditorAssetLibrary.does_asset_exist(level_pkgpath):
            unreal.EditorAssetLibrary.delete_asset(level_pkgpath)
            unreal.log(f"  🗑️  已删除旧关卡")
            created_level = unreal.EditorLevelLibrary.new_level(level_pkgpath)
    except Exception as e:
        unreal.log(f"  ℹ️  new_level尝试失败，用替代方案: {e}")
        created_level = None

    # 方法B：LevelFactory
    if created_level is None:
        try:
            lvl_factory = unreal.LevelFactoryNew()
            tools = unreal.AssetToolsHelpers.get_asset_tools()
            created_level = tools.create_asset("L_MountainBase", CONTENT_ROOT + "Maps", None, lvl_factory)
            unreal.log(f"  🏔️  用Factory创建关卡资产")
        except Exception as e2:
            unreal.log_warning(f"  ⚠️  无法自动创建Level资产，请手动新建: {e2}")

    # 加载关卡并布置Actor
    level_lib = unreal.EditorLevelLibrary
    try:
        level_lib.load_level(level_pkgpath)
    except Exception as e:
        unreal.log(f"  ℹ️  load_level跳过: {e}")

    try:
        world = level_lib.get_editor_world()
    except:
        world = None

    if world:
        unreal.log("  �️  在关卡中自动布置Actor...")

        # Home基地坐标（Z=30m = 3000cm）
        HOME = unreal.Vector(0, 0, 3000)

        # 放置 PlayerStart
        try:
            ps = level_lib.spawn_actor_from_class(unreal.PlayerStart, HOME, unreal.Rotator(0,0,0))
            ps.set_actor_label("PlayerStart")
            unreal.log(f"    🎯 PlayerStart @ {HOME}")
        except Exception as e: unreal.log(f"    ⚠️  PlayerStart跳过: {e}")

        # 放置 BP_Drone / 系统Actor
        def spawn_from_bp(bp_asset_name, folder, loc, label):
            try:
                # 两种路径尝试
                for bp_path in [
                    f"{CONTENT_ROOT}{folder}/{bp_asset_name}.{bp_asset_name}_C",
                    f"{CONTENT_ROOT}{folder}/{bp_asset_name}"
                ]:
                    bp_cls = unreal.EditorAssetLibrary.load_asset(bp_path)
                    if bp_cls: break
                if not bp_cls:
                    # 尝试用 C++ 类直接放（这样至少有默认功能）
                    fallback_cpp = {
                        "BP_Drone": "DroneBase", "BP_RouteManager": "RouteManager",
                        "BP_WeatherSystem": "WeatherSystem", "BP_SignalSystem": "SignalSystem",
                        "BP_ReplaySystem": "ReplaySystem"
                    }
                    if bp_asset_name in fallback_cpp:
                        try:
                            cppcls = getattr(unreal, fallback_cpp[bp_asset_name])
                            actor = level_lib.spawn_actor_from_class(cppcls, loc, unreal.Rotator(0,0,0))
                            if actor:
                                actor.set_actor_label(label)
                                unreal.log(f"    ✅ (C++) {label} @ {loc}")
                                return actor
                        except: pass
                    unreal.log(f"    ⚠️  {label}: 蓝图未找到")
                    return None
                # Blueprint对象要取generated_class
                actual_cls = bp_cls.generated_class() if hasattr(bp_cls, 'generated_class') else bp_cls
                actor = level_lib.spawn_actor_from_class(actual_cls, loc, unreal.Rotator(0,0,0))
                if actor:
                    actor.set_actor_label(label)
                    unreal.log(f"    ✅ (BP) {label} @ {loc}")
                    return actor
            except Exception as e:
                unreal.log(f"    ⚠️  {label} spawn failed: {e}")
                import traceback; traceback.print_exc()
            return None

        spawn_from_bp("BP_Drone",         "Blueprints/Drones",   HOME, "Drone")
        spawn_from_bp("BP_RouteManager",  "Blueprints/Route",   unreal.Vector(2000, 0, 3000), "RouteManager")
        spawn_from_bp("BP_WeatherSystem", "Blueprints/Systems", unreal.Vector(0, 5000, 3000), "WeatherSystem")
        spawn_from_bp("BP_SignalSystem",  "Blueprints/Systems", unreal.Vector(0, -5000, 3000), "SignalSystem")
        spawn_from_bp("BP_ReplaySystem",  "Blueprints/Systems", unreal.Vector(-5000, 0, 3000), "ReplaySystem")

        # 放置灯光+天空+雾气
        try:
            sun = level_lib.spawn_actor_from_class(unreal.DirectionalLight,
                                                    unreal.Vector(0,0,50000),
                                                    unreal.Rotator(-45, -30, 0))
            sun.set_actor_label("DirectionalLight_Sun")
            sky = level_lib.spawn_actor_from_class(unreal.SkyLight,
                                                    unreal.Vector(0,0,2000),
                                                    unreal.Rotator(0,0,0))
            sky.set_actor_label("SkyLight")
            fog = level_lib.spawn_actor_from_class(unreal.ExponentialHeightFog,
                                                    unreal.Vector(0,0,0),
                                                    unreal.Rotator(0,0,0))
            fog.set_actor_label("HeightFog")
            try:
                skyatmos = level_lib.spawn_actor_from_class(unreal.SkyAtmosphere,
                                                            unreal.Vector(0,0,0),
                                                            unreal.Rotator(0,0,0))
                skyatmos.set_actor_label("SkyAtmosphere")
            except: pass
            unreal.log("    💡 灯光+天空+雾气+大气已放置")
        except Exception as e:
            unreal.log(f"    ⚠️  灯光放置失败: {e}")

        # ============= 关键！！保存关卡到磁盘为 .umap 文件 =============
        unreal.log("  💾 正在把关卡保存为 .umap 到磁盘...")
        try:
            # 方法1：EditorLoadingAndSavingUtils.save_map（推荐，真正落盘）
            try:
                # 获取关卡的package或world的package名字
                saved_ok = unreal.EditorLoadingAndSavingUtils.save_map(world, level_pkgpath)
                unreal.log(f"  💾 save_map 结果: {saved_ok} → {level_pkgpath}")
            except Exception as e:
                unreal.log(f"  ℹ️  save_map 第一方案失败: {e}")
                saved_ok = False

            # 方法2：save_current_level
            if not saved_ok:
                try:
                    level_lib.save_current_level()
                    unreal.log(f"  💾 save_current_level 已执行")
                    saved_ok = True
                except Exception as e2:
                    unreal.log(f"  ℹ️  save_current_level 失败: {e2}")
                    saved_ok = False

            # 方法3：save_package（终极方案）
            if not saved_ok:
                try:
                    # 获取world对应的package
                    # world 的 outer 是 package，保存那个
                    try:
                        pkg = world.get_outer() if hasattr(world, "get_outer") else None
                        if pkg and hasattr(unreal, "EditorLoadingAndSavingUtils"):
                            unreal.EditorLoadingAndSavingUtils.save_packages([pkg], True)
                            unreal.log(f"  💾 save_packages 已执行")
                            saved_ok = True
                    except Exception as e3:
                        unreal.log(f"  ℹ️  save_packages 失败: {e3}")
                except: pass

            # 验证磁盘文件
            import time; time.sleep(0.3)
            if os.path.exists(level_disk_file):
                unreal.log(f"  ✅✅✅ 关卡磁盘文件已生成: {level_disk_file} ({os.path.getsize(level_disk_file)} bytes)")
                saved_ok = True
            else:
                unreal.log_warning(f"  ⚠️  关卡文件可能在磁盘上未创建（检查是否有保存权限）: {level_disk_file}")
                # 列出目录看看实际产生了什么
                try:
                    files = os.listdir(level_disk_dir)
                    unreal.log(f"    当前Content/Maps下文件: {files}")
                except: pass
        except Exception as e:
            unreal.log_error(f"  ❌ 关卡保存异常: {e}")
            import traceback; traceback.print_exc()

    unreal.log("  🗺️  关卡创建完成（建议后续用Landscape雕刻3座山峰提升视觉效果）")
    return level_pkgpath, saved_ok

# ========== Step 5: 配置GameMode到WorldSettings、HUD引用Widget ==========
def step_5_configure_game():
    unreal.log("\n" + "="*60)
    unreal.log("STEP 5: 配置 GameMode 默认参数 + HUD Widget引用 + 3救援目标")
    unreal.log("="*60)

    # ============ HUD WidgetClass 引用 ============
    hud_path = CONTENT_ROOT + "Blueprints/HUD/BP_HUD"
    bp_hud = unreal.EditorAssetLibrary.load_asset(hud_path)
    if bp_hud:
        try:
            def set_widget_ref(prop_name, wbp_path):
                wbp = unreal.EditorAssetLibrary.load_asset(CONTENT_ROOT + wbp_path)
                if wbp and bp_hud:
                    try:
                        # 编辑蓝图Skeletal/CDO的默认属性
                        bp_hud.modify()
                        for conn in bp_hud.get_editor_property("SimpleConstructionScript") if hasattr(bp_hud, 'get_editor_property') else []:
                            pass
                    except: pass
                    # 用更安全的GeneratedClass CDO
                    try:
                        gen_cls = bp_hud.generated_class()
                        if gen_cls:
                            cdo = unreal.get_default_object(gen_cls)
                            gen_cls_cdo = cdo if cdo else None
                            if gen_cls_cdo:
                                gen_cls_cdo.set_editor_property(prop_name, wbp.generated_class())
                                unreal.log(f"  🔗 BP_HUD.{prop_name} = {wbp_path}")
                    except Exception as e:
                        unreal.log(f"  ℹ️  {prop_name} CDO设置跳过（在蓝图Defaults手动设置）: {e}")

            set_widget_ref("MainHUDWidgetClass",      "UI/MainHUD/WBP_MainHUD")
            set_widget_ref("RouteEditorWidgetClass",  "UI/RouteEditor/WBP_RouteEditor")
            set_widget_ref("ResultScreenWidgetClass", "UI/ResultScreen/WBP_ResultScreen")
            set_widget_ref("TaskEditorWidgetClass",   "UI/TaskEditor/WBP_TaskEditor")
            set_widget_ref("ReplayWidgetClass",       "UI/Replay/WBP_ReplayControls")

            unreal.EditorAssetLibrary.save_loaded_asset(bp_hud)
        except Exception as e:
            unreal.log(f"  ⚠️  HUD配置出错（不影响核心功能）: {e}")

    # ============ RouteManager WaypointActorClass ============
    rm_path = CONTENT_ROOT + "Blueprints/Route/BP_RouteManager"
    bp_rm = unreal.EditorAssetLibrary.load_asset(rm_path)
    if bp_rm:
        try:
            wbp_asset = unreal.EditorAssetLibrary.load_asset(
                CONTENT_ROOT + "Blueprints/Route/BP_WaypointActor")
            if wbp_asset:
                try:
                    gen_cls = bp_rm.generated_class()
                    cdo = unreal.get_default_object(gen_cls)
                    cdo.set_editor_property("WaypointActorClass", wbp_asset.generated_class())
                    unreal.EditorAssetLibrary.save_loaded_asset(bp_rm)
                    unreal.log("  🔗 BP_RouteManager.WaypointActorClass = BP_WaypointActor")
                except Exception as e:
                    unreal.log(f"  ℹ️  RouteManager设置跳过: {e}")
        except Exception as e:
            unreal.log(f"  ⚠️  RouteManager配置出错: {e}")

    # ============ PlayerController Input引用 ============
    pc_path = CONTENT_ROOT + "Blueprints/PlayerController/BP_PlayerController"
    bp_pc = unreal.EditorAssetLibrary.load_asset(pc_path)
    if bp_pc:
        try:
            imc = unreal.EditorAssetLibrary.load_asset(CONTENT_ROOT + "Input/IMC_MountainRescue")
            ia_map = {}
            for n in ["IA_LeftClick","IA_RightClick","IA_MouseDrag","IA_ModeAdd","IA_ModeMove",
                      "IA_ModeDelete","IA_StartFlight","IA_ReturnHome","IA_ToggleEditor","IA_Pause"]:
                ass = unreal.EditorAssetLibrary.load_asset(CONTENT_ROOT + f"Input/{n}")
                if ass: ia_map[n] = ass

            try:
                gen_cls = bp_pc.generated_class()
                cdo = unreal.get_default_object(gen_cls)
                # 设置IMC
                if imc and cdo:
                    try:
                        cdo.set_editor_property("InputMappingContext", imc)
                        unreal.log(f"  🔗 BP_PC.InputMappingContext = IMC_MountainRescue")
                    except: pass
                # 尝试所有Input属性名
                prop_map = {}
                input_props = ["LeftClickAction","RightClickAction","MouseDragAction",
                               "ModeAddAction","ModeMoveAction","ModeDeleteAction",
                               "StartFlightAction","ReturnHomeAction",
                               "ToggleEditorAction","PauseAction"]
                asset_names = ["IA_LeftClick","IA_RightClick","IA_MouseDrag",
                               "IA_ModeAdd","IA_ModeMove","IA_ModeDelete",
                               "IA_StartFlight","IA_ReturnHome",
                               "IA_ToggleEditor","IA_Pause"]
                for prop, aname in zip(input_props, asset_names):
                    if cdo and aname in ia_map:
                        try:
                            cdo.set_editor_property(prop, ia_map[aname])
                            unreal.log(f"  🔗 BP_PC.{prop} = {aname}")
                        except: pass
                unreal.EditorAssetLibrary.save_loaded_asset(bp_pc)
            except Exception as e:
                unreal.log(f"  ⚠️  PlayerController Input设置出错（手动设置）: {e}")
        except Exception as e:
            unreal.log(f"  ⚠️  PlayerController 配置出错: {e}")

    # ============ BP_GameMode 救援目标配置（★核心★自动填3个目标）============
    gm_path = CONTENT_ROOT + "Blueprints/GameModes/BP_GameMode"
    bp_gm = unreal.EditorAssetLibrary.load_asset(gm_path)
    if bp_gm:
        try:
            gen_cls = bp_gm.generated_class()
            cdo = unreal.get_default_object(gen_cls)
            if not cdo:
                raise Exception("GameMode CDO not found")

            unreal.log("  🎯 正在配置 BP_GameMode → CurrentTaskConfig → 3个救援目标...")

            # 构造3个示例目标（使用C++结构体对应的Python API）
            targets = []
            target_defs = [
                ("T1_LightInjury",  "MinorInjury",  "Normal",
                 unreal.Vector(20000, 8000, 120000),
                 ["MedicalKit"], 600, 300, 500, 200, "轻伤-王师傅",
                 "徒步时脚踝扭伤，需急救包处理"),
                ("T2_Hypothermia", "Hypothermia",   "High",
                 unreal.Vector(-15000, 25000, 180000),
                 ["WarmBlanket", "MedicalKit"], 420, 240, 700, 350, "失温-李大姐",
                 "登山时被困，体温过低，需保暖毯+急救"),
                ("T3_LostPerson",  "LostPerson",   "Low",
                 unreal.Vector(35000, -20000, 90000),
                 ["LocatorBeacon"], 900, 480, 350, 100, "迷路-张同学",
                 "偏离步道方向不明，投放定位信标指引"),
            ]

            for tdef in target_defs:
                (tid, ttype, pri, loc, supplies,
                 tlim, gold, base, bonus, dname, desc) = tdef

                try:
                    # 用StructTag构造C++ RescueTargetData
                    target_data = unreal.Structure.create_struct(
                        unreal.RescueTargetData if hasattr(unreal, "RescueTargetData")
                        else None)
                    if target_data is None:
                        # Fallback: 使用EditorUtilities的set_by_name
                        unreal.log(f"    ⚠️  Python无法直接创建RescueTargetData，请手动配置目标: {tid}")
                        continue

                    # 填充字段
                    target_data.set_editor_property("TargetID", unreal.Name(tid))
                    target_data.set_editor_property("DisplayName", unreal.Text(dname))
                    target_data.set_editor_property("Description", unreal.Text(desc))
                    target_data.set_editor_property("WorldLocation", loc)
                    target_data.set_editor_property("TimeLimitSeconds", tlim)
                    target_data.set_editor_property("GoldenTimeSeconds", gold)
                    target_data.set_editor_property("BaseScore", base)
                    target_data.set_editor_property("GoldenTimeBonus", bonus)
                    target_data.set_editor_property("DelayPenaltyPerSecond",
                        5 if pri == "Critical" else 3 if pri == "High" else 2 if pri == "Normal" else 1)

                    # 枚举类型
                    try:
                        target_data.set_editor_property("TargetType",
                            getattr(unreal.ERescueTargetType, ttype))
                        target_data.set_editor_property("Priority",
                            getattr(unreal.ETaskPriority, pri))
                    except:
                        pass

                    # RequiredSupplies数组
                    try:
                        sup_array = []
                        for s in supplies:
                            sup_array.append(getattr(unreal.ESupplyType, s))
                        target_data.set_editor_property("RequiredSupplies", sup_array)
                    except Exception as e:
                        unreal.log(f"    ⚠️  设置Supplies失败（手动设置）: {e}")

                    targets.append(target_data)
                    unreal.log(f"    ✅ 目标: {dname} @ {loc}")
                except Exception as e:
                    unreal.log(f"    ❌ 创建目标 {tid} 失败: {e}")

            # 设置TaskConfig
            if len(targets) > 0:
                try:
                    # 先拿到当前TaskConfig的副本
                    task_cfg = cdo.get_editor_property("CurrentTaskConfig")
                    if task_cfg is None:
                        # 构造FTaskConfig
                        task_cfg = unreal.Structure.create_struct(
                            unreal.FTaskConfig if hasattr(unreal, "FTaskConfig") else None)

                    if task_cfg is not None:
                        task_cfg.set_editor_property("RescueTargets", targets)
                        task_cfg.set_editor_property("HomeLocation", unreal.Vector(0, 0, 3000))
                        task_cfg.set_editor_property("InitialBatteryPercent", 0.95)

                        # 初始物资配置
                        try:
                            payload = []
                            payload_defs = [
                                ("MedicalKit",    4, 2.0),
                                ("WarmBlanket",   2, 2.5),
                                ("LocatorBeacon", 3, 1.5),
                            ]
                            for stype, cnt, uw in payload_defs:
                                try:
                                    sp = unreal.Structure.create_struct(unreal.FSupplyPayload)
                                    if sp:
                                        sp.set_editor_property("SupplyType", getattr(unreal.ESupplyType, stype))
                                        sp.set_editor_property("Count", cnt)
                                        sp.set_editor_property("UnitWeightKg", uw)
                                        payload.append(sp)
                                except: pass
                            if len(payload) > 0:
                                task_cfg.set_editor_property("InitialPayload", payload)
                                unreal.log(f"    🎒 初始物资: 急救包×4 保暖毯×2 信标×3 总重 17.5kg")
                        except Exception as e:
                            unreal.log(f"    ⚠️  设置Payload跳过: {e}")

                        # 默认天气
                        try:
                            weather = task_cfg.get_editor_property("Weather")
                            if weather is not None:
                                weather.set_editor_property("WindSpeed", 6.0)
                                weather.set_editor_property("WindDirection", unreal.Vector(1, 0.3, 0))
                                weather.set_editor_property("bIsGusty", True)
                                weather.set_editor_property("GustIntensity", 1.3)
                                unreal.log(f"    🌤️  天气: 东北风6m/s + 阵风")
                        except: pass

                        # 信号盲区配置（让2号目标在盲区边缘）
                        try:
                            zones = []
                            # 在T2(失温)目标附近放一个盲区
                            dz_struct = unreal.Structure.create_struct(unreal.FSignalDeadZone) if hasattr(unreal, "FSignalDeadZone") else None
                            if dz_struct:
                                dz_struct.set_editor_property("CenterLocation",
                                    unreal.Vector(-10000, 18000, 170000))
                                dz_struct.set_editor_property("Radius", 60000.0)
                                dz_struct.set_editor_property("SignalBlockStrength", 0.85)
                                zones.append(dz_struct)
                                unreal.log(f"    📡  信号盲区: 1个（覆盖T2失温目标西北侧）")
                            if len(zones) > 0:
                                task_cfg.set_editor_property("SignalDeadZones", zones)
                        except: pass

                        # 写回GameMode
                        cdo.set_editor_property("CurrentTaskConfig", task_cfg)
                        unreal.log(f"  ✅ {len(targets)}个救援目标已自动写入 BP_GameMode")
                except Exception as e:
                    unreal.log_warning(f"  ⚠️  写入TaskConfig失败（手动参考PROJECT_STARTUP_GUIDE.md Step5）: {e}")
                    import traceback; traceback.print_exc()
            else:
                unreal.log_warning("  ⚠️  未成功写入目标数组，请手动按Step5设置")

            unreal.EditorAssetLibrary.save_loaded_asset(bp_gm)
        except Exception as e:
            unreal.log_error(f"  ❌ GameMode配置出错: {e}")
            import traceback; traceback.print_exc()

    unreal.log("  🔧 配置完成（少量参数需在蓝图Defaults中手动微调）")

# ========== Step 6: 创建DataTable（示例救援目标配置）==========
def step_6_create_datatable():
    unreal.log("\n" + "="*60)
    unreal.log("STEP 6: 创建示例任务配置DataTable（3目标简单关）")
    unreal.log("="*60)
    find_or_create_folder("DataTables")

    try:
        factory = unreal.DataTableFactory()
        # RescueTargetData结构在C++中
        struct_path = "/Script/MountainRescueDrone.RescueTargetData"
        try:
            row_struct = unreal.EditorAssetLibrary.load_asset(struct_path)
            if row_struct:
                factory.set_editor_property("Struct", row_struct)
        except: pass

        dt = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
            "DT_RescueTargets_Easy", CONTENT_ROOT + "DataTables", None, factory)
        unreal.log("  📋 DataTable DT_RescueTargets_Easy 创建成功")
        unreal.log("  ℹ️  在DataTable编辑器中填入目标数据即可被GameMode引用")
        save_asset(dt, "DataTables/DT_RescueTargets_Easy")
    except Exception as e:
        unreal.log_warning(f"  ⚠️  DataTable创建失败: {e}")

# ========== Step 7: 直接修改 DefaultEngine.ini（指向生成的L_MountainBase关卡 + 蓝图GameMode）==========
def step_7_write_ini_overrides(level_saved_ok):
    unreal.log("\n" + "="*60)
    unreal.log("STEP 7: 写入 DefaultEngine.ini → 自动绑定关卡+GameMode蓝图")
    unreal.log("="*60)

    # 找到项目的Config目录（在Content/../Config）
    project_root = os.path.dirname(PROJECT_CONTENT)
    ini_path = os.path.join(project_root, "Config", "DefaultEngine.ini")

    unreal.log(f"  📂 项目根目录: {project_root}")
    unreal.log(f"  📝 目标ini文件: {ini_path}")

    if not os.path.exists(ini_path):
        unreal.log_warning(f"  ⚠️  ini文件不存在，尝试查找: {os.listdir(project_root) if os.path.exists(project_root) else 'project_root也不存在'}")
        return False

    try:
        with open(ini_path, "r", encoding="utf-8") as f:
            ini_content = f.read()

        # ===== 要写入的配置 =====
        new_map_line = None
        if level_saved_ok:
            # 指向生成的 L_MountainBase
            new_map_line = "GameDefaultMap=/Game/Maps/L_MountainBase.L_MountainBase"
        else:
            # 回退到引擎自带的OpenWorld（防止首次打开崩溃）
            unreal.log_warning("  ⚠️  关卡未成功保存，启动图仍使用引擎OpenWorld模板")
            new_map_line = "GameDefaultMap=/Engine/Maps/Templates/OpenWorld.OpenWorld"

        # ===== 配置替换规则: (正则模式, 替换后的行) =====
        replacements = [
            # --- GameDefaultMap ---
            (r"^\s*GameDefaultMap\s*=.*$",
             new_map_line),
            # --- ServerDefaultMap ---
            (r"^\s*ServerDefaultMap\s*=.*$",
             "ServerDefaultMap=/Game/Maps/L_MountainBase.L_MountainBase" if level_saved_ok
             else "ServerDefaultMap=/Engine/Maps/Templates/OpenWorld.OpenWorld"),
            # --- GlobalDefaultGameMode 指向 BP_GameMode ---
            (r"^\s*GlobalDefaultGameMode\s*=.*$",
             "GlobalDefaultGameMode=/Game/Blueprints/GameModes/BP_GameMode.BP_GameMode_C"),
            # --- DefaultPlayerControllerClass ---
            (r"^\s*DefaultPlayerControllerClass\s*=.*$",
             "DefaultPlayerControllerClass=/Game/Blueprints/PlayerController/BP_PlayerController.BP_PlayerController_C"),
            # --- DefaultHUDClass ---
            (r"^\s*DefaultHUDClass\s*=.*$",
             "DefaultHUDClass=/Game/Blueprints/HUD/BP_HUD.BP_HUD_C"),
        ]

        import re
        changed_any = False
        new_lines = []
        for line in ini_content.splitlines():
            replaced = False
            for pattern, repl in replacements:
                if re.match(pattern, line, re.IGNORECASE):
                    if line.strip() != repl.strip():
                        new_lines.append(repl)
                        unreal.log(f"  🔧 替换: {line.strip()}  →  {repl}")
                        changed_any = True
                        replaced = True
                        break
                    else:
                        new_lines.append(line)
                        replaced = True
                        break
            if not replaced:
                new_lines.append(line)

        # 如果关键配置缺失（比如第一次没写过GlobalDefaultGameMode），追加到EngineSettings段
        ini_out = "\n".join(new_lines)

        def ensure_section_setting(section_name, setting_key, setting_value, content):
            """在ini的指定section中确保某一行存在；不存在则在section末尾追加"""
            if re.search(rf"^\s*{re.escape(setting_key)}\s*=", content, re.MULTILINE):
                return content, False  # 已经有了（上面已替换过）
            # 找到section
            section_pattern = rf"^\[{re.escape(section_name)}\]\s*$"
            match = re.search(section_pattern, content, re.MULTILINE)
            if not match:
                # section也没有，追加整个section
                return content + f"\n\n[{section_name}]\n{setting_key}={setting_value}\n", True
            # 找到这个section到下一个section之间的内容，在末尾插入
            section_start = match.end()
            next_section = re.search(r"^\[", content[section_start:], re.MULTILINE)
            if next_section:
                insert_pos = section_start + next_section.start()
            else:
                insert_pos = len(content)
            # 插入
            return (content[:insert_pos] + f"\n{setting_key}={setting_value}" + content[insert_pos:]), True

        # 逐个确保关键值
        needed = [
            ("/Script/EngineSettings.GameMapsSettings", "GameDefaultMap",
             "GameDefaultMap=/Game/Maps/L_MountainBase.L_MountainBase" if level_saved_ok
             else "GameDefaultMap=/Engine/Maps/Templates/OpenWorld.OpenWorld"),
            ("/Script/EngineSettings.GameMapsSettings", "ServerDefaultMap",
             "ServerDefaultMap=/Game/Maps/L_MountainBase.L_MountainBase" if level_saved_ok
             else "ServerDefaultMap=/Engine/Maps/Templates/OpenWorld.OpenWorld"),
            ("/Script/EngineSettings.GameMapsSettings", "GlobalDefaultGameMode",
             "GlobalDefaultGameMode=/Game/Blueprints/GameModes/BP_GameMode.BP_GameMode_C"),
            ("/Script/Engine.GameMapsSettings", "DefaultPlayerControllerClass",
             "DefaultPlayerControllerClass=/Game/Blueprints/PlayerController/BP_PlayerController.BP_PlayerController_C"),
            ("/Script/Engine.GameMapsSettings", "DefaultHUDClass",
             "DefaultHUDClass=/Game/Blueprints/HUD/BP_HUD.BP_HUD_C"),
        ]
        for sec, key, val in needed:
            ini_out, added = ensure_section_setting(sec, key, val, ini_out)
            if added:
                unreal.log(f"  ➕ 追加 [{sec}]  {val}")
                changed_any = True

        if changed_any:
            # 备份
            bak = ini_path + ".bak_before_asset_gen"
            try:
                import shutil
                shutil.copy2(ini_path, bak)
                unreal.log(f"  📦 原ini已备份: {bak}")
            except: pass

            with open(ini_path, "w", encoding="utf-8") as f:
                f.write(ini_out.rstrip() + "\n")
            unreal.log("  ✅✅✅ DefaultEngine.ini 已自动更新为指向生成的蓝图关卡！")
        else:
            unreal.log("  ℹ️  ini配置已是最新，无需修改")

        # 打印验证
        unreal.log("\n  📋 最终ini中的关键配置:")
        with open(ini_path, "r", encoding="utf-8") as f:
            for ln in f.readlines():
                k = ln.strip()
                if any(x in k for x in ["GameDefaultMap", "ServerDefaultMap",
                                          "GlobalDefaultGameMode", "DefaultPlayerControllerClass",
                                          "DefaultHUDClass"]):
                    unreal.log(f"    → {k}")

        return True
    except Exception as e:
        unreal.log_error(f"  ❌ 写入ini失败: {e}")
        import traceback; traceback.print_exc()
        return False

# ========== 主流程 ==========
def main():
    unreal.log("\n" + "🎮"*30)
    unreal.log("🚁 山地救援无人机模拟 - 一键生成所有可玩资产 (v2 自动落盘版)")
    unreal.log("🎮"*30 + "\n")

    total_steps = 7
    level_saved_ok = False
    try:
        step_1_create_input()           # InputAction + IMC
        step_2_create_blueprints()      # 11个蓝图子类
        step_3_create_umg()             # 6个UMG Widget
        level_path, level_saved_ok = step_4_create_level()  # 关卡 + Actor布置 + 磁盘保存
        step_5_configure_game()         # GameMode/HUD参数绑定
        step_6_create_datatable()       # DataTable

        # ============ 终极：递归保存 /Game 下所有资产到磁盘 ============
        unreal.log("\n" + "="*60)
        unreal.log("💾 终极保存：保存所有已加载的资产到磁盘...")
        unreal.log("="*60)
        try:
            # 方式1：save_directory递归（最稳妥）
            unreal.EditorAssetLibrary.save_directory(CONTENT_ROOT, True, True)
            unreal.log("  ✅ save_directory(/Game) 已执行")
        except Exception as e:
            unreal.log(f"  ⚠️  save_directory 失败，用单资产保存: {e}")
            try:
                all_assets = unreal.EditorAssetLibrary.list_assets(CONTENT_ROOT, True, False)
                count = 0
                for a in all_assets:
                    try:
                        unreal.EditorAssetLibrary.save_asset(a)
                        count += 1
                    except: pass
                unreal.log(f"  ✅ 单独保存 {count} 个资产")
            except Exception as e2:
                unreal.log_warning(f"  ⚠️  单资产保存也失败: {e2}")

        step_7_write_ini_overrides(level_saved_ok)  # 真正写ini绑定

        unreal.log("\n" + "="*60)
        unreal.log("✅ 全部生成完成！磁盘文件验证中...")
        unreal.log("="*60)

        # ============ 列出Content目录下已生成的.uasset/.umap ============
        unreal.log("📂 Content目录下文件统计:")
        generated_count = 0
        required_files = [
            ("L_MountainBase.umap",     "Content/Maps/"),
            ("BP_Drone.uasset",         "Content/Blueprints/Drones/"),
            ("BP_RouteManager.uasset",  "Content/Blueprints/Route/"),
            ("BP_GameMode.uasset",      "Content/Blueprints/GameModes/"),
            ("BP_PlayerController.uasset","Content/Blueprints/PlayerController/"),
            ("BP_HUD.uasset",           "Content/Blueprints/HUD/"),
            ("WBP_MainHUD.uasset",      "Content/UI/MainHUD/"),
            ("WBP_TaskEditor.uasset",   "Content/UI/TaskEditor/"),
            ("WBP_ResultScreen.uasset", "Content/UI/ResultScreen/"),
            ("IMC_MountainRescue.uasset","Content/Input/"),
            ("IA_StartFlight.uasset",   "Content/Input/"),
        ]
        all_ok = True
        for fname, fdir in required_files:
            fp = os.path.join(PROJECT_CONTENT, *fdir.split("/"), fname)
            exists = os.path.exists(fp)
            sz = os.path.getsize(fp) if exists else 0
            mark = "✅" if exists else "❌"
            if not exists: all_ok = False
            unreal.log(f"  {mark} {fdir}{fname}  {sz} bytes" if exists
                       else f"  {mark} {fdir}{fname}  ← 缺失！")
            generated_count += 1 if exists else 0

        unreal.log(f"\n📊 验收: {generated_count}/{len(required_files)} 关键文件生成成功")
        if all_ok:
            unreal.log("""
╔══════════════════════════════════════════════════════════════╗
║  🎉 全部文件落盘成功！关闭编辑器重新打开项目即可试玩          ║
╠══════════════════════════════════════════════════════════════╣
║  ▶ 打开项目会直接进入 L_MountainBase 关卡                     ║
║  ▶ GameMode已自动设置为 BP_GameMode (含3救援目标)             ║
║  ▶ 默认操作:                                                 ║
║    1键 = 添加航点 | 2键 = 移动航点 | 3键 = 删除航点          ║
║    空格/Enter = 开始飞行 | R = 返航 | Tab = 难度调参面板     ║
╚══════════════════════════════════════════════════════════════╝
""")
        else:
            unreal.log("""
  ⚠️  部分关键文件未生成（原因多为UE版本Python API差异），请执行:
  1. 在UE编辑器中 Ctrl+Shift+S 手动保存所有
  2. 查看Output Log中报错的具体信息
  3. 再次运行本脚本覆盖生成
""")

    except Exception as e:
        unreal.log_error(f"❌ 执行过程中出错: {e}")
        import traceback
        traceback.print_exc()
        unreal.log("""
        ⚠️  常见问题:
        - 如果提示找不到 MountainRescueGameMode 类 → 请先在Visual Studio编译C++项目
        - 如果创建蓝图失败 → 检查C++编译错误并修复
        - 重复运行此脚本会覆盖同名资产，注意备份！
        """)

if __name__ == "__main__":
    main()
