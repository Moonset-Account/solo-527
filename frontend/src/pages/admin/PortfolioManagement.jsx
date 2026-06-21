
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
  const [fileList, setFileList] = useState([])

  const statusMap = {
    approved: { text: '已审核', color: 'green' },
    pending: { text: '待审核', color: 'orange' },
  }

  const loadPortfolio = async () => {
    const params = { pageSize: 100 }
    if (treatmentFilter) {
      params.treatment = treatmentFilter
    }
    if (memberFilter) {
      params.memberName = memberFilter
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
    setFileList([])
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setFileList((record.images || []).map((url, index) => ({
      uid: `-${index}`,
      name: `image-${index}.jpg`,
      status: 'done',
      url,
    })))
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

  const handleModalOk = () => {
    form.validateFields().then(async (values) => {
      const images = fileList.map(f => f.url || f.response?.url).filter(Boolean)
      const submitData = { ...values, images }
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
    })
  }

  const uploadProps = {
    fileList,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const res = await uploadPortfolioImage(file)
        if (res.success) {
          const url = res.data.url || res.data
          onSuccess({ url })
          setFileList(prev => prev.map(f => 
            f.uid === file.uid ? { ...f, status: 'done', url } : f
          ))
        } else {
          onError(new Error('上传失败'))
        }
      } catch (error) {
        onError(error)
      }
    },
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
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
              {treatments.map(t => <Option key={t.id} value={t.name}>{t.name}</Option>)}
            </Select>
            <Input.Search
              placeholder="搜索会员姓名"
              allowClear
              style={{ width: 200 }}
              onSearch={setMemberFilter}
            />
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            上传作品
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          {data.map(item => (
            <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
              <Card
                hoverable
                cover={
                  <div style={{ position: 'relative' }}>
                    <Image
                      src={item.images?.[0]}
                      height={200}
                      style={{ objectFit: 'cover', width: '100%' }}
                      preview={false}
                    />
                    {item.images?.length > 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      >
                        +{item.images.length - 1}
                      </div>
                    )}
                    <Tag
                      color={statusMap[item.status].color}
                      style={{ position: 'absolute', top: 8, left: 8 }}
                    >
                      {statusMap[item.status].text}
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
                  title={item.memberName}
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>{item.treatment}</div>
                      <div style={{ color: '#999', fontSize: 12 }}>{item.createTime}</div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>

        {data.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: 50 }}>暂无作品数据</div>
        )}

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button>加载更多</Button>
        </div>
      </Card>

      <Modal
        title={editingItem ? '编辑作品' : '上传作品'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="memberName" label="会员姓名" rules={[{ required: true, message: '请输入会员姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="treatment" label="疗程类型" rules={[{ required: true, message: '请选择疗程' }]}>
            <Select>
              {treatments.map(t => <Option key={t.id} value={t.name}>{t.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="作品图片" rules={[{ required: true, message: '请上传作品图片' }]}>
            <Upload {...uploadProps} listType="picture-card" multiple>
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            </Upload>
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
              {(currentItem.images || []).map((img, index) => (
                <Col span={12} key={index} style={{ marginBottom: 16 }}>
                  <Image src={img} style={{ width: '100%', borderRadius: 8 }} />
                </Col>
              ))}
            </Row>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="会员">{currentItem.memberName}</Descriptions.Item>
              <Descriptions.Item label="疗程">{currentItem.treatment}</Descriptions.Item>
              <Descriptions.Item label="描述">{currentItem.description}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentItem.createTime}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentItem.status].color}>
                  {statusMap[currentItem.status].text}
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
