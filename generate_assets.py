#!/usr/bin/env python3
"""Generate real Unity .asset ScriptableObject files for DecorMatch3 project."""
import os

ROOT = "/Volumes/TraeProjects/trae-solo-generated-projects/question-295/Assets/ScriptableObjects"

# ---- GUIDs for each ScriptableObject source file ----
GUID_LEVELDATA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"          # LevelData.cs
GUID_MATERIALDATA = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"        # MaterialData.cs
GUID_CUSTOMERPROFILE = "cccccccccccccccccccccccccccccccc"     # CustomerProfile.cs
GUID_FURNITUREITEM = "dddddddddddddddddddddddddddddddd"       # FurnitureItem.cs
GUID_DECORATIONORDER = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"     # DecorationOrder.cs
GUID_ACHIEVEMENTDATA = "1111111111111111111111111111111a"     # AchievementData.cs
GUID_DAILYCHALLENGE = "2222222222222222222222222222222b"      # DailyChallengeManager.cs

# FurnitureItem.cs has two SO classes; first uses fileID=11500000, second 11500002
FILEID_FURNITURE = 11500000
FILEID_PALETTE = 11500002  # not generated currently


def asset_header(script_guid, script_fileid=11500000, asset_name="",
                 mono_fileid=11400000):
    """Unity standard YAML header for a ScriptableObject .asset file."""
    return f"""%YAML 1.1
%TAG !u! tag:unity3d.com,2011:
--- !u!114 &{mono_fileid}
MonoBehaviour:
  m_ObjectHideFlags: 0
  m_CorrespondingSourceObject: {{fileID: 0}}
  m_PrefabInstance: {{fileID: 0}}
  m_PrefabAsset: {{fileID: 0}}
  m_GameObject: {{fileID: 0}}
  m_Enabled: 1
  m_EditorHideFlags: 0
  m_Script: {{fileID: {script_fileid}, guid: {script_guid}, type: 3}}
  m_Name: {asset_name}
  m_EditorClassIdentifier:
"""


def color_str(r, g, b, a=1.0):
    return f"{{r: {r}, g: {g}, b: {b}, a: {a}}}"


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def write(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] {os.path.relpath(path, ROOT)}")


