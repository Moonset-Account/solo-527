import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { db, initDatabase } from './db';

async function seed() {
  await initDatabase();
  
  console.log('开始生成演示数据...');

  const passwordHash = await bcrypt.hash('123456', 10);

  const adminId = uuidv4();
  const member1Id = uuidv4();
  const member2Id = uuidv4();
  const member3Id = uuidv4();
  const operator1Id = uuidv4();
  const operator2Id = uuidv4();

  await db('users').insert([
    {
      id: adminId,
      username: 'admin',
      password_hash: passwordHash,
      role: 'admin',
      name: '张管理员',
      phone: '13800000000',
      points: 0
    },
    {
      id: member1Id,
      username: 'member1',
      password_hash: passwordHash,
      role: 'member',
      name: '李社员',
      phone: '13800000001',
      points: 150
    },
    {
      id: member2Id,
      username: 'member2',
      password_hash: passwordHash,
      role: 'member',
      name: '王社员',
      phone: '13800000002',
      points: 80
    },
    {
      id: member3Id,
      username: 'member3',
      password_hash: passwordHash,
      role: 'member',
      name: '赵社员',
      phone: '13800000003',
      points: 200
    },
    {
      id: operator1Id,
      username: 'operator1',
      password_hash: passwordHash,
      role: 'operator',
      name: '刘机手',
      phone: '13800000004',
      points: 0
    },
    {
      id: operator2Id,
      username: 'operator2',
      password_hash: passwordHash,
      role: 'operator',
      name: '陈机手',
      phone: '13800000005',
      points: 0
    }
  ]);

  const tractor1Id = uuidv4();
  const tractor2Id = uuidv4();
  const transplanter1Id = uuidv4();
  const drone1Id = uuidv4();

  await db('equipment').insert([
    {
      id: tractor1Id,
      name: '东方红-904 拖拉机',
      type: 'tractor',
      model: '东方红-LX904',
      serial_number: 'DFH-2023-001',
      purchase_date: '2023-03-15',
      purchase_price: 125000,
      status: 'available',
      total_hours: 320
    },
    {
      id: tractor2Id,
      name: '雷沃-1204 拖拉机',
      type: 'tractor',
      model: '雷沃-M1204',
      serial_number: 'LW-2023-002',
      purchase_date: '2023-05-20',
      purchase_price: 158000,
      status: 'available',
      total_hours: 280
    },
    {
      id: transplanter1Id,
      name: '久保田插秧机',
      type: 'transplanter',
      model: '久保田-2ZGQ6D',
      serial_number: 'KBT-2022-001',
      purchase_date: '2022-04-10',
      purchase_price: 85000,
      status: 'maintenance',
      total_hours: 150
    },
    {
      id: drone1Id,
      name: '大疆T40植保无人机',
      type: 'drone',
      model: 'DJI-T40',
      serial_number: 'DJI-2023-001',
      purchase_date: '2023-06-01',
      purchase_price: 62000,
      status: 'available',
      total_hours: 95
    }
  ]);

  const field1Id = uuidv4();
  const field2Id = uuidv4();
  const field3Id = uuidv4();
  const field4Id = uuidv4();

  await db('fields').insert([
    {
      id: field1Id,
      name: '东一号地块',
      area: 50.5,
      location: '村东头',
      polygon_coords: JSON.stringify([
        [116.397, 39.908],
        [116.400, 39.908],
        [116.400, 39.910],
        [116.397, 39.910]
      ]),
      soil_type: '壤土',
      owner_id: member1Id
    },
    {
      id: field2Id,
      name: '西二号地块',
      area: 35.2,
      location: '村西头',
      polygon_coords: JSON.stringify([
        [116.390, 39.905],
        [116.393, 39.905],
        [116.393, 39.907],
        [116.390, 39.907]
      ]),
      soil_type: '沙壤土',
      owner_id: member2Id
    },
    {
      id: field3Id,
      name: '南三号地块',
      area: 80.0,
      location: '村南边',
      polygon_coords: JSON.stringify([
        [116.395, 39.900],
        [116.400, 39.900],
        [116.400, 39.904],
        [116.395, 39.904]
      ]),
      soil_type: '黏土',
      owner_id: member1Id
    },
    {
      id: field4Id,
      name: '北四号地块',
      area: 42.8,
      location: '村北边',
      polygon_coords: JSON.stringify([
        [116.392, 39.912],
        [116.396, 39.912],
        [116.396, 39.915],
        [116.392, 39.915]
      ]),
      soil_type: '壤土',
      owner_id: member3Id
    }
  ]);

  const now = dayjs();

  const res1Id = uuidv4();
  const res2Id = uuidv4();
  const res3Id = uuidv4();
  const res4Id = uuidv4();
  const res5Id = uuidv4();
  const res6Id = uuidv4();
  const res7Id = uuidv4();

  await db('reservations').insert([
    {
      id: res1Id,
      member_id: member1Id,
      equipment_id: tractor1Id,
      field_id: field1Id,
      crop: '小麦',
      start_time: now.add(1, 'day').hour(8).minute(0).toISOString(),
      end_time: now.add(1, 'day').hour(12).minute(0).toISOString(),
      status: 'confirmed',
      price_type: 'member',
      estimated_price: 280,
      cancel_reason: null,
      is_rain_cancel: false,
      queue_position: null,
      notes: '深耕作业，注意土壤湿度'
    },
    {
      id: res2Id,
      member_id: member2Id,
      equipment_id: tractor1Id,
      field_id: field2Id,
      crop: '玉米',
      start_time: now.add(1, 'day').hour(8).minute(0).toISOString(),
      end_time: now.add(1, 'day').hour(11).minute(0).toISOString(),
      status: 'waitlisted',
      price_type: 'subsidy',
      estimated_price: 150,
      cancel_reason: null,
      is_rain_cancel: false,
      queue_position: 1,
      notes: '播种玉米'
    },
    {
      id: res3Id,
      member_id: member3Id,
      equipment_id: drone1Id,
      field_id: field4Id,
      crop: '水稻',
      start_time: now.add(3, 'day').hour(9).minute(0).toISOString(),
      end_time: now.add(3, 'day').hour(12).minute(0).toISOString(),
      status: 'pending',
      price_type: 'commercial',
      estimated_price: 390,
      cancel_reason: null,
      is_rain_cancel: false,
      queue_position: null,
      notes: '植保喷洒作业'
    },
    {
      id: res4Id,
      member_id: member1Id,
      equipment_id: tractor2Id,
      field_id: field3Id,
      crop: '小麦',
      start_time: now.subtract(2, 'day').hour(8).minute(0).toISOString(),
      end_time: now.subtract(2, 'day').hour(14).minute(0).toISOString(),
      status: 'completed',
      price_type: 'member',
      estimated_price: 420,
      cancel_reason: null,
      is_rain_cancel: false,
      queue_position: null,
      notes: '收割作业'
    },
    {
      id: res5Id,
      member_id: member2Id,
      equipment_id: tractor1Id,
      field_id: field2Id,
      crop: '大豆',
      start_time: now.add(5, 'day').hour(8).minute(0).toISOString(),
      end_time: now.add(5, 'day').hour(10).minute(0).toISOString(),
      status: 'cancelled',
      price_type: 'member',
      estimated_price: 140,
      cancel_reason: '临时有事，撤回预约',
      is_rain_cancel: false,
      queue_position: null,
      notes: '原定播种大豆'
    },
    {
      id: res6Id,
      member_id: member3Id,
      equipment_id: tractor2Id,
      field_id: field4Id,
      crop: '玉米',
      start_time: now.add(4, 'day').hour(9).minute(0).toISOString(),
      end_time: now.add(4, 'day').hour(13).minute(0).toISOString(),
      status: 'pending',
      price_type: 'member',
      estimated_price: 280,
      cancel_reason: null,
      is_rain_cancel: false,
      queue_position: null,
      notes: '翻地作业'
    },
    {
      id: res7Id,
      member_id: member1Id,
      equipment_id: drone1Id,
      field_id: field1Id,
      crop: '小麦',
      start_time: now.add(3, 'day').hour(9).minute(0).toISOString(),
      end_time: now.add(3, 'day').hour(11).minute(0).toISOString(),
      status: 'waitlisted',
      price_type: 'subsidy',
      estimated_price: 100,
      cancel_reason: null,
      is_rain_cancel: false,
      queue_position: 1,
      notes: '病虫害防治'
    }
  ]);

  await db('reservation_queue').insert([
    {
      id: uuidv4(),
      reservation_id: res2Id,
      equipment_id: tractor1Id,
      target_start_time: now.add(1, 'day').hour(8).minute(0).toISOString(),
      target_end_time: now.add(1, 'day').hour(11).minute(0).toISOString(),
      priority: 1,
      status: 'waiting',
      queued_at: now.toISOString()
    },
    {
      id: uuidv4(),
      reservation_id: res7Id,
      equipment_id: drone1Id,
      target_start_time: now.add(3, 'day').hour(9).minute(0).toISOString(),
      target_end_time: now.add(3, 'day').hour(11).minute(0).toISOString(),
      priority: 1,
      status: 'waiting',
      queued_at: now.toISOString()
    }
  ]);

  const workOrder1Id = uuidv4();
  const workOrder2Id = uuidv4();

  await db('work_orders').insert([
    {
      id: workOrder1Id,
      reservation_id: res1Id,
      operator_id: operator1Id,
      route_info: JSON.stringify({
        waypoints: [
          { lat: 39.908, lng: 116.397 },
          { lat: 39.908, lng: 116.400 }
        ],
        distance: 2.5
      }),
      status: 'assigned',
      assigned_at: now.toISOString()
    },
    {
      id: workOrder2Id,
      reservation_id: res4Id,
      operator_id: operator2Id,
      route_info: JSON.stringify({
        waypoints: [
          { lat: 39.900, lng: 116.395 },
          { lat: 39.900, lng: 116.400 }
        ],
        distance: 3.2
      }),
      status: 'completed',
      assigned_at: now.subtract(2, 'day').hour(7).minute(30).toISOString(),
      started_at: now.subtract(2, 'day').hour(8).minute(0).toISOString(),
      completed_at: now.subtract(2, 'day').hour(14).minute(0).toISOString()
    }
  ]);

  const workRecord1Id = uuidv4();

  await db('work_records').insert([
    {
      id: workRecord1Id,
      reservation_id: res4Id,
      work_order_id: workOrder2Id,
      equipment_id: tractor2Id,
      field_id: field3Id,
      operator_id: operator2Id,
      fuel_consumption: 18.5,
      work_hours: 6,
      field_photos: JSON.stringify(['/uploads/work1.jpg', '/uploads/work2.jpg']),
      notes: '作业完成良好，土壤湿度适宜，收割效率高',
      completed_at: now.subtract(2, 'day').hour(14).minute(30).toISOString()
    }
  ]);

  const settlement1Id = uuidv4();

  await db('settlements').insert([
    {
      id: settlement1Id,
      reservation_id: res4Id,
      member_id: member1Id,
      price_type: 'member',
      base_price: 600,
      price_multiplier: 0.7,
      fuel_cost: 130,
      total_amount: 420,
      points_deducted: 0,
      status: 'confirmed',
      created_at: now.subtract(2, 'day').hour(15).toISOString(),
      confirmed_at: now.subtract(1, 'day').hour(10).toISOString()
    }
  ]);

  const maintenance1Id = uuidv4();
  const maintenance2Id = uuidv4();

  await db('maintenance_tickets').insert([
    {
      id: maintenance1Id,
      equipment_id: transplanter1Id,
      reported_by: operator1Id,
      title: '插秧机秧针损坏',
      description: '作业时发现秧针磨损严重，需要更换6根秧针',
      priority: 'high',
      status: 'in_progress',
      cost: 0,
      reported_at: now.subtract(1, 'day').toISOString()
    },
    {
      id: maintenance2Id,
      equipment_id: tractor2Id,
      reported_by: operator2Id,
      title: '拖拉机液压系统漏油',
      description: '完成作业后发现液压油管接头处有轻微漏油，需要检查密封',
      priority: 'medium',
      status: 'open',
      cost: 0,
      reported_at: now.subtract(1, 'day').hour(16).toISOString()
    }
  ]);

  await db('audit_logs').insert([
    {
      id: uuidv4(),
      user_id: member2Id,
      user_name: '王社员',
      action: 'create',
      module: 'reservation',
      target_type: 'reservation',
      target_id: res2Id,
      description: '创建预约但因冲突进入候补队列',
      new_values: JSON.stringify({ equipment: '东方红-904拖拉机', status: 'waitlisted' }),
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0'
    },
    {
      id: uuidv4(),
      user_id: member2Id,
      user_name: '王社员',
      action: 'cancel',
      module: 'reservation',
      target_type: 'reservation',
      target_id: res5Id,
      description: '用户撤回预约',
      old_values: JSON.stringify({ status: 'pending' }),
      new_values: JSON.stringify({ status: 'cancelled', cancel_reason: '临时有事，撤回预约' }),
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0'
    },
    {
      id: uuidv4(),
      user_id: operator1Id,
      user_name: '刘机手',
      action: 'confirm',
      module: 'reservation',
      target_type: 'reservation',
      target_id: res1Id,
      description: '机手确认预约并分配任务',
      old_values: JSON.stringify({ status: 'pending' }),
      new_values: JSON.stringify({ status: 'confirmed', operator: '刘机手' }),
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0'
    }
  ]);

  console.log('✅ 演示数据生成完成！');
  console.log('');
  console.log('🔐 登录账号（密码均为 123456）：');
  console.log('  管理员: admin / 123456');
  console.log('  社员1: member1 / 123456');
  console.log('  社员2: member2 / 123456');
  console.log('  社员3: member3 / 123456');
  console.log('  机手1: operator1 / 123456');
  console.log('  机手2: operator2 / 123456');
  console.log('');
  console.log('📋 演示场景说明：');
  console.log('');
  console.log('  【场景1：预约冲突 & 候补队列】');
  console.log('  - 李社员已预约 tractor1 明天 8:00-12:00（已确认）');
  console.log('  - 王社员同时预约 tractor1 明天 8:00-11:00（冲突，进入候补队列 #1）');
  console.log('  - 李社员取消 → 王社员自动提升为待确认');
  console.log('');
  console.log('  【场景2：预约撤回 & 重新提交】');
  console.log('  - 王社员有一个已取消的预约（5天后的大豆播种）');
  console.log('  - 可在预约详情页点击"重新提交"，选择新时间重新预约');
  console.log('  - 重新提交时可修改设备、地块、时间等信息');
  console.log('');
  console.log('  【场景3：设备故障自动重排】');
  console.log('  - 创建高优先级维修工单时，自动触发设备故障重排');
  console.log('  - 受影响的预约自动延期并进入候补队列');
  console.log('  - 系统自动寻找下一个可用时段');
  console.log('');
  console.log('  【场景4：作业执行 & 照片油耗上传】');
  console.log('  - 机手登录后可查看分配的任务');
  console.log('  - 开始作业 → 完成作业时上传地块照片和油耗数据');
  console.log('  - 完成后自动生成结算单');
  console.log('');
  console.log('  【场景5：三种价格体系】');
  console.log('  - 社员自用：×0.7 倍（如李社员的预约）');
  console.log('  - 合作社补贴：×0.5 倍（如植保无人机）');
  console.log('  - 跨村租赁：×1.3 倍（如赵社员的商业预约）');
  console.log('');
  console.log('  【场景6：最终确认流程】');
  console.log('  - 社员提交预约 → 状态 pending');
  console.log('  - 机手确认 → 状态 confirmed，生成作业单');
  console.log('  - 机手完成作业 → 状态 completed');
  console.log('  - 管理员确认结算 → 结算单 confirmed');
  console.log('');
  
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ 种子数据生成失败:', err);
  process.exit(1);
});
