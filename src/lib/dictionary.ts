import type { MetricDefinition, DataDictionaryItem } from '$types';

export const dataDictionary: DataDictionaryItem[] = [
	{
		key: 'visitId',
		name: '就诊ID',
		type: 'string',
		description: '单次就诊的唯一标识符，已脱敏处理'
	},
	{
		key: 'department',
		name: '科室',
		type: 'string',
		description: '患者就诊的科室名称',
		example: '内科、外科、儿科'
	},
	{
		key: 'doctor',
		name: '医生',
		type: 'string',
		description: '接诊医生，公开页面已脱敏编码'
	},
	{
		key: 'patientType',
		name: '患者类型',
		type: 'enum',
		description: '患者就诊类型：普通、急诊、复诊、VIP'
	},
	{
		key: 'timeSlot',
		name: '时段',
		type: 'string',
		description: '挂号时段：上午、下午、晚间'
	},
	{
		key: 'registerTime',
		name: '挂号时间',
		type: 'timestamp',
		description: '患者完成挂号的时间'
	},
	{
		key: 'checkInTime',
		name: '签到时间',
		type: 'timestamp',
		description: '患者到达医院签到的时间'
	},
	{
		key: 'triageTime',
		name: '分诊时间',
		type: 'timestamp',
		description: '护士完成分诊的时间'
	},
	{
		key: 'callTime',
		name: '叫号时间',
		type: 'timestamp',
		description: '医生叫号进入诊室的时间'
	},
	{
		key: 'paymentTime',
		name: '缴费时间',
		type: 'timestamp',
		description: '患者完成缴费的时间'
	},
	{
		key: 'pickupTime',
		name: '取药时间',
		type: 'timestamp',
		description: '患者取到药品的时间'
	}
];

export const metricDefinitions: MetricDefinition[] = [
	{
		key: 'avgWaitTime',
		name: '平均等待时间',
		definition: '患者在某一环节的平均等待时长',
		calculation: '该环节所有有效样本等待时间的算术平均值',
		limitations: [
			'仅统计时间戳完整的记录',
			'异常数据可选择是否纳入统计',
			'不同科室业务性质不同，跨科室对比需谨慎'
		]
	},
	{
		key: 'medianWaitTime',
		name: '中位数等待时间',
		definition: '患者在某一环节等待时间的中位数',
		calculation: '将所有等待时间排序后取中间值',
		limitations: ['相比平均值更稳定，不易受极端值影响', '更能反映大多数患者的真实体验']
	},
	{
		key: 'p95WaitTime',
		name: 'P95等待时间',
		definition: '95%分位的等待时间',
		calculation: '将所有等待时间排序，第95百分位的数值',
		limitations: ['用于评估长尾等待情况', '反映大多数患者的最坏情况']
	},
	{
		key: 'throughput',
		name: '患者吞吐量',
		definition: '单位时间内完成就诊的患者数量',
		calculation: '统计时段内完成全流程的患者总数',
		limitations: ['受科室开放时间、医生排班等因素影响']
	}
];

export const departments = [
	'内科',
	'外科',
	'儿科',
	'妇产科',
	'眼科',
	'耳鼻喉科',
	'皮肤科',
	'口腔科',
	'骨科',
	'神经内科'
];

export const timeSlots = ['上午(8:00-12:00)', '下午(13:30-17:30)', '晚间(18:00-21:00)'];

export const patientTypes = ['普通', '急诊', '复诊', 'VIP'] as const;

export const processNodes = ['挂号', '签到', '分诊', '叫号', '缴费', '取药'] as const;
