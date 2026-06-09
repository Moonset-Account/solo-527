extends Control
## 教程页面

@onready var back_button: Button = $TopBar/BackButton
@onready var title_label: Label = $TopBar/TitleLabel
@onready var page_indicator: Label = $Pager/PageIndicator
@onready var prev_button: Button = $Pager/PrevButton
@onready var next_button: Button = $Pager/NextButton
@onready var start_button: Button = $Pager/StartButton
@onready var content_label: RichTextLabel = $ContentContainer/ContentLabel
@onready var icon_label: Label = $ContentContainer/IconLabel

const TUTORIAL_PAGES := [
    {"icon": "📦", "title": "欢迎来到搬家装箱！",
     "content": "你准备好挑战打包大师了吗？\n\n本游戏的目标是：把所有物品巧妙地装入有限的箱子空间内，[color=red]同时保护易碎品不受损坏[/color]！"},
    {"icon": "✋", "title": "拖拽操作",
     "content": "[b]鼠标/手指[/b]按住物品拖动。\n\n拖入箱子后松开即可放置。\n物品需要大部分进入箱子才算放置成功。\n\n放置时会自动吸附到最近的网格。"},
    {"icon": "🔄", "title": "旋转物品",
     "content": "正在拖拽时：\n\n[b]键盘：[/b]R 键顺时针旋转，Shift+R 逆时针\n\n[b]移动端：[/b]长按物品旋转90°，或使用右下角旋转按钮\n\n合理旋转可以节省大量空间！"},
    {"icon": "🏺", "title": "易碎品保护",
     "content": "带有红色标记的物品是[b][color=red]易碎品[/color][/b]！\n\n它们不能承受重物压迫。\n\n[color=red]✓ 易碎品应该放在上层[/color]\n[color=green]✓ 软垫（枕头）可以放在下方缓冲[/color]\n[color=red]✗ 不要把重物压在易碎品上面！[/color]"},
    {"icon": "⚖️", "title": "重量限制",
     "content": "每个箱子都有[b]最大重量限制[/b]。\n\n底部进度条显示当前重量。\n\n[color=green]绿色：[/color]良好\n[color=orange]黄色：[/color]接近上限\n[color=red]红色：[/color]超重，不合格！"},
    {"icon": "↩️", "title": "撤销与暂停",
     "content": "放错位置了？\n\n点击左下角 ↩️ 按钮撤销操作。\n或按 [b]Ctrl+Z[/b] 撤销。\n\n点击 ⏸ 暂停游戏调整策略。\n\n撤销不扣分，大胆尝试吧！"},
    {"icon": "⭐", "title": "评分与星级",
     "content": "完成后获得1~3星评价：\n\n⭐ 达到目标分\n⭐⭐ 达到较高分\n⭐⭐⭐ 达成完美分数！\n\n[color=green]加分项：[/color]空间利用率、重量优化、易碎品完好、连续放置\n[color=red]扣分项：[/color]物品碎裂、超重"},
    {"icon": "🏆", "title": "准备开始！",
     "content": "系统包含：\n• 5个精心设计的关卡\n• 每日挑战（随机种子）\n• 10个成就解锁\n• 本地排行榜\n\n祝你打包愉快！"}
]

var current_page: int = 0

func _ready() -> void:
    _setup_ui()
    _show_page(0)
    if back_button:
        back_button.pressed.connect(_on_back)
    if prev_button:
        prev_button.pressed.connect(_on_prev)
    if next_button:
        next_button.pressed.connect(_on_next)
    if start_button:
        start_button.pressed.connect(_on_start)

func _setup_ui() -> void:
    if title_label:
        title_label.add_theme_font_size_override("font_size", 44)
        title_label.add_theme_color_override("font_color", Color(0.4, 0.25, 0.1))
    if page_indicator:
        page_indicator.add_theme_font_size_override("font_size", 28)
        page_indicator.add_theme_color_override("font_color", Color(0.5, 0.35, 0.2))
    if content_label:
        content_label.add_theme_font_size_override("normal_font_size", 32)
        content_label.add_theme_color_override("default_color", Color(0.2, 0.15, 0.1))
    if icon_label:
        icon_label.add_theme_font_size_override("font_size", 120)
    for btn in [back_button, prev_button, next_button]:
        if btn:
            _style_button_small(btn)
    if start_button:
        _style_button(start_button)

