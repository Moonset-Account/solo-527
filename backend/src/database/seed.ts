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

  const res1Id = uuidv4();
  const res2Id = uuidv4();
  const res3Id = uuidv4();
  const res4Id = uuidv4();
  const res5Id = uuidv4();

  const now = dayjs();

  await db('reservations').insert([
    {
      id: res1Id,
      user_id: member1Id,
      equipment_id: tractor1Id,
      field_id: field1Id,
      crop_type: '小麦',
      start_time: now.add(1, 'day').hour(8).minute(0).toISOString(),
      end_time: now.add(1, 'day').hour(12).minute(0).toISOString(),
      status: 'confirmed',
      price_type: 'self_use',
      estimated_price: 280,
      is_cancelled: false,
      queue_position: null
    },
    {
      id: res2Id,
      user_id: member2Id,
      equipment_id: tractor1Id,
      field_id: field2Id,
      crop_type: '玉米',
      start_time: now.add(2, 'day').hour(8).minute(0).toISOString(),
      end_time: now.add(2, 'day').hour(11).minute(0).toISOString(),
      status: 'pending',
      price_type: 'cooperative_subsidy',
      estimated_price: 150,
      is_cancelled: false,
      queue_position: null
    },
    {
      id: res3Id,
      user_id: member3Id,
      equipment_id: drone1Id,
      field_id: field4Id,
      crop_type: '水稻',
      start_time: now.add(3, 'day').hour(9).minute(0).toISOString(),
      end_time: now.add(3, 'day').hour(12).minute(0).toISOString(),
      status: 'queued',
      price_type: 'cross_village',
      estimated_price: 390,
      is_cancelled: false,
      queue_position: 1
    },
    {
      id: res4Id,
      user_id: member1Id,
      equipment_id: tractor2Id,
      field_id: field3Id,
      crop_type: '小麦',
      start_time: now.subtract(2, 'day').hour(8).minute(0).toISOString(),
      end_time: now.subtract(2, 'day').hour(14).minute(0).toISOString(),
      status: 'completed',
      price_type: 'self_use',
      estimated_price: 420,
      is_cancelled: false,
      queue_position: null
    },
    {
      id: res5Id,
      user_id: member2Id,
      equipment_id: tractor1Id,
      field_id: field2Id,
      crop_type: '大豆',
      start_time: now.add(5, 'day').hour(8).minute(0).toISOString(),
      end_time: now.add(5, 'day').hour(10).minute(0).toISOString(),
      status: 'cancelled',
      price_type: 'self_use',
      estimated_price: 140,
      is_cancelled: true,
      cancel_reason: '临时有事，撤回预约',
      is_rain_cancel: false,
      queue_position: null
    }
  ]);

  await db('reservation_queue').insert([
    {
      id: uuidv4(),
      reservation_id: res3Id,
      priority: 0,
      status: 'waiting',
      queued_at: now.toISOString()
    }
  ]);

  const workOrder1Id = uuidv4();

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
    }
  ]);

  const workRecord1Id = uuidv4();

  await db('work_records').insert([
    {
      id: workRecord1Id,
      reservation_id: res4Id,
      equipment_id: tractor2Id,
      field_id: field3Id,
      operator_id: operator2Id,
      fuel_consumption: 18.5,
      work_hours: 6,
      photos: JSON.stringify(['/uploads/work1.jpg', '/uploads/work2.jpg']),
      notes: '作业完成良好，土壤湿度适宜',
      completed_at: now.subtract(2, 'day').hour(14).minute(30).toISOString()
    }
  ]);

  const settlement1Id = uuidv4();

  await db('settlements').insert([
    {
      id: settlement1Id,
      reservation_id: res4Id,
      user_id: member1Id,
      price_type: 'self_use',
      base_price: 600,
      subsidy_amount: 0,
      total_amount: 420,
      points_deducted: 0,
      status: 'confirmed',
      created_at: now.subtract(2, 'day').hour(15).toISOString(),
      confirmed_at: now.subtract(1, 'day').hour(10).toISOString()
    }
  ]);

  const maintenance1Id = uuidv4();

  await db('maintenance_tickets').insert([
    {
      id: maintenance1Id,
      equipment_id: transplanter1Id,
      reported_by: operator1Id,
      title: '插秧机秧针损坏',
      description: '作业时发现秧针磨损严重，需要更换',
      status: 'in_progress',
      cost: 0,
      reported_at: now.subtract(1, 'day').toISOString()
    }
  ]);

  console.log('演示数据生成完成！');
  console.log('');
  console.log('登录账号：');
  console.log('  管理员: admin / 123456');
  console.log('  社员1: member1 / 123456');
  console.log('  社员2: member2 / 123456');
  console.log('  社员3: member3 / 123456');
  console.log('  机手1: operator1 / 123456');
  console.log('  机手2: operator2 / 123456');
  console.log('');
  console.log('演示场景说明：');
  console.log('  1. 预约冲突：member1 和 member2 都预约了 tractor1');
  console.log('  2. 预约撤回：member2 已取消一个预约');
  console.log('  3. 候补排队：member3 预约无人机在候补队列');
  console.log('  4. 已完成作业：有一个已完成的作业记录和结算');
  console.log('  5. 设备维修：插秧机正在维修中');
  
  process.exit(0);
}

seed().catch((err) => {
  console.error('种子数据生成失败:', err);
  process.exit(1);
});
