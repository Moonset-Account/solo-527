screen evidence_board():
    tag overlay
    zorder 100

    frame:
        xalign 0.5
        yalign 0.5
        xsize 1000
        ysize 650
        background "#1a1a2e"

        vbox:
            xalign 0.5
            yalign 0.5
            spacing 10

            text "证据板" size 28 color "#e0e0ff" xalign 0.5

            frame:
                xsize 960
                ysize 480
                background "#16213e"

                viewport:
                    scrollbars "vertical"
                    mousewheel True

                    vbox:
                        spacing 8
                        xsize 920

                        for evid in store.evidence_board.get_discovered():
                            frame:
                                background "#0f3460"
                                xsize 900
                                padding (15, 10)

                                vbox:
                                    spacing 4
                                    text evid["name"] size 20 color "#ffd700"
                                    text evid["description"] size 15 color "#c8c8c8"
                                    text "地点：{0} | 时间：{1}".format(evid.get("location", "未知"), evid.get("timestamp", "未知")) size 13 color "#888888"

            frame:
                background "#0f3460"
                xsize 960
                ysize 80

                viewport:
                    scrollbars "vertical"
                    mousewheel True

                    vbox:
                        spacing 4
                        text "矛盾线索：" size 15 color "#ff6b6b"
                        for contra in store.evidence_board.check_contradictions():
                            text "◆ {0}".format(contra["description"]) size 13 color "#ff9999"

            textbutton "关闭 [ESC]" action [Hide("evidence_board"), Function(store.ui_state.pop_state)] xalign 0.5

screen timeline():
    tag overlay
    zorder 100

    frame:
        xalign 0.5
        yalign 0.5
        xsize 1000
        ysize 650
        background "#1a1a2e"

        vbox:
            xalign 0.5
            yalign 0.5
            spacing 10

            text "时间线" size 28 color "#e0e0ff" xalign 0.5

            frame:
                xsize 960
                ysize 520
                background "#16213e"

                viewport:
                    scrollbars "vertical"
                    mousewheel True

                    vbox:
                        spacing 6
                        xsize 920

                        for event in sorted(store.timeline.events, key=lambda e: e["time_str"]):
                            frame:
                                background "#0f3460" if not event["contradicted"] else "#5c1a1a"
                                xsize 900
                                padding (15, 8)

                                vbox:
                                    spacing 2
                                    $ status = ""
                                    if event["verified"]:
                                        $ status = " [已验证]"
                                    elif event["contradicted"]:
                                        $ status = " [已反驳]"
                                    text "{0}  {1}{2}".format(event["time_str"], event["description"], status) size 15 color "#c8c8c8"
                                    if event["character"]:
                                        $ suspect = store.suspicion_system.suspects.get(event["character"], {})
                                        text "相关人物：{0}".format(suspect.get("name", event["character"])) size 12 color "#888888"

            frame:
                background "#0f3460"
                xsize 960
                ysize 50

                viewport:
                    scrollbars "vertical"
                    mousewheel True

                    vbox:
                        spacing 4
                        for contra in store.timeline.find_contradictions():
                            text "⚠ {0}".format(contra["description"]) size 13 color "#ff9999"

            textbutton "关闭 [ESC]" action [Hide("timeline"), Function(store.ui_state.pop_state)] xalign 0.5

screen suspicion_board():
    tag overlay
    zorder 100

    frame:
        xalign 0.5
        yalign 0.5
        xsize 1000
        ysize 700
        background "#1a1a2e"

        vbox:
            xalign 0.5
            yalign 0.5
            spacing 10

            text "嫌疑板" size 28 color "#e0e0ff" xalign 0.5

            frame:
                xsize 960
                ysize 350
                background "#16213e"

                viewport:
                    scrollbars "vertical"
                    mousewheel True

                    vbox:
                        spacing 8
                        xsize 920

                        for suspect in store.suspicion_system.get_suspects_sorted():
                            frame:
                                background "#0f3460"
                                xsize 900
                                padding (15, 10)

                                vbox:
                                    spacing 4
                                    hbox:
                                        spacing 10
                                        text suspect["name"] size 20 color "#ffd700"
                                        text suspect["title"] size 15 color "#888888"
                                    bar value FieldValue(suspect, "suspicion_level", range=100) xsize 400 ysize 20
                                    text "嫌疑度：{0}%".format(suspect["suspicion_level"]) size 14 color "#ff6b6b"
                                    hbox:
                                        spacing 20
                                        if suspect["interrogated"]:
                                            text "已审讯" size 13 color "#6bff6b"
                                        else:
                                            text "未审讯" size 13 color "#888888"
                                        if suspect["alibi_verified"]:
                                            text "不在场已验证" size 13 color "#6bff6b"
                                        else:
                                            text "不在场未验证" size 13 color "#ff9999"
                                    if suspect["evidence_against"]:
                                        text "不利证据：{0}".format(", ".join(suspect["evidence_against"])) size 12 color "#ff9999"

            text "人际关系" size 20 color "#e0e0ff" xalign 0.5

            frame:
                xsize 960
                ysize 160
                background "#16213e"

                viewport:
                    scrollbars "vertical"
                    mousewheel True

                    vbox:
                        spacing 4
                        xsize 920

                        for (a, b), rel in store.suspicion_system.relationships.items():
                            $ name_a = store.suspicion_system.suspects.get(a, {}).get("name", a)
                            $ name_b = store.suspicion_system.suspects.get(b, {}).get("name", b)
                            frame:
                                background "#0f3460"
                                xsize 900
                                padding (10, 6)

                                text "{0} ←→ {1}  [{2}] {3}".format(name_a, name_b, rel["type"], rel["description"]) size 14 color "#c8c8c8"

            textbutton "关闭 [ESC]" action [Hide("suspicion_board"), Function(store.ui_state.pop_state)] xalign 0.5

