define narrator = Character(None, what_color="#c8c8c8")
define detective = Character("侦探", color="#6eb5ff")
define director = Character("导演·陈明远", color="#ff9e6e")
define actress = Character("女主角·林雪薇", color="#ff6eb5")
define stagehand = Character("舞台工人·赵大勇", color="#b5ff6e")
define props_master = Character("道具主管·王芝兰", color="#ffe06e")

image bg_lobby = Solid("#2a1f3d")
image bg_stage = Solid("#1a1520")
image bg_backstage = Solid("#1a1a1a")
image bg_dressing_room = Solid("#2d1f2d")
image bg_prop_room = Solid("#1f2a1f")

label start:
    $ store.level_config.set_difficulty(LevelConfig.DIFFICULTY_NORMAL)
    $ store.ui_state.reset()
    $ store.hint_system.reset_all()
    $ store.settlement_system.reset()
    $ store.ending_system.reset()
    $ analytics_reset()
    jump prologue

label prologue:
    $ store.level_config.advance_to_chapter(LevelConfig.CHAPTER_PROLOGUE)
    $ analytics_start("chapter_prologue")
    $ store.ui_state.push_state(UIState.DIALOGUE)

    scene bg_lobby with fade

    narrator "夜幕降临，老剧院的灯光在雨幕中闪烁。"
    narrator "你是一名侦探，接到紧急报案——镇上最珍贵的王冠道具在排练期间神秘失踪。"

    detective "这案子不简单。王冠道具在排练时失踪，说明是内部人作案。"

    menu:
        "先去大厅了解情况":
            $ analytics_record_choice("prologue_start", "先去大厅了解情况")
            detective "先从大厅开始调查，也许有人看到了什么。"
        "直接去舞台查看现场":
            $ analytics_record_choice("prologue_start", "直接去舞台查看现场")
            detective "现场是最重要的，先去舞台看看有没有线索。"

    narrator "你推开了老剧院沉重的大门，一股陈旧的气息扑面而来。"

    $ tutorial_id = store.tutorial_system.should_trigger(LevelConfig.CHAPTER_PROLOGUE)
    if tutorial_id:
        $ store.tutorial_system.start_tutorial(tutorial_id)
        call screen tutorial_overlay

    $ store.ui_state.push_state(UIState.INVESTIGATION)
    jump prologue_hub

label prologue_hub:
    $ _prologue_evidence = len(store.evidence_board.get_discovered())

    menu prologue_hub_menu:
        "调查大厅":
            jump prologue_lobby
        "调查舞台":
            jump prologue_stage
        "调查后台":
            jump prologue_backstage
        "查看提示 [H]":
            $ hint = store.hint_system.get_next_hint()
            if hint:
                narrator "[hint['text']]"
            else:
                narrator "继续调查各处，收集线索。"
            jump prologue_hub
        "完成序幕调查" if _prologue_evidence >= 2:
            narrator "你已收集到足够的初步线索，对案件有了基本了解。"
            jump prologue_settlement

    jump prologue_hub

label prologue_lobby:
    scene bg_lobby with fade

    narrator "大厅里空无一人，但地上有奇怪的粉末痕迹……"

    menu prologue_lobby_menu:
        "采集粉末样本" if not store.evidence_board.is_evidence_discovered("powder_trail"):
            $ store.evidence_board.discover("powder_trail")
            $ analytics_record_choice("lobby_powder", "采集粉末样本")
            detective "这粉末……像是道具室里用来保养道具的特殊粉末。有人从道具室一路走到了大厅。"
            jump prologue_lobby_menu

        "查看售票台" if not store.evidence_board.is_evidence_discovered("mysterious_note"):
            $ store.evidence_board.discover("mysterious_note")
            $ analytics_record_choice("lobby_note", "查看售票台")
            detective "售票台的抽屉没有上锁，里面有一张神秘字条，上面写着'今晚行动'。"
            jump prologue_lobby_menu

        "返回":
            jump prologue_hub

label prologue_stage:
    scene bg_stage with fade

    narrator "舞台上还残留着排练的痕迹，王冠原本就放在中央的展示台上。"

    menu prologue_stage_menu:
        "检查展示台的锁" if not store.evidence_board.is_evidence_discovered("broken_lock"):
            $ store.evidence_board.discover("broken_lock")
            $ analytics_record_choice("stage_lock", "检查展示台的锁")
            detective "锁被撬开了！手法很专业，不是一般人能做到的。"
            jump prologue_stage_menu

        "查看舞台两侧" if not store.evidence_board.is_evidence_discovered("missing_prop_crown"):
            $ store.evidence_board.discover("missing_prop_crown")
            $ analytics_record_choice("stage_sides", "查看舞台两侧")
            detective "舞台右侧的幕布后面有拖拽的痕迹，似乎有人把重物从这里拖走了。"
            jump prologue_stage_menu

        "返回":
            jump prologue_hub

