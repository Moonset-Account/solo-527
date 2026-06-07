import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import uuid

SAMPLE_TYPES = ['blood', 'urine', 'stool', 'biochemistry', 'immunology', 'microbiology']
SAMPLE_TYPE_NAMES = {
    'blood': '血液',
    'urine': '尿液',
    'stool': '粪便',
    'biochemistry': '生化',
    'immunology': '免疫',
    'microbiology': '微生物'
}

DEPARTMENTS = [
    '心内科', '呼吸内科', '消化内科', '神经内科', '肾内科',
    '普外科', '骨科', '神经外科', '泌尿外科', '妇产科',
    '儿科', '急诊科', '重症医学科', '老年科', '肿瘤科'
]

STAGES = [
    'collection_to_dispatch',
    'dispatch_to_receive',
    'receive_to_test',
    'test_to_review',
    'review_to_report'
]

STAGE_END_COL_MAPPING = {
    'collection_to_dispatch': 'dispatched',
    'dispatch_to_receive': 'received',
    'receive_to_test': 'tested',
    'test_to_review': 'reviewed',
    'review_to_report': 'reported'
}

STAGE_NAMES = {
    'collection_to_dispatch': '采样→送检',
    'dispatch_to_receive': '送检→接收',
    'receive_to_test': '接收→检测',
    'test_to_review': '检测→复核',
    'review_to_report': '复核→发布'
}

RETURN_REASONS = [
    '样本量不足',
    '样本溶血',
    '样本凝块',
    '标签信息错误',
    '申请单信息不全',
    '样本污染',
    '检测项目与样本类型不符',
    '样本超时拒收'
]

DEFAULT_THRESHOLDS = {
    'blood': {
        'emergency': {'collection_to_dispatch': 10, 'dispatch_to_receive': 15, 'receive_to_test': 20, 'test_to_review': 30, 'review_to_report': 10},
        'routine': {'collection_to_dispatch': 30, 'dispatch_to_receive': 45, 'receive_to_test': 60, 'test_to_review': 90, 'review_to_report': 30}
    },
    'urine': {
        'emergency': {'collection_to_dispatch': 15, 'dispatch_to_receive': 20, 'receive_to_test': 25, 'test_to_review': 20, 'review_to_report': 10},
        'routine': {'collection_to_dispatch': 45, 'dispatch_to_receive': 60, 'receive_to_test': 90, 'test_to_review': 60, 'review_to_report': 30}
    },
    'stool': {
        'routine': {'collection_to_dispatch': 60, 'dispatch_to_receive': 60, 'receive_to_test': 120, 'test_to_review': 60, 'review_to_report': 30}
    },
    'biochemistry': {
        'emergency': {'collection_to_dispatch': 10, 'dispatch_to_receive': 15, 'receive_to_test': 30, 'test_to_review': 45, 'review_to_report': 15},
        'routine': {'collection_to_dispatch': 30, 'dispatch_to_receive': 45, 'receive_to_test': 90, 'test_to_review': 120, 'review_to_report': 30}
    },
    'immunology': {
        'routine': {'collection_to_dispatch': 30, 'dispatch_to_receive': 45, 'receive_to_test': 120, 'test_to_review': 180, 'review_to_report': 45}
    },
    'microbiology': {
        'routine': {'collection_to_dispatch': 30, 'dispatch_to_receive': 45, 'receive_to_test': 240, 'test_to_review': 1440, 'review_to_report': 60}
    }
}