# ============================================================
#  LEVELS (5)
# ============================================================
def gen_levels():
    d = os.path.join(ROOT, "Levels")
    ensure_dir(d)

    levels = [
        {
            "name": "Level_1", "id": 1, "lname": "初学者的第一步",
            "desc": "收集足够的基础颜料，完成第一个装修订单！",
            "bw": 6, "bh": 6, "limit": 0, "maxmoves": 25,
            "s1": 500, "s2": 1200, "s3": 2000,
            "tiles": [0, 1, 2, 3, 4],  # Red,Blue,Yellow,Green,Purple
            "targets": [(0, 8), (1, 8), (2, 5)],  # (TileType enum int, amount)
            "bcr": 30, "psc": 20, "gem": 0,
        },
        {
            "name": "Level_2", "id": 2, "lname": "木材与布料",
            "desc": "收集木材料和布料，给客厅准备家具！",
            "bw": 7, "bh": 7, "limit": 0, "maxmoves": 30,
            "s1": 800, "s2": 1800, "s3": 3000,
            "tiles": [0, 1, 2, 3, 4, 5, 6, 8],  # +Orange, WoodLight, Fabric
            "targets": [(6, 12), (8, 10), (3, 6)],
            "bcr": 50, "psc": 25, "gem": 0,
        },
        {
            "name": "Level_3", "id": 3, "lname": "金属与瓷砖",
            "desc": "厨房装修需要更多的硬质材料！",
            "bw": 8, "bh": 8, "limit": 1, "time": 90,
            "s1": 1500, "s2": 3000, "s3": 5000,
            "tiles": [1, 2, 3, 5, 7, 9, 10],  # Blue,Yellow,Green,Orange,WoodDark,Metal,Tile
            "targets": [(9, 15), (10, 18), (7, 10)],
            "bcr": 80, "psc": 35, "gem": 2,
        },
        {
            "name": "Level_4", "id": 4, "lname": "壁纸大作战",
            "desc": "给卧室换上温馨的壁纸！",
            "bw": 8, "bh": 8, "limit": 0, "maxmoves": 28,
            "s1": 2000, "s2": 4000, "s3": 6500,
            "tiles": [0, 1, 4, 11, 8, 6],  # Red,Blue,Purple,Wallpaper,Fabric,WoodLight
            "targets": [(11, 20), (8, 12), (4, 10)],
            "bcr": 100, "psc": 40, "gem": 3,
        },
        {
            "name": "Level_5", "id": 5, "lname": "豪华大挑战",
            "desc": "综合考验：收集所有材料完成豪华订单！",
            "bw": 9, "bh": 9, "limit": 0, "maxmoves": 40,
            "s1": 3500, "s2": 6000, "s3": 10000,
            "tiles": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
            "targets": [(6, 15), (9, 12), (8, 10), (4, 8)],
            "bcr": 150, "psc": 60, "gem": 5,
        },
    ]

    # TileType enum ints (from TileType.cs):
    # PaintRed=0, PaintBlue=1, PaintYellow=2, PaintGreen=3, PaintPurple=4,
    # PaintOrange=5, WoodLight=6, WoodDark=7, Fabric=8, Metal=9, Tile=10,
    # Wallpaper=11, Carpet=12, Glass=13
    # MaterialId mapping (TileType -> MaterialId):
    # RedPaint=1, Blue=2, Yellow=3, Green=4, Purple=5, Orange=6,
    # WoodLight=10, WoodDark=11, Fabric=12, Metal=13, Tile=14, Wallpaper=15
    tile_to_matid = {0:1, 1:2, 2:3, 3:4, 4:5, 5:6, 6:10, 7:11, 8:12, 9:13, 10:14, 11:15, 12:16, 13:17}

    for L in levels:
        hdr = asset_header(GUID_LEVELDATA, asset_name=L["name"])
        body = f"""  LevelId: {L['id']}
  LevelName: {L['lname']}
  Description: {L['desc']}
  LevelIcon: {{fileID: 0}}
  BoardWidth: {L['bw']}
  BoardHeight: {L['bh']}
  TileSize: 100
  TileSpacing: 5
  MaxMoves: {L.get('maxmoves', 30)}
  TimeLimitSeconds: {L.get('time', 120)}
  LimitType: {L['limit']}
  OneStarScore: {L['s1']}
  TwoStarScore: {L['s2']}
  ThreeStarScore: {L['s3']}
  CollectionTargets:
"""
        for ttype, amt in L["targets"]:
            mid = tile_to_matid.get(ttype, 0)
            body += f"""  - MaterialId: {mid}
    TileType: {ttype}
    RequiredAmount: {amt}
"""
        body += "  AvailableTileTypes:\n"
        for t in L["tiles"]:
            body += f"  - {t}\n"
        body += f"""  ObstacleSpawnRate: 0
  PredefinedObstacles: []
  BaseCoinsReward: {L['bcr']}
  PerStarCoinBonus: {L['psc']}
  GemReward: {L['gem']}
  ComboMultiplier2Match: 2
  ComboMultiplier3Match: 4
  ComboMultiplier4PlusMatch: 8
"""
        write(os.path.join(d, f"{L['name']}.asset"), hdr + body)


