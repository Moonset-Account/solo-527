export const mockTeams = [
  { _id: 'team_01', name: '早班', members: ['张师傅', '李阿姨', '王小哥'], isSandbox: true },
  { _id: 'team_02', name: '中班', members: ['赵师傅', '钱大姐', '孙师傅'], isSandbox: true },
  { _id: 'team_03', name: '晚班', members: ['周师傅', '吴阿姨'], isSandbox: true },
  { _id: 'team_04', name: '机动班', members: ['郑师傅', '陈助理'], isSandbox: true },
];

export const mockIngredients = [
  {
    _id: 'ing_01', name: '高筋面粉', category: '粉类', unit: 'kg',
    currentStock: 120, minStock: 50, costPerUnit: 6.5,
    costHistory: [{ cost: 5.8, date: '2026-05-01' }, { cost: 6.2, date: '2026-05-15' }, { cost: 6.5, date: '2026-06-01' }],
    isSandbox: true,
  },
  {
    _id: 'ing_02', name: '白砂糖', category: '糖类', unit: 'kg',
    currentStock: 80, minStock: 30, costPerUnit: 8.0,
    costHistory: [{ cost: 7.5, date: '2026-05-01' }, { cost: 8.0, date: '2026-06-01' }],
    isSandbox: true,
  },
  {
    _id: 'ing_03', name: '黄油', category: '油脂类', unit: 'kg',
    currentStock: 25, minStock: 20, costPerUnit: 45.0,
    costHistory: [{ cost: 42.0, date: '2026-05-01' }, { cost: 45.0, date: '2026-06-01' }],
    isSandbox: true,
  },
  {
    _id: 'ing_04', name: '鸡蛋', category: '蛋类', unit: 'kg',
    currentStock: 60, minStock: 25, costPerUnit: 12.0,
    costHistory: [{ cost: 10.5, date: '2026-05-01' }, { cost: 11.0, date: '2026-05-15' }, { cost: 12.0, date: '2026-06-01' }],
    isSandbox: true,
  },
  {
    _id: 'ing_05', name: '淡奶油', category: '乳制品', unit: 'L',
    currentStock: 15, minStock: 10, costPerUnit: 28.0,
    costHistory: [{ cost: 26.0, date: '2026-05-01' }, { cost: 28.0, date: '2026-06-01' }],
    isSandbox: true,
  },
  {
    _id: 'ing_06', name: '酵母', category: '添加剂', unit: 'kg',
    currentStock: 8, minStock: 3, costPerUnit: 35.0,
    costHistory: [{ cost: 33.0, date: '2026-05-01' }, { cost: 35.0, date: '2026-06-01' }],
    isSandbox: true,
  },
  {
    _id: 'ing_07', name: '牛奶', category: '乳制品', unit: 'L',
    currentStock: 40, minStock: 20, costPerUnit: 10.0,
    costHistory: [{ cost: 9.5, date: '2026-05-01' }, { cost: 10.0, date: '2026-06-01' }],
    isSandbox: true,
  },
  {
    _id: 'ing_08', name: '巧克力', category: '辅料', unit: 'kg',
    currentStock: 5, minStock: 8, costPerUnit: 68.0,
    costHistory: [{ cost: 62.0, date: '2026-05-01' }, { cost: 65.0, date: '2026-05-15' }, { cost: 68.0, date: '2026-06-01' }],
    isSandbox: true,
  },
  {
    _id: 'ing_09', name: '香草精', category: '添加剂', unit: 'L',
    currentStock: 3, minStock: 2, costPerUnit: 120.0,
    costHistory: [{ cost: 115.0, date: '2026-05-01' }, { cost: 120.0, date: '2026-06-01' }],
    isSandbox: true,
  },
  {
    _id: 'ing_10', name: '食盐', category: '调味料', unit: 'kg',
    currentStock: 30, minStock: 10, costPerUnit: 3.0,
    costHistory: [{ cost: 2.8, date: '2026-05-01' }, { cost: 3.0, date: '2026-06-01' }],
    isSandbox: true,
  },
  {
    _id: 'ing_11', name: '泡打粉', category: '添加剂', unit: 'kg',
    currentStock: 6, minStock: 3, costPerUnit: 18.0,
    costHistory: [{ cost: 16.0, date: '2026-05-01' }, { cost: 18.0, date: '2026-06-01' }],
    isSandbox: true,
  },
  {
    _id: 'ing_12', name: '奶油奶酪', category: '乳制品', unit: 'kg',
    currentStock: 4, minStock: 5, costPerUnit: 55.0,
    costHistory: [{ cost: 50.0, date: '2026-05-01' }, { cost: 52.0, date: '2026-05-15' }, { cost: 55.0, date: '2026-06-01' }],
    isSandbox: true,
  },
];