def generate_mock_samples(num_samples=2000, start_date=None, end_date=None):
    if start_date is None:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
    
    samples = []
    return_records = []
    
    for i in range(num_samples):
        sample_type = random.choice(SAMPLE_TYPES)
        
        available_priorities = list(DEFAULT_THRESHOLDS[sample_type].keys())
        priority_weights = [0.2, 0.8] if 'emergency' in available_priorities else [1.0]
        if len(available_priorities) == 1:
            priority = available_priorities[0]
        else:
            priority = random.choices(available_priorities, weights=priority_weights[:len(available_priorities)])[0]
        
        dept = random.choice(DEPARTMENTS)
        
        random_days = random.random() * (end_date - start_date).total_seconds() / 86400
        base_time = start_date + timedelta(days=random_days)
        
        hour = np.random.normal(10, 4) if priority == 'routine' else np.random.normal(14, 6)
        hour = max(6, min(22, hour))
        base_time = base_time.replace(hour=int(hour), minute=random.randint(0, 59))
        
        thresholds = DEFAULT_THRESHOLDS[sample_type][priority]
        
        collected_at = base_time
        collected_source = 'auto'
        
        current_time = collected_at
        times = {'collected_at': current_time}
        sources = {'collected_at_source': collected_source}
        
        is_abnormal = random.random() < 0.15
        
        for stage in STAGES:
            threshold = thresholds.get(stage, 30)
            base_duration = threshold * 0.6
            
            if is_abnormal and random.random() < 0.4:
                duration = threshold * random.uniform(1.5, 4.0)
            else:
                duration = max(1, np.random.normal(base_duration, threshold * 0.2))
            
            current_time = current_time + timedelta(minutes=duration)
            
            stage_end_col = STAGE_END_COL_MAPPING[stage]
            times[f'{stage_end_col}_at'] = current_time
            
            source = 'manual' if random.random() < 0.05 else 'auto'
            sources[f'{stage_end_col}_at_source'] = source
        
        has_return = random.random() < 0.08
        status = 'returned' if has_return else ('completed' if random.random() < 0.95 else 'in_progress')
        
        sample_id = f'S{base_time.strftime("%Y%m%d")}{str(i+1).zfill(5)}'
        
        sample = {
            'sample_id': sample_id,
            'sample_type': sample_type,
            'sample_type_name': SAMPLE_TYPE_NAMES[sample_type],
            'priority': priority,
            'priority_name': '急诊' if priority == 'emergency' else '常规',
            'requesting_department': dept,
            'patient_id': f'P{random.randint(100000, 999999)}',
            **times,
            **sources,
            'status': status,
            'test_items': f'{SAMPLE_TYPE_NAMES[sample_type]}常规检测'
        }
        samples.append(sample)
        
        if has_return:
            num_returns = random.randint(1, 2)
            for r in range(num_returns):
                return_time = times['reviewed_at'] + timedelta(hours=random.uniform(0.5, 2))
                return_records.append({
                    'sample_id': sample_id,
                    'return_time': return_time,
                    'return_reason': random.choice(RETURN_REASONS),
                    'responsible_department': random.choice([dept, '检验科', '护理部']),
                    'returned_by': f'医生{random.randint(1, 20)}',
                    'notes': '请重新采样' if random.random() < 0.5 else ''
                })
    
    samples_df = pd.DataFrame(samples)
    returns_df = pd.DataFrame(return_records)
    
    return samples_df, returns_df


def get_threshold_configs():
    configs = []
    for sample_type, priorities in DEFAULT_THRESHOLDS.items():
        for priority, stages in priorities.items():
            for stage, threshold in stages.items():
                configs.append({
                    'sample_type': sample_type,
                    'sample_type_name': SAMPLE_TYPE_NAMES[sample_type],
                    'priority': priority,
                    'priority_name': '急诊' if priority == 'emergency' else '常规',
                    'stage_name': stage,
                    'stage_display_name': STAGE_NAMES[stage],
                    'threshold_minutes': threshold,
                    'description': f'{("急诊" if priority == "emergency" else "常规")}{SAMPLE_TYPE_NAMES[sample_type]}{STAGE_NAMES[stage]}'
                })
    return pd.DataFrame(configs)


_mock_samples_df = None
_mock_returns_df = None
_mock_thresholds_df = None


def initialize_mock_data():
    global _mock_samples_df, _mock_returns_df, _mock_thresholds_df
    _mock_samples_df, _mock_returns_df = generate_mock_samples(num_samples=3000)
    _mock_thresholds_df = get_threshold_configs()
    return _mock_samples_df, _mock_returns_df, _mock_thresholds_df


def get_samples_df():
    if _mock_samples_df is None:
        initialize_mock_data()
    return _mock_samples_df.copy()


def get_returns_df():
    if _mock_returns_df is None:
        initialize_mock_data()
    return _mock_returns_df.copy()


def get_thresholds_df():
    if _mock_thresholds_df is None:
        initialize_mock_data()
    return _mock_thresholds_df.copy()


def update_threshold(sample_type, priority, stage_name, new_threshold):
    global _mock_thresholds_df
    if _mock_thresholds_df is None:
        initialize_mock_data()
    
    mask = (
        (_mock_thresholds_df['sample_type'] == sample_type) &
        (_mock_thresholds_df['priority'] == priority) &
        (_mock_thresholds_df['stage_name'] == stage_name)
    )
    _mock_thresholds_df.loc[mask, 'threshold_minutes'] = new_threshold
    
    DEFAULT_THRESHOLDS[sample_type][priority][stage_name] = new_threshold
    
    return True