# ============================================================
#  MATERIALS (12)
# ============================================================
def gen_materials():
    d = os.path.join(ROOT, "Materials")
    ensure_dir(d)
    # (id, name, desc, category_int, color(rgba), tiletype_int, rarity, walls,floors,furniture,decor, styles(int[]))
    # MaterialCategory: Paint=0, Wood=1, Fabric=2, Metal=3, Tile=4, Wallpaper=5, Carpet=6, Glass=7
    mats = [
        (1,  "红色颜料",   "鲜艳的红色涂料",     0, (0.9,0.3,0.3), 0,  1, True,False,True,True, [0,2]),
        (2,  "蓝色颜料",   "宁静的蓝色涂料",     0, (0.3,0.5,0.9), 1,  1, True,False,True,True, [0,2]),
        (3,  "黄色颜料",   "明亮的黄色涂料",     0, (0.95,0.85,0.3), 2, 1, True,False,True,True, [0,2]),
        (4,  "绿色颜料",   "清新的绿色涂料",     0, (0.3,0.8,0.4), 3,  1, True,False,True,True, [0,9,2]),
        (5,  "紫色颜料",   "优雅的紫色涂料",     0, (0.7,0.4,0.85), 4, 1, True,False,True,True, [0,7,2]),
        (6,  "橙色颜料",   "温暖的橙色涂料",     0, (0.95,0.6,0.2), 5, 1, True,False,True,True, [0,10,2]),
        (10, "浅色木材",   "清新自然的浅色木料", 1, (0.85,0.7,0.5), 6, 1, False,True,True,True, [3,0,9]),
        (11, "深色木材",   "沉稳大气的深色木料", 1, (0.55,0.35,0.2), 7, 1, False,True,True,True, [1,7]),
        (12, "高级布料",   "柔软舒适的织物料",   2, (0.8,0.75,0.65), 8, 1, False,False,True,True, [0,8,9]),
        (13, "金属材料",   "坚固耐用的金属件",   3, (0.7,0.72,0.75), 9, 1, False,True,True,True, [4,0]),
        (14, "瓷砖",       "光滑易清洁的瓷砖",   4, (0.95,0.95,0.92), 10, 1, False,True,True,True, [0,2]),
        (15, "壁纸",       "精美图案的墙面壁纸", 5, (0.95,0.88,0.82), 11, 1, True,False,True,True, [3,8,9]),
    ]
    for mid, mname, desc, cat, col, tt, rarity, wl, fl, fur, dec, styles in mats:
        hdr = asset_header(GUID_MATERIALDATA, asset_name=f"Material_{mid}")
        styles_yaml = "\n".join(f"  - {s}" for s in styles)
        body = f"""  MaterialId: {mid}
  MaterialName: {mname}
  Description: {desc}
  Icon: {{fileID: 0}}
  Category: {cat}
  SourceTileType: {tt}
  MaterialColor: {color_str(*col)}
  RarityLevel: {rarity}
  UsedForWalls: {'1' if wl else '0'}
  UsedForFloors: {'1' if fl else '0'}
  UsedForFurniture: {'1' if fur else '0'}
  UsedForDecorations: {'1' if dec else '0'}
  StyleTags:
{styles_yaml}
"""
        write(os.path.join(d, f"Material_{mid}.asset"), hdr + body)