export const mockRecipes = [
  {
    _id: 'recipe_01', name: '牛角包', category: '起酥类',
    ingredients: [
      { ingredientId: 'ing_01', ingredientName: '高筋面粉', ratio: 1.0, unit: 'kg' },
      { ingredientId: 'ing_03', ingredientName: '黄油', ratio: 0.5, unit: 'kg' },
      { ingredientId: 'ing_02', ingredientName: '白砂糖', ratio: 0.15, unit: 'kg' },
      { ingredientId: 'ing_04', ingredientName: '鸡蛋', ratio: 0.2, unit: 'kg' },
      { ingredientId: 'ing_06', ingredientName: '酵母', ratio: 0.02, unit: 'kg' },
      { ingredientId: 'ing_07', ingredientName: '牛奶', ratio: 0.3, unit: 'L' },
    ],
    yield: 30, unit: '个', isSandbox: true,
  },
  {
    _id: 'recipe_02', name: '法棍', category: '面包类',
    ingredients: [
      { ingredientId: 'ing_01', ingredientName: '高筋面粉', ratio: 1.0, unit: 'kg' },
      { ingredientId: 'ing_06', ingredientName: '酵母', ratio: 0.01, unit: 'kg' },
      { ingredientId: 'ing_10', ingredientName: '食盐', ratio: 0.02, unit: 'kg' },
      { ingredientId: 'ing_07', ingredientName: '牛奶', ratio: 0.6, unit: 'L' },
    ],
    yield: 12, unit: '根', isSandbox: true,
  },
  {
    _id: 'recipe_03', name: '生日蛋糕', category: '蛋糕类',
    ingredients: [
      { ingredientId: 'ing_01', ingredientName: '高筋面粉', ratio: 0.3, unit: 'kg' },
      { ingredientId: 'ing_02', ingredientName: '白砂糖', ratio: 0.3, unit: 'kg' },
      { ingredientId: 'ing_04', ingredientName: '鸡蛋', ratio: 0.5, unit: 'kg' },
      { ingredientId: 'ing_05', ingredientName: '淡奶油', ratio: 0.5, unit: 'L' },
      { ingredientId: 'ing_03', ingredientName: '黄油', ratio: 0.2, unit: 'kg' },
      { ingredientId: 'ing_09', ingredientName: '香草精', ratio: 0.01, unit: 'L' },
    ],
    yield: 2, unit: '个', isSandbox: true,
  },
  {
    _id: 'recipe_04', name: '曲奇饼干', category: '饼干类',
    ingredients: [
      { ingredientId: 'ing_01', ingredientName: '高筋面粉', ratio: 0.5, unit: 'kg' },
      { ingredientId: 'ing_03', ingredientName: '黄油', ratio: 0.35, unit: 'kg' },
      { ingredientId: 'ing_02', ingredientName: '白砂糖', ratio: 0.2, unit: 'kg' },
      { ingredientId: 'ing_04', ingredientName: '鸡蛋', ratio: 0.15, unit: 'kg' },
      { ingredientId: 'ing_09', ingredientName: '香草精', ratio: 0.005, unit: 'L' },
    ],
    yield: 50, unit: '块', isSandbox: true,
  },
  {
    _id: 'recipe_05', name: '吐司面包', category: '面包类',
    ingredients: [
      { ingredientId: 'ing_01', ingredientName: '高筋面粉', ratio: 1.0, unit: 'kg' },
      { ingredientId: 'ing_02', ingredientName: '白砂糖', ratio: 0.1, unit: 'kg' },
      { ingredientId: 'ing_03', ingredientName: '黄油', ratio: 0.1, unit: 'kg' },
      { ingredientId: 'ing_06', ingredientName: '酵母', ratio: 0.015, unit: 'kg' },
      { ingredientId: 'ing_07', ingredientName: '牛奶', ratio: 0.5, unit: 'L' },
      { ingredientId: 'ing_10', ingredientName: '食盐', ratio: 0.015, unit: 'kg' },
    ],
    yield: 8, unit: '条', isSandbox: true,
  },
  {
    _id: 'recipe_06', name: '玛芬', category: '蛋糕类',
    ingredients: [
      { ingredientId: 'ing_01', ingredientName: '高筋面粉', ratio: 0.4, unit: 'kg' },
      { ingredientId: 'ing_02', ingredientName: '白砂糖', ratio: 0.2, unit: 'kg' },
      { ingredientId: 'ing_04', ingredientName: '鸡蛋', ratio: 0.25, unit: 'kg' },
      { ingredientId: 'ing_07', ingredientName: '牛奶', ratio: 0.2, unit: 'L' },
      { ingredientId: 'ing_11', ingredientName: '泡打粉', ratio: 0.015, unit: 'kg' },
      { ingredientId: 'ing_03', ingredientName: '黄油', ratio: 0.15, unit: 'kg' },
    ],
    yield: 24, unit: '个', isSandbox: true,
  },
  {
    _id: 'recipe_07', name: '蛋挞', category: '点心类',
    ingredients: [
      { ingredientId: 'ing_01', ingredientName: '高筋面粉', ratio: 0.25, unit: 'kg' },
      { ingredientId: 'ing_03', ingredientName: '黄油', ratio: 0.15, unit: 'kg' },
      { ingredientId: 'ing_04', ingredientName: '鸡蛋', ratio: 0.3, unit: 'kg' },
      { ingredientId: 'ing_02', ingredientName: '白砂糖', ratio: 0.12, unit: 'kg' },
      { ingredientId: 'ing_07', ingredientName: '牛奶', ratio: 0.2, unit: 'L' },
      { ingredientId: 'ing_05', ingredientName: '淡奶油', ratio: 0.15, unit: 'L' },
    ],
    yield: 36, unit: '个', isSandbox: true,
  },
  {
    _id: 'recipe_08', name: '磅蛋糕', category: '蛋糕类',
    ingredients: [
      { ingredientId: 'ing_01', ingredientName: '高筋面粉', ratio: 0.3, unit: 'kg' },
      { ingredientId: 'ing_03', ingredientName: '黄油', ratio: 0.3, unit: 'kg' },
      { ingredientId: 'ing_02', ingredientName: '白砂糖', ratio: 0.25, unit: 'kg' },
      { ingredientId: 'ing_04', ingredientName: '鸡蛋', ratio: 0.3, unit: 'kg' },
      { ingredientId: 'ing_09', ingredientName: '香草精', ratio: 0.008, unit: 'L' },
      { ingredientId: 'ing_11', ingredientName: '泡打粉', ratio: 0.008, unit: 'kg' },
    ],
    yield: 4, unit: '条', isSandbox: true,
  },
];

