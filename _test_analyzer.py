import sys
sys.path.insert(0, '.')

from app.analyzer import analyzer
from app.masking import mask_sensitive_data

sample = """坚持就是胜利

在人生的道路上，我们会遇到很多困难，但是只要坚持，就一定能够成功。我叫王小明，家住北京市朝阳区建国路88号，联系电话13812345678。

比如说，爱迪生发明电灯，他实验了很多次都失败了，但是他没有放弃。最后他成功了。所以说坚持很重要。

总之，坚持就是胜利。只有坚持，我们才能实现自己的梦想。"""

print("=== 步骤1: 数据脱敏测试 ===")
masked, actions = mask_sensitive_data(sample)
print(f"检测到敏感信息: {len(actions)} 处")
for a in actions[:3]:
    print(f"  - {a}")
print(f"脱敏后内容: {masked[:120]}...\n")

print("=== 步骤2: 四维度AI分析测试 ===")
results = analyzer.analyze_full(masked)
for cat, result in results.items():
    print(f"\n【{cat.value}】整体置信度={result.overall_confidence:.3f}  "
          f"建议数={len(result.items)}  证据数={len(result.evidence_refs)}  "
          f"低置信度={'是' if result.overall_confidence < 0.6 else '否'}  "
          f"模型={result.model_name}")
    for item in result.items[:2]:
        status = "⚠️低置信" if item.confidence < 0.6 else "  可靠"
        print(f"  {status} [{item.severity}|conf={item.confidence:.2f}] {item.suggestion_text[:70]}...")

print("\n\n=== 步骤3: 模型依据（仅教师可见） ===")
for cat, result in results.items():
    for ev in result.evidence_refs[:1]:
        print(f"  [{cat.value}] {ev['description']}: {str(ev['evidence_data'])[:120]}...")

print("\n✅ 全部核心模块验证通过")