label prologue_backstage:
    scene bg_backstage with fade

    narrator "后台通道昏暗狭窄，墙上的道具挂架有些是空的。"

    menu prologue_backstage_menu:
        "仔细检查通道尽头" if not store.evidence_board.is_evidence_discovered("hidden_compartment"):
            $ store.evidence_board.discover("hidden_compartment")
            $ analytics_record_choice("backstage_compartment", "检查通道尽头")
            detective "通道尽头有一个暗格！里面是空的，但明显最近被人打开过。这是藏东西的好地方。"
            jump prologue_backstage_menu

        "查看配电箱" if not store.evidence_board.is_evidence_discovered("stagehand_toolbox"):
            $ store.evidence_board.discover("stagehand_toolbox")
            $ analytics_record_choice("backstage_toolbox", "查看配电箱和工具箱")
            detective "配电箱的灯在19:30到20:00之间被人关过。旁边的工具箱被道具主管借走过，里面有撬锁工具。"
            jump prologue_backstage_menu

        "返回":
            jump prologue_hub

label prologue_settlement:
    $ analytics_end("chapter_prologue")
    narrator "序幕调查结束。你已掌握了初步线索，接下来需要更深入地调查各处。"
    jump ch1_start

label ch1_start:
    $ store.level_config.advance_to_chapter(LevelConfig.CHAPTER_CH1)
    $ analytics_start("chapter_ch1")
    $ store.hint_system.reset_chapter_hints()
    $ store.ui_state.push_state(UIState.INVESTIGATION)

    $ tutorial_id = store.tutorial_system.should_trigger(LevelConfig.CHAPTER_CH1)
    if tutorial_id:
        $ store.tutorial_system.start_tutorial(tutorial_id)
        call screen tutorial_overlay

    narrator "调查进入新阶段。你需要在各个场景之间穿梭，收集更多证据。"
    narrator "按 T 键可以查看时间线，按 E 键可以打开证据板。"

    jump ch1_hub

label ch1_hub:
    $ _return_hub = "ch1_hub"
    $ _ch1_complete = store.level_config.is_chapter_complete(LevelConfig.CHAPTER_CH1)

    menu ch1_hub_menu:
        "大厅":
            jump ch1_lobby
        "舞台":
            jump ch1_stage
        "后台":
            jump ch1_backstage
        "化妆间":
            jump ch1_dressing_room
        "道具室":
            jump ch1_prop_room
        "查看证据板 [E]":
            call screen evidence_board
            jump ch1_hub
        "查看时间线 [T]":
            call screen timeline
            jump ch1_hub
        "查看提示 [H]":
            $ hint = store.hint_system.get_next_hint()
            if hint:
                narrator "[hint['text']]"
            else:
                narrator "暂时没有更多提示了。"
            jump ch1_hub
        "完成本章调查" if _ch1_complete:
            jump ch1_settlement

    jump ch1_hub

label ch1_lobby:
    scene bg_lobby with fade

    menu ch1_lobby_menu:
        "采集粉末样本" if not store.evidence_board.is_evidence_discovered("powder_trail"):
            $ store.evidence_board.discover("powder_trail")
            detective "这粉末像是道具室的特殊保养粉末。有人从道具室一路走到了大厅。"
            jump ch1_lobby_menu
        "查看售票台" if not store.evidence_board.is_evidence_discovered("mysterious_note"):
            $ store.evidence_board.discover("mysterious_note")
            detective "售票台抽屉里有一张写着'今晚行动'的字条。"
            jump ch1_lobby_menu
        "返回":
            jump scene_return

label ch1_stage:
    scene bg_stage with fade

    menu ch1_stage_menu:
        "检查展示台锁" if not store.evidence_board.is_evidence_discovered("broken_lock"):
            $ store.evidence_board.discover("broken_lock")
            detective "锁被专业手法撬开，这不是一般人能做到的。"
            jump ch1_stage_menu
        "检查舞台两侧" if not store.evidence_board.is_evidence_discovered("missing_prop_crown"):
            $ store.evidence_board.discover("missing_prop_crown")
            detective "右侧幕布后有拖拽痕迹，有人把重物从这里拖走了。"
            jump ch1_stage_menu
        "返回":
            jump scene_return