export const mockBatches = [
  {
    _id: 'batch_01', batchNo: 'B20260615001', recipeId: 'recipe_01', recipeName: '牛角包',
    teamId: 'team_01', teamName: '早班', plannedQty: 60, actualQty: 58, status: 'completed',
    unit: '个', startTime: new Date('2026-06-15T06:00:00'), endTime: new Date('2026-06-15T09:30:00'),
    attachments: [], notes: [{ content: '面团发酵良好', author: '张师傅', createdAt: new Date('2026-06-15T07:00:00') }],
    history: [{ field: 'status', oldValue: 'pending', newValue: 'in_progress', changedBy: '张师傅', changedAt: new Date('2026-06-15T06:00:00') }, { field: 'status', oldValue: 'in_progress', newValue: 'completed', changedBy: '张师傅', changedAt: new Date('2026-06-15T09:30:00') }],
    isSandbox: true,
  },
  {
    _id: 'batch_02', batchNo: 'B20260615002', recipeId: 'recipe_02', recipeName: '法棍',
    teamId: 'team_01', teamName: '早班', plannedQty: 24, actualQty: 24, status: 'picked_up',
    unit: '根', startTime: new Date('2026-06-15T06:30:00'), endTime: new Date('2026-06-15T10:00:00'),
    attachments: [], notes: [], history: [],
    isSandbox: true,
  },
  {
    _id: 'batch_03', batchNo: 'B20260615003', recipeId: 'recipe_05', recipeName: '吐司面包',
    teamId: 'team_02', teamName: '中班', plannedQty: 16, actualQty: 15, status: 'completed',
    unit: '条', startTime: new Date('2026-06-15T10:00:00'), endTime: new Date('2026-06-15T14:00:00'),
    attachments: [], notes: [], history: [],
    isSandbox: true,
  },
  {
    _id: 'batch_04', batchNo: 'B20260615004', recipeId: 'recipe_03', recipeName: '生日蛋糕',
    teamId: 'team_02', teamName: '中班', plannedQty: 4, actualQty: 3, status: 'completed',
    unit: '个', startTime: new Date('2026-06-15T10:30:00'), endTime: new Date('2026-06-15T15:00:00'),
    attachments: [{ url: '/uploads/cake_order.jpg', name: '蛋糕订单图.jpg', uploadedAt: new Date('2026-06-15T10:30:00') }],
    notes: [{ content: '客户要求粉色奶油装饰', author: '赵师傅', createdAt: new Date('2026-06-15T11:00:00') }],
    history: [],
    isSandbox: true,
  },
  {
    _id: 'batch_05', batchNo: 'B20260616001', recipeId: 'recipe_04', recipeName: '曲奇饼干',
    teamId: 'team_01', teamName: '早班', plannedQty: 100, actualQty: 98, status: 'completed',
    unit: '块', startTime: new Date('2026-06-16T06:00:00'), endTime: new Date('2026-06-16T09:00:00'),
    attachments: [], notes: [], history: [],
    isSandbox: true,
  },
  {
    _id: 'batch_06', batchNo: 'B20260616002', recipeId: 'recipe_06', recipeName: '玛芬',
    teamId: 'team_02', teamName: '中班', plannedQty: 48, actualQty: 48, status: 'picked_up',
    unit: '个', startTime: new Date('2026-06-16T10:00:00'), endTime: new Date('2026-06-16T13:00:00'),
    attachments: [], notes: [], history: [],
    isSandbox: true,
  },
  {
    _id: 'batch_07', batchNo: 'B20260616003', recipeId: 'recipe_07', recipeName: '蛋挞',
    teamId: 'team_03', teamName: '晚班', plannedQty: 72, actualQty: 70, status: 'completed',
    unit: '个', startTime: new Date('2026-06-16T14:00:00'), endTime: new Date('2026-06-16T17:30:00'),
    attachments: [], notes: [], history: [],
    isSandbox: true,
  },
  {
    _id: 'batch_08', batchNo: 'B20260617001', recipeId: 'recipe_01', recipeName: '牛角包',
    teamId: 'team_01', teamName: '早班', plannedQty: 90, actualQty: null, status: 'in_progress',
    unit: '个', startTime: new Date('2026-06-17T06:00:00'), endTime: null,
    attachments: [], notes: [{ content: '今日增量生产', author: '张师傅', createdAt: new Date('2026-06-17T06:00:00') }],
    history: [{ field: 'status', oldValue: 'pending', newValue: 'in_progress', changedBy: '张师傅', changedAt: new Date('2026-06-17T06:00:00') }],
    isSandbox: true,
  },
  {
    _id: 'batch_09', batchNo: 'B20260617002', recipeId: 'recipe_08', recipeName: '磅蛋糕',
    teamId: 'team_02', teamName: '中班', plannedQty: 8, actualQty: null, status: 'pending',
    unit: '条', startTime: null, endTime: null,
    attachments: [], notes: [], history: [],
    isSandbox: true,
  },
  {
    _id: 'batch_10', batchNo: 'B20260617003', recipeId: 'recipe_02', recipeName: '法棍',
    teamId: 'team_03', teamName: '晚班', plannedQty: 36, actualQty: null, status: 'pending',
    unit: '根', startTime: null, endTime: null,
    attachments: [], notes: [], history: [],
    isSandbox: true,
  },
  {
    _id: 'batch_11', batchNo: 'B20260618001', recipeId: 'recipe_03', recipeName: '生日蛋糕',
    teamId: 'team_01', teamName: '早班', plannedQty: 6, actualQty: null, status: 'pending',
    unit: '个', startTime: null, endTime: null,
    attachments: [], notes: [], history: [],
    isSandbox: true,
  },
  {
    _id: 'batch_12', batchNo: 'B20260615005', recipeId: 'recipe_04', recipeName: '曲奇饼干',
    teamId: 'team_04', teamName: '机动班', plannedQty: 50, actualQty: 0, status: 'scrapped',
    unit: '块', startTime: new Date('2026-06-15T14:00:00'), endTime: new Date('2026-06-15T16:00:00'),
    attachments: [], notes: [{ content: '烤箱温度异常，全部报废', author: '郑师傅', createdAt: new Date('2026-06-15T16:00:00') }],
    history: [{ field: 'status', oldValue: 'in_progress', newValue: 'scrapped', changedBy: '郑师傅', changedAt: new Date('2026-06-15T16:00:00') }],
    isSandbox: true,
  },
  {
    _id: 'batch_13', batchNo: 'B20260616004', recipeId: 'recipe_05', recipeName: '吐司面包',
    teamId: 'team_01', teamName: '早班', plannedQty: 16, actualQty: 14, status: 'picked_up',
    unit: '条', startTime: new Date('2026-06-16T06:00:00'), endTime: new Date('2026-06-16T10:00:00'),
    attachments: [], notes: [], history: [],
    isSandbox: true,
  },
  {
    _id: 'batch_14', batchNo: 'B20260617004', recipeId: 'recipe_06', recipeName: '玛芬',
    teamId: 'team_04', teamName: '机动班', plannedQty: 36, actualQty: null, status: 'pending',
    unit: '个', startTime: null, endTime: null,
    attachments: [], notes: [], history: [],
    isSandbox: true,
  },
  {
    _id: 'batch_15', batchNo: 'B20260616005', recipeId: 'recipe_01', recipeName: '牛角包',
    teamId: 'team_03', teamName: '晚班', plannedQty: 45, actualQty: 42, status: 'completed',
    unit: '个', startTime: new Date('2026-06-16T14:00:00'), endTime: new Date('2026-06-16T17:30:00'),
    attachments: [], notes: [], history: [],
    isSandbox: true,
  },
  {
    _id: 'batch_16', batchNo: 'B20260617005', recipeId: 'recipe_07', recipeName: '蛋挞',
    teamId: 'team_02', teamName: '中班', plannedQty: 108, actualQty: null, status: 'in_progress',
    unit: '个', startTime: new Date('2026-06-17T10:00:00'), endTime: null,
    attachments: [], notes: [], history: [{ field: 'status', oldValue: 'pending', newValue: 'in_progress', changedBy: '赵师傅', changedAt: new Date('2026-06-17T10:00:00') }],
    isSandbox: true,
  },
];