screen hint():
    tag overlay
    zorder 100

    frame:
        xalign 0.5
        yalign 0.5
        xsize 600
        ysize 300
        background "#1a1a2e"

        vbox:
            xalign 0.5
            yalign 0.5
            spacing 15
            xpadding 30
            ypadding 30

            text "提示" size 28 color "#e0e0ff" xalign 0.5

            $ hint = store.hint_system.get_next_hint()
            if hint:
                text hint["text"] size 18 color "#ffd700" text_align 0.5 xalign 0.5
            else:
                text "暂时没有更多提示了。继续调查吧。" size 18 color "#888888" text_align 0.5 xalign 0.5

            textbutton "关闭 [H]" action [Hide("hint"), Function(store.ui_state.pop_state)] xalign 0.5

screen map():
    tag overlay
    zorder 100

    frame:
        xalign 0.5
        yalign 0.5
        xsize 800
        ysize 600
        background "#1a1a2e"

        vbox:
            xalign 0.5
            yalign 0.5
            spacing 15
            xpadding 30
            ypadding 30

            text "剧院地图" size 28 color "#e0e0ff" xalign 0.5

            $ locations = store.level_config.get_available_locations()

            grid 3 2:
                xalign 0.5
                spacing 10

                for loc_id in ["lobby", "stage", "backstage", "dressing_room", "prop_room", ""]:
                    if loc_id and loc_id in locations:
                        $ loc_names = {"lobby": "大厅", "stage": "舞台", "backstage": "后台", "dressing_room": "化妆间", "prop_room": "道具室"}
                        textbutton loc_names.get(loc_id, loc_id):
                            action [Hide("map"), Function(store.ui_state.pop_state), Jump(loc_id + "_investigation" if store.level_config.current_chapter == LevelConfig.CHAPTER_PROLOGUE else "ch1_" + loc_id)]
                            xsize 200
                            ysize 100
                    else:
                        null width 200 height 100

            textbutton "关闭 [ESC]" action [Hide("map"), Function(store.ui_state.pop_state)] xalign 0.5

screen tutorial_overlay():
    tag overlay
    zorder 200

    $ step = store.tutorial_system.get_current_step()

    if step:
        frame:
            xalign 0.5
            yalign 0.9
            xsize 800
            background "#1a1a2ecc"
            padding (30, 20)

            vbox:
                spacing 10

                hbox:
                    xalign 0.5
                    spacing 20
                    text "教程：{0}".format(step["tutorial_title"]) size 22 color "#ffd700"
                    text "({0}/{1})".format(step["step_number"], step["total_steps"]) size 16 color "#888888"

                text step["text"] size 18 color "#e0e0ff" text_align 0.5 xalign 0.5

                hbox:
                    xalign 0.5
                    spacing 30

                    textbutton "跳过教程" action [Function(store.tutorial_system.skip_tutorial), Hide("tutorial_overlay"), Return()] style "quick_button"
                    textbutton "下一步" action [Function(store.tutorial_system.advance_step), If(store.tutorial_system.is_tutorial_active(), Show("tutorial_overlay"), Hide("tutorial_overlay")), Return()] style "quick_button"

screen game_hud():
    zorder 50

    frame:
        xalign 0.0
        yalign 0.0
        background "#00000088"
        padding (10, 5)

        hbox:
            spacing 10
            textbutton "证据[E]" action [Function(store.ui_state.push_state, UIState.EVIDENCE_BOARD), Show("evidence_board")] style "quick_button"
            textbutton "时间线[T]" action [Function(store.ui_state.push_state, UIState.TIMELINE), Show("timeline")] style "quick_button"
            textbutton "嫌疑[S]" action [Function(store.ui_state.push_state, UIState.SUSPICION_BOARD), Show("suspicion_board")] style "quick_button"
            textbutton "提示[H]" action [Function(store.ui_state.push_state, "提示"), Show("hint")] style "quick_button"
            textbutton "地图[M]" action [Function(store.ui_state.push_state, "地图"), Show("map")] style "quick_button"

    frame:
        xalign 1.0
        yalign 0.0
        background "#00000088"
        padding (10, 5)

        $ config = store.level_config.get_current_chapter_config()
        if config:
            vbox:
                text config["title"] size 14 color "#ffd700"
                $ discovered = len(store.evidence_board.get_discovered())
                $ required = store.level_config.get_required_evidence()
                text "证据：{0}/{1}".format(discovered, required) size 12 color "#c8c8c8"
                $ interrogated = sum(1 for s in store.suspicion_system.suspects.values() if s["interrogated"])
                $ req_interrogated = store.level_config.get_required_interrogations()
                if req_interrogated > 0:
                    text "审讯：{0}/{1}".format(interrogated, req_interrogated) size 12 color "#c8c8c8"