label ch1_backstage:
    scene bg_backstage with fade

    menu ch1_backstage_menu:
        "检查通道尽头" if not store.evidence_board.is_evidence_discovered("hidden_compartment"):
            $ store.evidence_board.discover("hidden_compartment")
            detective "通道尽头有一个暗格，里面已空但明显最近被人打开过。"
            jump ch1_backstage_menu
        "查看配电箱和工具箱" if not store.evidence_board.is_evidence_discovered("stagehand_toolbox"):
            $ store.evidence_board.discover("stagehand_toolbox")
            detective "配电箱在19:30到20:00间被关过。工具箱曾被道具主管借走，内有撬锁工具。"
            jump ch1_backstage_menu
        "返回":
            jump scene_return

label ch1_dressing_room:
    scene bg_dressing_room with fade

    narrator "化妆间弥漫着香水的味道，化妆台上整齐地摆放着各种用品。"

    menu ch1_dressing_menu:
        "检查化妆台抽屉" if not store.evidence_board.is_evidence_discovered("actress_glove"):
            $ store.evidence_board.discover("actress_glove")
            detective "抽屉里有一只不属于这里的手套，上面沾着和舞台上一样的粉末。这是女演员的手套！"
            jump ch1_dressing_menu
        "查看衣柜":
            detective "衣柜里有一件沾了灰的演出服，似乎最近被穿过。口袋里有些碎屑。"
            jump ch1_dressing_menu
        "返回":
            jump scene_return

label ch1_prop_room:
    scene bg_prop_room with fade

    narrator "道具室里堆满了各种演出用品，空气中弥漫着木材和颜料的气味。"

    menu ch1_prop_menu:
        "检查道具账本" if not store.evidence_board.is_evidence_discovered("props_master_ledger"):
            $ store.evidence_board.discover("props_master_ledger")
            detective "账本记录了制作王冠复制品的条目，申请理由为'备用'。这笔账目很可疑。"
            jump ch1_prop_menu
        "查看工作台" if not store.evidence_board.is_evidence_discovered("duplicate_crown"):
            $ store.evidence_board.discover("duplicate_crown")
            detective "工作台上有制作复制品的工具和材料。一个复制品王冠已经完成了！但真品在哪里？"
            jump ch1_prop_menu
        "返回":
            jump scene_return


label ch1_settlement:
    $ result = store.settlement_system.calculate_chapter_score(LevelConfig.CHAPTER_CH1)
    $ analytics_end("chapter_ch1")

    narrator "第一章完成！"
    narrator "证据收集：[result['evidence_found']] / [result['evidence_total']]"
    narrator "矛盾发现：[result['contradictions_found']]"
    narrator "线索连接：[result['connections_made']]"
    narrator "评分：[result['total_score']] 分 —— 等级 [result['grade']]"

    jump ch2_start

label ch2_start:
    $ store.level_config.advance_to_chapter(LevelConfig.CHAPTER_CH2)
    $ analytics_start("chapter_ch2")
    $ store.hint_system.reset_chapter_hints()

    $ tutorial_id = store.tutorial_system.should_trigger(LevelConfig.CHAPTER_CH2)
    if tutorial_id:
        $ store.tutorial_system.start_tutorial(tutorial_id)
        call screen tutorial_overlay

    narrator "现在你可以正式审讯嫌疑人了。你的提问角度会影响嫌疑度。"
    narrator "按 S 键可以查看嫌疑板。"

    jump ch2_hub

label ch2_hub:
    $ _return_hub = "ch2_hub"
    $ _ch2_complete = store.level_config.is_chapter_complete(LevelConfig.CHAPTER_CH2)

    menu ch2_hub_menu:
        "审讯导演·陈明远" if not store.suspicion_system.suspects["director"]["interrogated"]:
            jump ch2_interview_director
        "审讯女主角·林雪薇" if not store.suspicion_system.suspects["actress"]["interrogated"]:
            jump ch2_interview_actress
        "审讯舞台工人·赵大勇" if not store.suspicion_system.suspects["stagehand"]["interrogated"]:
            jump ch2_interview_stagehand
        "审讯道具主管·王芝兰" if not store.suspicion_system.suspects["props_master"]["interrogated"]:
            jump ch2_interview_props_master
        "重新审讯导演" if store.suspicion_system.suspects["director"]["interrogated"]:
            jump ch2_interview_director
        "重新审讯女主角" if store.suspicion_system.suspects["actress"]["interrogated"]:
            jump ch2_interview_actress
        "重新审讯舞台工人" if store.suspicion_system.suspects["stagehand"]["interrogated"]:
            jump ch2_interview_stagehand
        "重新审讯道具主管" if store.suspicion_system.suspects["props_master"]["interrogated"]:
            jump ch2_interview_props_master
        "继续调查场景":
            jump ch2_scene_hub
        "查看嫌疑板 [S]":
            call screen suspicion_board
            jump ch2_hub
        "查看证据板 [E]":
            call screen evidence_board
            jump ch2_hub
        "查看提示 [H]":
            $ hint = store.hint_system.get_next_hint()
            if hint:
                narrator "[hint['text']]"
            else:
                narrator "暂时没有更多提示了。"
            jump ch2_hub
        "完成审讯阶段" if _ch2_complete:
            jump ch2_settlement

    jump ch2_hub

