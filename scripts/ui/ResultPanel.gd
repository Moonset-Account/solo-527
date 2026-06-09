extends Control
## 关卡结算/结果面板

@onready var stars_container: HBoxContainer = $Panel/VBox/StarsContainer
@onready var score_label: Label = $Panel/VBox/ScoreLabel
@onready var summary_label: RichTextLabel = $Panel/VBox/SummaryLabel
@onready var title_label: Label = $Panel/VBox/TitleLabel
@onready var retry_button: Button = $Panel/VBox/ButtonsContainer/RetryButton
@onready var next_button: Button = $Panel/VBox/ButtonsContainer/NextButton
@onready var menu_button: Button = $Panel/VBox/ButtonsContainer/MenuButton
@onready var select_button: Button = $Panel/VBox/ButtonsContainer/SelectButton

var stars_anim: Array[Label] = []

func _ready() -> void:
    _setup_stars()
    _setup_buttons()
    if retry_button:
        retry_button.pressed.connect(_on_retry)
    if next_button:
        next_button.pressed.connect(_on_next)
    if menu_button:
        menu_button.pressed.connect(_on_menu)
    if select_button:
        select_button.pressed.connect(_on_select)

func _setup_stars() -> void:
    if not stars_container:
        return
    stars_container.clear_children()
    for i in 3:
        var lbl: Label = Label.new()
        lbl.text = "☆"
        lbl.add_theme_font_size_override("font_size", 84)
        lbl.add_theme_color_override("font_color", Color(0.7, 0.65, 0.5))
        lbl.modulate.a = 0.0
        lbl.scale = Vector2(0.5, 0.5)
        lbl.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
        stars_container.add_child(lbl)
        stars_anim.append(lbl)

func _setup_buttons() -> void:
    var buttons: Array = [retry_button, next_button, menu_button, select_button]
    for btn in buttons:
        if btn:
            var style_normal: StyleBoxFlat = StyleBoxFlat.new()
            style_normal.bg_color = Color(0.85, 0.7, 0.5)
            style_normal.corner_radius_top_left = 12
            style_normal.corner_radius_top_right = 12
            style_normal.corner_radius_bottom_left = 12
            style_normal.corner_radius_bottom_right = 12
            style_normal.content_margin_left = 24
            style_normal.content_margin_right = 24
            style_normal.content_margin_top = 14
            style_normal.content_margin_bottom = 14
            btn.add_theme_stylebox_override("normal", style_normal)
            var style_hover: StyleBoxFlat = style_normal.duplicate()
            style_hover.bg_color = Color(0.95, 0.8, 0.6)
            btn.add_theme_stylebox_override("hover", style_hover)
            btn.add_theme_font_size_override("font_size", 28)
            btn.add_theme_color_override("font_color", Color(0.3, 0.15, 0.05))
            btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
    if title_label:
        title_label.add_theme_font_size_override("font_size", 44)
    if score_label:
        score_label.add_theme_font_size_override("font_size", 52)
        score_label.add_theme_color_override("font_color", Color(0.5, 0.3, 0.1))
    if summary_label:
        summary_label.add_theme_font_size_override("font_size", 22)
        summary_label.add_theme_color_override("font_color", Color(0.4, 0.3, 0.2))
        summary_label.autowrap_mode = TextServer.AUTOWRAP_WORD

func show_result(result: Dictionary) -> void:
    var score: int = int(result.get("total_score", 0))
    var stars: int = int(result.get("stars", 0))
    var is_fail: bool = stars == 0
    if title_label:
        if is_fail:
            title_label.text = "再试一次！"
            title_label.add_theme_color_override("font_color", Color(0.7, 0.3, 0.3))
        elif stars == 3:
            title_label.text = "太棒了！完美通关！"
            title_label.add_theme_color_override("font_color", Color(0.9, 0.6, 0.2))
        else:
            title_label.text = "过关！"
            title_label.add_theme_color_override("font_color", Color(0.3, 0.5, 0.3))
    if score_label:
        score_label.text = "%d 分" % score
    if summary_label:
        var calc: ScoreCalculator = ScoreCalculator.new()
        summary_label.text = calc.get_score_summary(result)
    var has_next: bool = ResourceLoader_.get_level_count() > GameState.current_level_id
    if next_button:
        next_button.visible = not is_fail and has_next and not GameState.is_daily_mode
        next_button.disabled = is_fail or not has_next
    call_deferred("_animate_stars", stars)
    visible = true
    modulate.a = 0.0
    scale = Vector2(0.85, 0.85)
    var tween: Tween = create_tween()
    tween.set_parallel(true)
    tween.tween_property(self, "modulate:a", 1.0, 0.25)
    tween.tween_property(self, "scale", Vector2.ONE, 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _animate_stars(earned: int) -> void:
    await get_tree().create_timer(0.35).timeout
    for i in 3:
        var lbl: Label = stars_anim[i]
        if i < earned:
            lbl.text = "⭐"
            lbl.add_theme_color_override("font_color", Color(1.0, 0.85, 0.2))
            AudioManager.play_sfx("star")
        var tween: Tween = create_tween()
        tween.set_parallel(true)
        tween.tween_property(lbl, "modulate:a", 1.0, 0.2)
        tween.tween_property(lbl, "scale", Vector2.ONE, 0.3).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
        await tween.finished
        await get_tree().create_timer(0.15).timeout

func _on_retry() -> void:
    AudioManager.play_sfx("click")
    GameState.restart_level()

func _on_next() -> void:
    AudioManager.play_sfx("click")
    var next_level: int = GameState.current_level_id + 1
    GameState.start_level(next_level)
    SceneManager.change_scene("game")

func _on_menu() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_main_menu()

func _on_select() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_level_select()