export const mockSchedules = [
  {
    _id: 'sched_01', date: '2026-06-15', teamId: 'team_01', teamName: '早班', status: 'completed',
    batches: [
      { batchId: 'batch_01', batchNo: 'B20260615001', recipeName: '牛角包', plannedQty: 60, unit: '个' },
      { batchId: 'batch_02', batchNo: 'B20260615002', recipeName: '法棍', plannedQty: 24, unit: '根' },
    ],
    isSandbox: true,
  },
  {
    _id: 'sched_02', date: '2026-06-15', teamId: 'team_02', teamName: '中班', status: 'completed',
    batches: [
      { batchId: 'batch_03', batchNo: 'B20260615003', recipeName: '吐司面包', plannedQty: 16, unit: '条' },
      { batchId: 'batch_04', batchNo: 'B20260615004', recipeName: '生日蛋糕', plannedQty: 4, unit: '个' },
    ],
    isSandbox: true,
  },
  {
    _id: 'sched_03', date: '2026-06-15', teamId: 'team_04', teamName: '机动班', status: 'completed',
    batches: [
      { batchId: 'batch_12', batchNo: 'B20260615005', recipeName: '曲奇饼干', plannedQty: 50, unit: '块' },
    ],
    isSandbox: true,
  },
  {
    _id: 'sched_04', date: '2026-06-16', teamId: 'team_01', teamName: '早班', status: 'completed',
    batches: [
      { batchId: 'batch_05', batchNo: 'B20260616001', recipeName: '曲奇饼干', plannedQty: 100, unit: '块' },
      { batchId: 'batch_13', batchNo: 'B20260616004', recipeName: '吐司面包', plannedQty: 16, unit: '条' },
    ],
    isSandbox: true,
  },
  {
    _id: 'sched_05', date: '2026-06-16', teamId: 'team_02', teamName: '中班', status: 'completed',
    batches: [
      { batchId: 'batch_06', batchNo: 'B20260616002', recipeName: '玛芬', plannedQty: 48, unit: '个' },
    ],
    isSandbox: true,
  },
  {
    _id: 'sched_06', date: '2026-06-16', teamId: 'team_03', teamName: '晚班', status: 'completed',
    batches: [
      { batchId: 'batch_07', batchNo: 'B20260616003', recipeName: '蛋挞', plannedQty: 72, unit: '个' },
      { batchId: 'batch_15', batchNo: 'B20260616005', recipeName: '牛角包', plannedQty: 45, unit: '个' },
    ],
    isSandbox: true,
  },
  {
    _id: 'sched_07', date: '2026-06-17', teamId: 'team_01', teamName: '早班', status: 'in_progress',
    batches: [
      { batchId: 'batch_08', batchNo: 'B20260617001', recipeName: '牛角包', plannedQty: 90, unit: '个' },
    ],
    isSandbox: true,
  },
  {
    _id: 'sched_08', date: '2026-06-17', teamId: 'team_02', teamName: '中班', status: 'in_progress',
    batches: [
      { batchId: 'batch_09', batchNo: 'B20260617002', recipeName: '磅蛋糕', plannedQty: 8, unit: '条' },
      { batchId: 'batch_16', batchNo: 'B20260617005', recipeName: '蛋挞', plannedQty: 108, unit: '个' },
    ],
    isSandbox: true,
  },
  {
    _id: 'sched_09', date: '2026-06-17', teamId: 'team_03', teamName: '晚班', status: 'planned',
    batches: [
      { batchId: 'batch_10', batchNo: 'B20260617003', recipeName: '法棍', plannedQty: 36, unit: '根' },
    ],
    isSandbox: true,
  },
  {
    _id: 'sched_10', date: '2026-06-18', teamId: 'team_01', teamName: '早班', status: 'planned',
    batches: [
      { batchId: 'batch_11', batchNo: 'B20260618001', recipeName: '生日蛋糕', plannedQty: 6, unit: '个' },
    ],
    isSandbox: true,
  },
  {
    _id: 'sched_11', date: '2026-06-18', teamId: 'team_04', teamName: '机动班', status: 'planned',
    batches: [
      { batchId: 'batch_14', batchNo: 'B20260617004', recipeName: '玛芬', plannedQty: 36, unit: '个' },
    ],
    isSandbox: true,
  },
];