label ch2_scene_hub:
    menu ch2_scene_menu:
        "大厅":
            jump ch1_lobby
        "舞台":
            jump ch1_stage
        "后台":
            jump ch1_backstage
        "化妆间":
            jump ch1_dressing_room
        "道具室":
            jump ch1_prop_room
        "返回审讯":
            jump interview_return

label ch2_interview_director:
    scene bg_lobby with fade

    director "你是来调查王冠失窃的？我当时一直在观众席指导排练，根本没靠近过舞台。"

    menu ch2_dir_menu:
        "你确定整个晚上都在观众席吗？":
            $ analytics_record_choice("ch2_dir_1", "质问导演不在场证明")
            director "我……中间确实去了一趟洗手间，大概十分钟左右。但我绝对没有去舞台！你可以问其他人。"
            $ store.suspicion_system.adjust_suspicion("director", 10, "十分钟的空白时间")
            $ store.evidence_board.discover("director_alibi")
            jump ch2_dir_menu

        "你和道具主管的关系如何？":
            $ analytics_record_choice("ch2_dir_2", "询问导演与道具主管关系")
            director "王芝兰？那个人我信不过。她的账目总是不清不楚，我也提醒过院方，但没人听。"
            $ store.suspicion_system.adjust_suspicion("props_master", 5, "导演的评价")
            jump ch2_dir_menu

        "结束审讯":
            $ store.suspicion_system.mark_interrogated("director")
            narrator "导演的说辞有些地方值得推敲，需要更多证据来验证。"
            jump interview_return

label ch2_interview_actress:
    scene bg_dressing_room with fade

    actress "王冠不见了？我当时在化妆间准备第二幕的戏份，完全不知道发生了什么。"

    menu ch2_act_menu:
        "化妆间里发现了你的手套，上面有舞台的粉末。" if store.evidence_board.is_evidence_discovered("actress_glove"):
            $ analytics_record_choice("ch2_act_1", "用手套证据质疑女演员")
            actress "那手套……我之前去舞台取过道具，不小心弄脏了手套就放回化妆间了。但这和王冠失窃没有关系！"
            $ store.suspicion_system.adjust_suspicion("actress", 15, "手套证据与证词矛盾")
            jump ch2_act_menu

        "你和导演是什么关系？":
            $ analytics_record_choice("ch2_act_2", "询问女演员与导演关系")
            actress "陈导演是我的老师，他一直很照顾我。但最近他压力很大，总觉得有人在暗中做手脚。"
            $ store.suspicion_system.adjust_suspicion("director", 5, "女演员提到导演的压力")
            jump ch2_act_menu

        "结束审讯":
            $ store.suspicion_system.mark_interrogated("actress")
            narrator "林雪薇看起来很紧张，但她的话似乎也有几分道理。"
            jump interview_return

label ch2_interview_stagehand:
    scene bg_backstage with fade

    stagehand "别看我，我只是在后台修灯光。我什么都不知道。"

    menu ch2_stg_menu:
        "后台的配电箱在19:30到20:00被关了，你当时在哪？" if store.evidence_board.is_evidence_discovered("hidden_compartment"):
            $ analytics_record_choice("ch2_stg_1", "用配电箱证据质问舞台工人")
            stagehand "配电箱？那是断电事故，不是我干的！我当时在东边通道修灯，可以查我的工具记录。至于那个暗格……我不知道什么暗格。"
            $ store.suspicion_system.adjust_suspicion("stagehand", 10, "对配电箱事件的反应")
            jump ch2_stg_menu

        "你的工具箱最近借给谁了？":
            $ analytics_record_choice("ch2_stg_2", "询问工具箱去向")
            stagehand "工具箱？上周王芝兰借走过，说要修什么道具架子。但我跟她早没关系了，别把我和她的事扯在一起。"
            $ store.suspicion_system.adjust_suspicion("props_master", 10, "借走工具箱")
            $ store.suspicion_system.add_evidence_against("props_master", "stagehand_toolbox")
            jump ch2_stg_menu

        "结束审讯":
            $ store.suspicion_system.mark_interrogated("stagehand")
            narrator "赵大勇的反应很激烈，他似乎在隐藏什么，也可能只是不想被冤枉。"
            jump interview_return

