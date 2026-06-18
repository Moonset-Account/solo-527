import { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Modal, Form, Input, Select, DatePicker, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, UserAddOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../../api';
import { ClassDto, User } from '../../types';

export default function AdminClasses() {
  const [data, setData] = useState<ClassDto[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassDto | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm();
  const [enrollForm] = Form.useForm();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.classes.list(),
      api.auth.getUsersByRole('Teacher'),
      api.auth.getUsersByRole('Student')
    ]).then(([classes, t, s]) => {
      setData(classes as ClassDto[]);
      setTeachers(t as User[]);
      setStudents(s as User[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleOpen = (record?: ClassDto) => {
    setEditMode(!!record);
    setSelectedClass(record || null);
    if (record) {
      form.setFieldsValue({
        ...record,
        startDate: dayjs(record.startDate),
        endDate: dayjs(record.endDate)
      });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        courseId: values.courseId || 1
      };
      if (editMode && selectedClass) {
        await api.classes.update(selectedClass.id, payload);
        message.success('班级已更新');
      } else {
        await api.classes.create(payload);
        message.success('班级已创建');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const handleEnroll = async (values: any) => {
    if (!selectedClass) return;
    try {
      await api.classes.enrollStudent(selectedClass.id, values.studentId);
      message.success('学生已加入班级');
      setEnrollOpen(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const columns = [
    { title: '班级名称', dataIndex: 'name', key: 'name' },
    { title: '课程', dataIndex: 'courseName', key: 'courseName' },
    { title: '授课老师', dataIndex: 'teacherName', key: 'teacherName' },
    { title: '人数', key: 'count', render: (_: any, r: ClassDto) => `${r.studentCount}/${r.maxStudents}` },
    { title: '时间', key: 'date', render: (_: any, r: ClassDto) =>
      `${dayjs(r.startDate).format('YYYY-MM-DD')} ~ ${dayjs(r.endDate).format('YYYY-MM-DD')}`
    },
    { title: '状态', dataIndex: 'isActive', key: 'status', render: (v: boolean) =>
      v ? <Tag color="green">进行中</Tag> : <Tag color="gray">已结束</Tag>
    },
    {
      title: '操作', key: 'action', render: (_: any, r: ClassDto) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpen(r)}>编辑</Button>
          <Button size="small" icon={<UserAddOutlined />} type="link" onClick={() => {
            setSelectedClass(r);
            enrollForm.resetFields();
            setEnrollOpen(true);
          }}>添加学生</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>班级管理</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpen()}>新建班级</Button>
      </div>
      <Card className="card-shadow">
        <Table rowKey="id" loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={editMode ? '编辑班级' : '新建班级'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="班级名称" rules={[{ required: true }]}>
            <Input placeholder="请输入班级名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="teacherId" label="授课老师">
            <Select placeholder="选择老师">
              {teachers.map(t => <Select.Option key={t.id} value={t.id}>{t.realName}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="maxStudents" label="最大人数" rules={[{ required: true }]} initialValue={15}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item label="开课时间" required>
            <Space style={{ width: '100%' }}>
              <Form.Item name="startDate" noStyle rules={[{ required: true }]}>
                <DatePicker style={{ flex: 1 }} />
              </Form.Item>
              <Form.Item name="endDate" noStyle rules={[{ required: true }]}>
                <DatePicker style={{ flex: 1 }} />
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={`为「${selectedClass?.name}」添加学生`} open={enrollOpen}
        onCancel={() => setEnrollOpen(false)} onOk={() => enrollForm.submit()} destroyOnClose>
        <Form form={enrollForm} layout="vertical" onFinish={handleEnroll}>
          <Form.Item name="studentId" label="选择学生" rules={[{ required: true }]}>
            <Select placeholder="选择要添加的学生" showSearch optionFilterProp="children">
              {students.map(s => <Select.Option key={s.id} value={s.id}>{s.realName}</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