export const mockInventoryLogs = [
  { _id: 'inv_01', ingredientId: 'ing_01', ingredientName: '高筋面粉', type: 'inbound', quantity: 50, unit: 'kg', costPerUnit: 6.5, totalCost: 325, operator: '张师傅', note: '周采购入库', isSandbox: true },
  { _id: 'inv_02', ingredientId: 'ing_03', ingredientName: '黄油', type: 'inbound', quantity: 20, unit: 'kg', costPerUnit: 45.0, totalCost: 900, operator: '李阿姨', note: '紧急补货', isSandbox: true },
  { _id: 'inv_03', ingredientId: 'ing_04', ingredientName: '鸡蛋', type: 'inbound', quantity: 30, unit: 'kg', costPerUnit: 12.0, totalCost: 360, operator: '张师傅', note: '日常入库', isSandbox: true },
  { _id: 'inv_04', ingredientId: 'ing_01', ingredientName: '高筋面粉', type: 'outbound', quantity: 15, unit: 'kg', costPerUnit: 6.5, totalCost: 97.5, operator: '赵师傅', note: '牛角包生产领料', isSandbox: true },
  { _id: 'inv_05', ingredientId: 'ing_03', ingredientName: '黄油', type: 'outbound', quantity: 8, unit: 'kg', costPerUnit: 45.0, totalCost: 360, operator: '赵师傅', note: '牛角包+曲奇领料', isSandbox: true },
  { _id: 'inv_06', ingredientId: 'ing_02', ingredientName: '白砂糖', type: 'inbound', quantity: 25, unit: 'kg', costPerUnit: 8.0, totalCost: 200, operator: '王小哥', note: '周采购入库', isSandbox: true },
  { _id: 'inv_07', ingredientId: 'ing_05', ingredientName: '淡奶油', type: 'inbound', quantity: 10, unit: 'L', costPerUnit: 28.0, totalCost: 280, operator: '李阿姨', note: '蛋糕生产补货', isSandbox: true },
  { _id: 'inv_08', ingredientId: 'ing_08', ingredientName: '巧克力', type: 'inbound', quantity: 5, unit: 'kg', costPerUnit: 68.0, totalCost: 340, operator: '王小哥', note: '巧克力类产品补货', isSandbox: true },
  { _id: 'inv_09', ingredientId: 'ing_12', ingredientName: '奶油奶酪', type: 'outbound', quantity: 3, unit: 'kg', costPerUnit: 55.0, totalCost: 165, operator: '周师傅', note: '芝士蛋糕领料', isSandbox: true },
  { _id: 'inv_10', ingredientId: 'ing_07', ingredientName: '牛奶', type: 'inbound', quantity: 20, unit: 'L', costPerUnit: 10.0, totalCost: 200, operator: '孙师傅', note: '日常入库', isSandbox: true },
  { _id: 'inv_11', ingredientId: 'ing_06', ingredientName: '酵母', type: 'inbound', quantity: 2, unit: 'kg', costPerUnit: 35.0, totalCost: 70, operator: '张师傅', note: '补货', isSandbox: true },
  { _id: 'inv_12', ingredientId: 'ing_11', ingredientName: '泡打粉', type: 'inbound', quantity: 3, unit: 'kg', costPerUnit: 18.0, totalCost: 54, operator: '李阿姨', note: '补货', isSandbox: true },
];