label ch2_interview_props_master:
    scene bg_prop_room with fade

    props_master "王冠丢了？我17:30就到了，一直在道具室整理物品。那东西不是我负责保管的。"

    menu ch2_propm_menu:
        "账本上记录了你制作了王冠复制品。" if store.evidence_board.is_evidence_discovered("props_master_ledger"):
            $ analytics_record_choice("ch2_propm_1", "用账本证据质问道具主管")
            props_master "复制品？那……那是导演让我做的！他说需要备用道具以防万一。我只是照吩咐做事。"
            $ store.suspicion_system.adjust_suspicion("props_master", 15, "制作复制品但推给导演")
            $ store.suspicion_system.adjust_suspicion("director", 10, "可能指使制作复制品")
            $ store.suspicion_system.add_evidence_against("props_master", "props_master_ledger")
            jump ch2_propm_menu

        "有人看到你借过赵大勇的工具箱。" if store.evidence_board.is_evidence_discovered("stagehand_toolbox"):
            $ analytics_record_choice("ch2_propm_2", "用工具箱证据质问道具主管")
            props_master "我借工具箱是修架子用的，和赵大勇的事早就了结了。你们别想套我的话。"
            $ store.suspicion_system.adjust_suspicion("props_master", 5, "对工具箱的辩解不够有力")
            jump ch2_propm_menu

        "结束审讯":
            $ store.suspicion_system.mark_interrogated("props_master")
            narrator "王芝兰在推卸责任，但她说导演让她做复制品——这又是另一条线索。"
            jump interview_return

label ch2_settlement:
    $ result = store.settlement_system.calculate_chapter_score(LevelConfig.CHAPTER_CH2)
    $ analytics_end("chapter_ch2")

    narrator "第二章完成！"
    narrator "审讯完成：[result['interrogated']] / [result['interrogated_required']]"
    narrator "评分：[result['total_score']] 分 —— 等级 [result['grade']]"

    jump ch3_start

label ch3_start:
    $ store.level_config.advance_to_chapter(LevelConfig.CHAPTER_CH3)
    $ analytics_start("chapter_ch3")
    $ store.hint_system.reset_chapter_hints()

    $ tutorial_id = store.tutorial_system.should_trigger(LevelConfig.CHAPTER_CH3)
    if tutorial_id:
        $ store.tutorial_system.start_tutorial(tutorial_id)
        call screen tutorial_overlay

    narrator "交叉质证阶段！现在你可以用证据直接对质嫌疑人。"

    jump ch3_hub

label ch3_hub:
    $ _ch3_complete = store.level_config.is_chapter_complete(LevelConfig.CHAPTER_CH3)

    menu ch3_hub_menu:
        "用证据对质导演" if store.suspicion_system.suspects["director"]["interrogated"]:
            jump ch3_confront_director
        "用证据对质女主角" if store.suspicion_system.suspects["actress"]["interrogated"]:
            jump ch3_confront_actress
        "用证据对质舞台工人" if store.suspicion_system.suspects["stagehand"]["interrogated"]:
            jump ch3_confront_stagehand
        "用证据对质道具主管" if store.suspicion_system.suspects["props_master"]["interrogated"]:
            jump ch3_confront_props_master
        "审讯尚未问话的嫌疑人" if not store.suspicion_system.suspects["director"]["interrogated"] or not store.suspicion_system.suspects["actress"]["interrogated"] or not store.suspicion_system.suspects["stagehand"]["interrogated"] or not store.suspicion_system.suspects["props_master"]["interrogated"]:
            jump ch3_interview_hub
        "重新审讯嫌疑人":
            jump ch3_interview_hub
        "继续调查场景":
            jump ch3_scene_hub
        "查看嫌疑板 [S]":
            call screen suspicion_board
            jump ch3_hub
        "查看证据板 [E]":
            call screen evidence_board
            jump ch3_hub
        "查看时间线 [T]":
            call screen timeline
            jump ch3_hub
        "查看提示 [H]":
            $ hint = store.hint_system.get_next_hint()
            if hint:
                narrator "[hint['text']]"
            else:
                narrator "暂时没有更多提示了。"
            jump ch3_hub
        "完成质证阶段" if _ch3_complete:
            jump ch3_settlement

    jump ch3_hub

label ch3_interview_hub:
    $ _return_hub = "ch3_hub"
    menu ch3_interview_menu:
        "审讯导演·陈明远":
            jump ch2_interview_director
        "审讯女主角·林雪薇":
            jump ch2_interview_actress
        "审讯舞台工人·赵大勇":
            jump ch2_interview_stagehand
        "审讯道具主管·王芝兰":
            jump ch2_interview_props_master
        "返回质证菜单":
            jump ch3_hub

