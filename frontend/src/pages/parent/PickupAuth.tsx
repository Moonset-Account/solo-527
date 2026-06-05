import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Child, AuthorizedPickupPerson } from '@/types';
import { getChildren, getChild, createAuthorizedPickup } from '@/api/children';

export default function PickupAuth() {
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [data, setData] = useState<AuthorizedPickupPerson[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedChildId, setSelectedChildId] = useState<number | undefined>();

  useEffect(() => {
    getChildren({ is_active: true })
      .then((res) => {
        setChildren(res.results);
        if (res.results.length > 0) {
          setSelectedChildId(res.results[0].id);
        }
      })
      .catch(() => message.error('获取儿童列表失败'));
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    setLoading(true);
    getChild(selectedChildId)
      .then((child) => {
        setData(child.authorized_pickups || []);
      })
      .catch(() => message.error('获取接送人信息失败'))
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  const columns: ColumnsType<AuthorizedPickupPerson> = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '关系', dataIndex: 'relation', key: 'relation' },
    { title: '身份证号', dataIndex: 'id_number', key: 'id_number' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v: boolean) => (v ? <Tag color="green">有效</Tag> : <Tag color="red">已停用</Tag>),
    },
  ];

  const handleAdd = () => {
    if (!selectedChildId) {
      message.warning('请先选择孩子');
      return;
    }
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createAuthorizedPickup(selectedChildId!, values);
      message.success('授权接送人添加成功，等待审核');
      setModalOpen(false);
      const res = await getChildren({ is_active: true });
      setChildren(res.results);
    } catch {
      message.error('添加失败');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2>接送授权</h2>
          <Select
            placeholder="选择孩子"
            style={{ width: 200 }}
            value={selectedChildId}
            onChange={setSelectedChildId}
            options={children.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          申请新增授权
        </Button>
      </div>

      <Table<AuthorizedPickupPerson>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="申请新增授权接送人"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="relation" label="与孩子关系" rules={[{ required: true, message: '请选择关系' }]}>
            <Select
              options={[
                { value: '父亲', label: '父亲' },
                { value: '母亲', label: '母亲' },
                { value: '爷爷', label: '爷爷' },
                { value: '奶奶', label: '奶奶' },
                { value: '外公', label: '外公' },
                { value: '外婆', label: '外婆' },
                { value: '其他', label: '其他' },
              ]}
            />
          </Form.Item>
          <Form.Item name="id_number" label="身份证号" rules={[{ required: true, message: '请输入身份证号' }]}>
            <Input maxLength={18} />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
