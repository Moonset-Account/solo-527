
import { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Space, Select, Modal, Form, Input, Upload, Tag, message, Image, Descriptions } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UploadOutlined } from '@ant-design/icons'
import { getPortfolio, createPortfolio, updatePortfolio, deletePortfolio, uploadPortfolioImage } from '../../api/portfolio'
import { getMembers } from '../../api/members'
import { getTreatments } from '../../api/treatments'

const { Option } = Select
const { TextArea } = Input

const PortfolioManagement = () => {
  const [data, setData] = useState([])
  const [members, setMembers] = useState([])
  const [treatments, setTreatments] = useState([])
  const [treatmentFilter, setTreatmentFilter] = useState('')
  const [memberFilter, setMemberFilter] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [currentItem, setCurrentItem] = useState(null)
  const [form] = Form.useForm()
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  const statusMap = {
    active: { text: '已上架', color: 'green' },
    inactive: { text: '已下架', color: 'default' },
    pending: { text: '待审核', color: 'orange' },
    approved: { text: '已审核', color: 'green' },
  }

  const loadPortfolio = async () => {
    const params = { pageSize: 100 }
    if (treatmentFilter) {
      params.treatmentId = treatmentFilter
    }
    if (memberFilter) {
      params.memberId = memberFilter
    }
    const res = await getPortfolio(params)
    if (res.success) {
      setData(res.data.list || [])
    }
  }

  const loadMembers = async () => {
    const res = await getMembers({ pageSize: 100 })
    if (res.success) {
      setMembers(res.data.list || [])
    }
  }

  const loadTreatments = async () => {
    const res = await getTreatments({ pageSize: 100 })
    if (res.success) {
      setTreatments(res.data.list || [])
    }
  }

  useEffect(() => {
    loadPortfolio()
    loadMembers()
    loadTreatments()
  }, [])

  useEffect(() => {
    loadPortfolio()
  }, [treatmentFilter, memberFilter])

  const handleAdd = () => {
    setEditingItem(null)
    setImageUrl('')
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    setImageUrl(record.image || '')
    form.setFieldsValue({
      memberId: record.memberId,
      treatmentId: record.treatmentId,
      title: record.title,
      description: record.description,
      status: record.status,
    })
    setModalVisible(true)
  }

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该作品吗？',
      onOk: async () => {
        const res = await deletePortfolio(id)
        if (res.success) {
          message.success('删除成功')
          loadPortfolio()
        }
      },
    })
  }

  const handleDetail = (record) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  const handleUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true)
    try {
      const res = await uploadPortfolioImage(file)
      if (res.success) {
        const url = res.data.url
        setImageUrl(url)
        onSuccess({ url })
      } else {
        onError(new Error('上传失败'))
      }
    } catch (err) {
      onError(err)
    } finally {
      setUploading(false)
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        image: imageUrl,
      }
      if (editingItem) {
        const res = await updatePortfolio(editingItem.id, submitData)
        if (res.success) {
          message.success('修改成功')
          setModalVisible(false)
          loadPortfolio()
        }
      } else {
        const res = await createPortfolio(submitData)
        if (res.success) {
          message.success('添加成功')
          setModalVisible(false)
          loadPortfolio()
        }
      }
    } catch (err) {
      // validation error
    }
  }

  const getMemberName = (item) => {
    if (item.member) return item.member.name
    const m = members.find(m => m.id === item.memberId)
    return m ? m.name : item.memberId
  }

  const getTreatmentName = (item) => {
    if (item.treatment) return item.treatment.name
    const t = treatments.find(t => t.id === item.treatmentId)
    return t ? t.name : ''
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>作品管理</h2>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Select
              placeholder="疗程筛选"
              value={treatmentFilter || undefined}
              onChange={setTreatmentFilter}
              allowClear
              style={{ width: 150 }}
            >
              {treatments.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
            </Select>
            <Select
              placeholder="会员筛选"
              value={memberFilter || undefined}
              onChange={setMemberFilter}
              allowClear
              style={{ width: 150 }}
              showSearch
              optionFilterProp="children"
            >
              {members.map(m => <Option key={m.id} value={m.id}>{m.name}</Option>)}
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            上传作品
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          {data.map(item => {
            const st = statusMap[item.status] || { text: item.status, color: 'default' }
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                <Card
                  hoverable
                  cover={
                    <div style={{ position: 'relative' }}>
                      <Image
                        src={item.image}
                        height={200}
                        style={{ objectFit: 'cover', width: '100%' }}
                        preview={false}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJhAPk2iMa1AAAAABJRU5ErkJggg=="
                      />
                      {item.beforeImage && (
                        <Image
                          src={item.beforeImage}
                          style={{ display: 'none' }}
                          preview={false}
                        />
                      )}
                      <Tag
                        color={st.color}
                        style={{ position: 'absolute', top: 8, left: 8 }}
                      >
                        {st.text}
                      </Tag>
                    </div>
                  }
                  actions={[
                    <EyeOutlined key="view" onClick={() => handleDetail(item)} />,
                    <EditOutlined key="edit" onClick={() => handleEdit(item)} />,
                    <DeleteOutlined key="delete" onClick={() => handleDelete(item.id)} />,
                  ]}
                >
                  <Card.Meta
                    title={item.title || getMemberName(item)}
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>{getTreatmentName(item)}</div>
                        <div style={{ color: '#999', fontSize: 12 }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            )
          })}
        </Row>

        {data.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: 50 }}>暂无作品数据</div>
        )}
      </Card>

      <Modal
        title={editingItem ? '编辑作品' : '上传作品'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="memberId" label="会员" rules={[{ required: true, message: '请选择会员' }]}>
            <Select showSearch optionFilterProp="children" placeholder="请选择会员">
              {members.map(m => <Option key={m.id} value={m.id}>{m.name} ({m.phone})</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="treatmentId" label="疗程类型">
            <Select allowClear placeholder="请选择疗程">
              {treatments.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="作品标题" rules={[{ required: true, message: '请输入作品标题' }]}>
            <Input placeholder="请输入作品标题" />
          </Form.Item>
          <Form.Item label="作品图片" required>
            <Upload
              customRequest={handleUpload}
              showUploadList={false}
              accept="image/*"
            >
              {imageUrl ? (
                <Image src={imageUrl} style={{ maxWidth: 200, maxHeight: 200 }} />
              ) : (
                <div>
                  <Button icon={<UploadOutlined />} loading={uploading}>上传图片</Button>
                </div>
              )}
            </Upload>
            {!imageUrl && <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>请先上传图片</div>}
          </Form.Item>
          <Form.Item name="description" label="作品描述">
            <TextArea rows={3} placeholder="请输入作品描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="作品详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentItem && (
          <>
            <Row gutter={16}>
              {currentItem.image && (
                <Col span={currentItem.beforeImage ? 12 : 24} style={{ marginBottom: 16 }}>
                  <Image src={currentItem.image} style={{ width: '100%', borderRadius: 8 }} />
                </Col>
              )}
              {currentItem.beforeImage && (
                <Col span={12} style={{ marginBottom: 16 }}>
                  <Image src={currentItem.beforeImage} style={{ width: '100%', borderRadius: 8 }} />
                </Col>
              )}
            </Row>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="标题">{currentItem.title}</Descriptions.Item>
              <Descriptions.Item label="会员">{getMemberName(currentItem)}</Descriptions.Item>
              <Descriptions.Item label="疗程">{getTreatmentName(currentItem)}</Descriptions.Item>
              <Descriptions.Item label="描述">{currentItem.description}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {currentItem.createdAt ? new Date(currentItem.createdAt).toLocaleString() : ''}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={(statusMap[currentItem.status] || {}).color || 'default'}>
                  {(statusMap[currentItem.status] || {}).text || currentItem.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  )
}

export default PortfolioManagement