label ch3_scene_hub:
    $ _return_hub = "ch3_hub"
    menu ch3_scene_menu:
        "大厅":
            jump ch1_lobby
        "舞台":
            jump ch1_stage
        "后台":
            jump ch1_backstage
        "化妆间":
            jump ch1_dressing_room
        "道具室":
            jump ch1_prop_room
        "返回质证菜单":
            $ renpy.jump("ch3_hub")

label ch3_confront_director:
    scene bg_lobby with fade

    menu ch3_dir_confront:
        "用'今晚行动'字条质问导演" if store.evidence_board.is_evidence_discovered("mysterious_note"):
            $ analytics_record_choice("ch3_confront_dir_note", "用字条对质导演")
            $ store.ending_system.record_key_choice("confront_director_note", "用字条对质导演", 1)
            director "那字条……我见过，但不是我写的！可能是任何人写的！"
            $ store.suspicion_system.adjust_suspicion("director", 15, "字条暗示预谋")
            narrator "导演的反应很可疑，他似乎知道字条的内容。"
            jump ch3_dir_confront

        "质问导演关于复制品的事" if store.evidence_board.is_evidence_discovered("duplicate_crown"):
            $ analytics_record_choice("ch3_confront_dir_duplicate", "用复制品对质导演")
            $ store.ending_system.record_key_choice("confront_director_duplicate", "用复制品对质导演", 1)
            director "我确实让王芝兰做了一个备用道具，这是正常流程！"
            detective "但复制品的精良程度足以以假乱真，这不像普通的备用道具。"
            $ store.suspicion_system.adjust_suspicion("director", 10, "复制品的解释不合理")
            jump ch3_dir_confront

        "返回":
            jump ch3_hub

label ch3_confront_actress:
    scene bg_dressing_room with fade

    menu ch3_act_confront:
        "用手套和粉末证据质疑她的说法" if store.evidence_board.is_evidence_discovered("actress_glove") and store.evidence_board.is_evidence_discovered("powder_trail"):
            $ analytics_record_choice("ch3_confront_act_glove", "用手套和粉末对质女演员")
            $ store.ending_system.record_key_choice("confront_actress_glove", "用手套和粉末对质女演员", 1)
            actress "我承认我去过舞台……但只是去取道具，我真的没有偷王冠！"
            $ store.suspicion_system.adjust_suspicion("actress", 10, "承认去过舞台")
            $ store.timeline.verify_event("actress_arrives")
            narrator "她的承认部分证实了时间线，但仍然无法解释手套上的粉末成分。"
            jump ch3_act_confront

        "返回":
            jump ch3_hub

label ch3_confront_stagehand:
    scene bg_backstage with fade

    menu ch3_stg_confront:
        "用暗格证据质问赵大勇" if store.evidence_board.is_evidence_discovered("hidden_compartment"):
            $ analytics_record_choice("ch3_confront_stg_compartment", "用暗格对质舞台工人")
            $ store.ending_system.record_key_choice("confront_stagehand_compartment", "用暗格对质舞台工人", 1)
            stagehand "我……我知道那个暗格，但我没用过！那是之前就有的！"
            $ store.suspicion_system.adjust_suspicion("stagehand", -5, "对暗格的了解但否认使用")
            narrator "赵大勇了解暗格，但否认使用过。他的紧张可能只是害怕被牵连。"
            jump ch3_stg_confront

        "返回":
            jump ch3_hub

label ch3_confront_props_master:
    scene bg_prop_room with fade

    menu ch3_propm_confront:
        "用账本和复制品对质" if store.evidence_board.is_evidence_discovered("props_master_ledger") and store.evidence_board.is_evidence_discovered("duplicate_crown"):
            $ analytics_record_choice("ch3_confront_propm_ledger", "用账本和复制品对质道具主管")
            $ store.ending_system.record_key_choice("confront_props_master", "用账本和复制品对质道具主管", 2)
            props_master "我……我已经说过那是导演让我做的！"
            detective "但账本上写的是'备用'，而复制品的品质远超备用需要。而且你借了工具箱，里面有撬锁工具。"
            $ store.suspicion_system.adjust_suspicion("props_master", 20, "账本与复制品的矛盾")
            $ store.suspicion_system.add_evidence_against("props_master", "duplicate_crown")
            narrator "王芝兰的表情在变化——她开始慌了。"
            jump ch3_propm_confront

        "用工具箱证据对质" if store.evidence_board.is_evidence_discovered("stagehand_toolbox"):
            $ analytics_record_choice("ch3_confront_propm_toolbox", "用工具箱对质道具主管")
            $ store.ending_system.record_key_choice("confront_props_master_toolbox", "用工具箱对质道具主管", 1)
            props_master "工具箱只是修架子用的！"
            detective "但里面的撬锁工具和展示台上锁的撬开手法吻合。"
            $ store.suspicion_system.adjust_suspicion("props_master", 10, "工具箱与撬锁手法的关联")
            jump ch3_propm_confront

        "返回":
            jump ch3_hub

