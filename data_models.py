"""
数据模型定义
医院门诊等待时间分析工作台数据模型
"""
from dataclasses import dataclass
from typing import Optional, List
from enum import Enum


class ProcessNode(str, Enum):
    """流程节点枚举"""
    REGISTRATION = "挂号"
    CHECK_IN = "签到"
    TRIAGE = "分诊"
    CALL = "叫号"
    CONSULTATION = "就诊"
    PAYMENT = "缴费"
    MEDICINE = "取药"


class PatientType(str, Enum):
    """患者类型"""
    ORDINARY = "普通患者"
    EMERGENCY = "急诊患者"
    VETERAN = "优抚对象"
    CHRONIC = "慢性病患者"


class TimeSlot(str, Enum):
    """时段"""
    MORNING_EARLY = "早高峰(7:30-9:00)"
    MORNING = "上午(9:00-12:00)"
    AFTERNOON_EARLY = "午高峰(13:30-14:30)"
    AFTERNOON = "下午(14:30-17:30)"
    EVENING = "晚间(17:30-20:00)"


@dataclass
class PatientVisit:
    """患者就诊记录 - 核心数据模型"""
    visit_id: str
    dept_id: str
    dept_name: str
    doctor_id: str
    doctor_name: str
    patient_type: PatientType
    time_slot: TimeSlot
    visit_date: str
    
    reg_time: Optional[str] = None
    checkin_time: Optional[str] = None
    triage_time: Optional[str] = None
    call_time: Optional[str] = None
    consult_start_time: Optional[str] = None
    consult_end_time: Optional[str] = None
    payment_time: Optional[str] = None
    medicine_time: Optional[str] = None
    
    is_anomaly: bool = False
    anomaly_reason: Optional[str] = None
    comment: Optional[str] = None


@dataclass
class MetricsConfig:
    """指标口径配置"""
    wait_reg_to_checkin: str = "挂号到签到等待时间"
    wait_checkin_to_triage: str = "签到到分诊等待时间"
    wait_triage_to_call: str = "分诊到叫号等待时间"
    wait_call_to_consult: str = "叫号到就诊等待时间"
    wait_consult_to_payment: str = "就诊到缴费等待时间"
    wait_payment_to_medicine: str = "缴费到取药等待时间"
    total_wait_time: str = "总等待时间"
    consult_duration: str = "问诊时长"


@dataclass
class FilterState:
    """筛选条件状态"""
    depts: List[str]
    doctors: List[str]
    time_slots: List[str]
    patient_types: List[str]
    date_range: tuple
    exclude_anomalies: bool = False


# 流程节点顺序
NODE_ORDER = [
    ProcessNode.REGISTRATION,
    ProcessNode.CHECK_IN,
    ProcessNode.TRIAGE,
    ProcessNode.CALL,
    ProcessNode.CONSULTATION,
    ProcessNode.PAYMENT,
    ProcessNode.MEDICINE
]

# 等待时间对（计算等待时长的节点对）
WAIT_PAIRS = [
    ("reg_time", "checkin_time", "挂号→签到"),
    ("checkin_time", "triage_time", "签到→分诊"),
    ("triage_time", "call_time", "分诊→叫号"),
    ("call_time", "consult_start_time", "叫号→就诊"),
    ("consult_end_time", "payment_time", "就诊→缴费"),
    ("payment_time", "medicine_time", "缴费→取药"),
]