func _show_page(idx: int) -> void:
    current_page = clamp(idx, 0, TUTORIAL_PAGES.size() - 1)
    var page: Dictionary = TUTORIAL_PAGES[current_page]
    if title_label:
        title_label.text = page["title"]
    if icon_label:
        icon_label.text = page["icon"]
    if content_label:
        content_label.text = page["content"]
    if page_indicator:
        page_indicator.text = "%d / %d" % [current_page + 1, TUTORIAL_PAGES.size()]
    if prev_button:
        prev_button.disabled = current_page == 0
    if next_button:
        next_button.visible = current_page < TUTORIAL_PAGES.size() - 1
    if start_button:
        start_button.visible = current_page == TUTORIAL_PAGES.size() - 1
    _animate_page_in()

func _animate_page_in() -> void:
    if icon_label:
        icon_label.modulate.a = 0.0
        icon_label.scale = Vector2(0.5, 0.5)
        var t1: Tween = create_tween()
        t1.set_parallel(true)
        t1.tween_property(icon_label, "modulate:a", 1.0, 0.3)
        t1.tween_property(icon_label, "scale", Vector2.ONE, 0.4).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
    if content_label:
        content_label.modulate.a = 0.0
        var t2: Tween = create_tween()
        t2.tween_property(content_label, "modulate:a", 1.0, 0.35).set_delay(0.1)

func _style_button(btn: Button) -> void:
    var style_normal: StyleBoxFlat = StyleBoxFlat.new()
    style_normal.bg_color = Color(0.9, 0.7, 0.4)
    style_normal.corner_radius_top_left = 14
    style_normal.corner_radius_top_right = 14
    style_normal.corner_radius_bottom_left = 14
    style_normal.corner_radius_bottom_right = 14
    style_normal.content_margin_left = 40
    style_normal.content_margin_right = 40
    style_normal.content_margin_top = 16
    style_normal.content_margin_bottom = 16
    btn.add_theme_stylebox_override("normal", style_normal)
    var style_hover: StyleBoxFlat = style_normal.duplicate()
    style_hover.bg_color = Color(1.0, 0.8, 0.5)
    btn.add_theme_stylebox_override("hover", style_hover)
    btn.add_theme_font_size_override("font_size", 32)
    btn.add_theme_color_override("font_color", Color(0.3, 0.15, 0.05))
    btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND

func _style_button_small(btn: Button) -> void:
    var style_normal: StyleBoxFlat = StyleBoxFlat.new()
    style_normal.bg_color = Color(0.7, 0.55, 0.4)
    style_normal.corner_radius_top_left = 12
    style_normal.corner_radius_top_right = 12
    style_normal.corner_radius_bottom_left = 12
    style_normal.corner_radius_bottom_right = 12
    style_normal.content_margin_left = 20
    style_normal.content_margin_right = 20
    style_normal.content_margin_top = 12
    style_normal.content_margin_bottom = 12
    btn.add_theme_stylebox_override("normal", style_normal)
    btn.add_theme_font_size_override("font_size", 28)
    btn.add_theme_color_override("font_color", Color.WHITE)
    btn.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND

func _on_back() -> void:
    AudioManager.play_sfx("click")
    GameState.go_to_main_menu()

func _on_prev() -> void:
    AudioManager.play_sfx("click")
    _show_page(current_page - 1)

func _on_next() -> void:
    AudioManager.play_sfx("click")
    _show_page(current_page + 1)

func _on_start() -> void:
    AudioManager.play_sfx("click")
    GameState.start_level(1)
    SceneManager.change_scene("game")

func _input(event: InputEvent) -> void:
    if event is InputEventKey and event.pressed and not event.echo:
        if event.keycode == KEY_LEFT:
            _on_prev()
        elif event.keycode == KEY_RIGHT:
            _on_next()
        elif event.keycode == KEY_ESCAPE:
            _on_back()