export const mockScrapRecords = [
  { _id: 'scrap_01', batchId: 'batch_12', batchNo: 'B20260615005', ingredientId: 'ing_01', ingredientName: '高筋面粉', quantity: 2.5, reason: '烤箱温度异常导致产品报废', operator: '郑师傅', isSandbox: true },
  { _id: 'scrap_02', batchId: 'batch_12', batchNo: 'B20260615005', ingredientId: 'ing_03', ingredientName: '黄油', quantity: 1.75, reason: '烤箱温度异常导致产品报废', operator: '郑师傅', isSandbox: true },
  { _id: 'scrap_03', batchId: 'batch_01', batchNo: 'B20260615001', ingredientId: 'ing_01', ingredientName: '高筋面粉', quantity: 0.5, reason: '正常损耗', operator: '张师傅', isSandbox: true },
  { _id: 'scrap_04', batchId: 'batch_04', batchNo: 'B20260615004', ingredientId: 'ing_05', ingredientName: '淡奶油', quantity: 0.3, reason: '裱花失败重做', operator: '赵师傅', isSandbox: true },
];

export const mockProfitRecords = [
  { _id: 'profit_01', date: '2026-06-11', revenue: 5800, cost: 2800, margin: 3000, marginRate: 51.7, batchCount: 5, isSandbox: true },
  { _id: 'profit_02', date: '2026-06-12', revenue: 6200, cost: 3100, margin: 3100, marginRate: 50.0, batchCount: 6, isSandbox: true },
  { _id: 'profit_03', date: '2026-06-13', revenue: 5500, cost: 2900, margin: 2600, marginRate: 47.3, batchCount: 5, isSandbox: true },
  { _id: 'profit_04', date: '2026-06-14', revenue: 7100, cost: 3200, margin: 3900, marginRate: 54.9, batchCount: 7, isSandbox: true },
  { _id: 'profit_05', date: '2026-06-15', revenue: 6500, cost: 3500, margin: 3000, marginRate: 46.2, batchCount: 5, isSandbox: true },
  { _id: 'profit_06', date: '2026-06-16', revenue: 7800, cost: 3600, margin: 4200, marginRate: 53.8, batchCount: 6, isSandbox: true },
  { _id: 'profit_07', date: '2026-06-17', revenue: 5200, cost: 2700, margin: 2500, marginRate: 48.1, batchCount: 4, isSandbox: true },
];

