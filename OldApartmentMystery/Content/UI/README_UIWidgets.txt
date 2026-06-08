# UI 资源目录

Widget Blueprint 说明：

1. WB_MainMenu          —— 主菜单 (开始 / 关卡选择 / 设置 / 继续 / 退出)
2. WB_HUD                —— 主 HUD 主界面 继承 OAMHUDWidget
3. WB_Notebook            —— 笔记本 继承 OAMNotebookWidget
4. WB_Puzzle              —— 谜题面板 继承 OAMPuzzleWidget
5. WB_Examine              —— 物品检查 继承 OAMExamineWidget
6. WB_Settings             —— 设置面板 继承 OAMSettingsWidget
7. WB_SaveLoad               存档/读档  继承 OAMSaveLoadWidget
8. WB_LevelSelect            —— 关卡选择  继承 OAMLevelSelectWidget
9. WB_ChapterComplete        —— 过关结算 继承 OAMChapterCompleteWidget
10. WB_PauseMenu            —— 暂停菜单（新建 Widget Blueprint 继承 OAMUserWidget （建议结构：

结构: OAMHUDWidget
   - Canvas Panel
      Txt_InteractPrompt     FText
      Txt_ObjectiveText
      Txt_ChapterTitle
      Progress_Objective
      Panel_ToastContainer
      Txt_CurrentRoom
      Img_Crosshair
      Img_DamageFlash
      Txt_Clock

WB_Notebook 结构（建议：
   - SizeBox 1200, 800
      - Image 笔记本背景纸张
         - Overlay 主内容
            - Vertical Box 顶部：Tab 按钮/页