# ============================================================
#  CUSTOMERS (3)
# ============================================================
def gen_customers():
    d = os.path.join(ROOT, "Customers")
    ensure_dir(d)

    # DecorationStyle: Modern=0, Classic=1, Minimalist=2, Scandinavian=3,
    # Industrial=4, Bohemian=5, Retro=6, Luxurious=7, Cozy=8, Fresh=9,
    # Warm=10, Cool=11
    # MaterialCategory: Paint=0, Wood=1, Fabric=2, Metal=3, Tile=4, Wallpaper=5
    # FurnitureType: Sofa=0, Table=1, Chair=2, Bed=3, Cabinet=4, Bookshelf=5,
    # Lamp=6, Rug=7, Curtain=8, Decoration=9
    # CustomerPersonality: Easygoing=0, Demanding=1, Creative=2, BudgetConscious=3, Trendy=4, Traditional=5

    customers = [
        {
            "name": "Customer_Lily",
            "cid": "CUSTOMER_001", "cname": "莉莉", "age": 26,
            "job": "设计师", "bio": "追求时尚的年轻设计师，喜欢有创意的设计。",
            "minb": 500, "maxb": 1500, "pers": 2,
            "styles": [(0, 85), (2, 75), (3, 70), (1, 30), (4, 50)],
            "colors": [((0.95,0.9,0.85), 85), ((0.7,0.85,0.9), 80),
                       ((0.9,0.7,0.7), 60), ((0.4,0.4,0.4), 30)],
            "mats": [(0, 80), (2, 75), (1, 65), (3, 45), (4, 55)],
            "furns": [(0, 85), (1, 70), (7, 80), (9, 90)],
            "greetings": ["你好呀，想让我的客厅更有艺术感！", "我是莉莉，很高兴见到你~"],
            "hints": ["我喜欢明亮但不刺眼的颜色。", "多一些温暖的感觉会更好。"],
            "happy": ["哇，这就是我梦想中的家！", "太有创意了，完全超出预期！"],
            "disappointed": ["嗯...和我想象的不太一样。", "感觉还差点什么。"],
            "neutral": ["还不错，谢谢你的设计。", "整体可以接受。"],
        },
        {
            "name": "Customer_Nana",
            "cid": "CUSTOMER_002", "cname": "娜娜", "age": 31,
            "job": "自由撰稿人", "bio": "喜欢温馨舒适，希望卧室能放松身心。",
            "minb": 800, "maxb": 2200, "pers": 0,
            "styles": [(3, 90), (8, 85), (9, 75), (10, 70), (2, 65)],
            "colors": [((0.95,0.92,0.88), 90), ((0.85,0.78,0.7), 80),
                       ((0.78,0.88,0.78), 65), ((0.95,0.75,0.7), 45)],
            "mats": [(5, 85), (2, 90), (1, 70), (0, 50), (4, 55)],
            "furns": [(3, 95), (6, 80), (8, 85), (7, 75)],
            "greetings": ["嗨，请帮我打造一个能放松的卧室吧。", "想让卧室更温馨一些~"],
            "hints": ["我喜欢柔和的灯光和面料。", "木质的东西会让我很安心。"],
            "happy": ["感觉整个人都放松下来了，太谢谢你了！", "这正是我想要的感觉~"],
            "disappointed": ["好像有点太严肃了？", "我想要更温暖一些的氛围。"],
            "neutral": ["还行，整体挺舒服的。", "我再考虑看看。"],
        },
        {
            "name": "Customer_Mark",
            "cid": "CUSTOMER_003", "cname": "马克", "age": 38,
            "job": "律师", "bio": "注重实用和品质，书房需要商务感。",
            "minb": 1500, "maxb": 4000, "pers": 1,
            "styles": [(7, 90), (1, 85), (0, 70), (4, 75), (2, 60)],
            "colors": [((0.3,0.3,0.35), 85), ((0.6,0.5,0.4), 75),
                       ((0.2,0.25,0.4), 65), ((0.95,0.9,0.8), 50)],
            "mats": [(3, 90), (1, 85), (0, 55), (4, 70), (2, 40)],
            "furns": [(5, 95), (1, 85), (2, 70), (4, 80)],
            "greetings": ["我需要一个专业、高效的书房。", "效率和品质是最重要的。"],
            "hints": ["我经常加班，灯光很重要。", "书柜要够大，能装很多法律书籍。"],
            "happy": ["完美！这正是我想要的专业感。", "品质一流，我很满意。"],
            "disappointed": ["太花哨了，不够稳重。", "实用性不达标。"],
            "neutral": ["基本符合要求。", "勉强合格吧。"],
        },
    ]

    for C in customers:
        hdr = asset_header(GUID_CUSTOMERPROFILE, asset_name=C["name"])
        body = f"""  CustomerId: {C['cid']}
  CustomerName: {C['cname']}
  Avatar: {{fileID: 0}}
  Age: {C['age']}
  Occupation: {C['job']}
  Bio: {C['bio']}
  MinBudget: {C['minb']}
  MaxBudget: {C['maxb']}
"""
        body += "  StylePreferences:\n"
        for s, w in C["styles"]:
            body += f"  - Style: {s}\n    Weight: {w}\n"
        body += "  ColorPreferences:\n"
        for col, w in C["colors"]:
            body += f"  - Color: {color_str(*col)}\n    Weight: {w}\n"
        body += "  MaterialPreferences:\n"
        for m, w in C["mats"]:
            body += f"  - Category: {m}\n    Weight: {w}\n"
        body += "  FurniturePreferences:\n"
        for f, w in C["furns"]:
            body += f"  - FurnitureType: {f}\n    Weight: {w}\n"

        def str_arr(lines):
            if not lines:
                return "  SpecialRequirements: []\n"
            out = ""
            for L in lines:
                out += f"  - {L}\n"
            return out

        body += "  SpecialRequirements:\n"
        if C["cid"] == "CUSTOMER_001":
            body += "  - 客厅要有艺术挂画\n  - 需要充足的自然光\n"
        elif C["cid"] == "CUSTOMER_002":
            body += "  - 床边要有阅读灯\n  - 储物柜要充足\n"
        else:
            body += "  - 大书柜放法律书籍\n  - 会议桌需要两把椅子\n"

        body += f"  Personality: {C['pers']}\n"

        def yaml_lines(lines):
            if not lines:
                return " []"
            return "\n" + "\n".join(f"  - {L}" for L in lines)

        body += "  GreetingLines:" + yaml_lines(C["greetings"]) + "\n"
        body += "  HintLines:" + yaml_lines(C["hints"]) + "\n"
        body += "  HappyLines:" + yaml_lines(C["happy"]) + "\n"
        body += "  DisappointedLines:" + yaml_lines(C["disappointed"]) + "\n"
        body += "  NeutralLines:" + yaml_lines(C["neutral"]) + "\n"

        write(os.path.join(d, f"{C['name']}.asset"), hdr + body)