export const mockAnomalies = [
  {
    _id: 'anomaly_01', type: 'cost_spike', severity: 'high',
    description: '黄油采购成本近一月内上涨7.1%，从42元/kg涨至45元/kg，影响所有含黄油产品利润率',
    ingredientId: 'ing_03', ingredientName: '黄油', expectedCost: 42.0, actualCost: 45.0,
    impactScope: '影响牛角包、曲奇饼干、磅蛋糕等8个品类的成本结构，预计每月增加成本约3600元',
    responsiblePerson: '采购部-王经理',
    handlingPlan: '1. 与供应商重新谈判价格 2. 评估替代供应商 3. 调整含黄油产品定价策略',
    status: 'handling', isSandbox: true,
  },
  {
    _id: 'anomaly_02', type: 'cost_spike', severity: 'medium',
    description: '鸡蛋成本持续上涨，从10.5元/kg涨至12元/kg，涨幅14.3%',
    ingredientId: 'ing_04', ingredientName: '鸡蛋', expectedCost: 10.5, actualCost: 12.0,
    impactScope: '影响蛋糕类、蛋挞等6个品类，预计每月增加成本约1800元',
    responsiblePerson: '采购部-王经理',
    handlingPlan: '1. 锁定长期供货协议 2. 寻找本地养殖场直供渠道',
    status: 'open', isSandbox: true,
  },
  {
    _id: 'anomaly_03', type: 'low_stock', severity: 'high',
    description: '巧克力库存低于最低库存线，当前5kg，最低要求8kg，急需补货',
    ingredientId: 'ing_08', ingredientName: '巧克力', expectedCost: 68.0, actualCost: 68.0,
    impactScope: '巧克力相关产品可能面临停产风险，影响3个品类',
    responsiblePerson: '仓储部-李主管',
    handlingPlan: '1. 立即下紧急采购订单 2. 临时调整生产计划减少巧克力产品排产',
    status: 'handling', isSandbox: true,
  },
  {
    _id: 'anomaly_04', type: 'low_stock', severity: 'medium',
    description: '奶油奶酪库存低于最低库存线，当前4kg，最低要求5kg',
    ingredientId: 'ing_12', ingredientName: '奶油奶酪', expectedCost: 55.0, actualCost: 55.0,
    impactScope: '影响芝士蛋糕等产品生产',
    responsiblePerson: '仓储部-李主管',
    handlingPlan: '1. 安排下次采购补货 2. 优先使用现有库存生产高利润产品',
    status: 'open', isSandbox: true,
  },
  {
    _id: 'anomaly_05', type: 'cost_spike', severity: 'low',
    description: '奶油奶酪成本从50元/kg涨至55元/kg，涨幅10%',
    ingredientId: 'ing_12', ingredientName: '奶油奶酪', expectedCost: 50.0, actualCost: 55.0,
    impactScope: '影响1-2个品类，预计每月增加成本约500元',
    responsiblePerson: '采购部-王经理',
    handlingPlan: '持续关注价格走势，必要时调整采购策略',
    status: 'resolved', isSandbox: true,
  },
];
