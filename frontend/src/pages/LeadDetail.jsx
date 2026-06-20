import { useEffect, useState } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Tabs,
  List,
  Comment,
  Avatar,
  Input,
  Form,
  Modal,
  Select,
  message,
  Divider,
  Row,
  Col,
  Timeline,
  Upload,
  Empty,
  Badge,
  Popconfirm,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getLeadDetail,
  getLeadTags,
  addLeadTags,
  removeLeadTags,
  updateLevel,
  updateStatus,
  markLost,
} from '../api/lead'
import { getRemarksByLead, createRemark, deleteRemark } from '../api/remark'
import { getAttachmentsByLead, createAttachment, deleteAttachment } from '../api/attachment'
import { getChangeLogsByLead } from '../api/changeLog'
import { getFollowUpsByLead, createFollowUp } from '../api/followUp'
import { getQuotationsByLead } from '../api/quotation'
import { getAllTags } from '../api/tag'
import { getEnabledLostReasons } from '../api/lostReason'
import { getUsersByRole } from '../api/user'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

const statusMap = {
  NEW: { text: '新线索', color: 'blue' },
  CONTACTED: { text: '已接触', color: 'cyan' },
  MEASURED: { text: '已量房', color: 'green' },
  QUOTED: { text: '已报价', color: 'gold' },
  NEGOTIATING: { text: '谈判中', color: 'purple' },
  DEAL: { text: '已成交', color: 'success' },
  LOST: { text: '已流失', color: 'red' },
}

const levelMap = {
  S: { text: 'S级', color: 'red' },
  A: { text: 'A级', color: 'orange' },
  B: { text: 'B级', color: 'gold' },
  C: { text: 'C级', color: 'blue' },
  D: { text: 'D级', color: 'default' },
}

const LeadDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [tags, setTags] = useState([])
  const [allTags, setAllTags] = useState([])
  const [remarks, setRemarks] = useState([])
  const [attachments, setAttachments] = useState([])
  const [changeLogs, setChangeLogs] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [quotations, setQuotations] = useState([])
  const [lostReasons, setLostReasons] = useState([])
  const [designers, setDesigners] = useState([])
  const [loading, setLoading] = useState(false)
  const [remarkInput, setRemarkInput] = useState('')
  const [tagModalVisible, setTagModalVisible] = useState(false)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [levelModalVisible, setLevelModalVisible] = useState(false)
  const [lostModalVisible, setLostModalVisible] = useState(false)
  const [followModalVisible, setFollowModalVisible] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [
        leadRes,
        tagsRes,
        allTagsRes,
        remarksRes,
        attachmentsRes,
        logsRes,
        followUpsRes,
        quotationsRes,
        lostReasonsRes,
        designersRes,
      ] = await Promise.all([
        getLeadDetail(id),
        getLeadTags(id),
        getAllTags(),
        getRemarksByLead(id),
        getAttachmentsByLead(id),
        getChangeLogsByLead(id),
        getFollowUpsByLead(id),
        getQuotationsByLead(id),
        getEnabledLostReasons(),
        getUsersByRole('DESIGNER'),
      ])
      setLead(leadRes)
      setTags(tagsRes || [])
      setAllTags(allTagsRes || [])
      setRemarks(remarksRes || [])
      setAttachments(attachmentsRes || [])
      setChangeLogs(logsRes || [])
      setFollowUps(followUpsRes || [])
      setQuotations(quotationsRes || [])
      setLostReasons(lostReasonsRes || [])
      setDesigners(designersRes || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleAddRemark = async () => {
    if (!remarkInput.trim()) return
    try {
      await createRemark(id, remarkInput)
      message.success('备注添加成功')
      setRemarkInput('')
      const res = await getRemarksByLead(id)
      setRemarks(res || [])
    } catch (e) {}
  }

  const handleDeleteRemark = async (remarkId) => {
    try {
      await deleteRemark(remarkId)
      message.success('删除成功')
      setRemarks(remarks.filter((r) => r.id !== remarkId))
    } catch (e) {}
  }

  const openTagModal = () => {
    setSelectedTagIds(tags.map((t) => t.id))
    setTagModalVisible(true)
  }

  const handleSaveTags = async () => {
    try {
      const currentTagIds = tags.map((t) => t.id)
      const toAdd = selectedTagIds.filter((id) => !currentTagIds.includes(id))
      const toRemove = currentTagIds.filter((id) => !selectedTagIds.includes(id))
      
      if (toAdd.length > 0) {
        await addLeadTags(id, toAdd)
      }
      if (toRemove.length > 0) {
        await removeLeadTags(id, toRemove)
      }
      
      message.success('标签保存成功')
      setTagModalVisible(false)
      const res = await getLeadTags(id)
      setTags(res || [])
    } catch (e) {}
  }

  const handleUpdateStatus = async (values) => {
    try {
      await updateStatus(id, values.status)
      message.success('状态更新成功')
      setStatusModalVisible(false)
      loadData()
    } catch (e) {}
  }

  const handleUpdateLevel = async (values) => {
    try {
      await updateLevel(id, values.level)
      message.success('等级更新成功')
      setLevelModalVisible(false)
      loadData()
    } catch (e) {}
  }

  const handleMarkLost = async (values) => {
    try {
      await markLost(id, values.lostReasonId, values.remark)
      message.success('已标记为流失')
      setLostModalVisible(false)
      loadData()
    } catch (e) {}
  }

  const handleAddFollowUp = async (values) => {
    try {
      await createFollowUp({
        leadId: id,
        ...values,
      })
      message.success('跟进记录添加成功')
      setFollowModalVisible(false)
      form.resetFields()
      const res = await getFollowUpsByLead(id)
      setFollowUps(res || [])
    } catch (e) {}
  }

  const infoItems = lead ? [
    { key: '1', label: '客户姓名', children: lead.customerName },
    { key: '2', label: '电话', children: lead.phone },
    { key: '3', label: '性别', children: lead.gender || '-' },
    { key: '4', label: '年龄', children: lead.age || '-' },
    { key: '5', label: '小区', children: lead.community || '-' },
    { key: '6', label: '地址', children: lead.address || '-' },
    { key: '7', label: '房屋类型', children: lead.houseType || '-' },
    { key: '8', label: '房屋面积', children: lead.houseArea ? `${lead.houseArea}㎡` : '-' },
    { key: '9', label: '预算范围', children: lead.budgetMin && lead.budgetMax ? `¥${lead.budgetMin} - ¥${lead.budgetMax}` : '-' },
    { key: '10', label: '装修风格', children: lead.decorationStyle || '-' },
    { key: '11', label: '装修类型', children: lead.decorationType || '-' },
    { key: '12', label: '入住时间', children: lead.moveInDate ? dayjs(lead.moveInDate).format('YYYY-MM-DD') : '-' },
    { key: '13', label: '来源', children: lead.source || '-' },
    { key: '14', label: '负责人', children: lead.ownerName || '未分配' },
    { key: '15', label: '量房设计师', children: lead.measureDesignerName || '-' },
    { key: '16', label: '量房时间', children: lead.measureDate ? dayjs(lead.measureDate).format('YYYY-MM-DD HH:mm') : '-' },
    { key: '17', label: '下次跟进时间', children: lead.nextFollowTime ? dayjs(lead.nextFollowTime).format('YYYY-MM-DD HH:mm') : '-' },
    { key: '18', label: '总跟进次数', children: lead.totalFollowCount || 0 },
    { key: '19', label: '最后跟进时间', children: lead.lastFollowTime ? dayjs(lead.lastFollowTime).format('YYYY-MM-DD HH:mm') : '-' },
    { key: '20', label: '创建时间', children: lead.createdAt ? dayjs(lead.createdAt).format('YYYY-MM-DD HH:mm') : '-' },
  ] : []

  const tabItems = [
    {
      key: 'remarks',
      label: '备注',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <TextArea
              rows={3}
              placeholder="添加备注..."
              value={remarkInput}
              onChange={(e) => setRemarkInput(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <Button type="primary" onClick={handleAddRemark} icon={<PlusOutlined />}>
              添加备注
            </Button>
          </div>
          {remarks.length > 0 ? (
            <List
              dataSource={remarks}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Popconfirm title="确定删除?" onConfirm={() => handleDeleteRemark(item.id)}>
                      <a key="delete">删除</a>
                    </Popconfirm>,
                  ]}
                >
                  <Comment
                    author={item.creatorName}
                    content={item.content}
                    datetime={dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                    avatar={<Avatar icon={<UserOutlined />} />}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无备注" />
          )}
        </div>
      ),
    },
    {
      key: 'followups',
      label: '跟进记录',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setFollowModalVisible(true)}>
              添加跟进
            </Button>
          </div>
          {followUps.length > 0 ? (
            <Timeline
              items={followUps.map((item) => ({
                color: item.status === 'COMPLETED' ? 'green' : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {item.followType || '跟进'} - {item.followerName}
                    </div>
                    <div style={{ color: '#666', margin: '4px 0' }}>{item.content}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {dayjs(item.followTime).format('YYYY-MM-DD HH:mm')}
                      {item.nextFollowTime && ` · 下次跟进: ${dayjs(item.nextFollowTime).format('YYYY-MM-DD HH:mm')}`}
                      {item.durationMinutes && ` · 耗时${item.durationMinutes}分钟`}
                    </div>
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty description="暂无跟进记录" />
          )}
        </div>
      ),
    },
    {
      key: 'quotations',
      label: '报价版本',
      children: (
        <div>
          {quotations.length > 0 ? (
            <List
              dataSource={quotations}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>版本 {item.versionNo}</span>
                        {item.isCurrent && <Tag color="green">当前版本</Tag>}
                      </Space>
                    }
                    description={
                      <div>
                        <div>总价: ¥{item.totalPrice}</div>
                        {item.discount && <div>折扣: {item.discount}%</div>}
                        <div>最终价: ¥{item.finalPrice || item.totalPrice}</div>
                        {item.paymentMethod && <div>付款方式: {item.paymentMethod}</div>}
                        {item.constructionPeriod && <div>工期: {item.constructionPeriod}天</div>}
                        <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                          创建人: {item.creatorName} · {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无报价版本" />
          )}
        </div>
      ),
    },
    {
      key: 'attachments',
      label: '附件',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Upload
              action="/api/upload"
              beforeUpload={() => {
                message.info('示例项目，上传功能需要后端文件服务支持')
                return false
              }}
            >
              <Button icon={<PlusOutlined />}>上传附件</Button>
            </Upload>
          </div>
          {attachments.length > 0 ? (
            <List
              dataSource={attachments}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <a key="download">下载</a>,
                    <Popconfirm title="确定删除?" onConfirm={async () => {
                      await deleteAttachment(item.id)
                      message.success('删除成功')
                      setAttachments(attachments.filter((a) => a.id !== item.id))
                    }}>
                      <a key="delete">删除</a>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.fileName}
                    description={
                      <div>
                        {item.category && <Tag>{item.category}</Tag>}
                        <span style={{ color: '#999', fontSize: 12 }}>
                          上传人: {item.uploaderName} · {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无附件" />
          )}
        </div>
      ),
    },
    {
      key: 'logs',
      label: '修改历史',
      children: (
        <div>
          {changeLogs.length > 0 ? (
            <Timeline
              items={changeLogs.map((item) => ({
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {item.changeType || '修改'} - {item.fieldName}
                    </div>
                    {item.oldValue && <div style={{ color: '#999' }}>旧值: {item.oldValue}</div>}
                    {item.newValue && <div style={{ color: '#52c41a' }}>新值: {item.newValue}</div>}
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                      操作人: {item.changerName} · {dayjs(item.changedAt).format('YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty description="暂无修改记录" />
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h2 style={{ margin: 0 }}>线索详情</h2>
        </Space>
        <Space>
          <Button onClick={openTagModal} icon={<EditOutlined />}>
            编辑标签
          </Button>
          <Button onClick={() => setLevelModalVisible(true)}>
            修改等级
          </Button>
          <Button onClick={() => setStatusModalVisible(true)}>
            变更状态
          </Button>
          <Button danger onClick={() => setLostModalVisible(true)}>
            标记流失
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="基本信息" loading={loading}>
            {lead && (
              <Descriptions column={2} bordered size="small" items={infoItems} />
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="客户画像" loading={loading}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>状态</div>
              {lead && (
                <Tag color={statusMap[lead.status]?.color} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {statusMap[lead.status]?.text}
                </Tag>
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>等级</div>
              {lead && (
                <Badge
                  status={levelMap[lead.level]?.color}
                  text={levelMap[lead.level]?.text}
                  style={{ fontSize: 14 }}
                />
              )}
            </div>
            <div>
              <div style={{ marginBottom: 8 }}>标签</div>
              {tags.length > 0 ? (
                <div>
                  {tags.map((tag) => (
                    <Tag key={tag.id} color={tag.color} className="tag-item">
                      {tag.name}
                    </Tag>
                  ))}
                </div>
              ) : (
                <span style={{ color: '#999' }}>暂无标签</span>
              )}
            </div>
            {lead?.remark && (
              <>
                <Divider />
                <div>
                  <div style={{ marginBottom: 8 }}>备注</div>
                  <div style={{ color: '#666' }}>{lead.remark}</div>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }}>
        <Tabs defaultActiveKey="remarks" items={tabItems} />
      </Card>

      <Modal
        title="编辑标签"
        open={tagModalVisible}
        onCancel={() => setTagModalVisible(false)}
        onOk={handleSaveTags}
        width={500}
      >
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="选择标签"
          value={selectedTagIds}
          onChange={setSelectedTagIds}
          optionLabelProp="label"
        >
          {allTags.map((tag) => (
            <Option key={tag.id} value={tag.id} label={tag.name}>
              <Tag color={tag.color}>{tag.name}</Tag>
              {tag.category && <span style={{ color: '#999', marginLeft: 8 }}>{tag.category}</span>}
            </Option>
          ))}
        </Select>
      </Modal>

      <Modal
        title="变更状态"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item
            name="status"
            label="选择状态"
            rules={[{ required: true, message: '请选择状态' }]}
            initialValue={lead?.status}
          >
            <Select placeholder="请选择状态">
              {Object.entries(statusMap).map(([key, val]) => (
                <Option key={key} value={key}>
                  <Tag color={val.color}>{val.text}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确定</Button>
              <Button onClick={() => setStatusModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改等级"
        open={levelModalVisible}
        onCancel={() => setLevelModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleUpdateLevel}>
          <Form.Item
            name="level"
            label="选择等级"
            rules={[{ required: true, message: '请选择等级' }]}
            initialValue={lead?.level}
          >
            <Select placeholder="请选择等级">
              {Object.entries(levelMap).map(([key, val]) => (
                <Option key={key} value={key}>{val.text}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确定</Button>
              <Button onClick={() => setLevelModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="标记流失"
        open={lostModalVisible}
        onCancel={() => setLostModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleMarkLost}>
          <Form.Item
            name="lostReasonId"
            label="流失原因"
            rules={[{ required: true, message: '请选择流失原因' }]}
          >
            <Select placeholder="请选择流失原因">
              {lostReasons.map((reason) => (
                <Option key={reason.id} value={reason.id}>
                  {reason.category && <span style={{ color: '#999' }}>[{reason.category}]</span>}
                  {reason.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="流失备注">
            <TextArea rows={3} placeholder="请输入流失备注" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">确认流失</Button>
              <Button onClick={() => setLostModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加跟进记录"
        open={followModalVisible}
        onCancel={() => setFollowModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleAddFollowUp}>
          <Form.Item name="followType" label="跟进方式">
            <Select placeholder="请选择跟进方式">
              <Option value="电话">电话</Option>
              <Option value="微信">微信</Option>
              <Option value="面谈">面谈</Option>
              <Option value="量房">量房</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="跟进内容"
            rules={[{ required: true, message: '请输入跟进内容' }]}
          >
            <TextArea rows={4} placeholder="请输入跟进内容" />
          </Form.Item>
          <Form.Item name="nextFollowTime" label="下次跟进时间">
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item name="durationMinutes" label="跟进耗时(分钟)">
            <Input type="number" placeholder="请输入跟进耗时" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确定</Button>
              <Button onClick={() => setFollowModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default LeadDetail