# ============================================================
#  FURNITURE (4)
# ============================================================
def gen_furniture():
    d = os.path.join(ROOT, "Furniture")
    ensure_dir(d)
    # (id, name, type_int, cost, comfort, durability, aesthetic, practicality,
    #  styles, primary_color, secondary_color, pmat, smat, dims)
    # FurnitureType: Sofa=0, Table=1, Chair=2, Bed=3, ...
    # MaterialCategory: Paint=0, Wood=1, Fabric=2, Metal=3, Tile=4, Wallpaper=5
    items = [
        (1, "舒适布艺沙发", 0, 500, 85, 65, 80, 75, [0, 8],
         (0.85,0.75,0.7), (0.4,0.35,0.3), 2, 1, (2.0, 0.9, 0.85)),
        (2, "实木餐桌",   1, 400, 60, 90, 75, 85, [1, 3],
         (0.6,0.42,0.28), (0.45,0.3,0.2), 1, 1, (1.5, 0.75, 0.9)),
        (3, "金属框架椅子", 2, 150, 55, 85, 70, 80, [0, 4],
         (0.3,0.3,0.32), (0.7,0.7,0.72), 3, 1, (0.5, 0.45, 0.85)),
        (4, "实木大床",   3, 800, 90, 88, 75, 70, [3, 8],
         (0.7,0.55,0.4), (0.85,0.8,0.7), 1, 2, (2.0, 0.5, 1.8)),
    ]
    for fid, fname, ft, cost, comf, dur, aes, prac, styles, pc, sc, pm, sm, dims in items:
        hdr = asset_header(GUID_FURNITUREITEM, script_fileid=FILEID_FURNITURE,
                           asset_name=f"Furniture_{fid}")
        styles_yaml = "\n".join(f"  - {s}" for s in styles)
        body = f"""  FurnitureId: {fid}
  FurnitureName: {fname}
  Type: {ft}
  PreviewImage: {{fileID: 0}}
  Prefab: {{fileID: 0}}
  StyleTags:
{styles_yaml}
  PrimaryColor: {color_str(*pc)}
  SecondaryColor: {color_str(*sc)}
  PrimaryMaterial: {pm}
  SecondaryMaterial: {sm}
  Cost: {cost}
  ComfortRating: {comf}
  DurabilityRating: {dur}
  AestheticRating: {aes}
  PracticalityRating: {prac}
  Dimensions: {{x: {dims[0]}, y: {dims[1]}, z: {dims[2]}}}
"""
        write(os.path.join(d, f"Furniture_{fid}.asset"), hdr + body)