label ch3_settlement:
    $ result = store.settlement_system.calculate_chapter_score(LevelConfig.CHAPTER_CH3)
    $ analytics_end("chapter_ch3")

    narrator "第三章完成！"
    narrator "评分：[result['total_score']] 分 —— 等级 [result['grade']]"

    jump ch4_start

label ch4_start:
    $ store.level_config.advance_to_chapter(LevelConfig.CHAPTER_CH4)
    $ analytics_start("chapter_ch4")
    $ store.hint_system.reset_chapter_hints()

    narrator "终章——是时候揭示真相了。"

    jump ch4_accusation

label ch4_accusation:
    menu ch4_accuse_menu:
        "指认导演·陈明远为凶手":
            $ analytics_record_choice("ch4_accuse_director", "指认导演")
            $ store.ending_system.record_key_choice("accuse_director", "指认导演", -1)
            $ store.suspicion_system.adjust_suspicion("director", 20, "被指认为凶手")
            jump ch4_accuse_director

        "指认女主角·林雪薇为凶手":
            $ analytics_record_choice("ch4_accuse_actress", "指认女演员")
            $ store.ending_system.record_key_choice("accuse_actress", "指认女演员", -1)
            $ store.suspicion_system.adjust_suspicion("actress", 20, "被指认为凶手")
            jump ch4_accuse_actress

        "指认舞台工人·赵大勇为凶手":
            $ analytics_record_choice("ch4_accuse_stagehand", "指认舞台工人")
            $ store.ending_system.record_key_choice("accuse_stagehand", "指认舞台工人", -1)
            $ store.suspicion_system.adjust_suspicion("stagehand", 20, "被指认为凶手")
            jump ch4_accuse_stagehand

        "指认道具主管·王芝兰为凶手":
            $ analytics_record_choice("ch4_accuse_props_master", "指认道具主管")
            $ store.ending_system.record_key_choice("accuse_props_master", "指认道具主管", 2)
            $ store.suspicion_system.adjust_suspicion("props_master", 20, "被指认为凶手")
            jump ch4_accuse_props_master

        "查看嫌疑板 [S]":
            call screen suspicion_board
            jump ch4_accusation

        "查看证据板 [E]":
            call screen evidence_board
            jump ch4_accusation

        "查看提示 [H]":
            $ hint = store.hint_system.get_next_hint()
            if hint:
                narrator "[hint['text']]"
            else:
                narrator "信任你的推理，做出最终选择吧。"
            jump ch4_accusation

label ch4_accuse_director:
    if not store.settlement_system.can_retry(LevelConfig.CHAPTER_CH4):
        jump ending_bad
    narrator "你指认了导演·陈明远……"
    narrator "然而，随着证据的重新审视，导演虽然有嫌疑，但他并没有制作复制品的动机和手段。"
    $ store.settlement_system.record_failure(LevelConfig.CHAPTER_CH4, "wrong_accusation", "指认导演")
    $ store.settlement_system.record_retry(LevelConfig.CHAPTER_CH4, "ch4_accusation")
    menu:
        "重新推理":
            $ store.suspicion_system.adjust_suspicion("director", -20, "错误指认")
            jump ch4_accusation
        "坚持判断":
            jump ending_bad

label ch4_accuse_actress:
    if not store.settlement_system.can_retry(LevelConfig.CHAPTER_CH4):
        jump ending_bad
    narrator "你指认了女主角·林雪薇……"
    narrator "然而，林雪薇虽然有可疑之处，但手套上的粉末只能证明她到过舞台，不能证明她偷了王冠。"
    $ store.settlement_system.record_failure(LevelConfig.CHAPTER_CH4, "wrong_accusation", "指认女演员")
    $ store.settlement_system.record_retry(LevelConfig.CHAPTER_CH4, "ch4_accusation")
    menu:
        "重新推理":
            $ store.suspicion_system.adjust_suspicion("actress", -20, "错误指认")
            jump ch4_accusation
        "坚持判断":
            jump ending_bad

label ch4_accuse_stagehand:
    if not store.settlement_system.can_retry(LevelConfig.CHAPTER_CH4):
        jump ending_bad
    narrator "你指认了舞台工人·赵大勇……"
    narrator "然而，赵大勇虽然在现场，但他对暗格的了解并不等于他使用了暗格。他的工具记录也证实了他当时在修灯。"
    $ store.settlement_system.record_failure(LevelConfig.CHAPTER_CH4, "wrong_accusation", "指认舞台工人")
    $ store.settlement_system.record_retry(LevelConfig.CHAPTER_CH4, "ch4_accusation")
    menu:
        "重新推理":
            $ store.suspicion_system.adjust_suspicion("stagehand", -20, "错误指认")
            jump ch4_accusation
        "坚持判断":
            jump ending_bad

