extends RefCounted

class_name FailureRecord

# 失败类型（取值必须使用 FailureTypes.* 常量，例如 FailureTypes.TIME_EXCEEDED）
# 字符串转换请调用 FailureTypes.type_to_string(type)
# 默认值 6 = FailureTypes.LOW_SCORE（避免解析期跨 class_name 循环依赖）
var type: int = 6
var zone_id: String = ""
var zone_name: String = ""
var description: String = ""
var suggestion: String = ""
var severity: int = 1