# ============================================================
#  PALETTES (3)
# ============================================================
def gen_palettes():
    d = os.path.join(ROOT, "Palettes")
    ensure_dir(d)
    # (id, name, wall_p, wall_a, wall_mat, floor_p, floor_pat, floor_mat,
    #  wall_styles, floor_styles, overall_styles, wall_matid, floor_matid,
    #  wall_amt, floor_amt)
    palettes = [
        (1, "现代简约白",
         (0.95,0.94,0.92), (0.85,0.85,0.88), 0,
         (0.92,0.88,0.82), (0.95,0.95,0.95), 4,
         [2, 0], [0, 3], [0, 2, 3],
         3, 14, 10, 8),
        (2, "北欧暖木色",
         (0.98,0.95,0.9), (0.9,0.82,0.7), 0,
         (0.78,0.65,0.5), (0.7,0.55,0.4), 1,
         [3, 9, 10], [3, 8], [3, 8, 9],
         3, 10, 12, 10),
        (3, "豪华深色系",
         (0.22,0.23,0.28), (0.35,0.25,0.2), 0,
         (0.5,0.4,0.3), (0.35,0.35,0.35), 1,
         [7, 1], [7, 4], [7, 1, 4],
         5, 11, 10, 8),
    ]
    for pid, pname, wp, wa, wm, fp, fp2, fm, ws, fs, os_, wmid, fmid, wamt, famt in palettes:
        hdr = asset_header(GUID_FURNITUREITEM, script_fileid=FILEID_PALETTE,
                           asset_name=f"Palette_{pid}")
        wsy = "\n".join(f"  - {s}" for s in ws)
        fsy = "\n".join(f"  - {s}" for s in fs)
        osy = "\n".join(f"  - {s}" for s in os_)
        body = f"""  PaletteId: {pid}
  PaletteName: {pname}
  WallPrimary: {color_str(*wp)}
  WallAccent: {color_str(*wa)}
  WallStyleTags:
{wsy}
  WallMaterial: {wm}
  FloorPrimary: {color_str(*fp)}
  FloorPattern: {color_str(*fp2)}
  FloorStyleTags:
{fsy}
  FloorMaterial: {fm}
  OverallStyleTags:
{osy}
  WallMaterialId: {wmid}
  FloorMaterialId: {fmid}
  WallMaterialAmount: {wamt}
  FloorMaterialAmount: {famt}
"""
        write(os.path.join(d, f"Palette_{pid}.asset"), hdr + body)