label ch4_accuse_props_master:
    narrator "你指认了道具主管·王芝兰……"
    detective "王芝兰，你制作了王冠的复制品，用复制品替换了真品。你借走赵大勇的工具箱，用里面的撬锁工具打开了展示台的锁。你把真品先藏在后台通道的暗格里，准备事后转移。"

    if store.evidence_board.is_evidence_discovered("props_master_ledger") and store.evidence_board.is_evidence_discovered("duplicate_crown") and store.evidence_board.is_evidence_discovered("hidden_compartment"):
        props_master "……你怎么知道的？"
        detective "账本上的'备用'记录、精良的复制品、被打开的暗格——所有线索都指向你。"
        jump ending_true
    elif store.evidence_board.is_evidence_discovered("props_master_ledger"):
        props_master "我……我只是照吩咐做事……"
        detective "但账本上的'备用'记录和你制作复制品的事实，已经足够证明你的嫌疑。"
        jump ending_good
    else:
        props_master "你有什么证据？"
        detective "……证据还不够充分。"
        jump ending_neutral

label ending_true:
    $ store.ending_system.evaluate_endings()
    $ result = store.settlement_system.calculate_chapter_score(LevelConfig.CHAPTER_CH4)
    $ analytics_end("chapter_ch4")

    scene bg_stage with fade

    narrator "真相大白。"
    narrator "道具主管·王芝兰利用职务之便制作了王冠复制品，在排练期间用撬锁工具打开了展示台的锁，将真品藏在暗格中准备事后转移。"
    narrator "她声称'备用'的复制品，实际上是以假乱真的替代品。而'今晚行动'的字条，正是她的行动计划。"

    $ final_result = store.settlement_system.calculate_final_score()

    narrator "恭喜你揭开了真相！"
    narrator "最终评分：[final_result['total_score']] 分 —— 等级 [final_result['grade']]"

    jump game_end

label ending_good:
    $ store.ending_system.evaluate_endings()
    $ result = store.settlement_system.calculate_chapter_score(LevelConfig.CHAPTER_CH4)
    $ analytics_end("chapter_ch4")

    scene bg_stage with fade

    narrator "正义得到伸张。"
    narrator "虽然你正确指认了凶手，但还有更多证据可以挖掘。真相的全貌或许比你知道的更复杂。"

    $ final_result = store.settlement_system.calculate_final_score()

    narrator "最终评分：[final_result['total_score']] 分 —— 等级 [final_result['grade']]"

    jump game_end

label ending_neutral:
    $ store.ending_system.evaluate_endings()
    $ result = store.settlement_system.calculate_chapter_score(LevelConfig.CHAPTER_CH4)
    $ analytics_end("chapter_ch4")

    scene bg_lobby with fade

    narrator "道具找到了，但真相并未完全揭开。"
    narrator "虽然王冠被追回，但幕后完整的阴谋仍然隐藏在暗处。也许下一次调查能揭示更多。"

    $ final_result = store.settlement_system.calculate_final_score()

    narrator "最终评分：[final_result['total_score']] 分 —— 等级 [final_result['grade']]"

    jump game_end

label ending_bad:
    $ store.ending_system.evaluate_endings()
    $ result = store.settlement_system.calculate_chapter_score(LevelConfig.CHAPTER_CH4)
    $ analytics_end("chapter_ch4")

    scene bg_lobby with fade

    narrator "误判。"
    narrator "你的推理出现了偏差，指认了错误的嫌疑人。真凶仍然逍遥法外。"

    $ final_result = store.settlement_system.calculate_final_score()

    narrator "最终评分：[final_result['total_score']] 分 —— 等级 [final_result['grade']]"

    menu:
        "重新开始终章":
            $ store.settlement_system.record_retry(LevelConfig.CHAPTER_CH4, "ending_retry")
            jump ch4_accusation
        "接受结局":
            jump game_end

label interview_return:
    $ renpy.jump(_return_hub)

label scene_return:
    $ renpy.jump(_return_hub)

label game_end:
    $ final = store.settlement_system.calculate_final_score()

    narrator "=== 游戏结算 ==="
    narrator "最终等级：[final['grade']]"
    narrator "最终评分：[final['total_score']]"
    narrator "结局：[final['ending']]"
    narrator "总重试次数：[final['total_retries']]"
    narrator "总失败次数：[final['total_failures']]"

    narrator "感谢游玩老剧院侦探故事！"

    return
