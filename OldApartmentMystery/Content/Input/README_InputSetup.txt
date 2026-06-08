# 输入资产目录:

1. IMC_Player        主输入映射上下文
2. IA_Move          2D 值 (WASD)
3. IA_Look           2D 值 (MouseXY)
4. IA_Interact       动作：Digital)
5. IA_Notebook      动作)
6. IA_Inventory     动作)
7. IA_Pause       动作)
8. IA_Digit0 ~ IA_Digit9      动作(10个 每个数字)
9. IA_Back          动作 右键)

绑定关系：
  MappingContext IMC_Player 值:
  IMC_Player (优先级 10
    移动 W → Action Mappings:
     - Move: Value (0: W → 2D 轴 (1.0, 0.0, 0.0
     - Move: S → (0, -1, 0.0
     - Move: A →  (-1, 0.0, 0)
     - Move: D → (1, 0.0, 0.0
     - Look: Mouse XY 2D 轴 (Sensitivity 0.01 ~ 0.01)
    Interact: E  触发：Started)
    Notebook : N   触发Started)
    Inventory: I   触发：Started)
    Pause: Escape    触发 Started
Digit: Digit_0 ~ 9：
    Back: Right Mouse Button 触发 Started