# ============================================================
#  ORDERS (3)
# ============================================================
def gen_orders():
    d = os.path.join(ROOT, "Orders")
    ensure_dir(d)
    # OrderCategory: LivingRoom=0, Bedroom=1, Kitchen=2, Bathroom=3, Study=4, Balcony=5
    # RoomSize: Small=0, Medium=1, Large=2
    # DecorationSlotType: WallColor=0, FloorColor=1, MainFurniture=2, SecondaryFurniture=3,
    # Lighting=4, Decoration=5, Textile=6, Custom=7
    # NOTE: customer SO references - for now we use {fileID: 0} because we can't
    # easily reference other asset fileIDs from outside Unity without a library.
    # DataManager will code-fill customer, furniture, palette lists at runtime.

    orders = [
        {
            "name": "Order_1", "id": 1,
            "title": "莉莉的客厅大改造", "desc": "为设计师莉莉打造一个充满艺术感的现代客厅，需要明亮温馨的配色方案。",
            "cat": 0, "rsize": 1, "minb": 500, "maxb": 1500,
            "breward": 200, "srmul": 100, "gem": 1,
            "levels": [1],
            "priority": 1, "ul": -1, "minlvl": 0, "tlimit": 0,
            "slots": [
                ("s1", "墙面色彩", 0, "打造明亮舒适的墙面", [0, 3], True, 5, 15),
                ("s2", "地板材质", 1, "客厅地板需要耐磨", [0, 1, 3], True, 8, 15),
                ("s3", "主要家具", 2, "沙发是客厅核心", [0], True, 400, 800),
                ("s4", "装饰点缀", 5, "增添艺术氛围", [0, 9], False, 50, 200),
            ],
        },
        {
            "name": "Order_2", "id": 2,
            "title": "娜娜的温馨卧室", "desc": "给自由撰稿人娜娜一个能放松身心的北欧风卧室，木质元素和柔和灯光是关键。",
            "cat": 1, "rsize": 1, "minb": 800, "maxb": 2200,
            "breward": 350, "srmul": 120, "gem": 2,
            "levels": [2, 4],
            "priority": 2, "ul": 1, "minlvl": 1, "tlimit": 0,
            "slots": [
                ("w1", "墙面壁纸", 0, "温馨墙面壁纸", [3, 9], True, 10, 20),
                ("f1", "地板木材", 1, "温馨木地板", [3, 1], True, 10, 18),
                ("mf", "核心床具", 2, "大尺寸舒适床", [3], True, 600, 1200),
                ("lg", "柔和灯光", 4, "营造氛围", [3, 8], False, 100, 300),
            ],
        },
        {
            "name": "Order_3", "id": 3,
            "title": "马克的律师书房", "desc": "为律师马克打造专业稳重的豪华书房，深色系配色，必须有超大书柜。",
            "cat": 4, "rsize": 2, "minb": 1500, "maxb": 4000,
            "breward": 600, "srmul": 150, "gem": 4,
            "levels": [3, 5],
            "priority": 3, "ul": 2, "minlvl": 2, "tlimit": 0,
            "slots": [
                ("w1", "书房墙面", 0, "稳重的墙面颜色", [7, 1], True, 8, 16),
                ("f1", "书房地板", 1, "深色实木地板", [1, 7], True, 12, 20),
                ("bk", "书柜主体", 2, "大尺寸书柜", [1], True, 800, 2000),
                ("tb", "办公桌椅", 3, "桌椅组合", [4, 0], True, 500, 1200),
                ("deco", "装饰", 5, "书架装饰品", [7, 1], False, 100, 400),
            ],
        },
    ]
    for O in orders:
        hdr = asset_header(GUID_DECORATIONORDER, asset_name=O["name"])
        body = f"""  OrderId: {O['id']}
  OrderTitle: {O['title']}
  OrderDescription: {O['desc']}
  Category: {O['cat']}
  RoomSize: {O['rsize']}
  RoomPreview: {{fileID: 0}}
  Customer: {{fileID: 0}}
  PriorityLevel: {O['priority']}
  BudgetMin: {O['minb']}
  BudgetMax: {O['maxb']}
  BaseReward: {O['breward']}
  StarRewardMultiplier: {O['srmul']}
  GemReward: {O['gem']}
  RequiredLevelIds:
"""
        for lv in O["levels"]:
            body += f"  - {lv}\n"
        body += "  RequiredSlots:\n"
        for sid, sname, stype, sdesc, sprefs, required, minc, maxc in O["slots"][:3]:  # 3 required
            sty = "\n".join(f"    - {s}" for s in sprefs)
            body += f"""  - SlotId: {sid}
    SlotName: {sname}
    SlotType: {stype}
    Description: {sdesc}
    PreferredStyles:
{sty}
    AvailableFurniture: []
    AvailableColorPalettes: []
    AvailableMaterials: []
    IsRequired: {'1' if required else '0'}
    MinMaterialCost: {minc}
    MaxMaterialCost: {maxc}
"""
        body += "  OptionalSlots:\n"
        for sid, sname, stype, sdesc, sprefs, required, minc, maxc in O["slots"][3:]:  # rest optional
            sty = "\n".join(f"    - {s}" for s in sprefs)
            body += f"""  - SlotId: {sid}
    SlotName: {sname}
    SlotType: {stype}
    Description: {sdesc}
    PreferredStyles:
{sty}
    AvailableFurniture: []
    AvailableColorPalettes: []
    AvailableMaterials: []
    IsRequired: {'1' if required else '0'}
    MinMaterialCost: {minc}
    MaxMaterialCost: {maxc}
"""
        body += f"""  TimeLimitMinutes: {O['tlimit']}
  UnlockOrderId: {O['ul']}
  MinLevelRequirement: {O['minlvl']}
"""
        write(os.path.join(d, f"{O['name']}.asset"), hdr + body)


# ============================================================
#  ACHIEVEMENTS (7)
# ============================================================
def gen_achievements():
    d = os.path.join(ROOT, "Achievements")
    ensure_dir(d)
    # AchievementCategory: Match3=0, Decoration=1, Collection=2, Social=3, Special=4, Tutorial=5
    # AchievementConditionType: TotalMatches=0, LevelsCompleted=1, PerfectLevels=2,
    # ComboReached=3, MaterialsCollected=4, OrdersCompleted=5, FiveStarOrders=6,
    # HighScore=7, TotalCoinsEarned=8, PlayTime=9, ConsecutiveDays=10, DailyChallengesCompleted=11
    achs = [
        ("ACH_FIRST_MATCH",   "首次消除",   "完成你的第一次三消匹配。",         4, 0, 1,    50, 0, False),
        ("ACH_100_MATCHES",   "消除达人",   "累计完成 100 次三消匹配。",       0, 0, 100,  200, 1, False),
        ("ACH_LEVEL_1",       "初出茅庐",   "通过第 1 关。",                   0, 1, 1,    100, 0, False),
        ("ACH_LEVELS_5",      "五关斩将",   "总共通过 5 个关卡。",             0, 1, 5,    500, 3, False),
        ("ACH_ORDER_1",       "第一单",     "完成第一个装修订单。",             1, 5, 1,    150, 1, False),
        ("ACH_ORDERS_3",      "订单大师",   "完成 3 个装修订单。",             1, 5, 3,    600, 4, False),
        ("ACH_COLLECTOR_50",  "材料收集者", "累计收集 50 份材料。",             2, 4, 50,   300, 2, False),
    ]
    for aid, aname, adesc, cat, ct, tv, cr, gr, hidden in achs:
        hdr = asset_header(GUID_ACHIEVEMENTDATA, asset_name=aid)
        body = f"""  AchievementId: {aid}
  Name: {aname}
  Description: {adesc}
  Icon: {{fileID: 0}}
  LockedIcon: {{fileID: 0}}
  Category: {cat}
  ConditionType: {ct}
  TargetValue: {tv}
  CoinReward: {cr}
  GemReward: {gr}
  RewardItemId:
  IsHidden: {'1' if hidden else '0'}
  Milestones: []
"""
        write(os.path.join(d, f"{aid}.asset"), hdr + body)


# ============================================================
#  DAILY CHALLENGES (4)
# ============================================================
def gen_daily_challenges():
    d = os.path.join(ROOT, "DailyChallenges")
    ensure_dir(d)
    # DailyChallengeType: ScoreTarget=0, MatchCount=1, MaterialCollection=2,
    # TimeAttack=3, NoFailLevel=4
    chs = [
        ("CHALLENGE_DAILY_SCORE",    "每日分数挑战",   "在任意关卡达到 2000 分。",        0, 0, 2000, 120, 3, 300, 2, 1, 2),
        ("CHALLENGE_DAILY_MATERIAL", "材料收集挑战",   "累计收集 30 份任意材料。",        2, 1, 30,   180, 3, 250, 1, 1, 1),
        ("CHALLENGE_DAILY_COMBO",    "连击高手",       "达成 5 连击。",                   1, 2, 5,    90,  5, 400, 3, 1, 3),
        ("CHALLENGE_DAILY_NOFAIL",   "无失败挑战",     "通过一关且不超过 1 次失败。",     4, 3, 1,    180, 1, 600, 5, 1, 4),
    ]
    for cid, cname, cdesc, chtype, lid, tv, dur, mf, cr, gr, sr, diff in chs:
        hdr = asset_header(GUID_DAILYCHALLENGE, asset_name=cid)
        body = f"""  ChallengeId: {cid}
  Title: {cname}
  Description: {cdesc}
  Icon: {{fileID: 0}}
  ChallengeType: {chtype}
  LevelId: {lid}
  TargetValue: {tv}
  DurationSeconds: {dur}
  MaxFailsAllowed: {mf}
  CoinReward: {cr}
  GemReward: {gr}
  StarReward: {sr}
  DifficultyLevel: {diff}
"""
        write(os.path.join(d, f"{cid}.asset"), hdr + body)


# ============================================================
#  MAIN
# ============================================================
def main():
    ensure_dir(ROOT)
    gen_levels()
    gen_materials()
    gen_customers()
    gen_furniture()
    gen_palettes()
    gen_orders()
    gen_achievements()
    gen_daily_challenges()
    print(f"\nDone. All assets generated under: {ROOT}")
    # count files
    total = 0
    for sub in ["Levels", "Materials", "Customers", "Furniture", "Palettes",
                "Orders", "Achievements", "DailyChallenges"]:
        n = len(os.listdir(os.path.join(ROOT, sub)))
        total += n
        print(f"  {sub}: {n}")
    print(f"Total: {total} .asset files")


if __name__ == "__main__":
    main()
