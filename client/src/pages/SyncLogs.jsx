import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Tag, Card, Alert, Select, Form, Collapse, message } from 'antd'
import { SyncOutlined, WarningOutlined, CheckCircleOutlined, BulbOutlined, ReloadOutlined } from '@ant-design/icons'
import { getSyncLogs, createSyncLog } from '../services/api'
import dayjs from 'dayjs'

function SyncLogs() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })
  const [filterForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const values = filterForm.getFieldsValue()
      const res = await getSyncLogs({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...values
      })
      setList(res.list)
      setTotal(res.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }))
    setTimeout(loadData, 0)
  }

  const handleReset = () => {
    filterForm.resetFields()
    setPagination(p => ({ ...p, current: 1 }))
    setTimeout(loadData, 0)
  }

  const handleTestSync = async type => {
    try {
      const isError = Math.random() > 0.5
      const errorMsg = isError ? getRandomError() : null
      const suggestion = isError ? getSuggestionForError(errorMsg) : null

      await createSyncLog({
        syncType: type,
        status: isError ? 'ERROR' : 'SUCCESS',
        errorMsg,
        suggestion
      })

      if (isError) {
        message.error(`${type} 同步失败：${errorMsg}（建议：${suggestion}）`)
      } else {
        message.success(`${type} 同步成功`)
      }
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const getRandomError = () => {
    const errors = [
      '网络连接超时，请检查网络设置',
      '数据库连接失败，无法读取数据',
      '权限验证失败，token已过期',
      '数据格式错误，无法解析响应',
      '服务器响应超时，请稍后重试',
      '文件上传失败，存储空间不足'
    ]
    return errors[Math.floor(Math.random() * errors.length)]
  }

  const getSuggestionForError = error => {
    if (error.includes('网络') || error.includes('超时')) {
      return '建议检查网络连接是否正常，或切换网络环境后重试'
    }
    if (error.includes('数据库') || error.includes('数据')) {
      return '建议联系技术人员检查数据库连接配置和数据格式'
    }
    if (error.includes('权限') || error.includes('token')) {
      return '建议重新登录获取新的token，或检查权限配置'
    }
    if (error.includes('空间') || error.includes('存储')) {
      return '建议清理存储空间，或联系管理员扩容'
    }
    return '建议稍后重试，如问题持续请联系技术支持'
  }

  const errorCount = list.filter(l => l.status === 'ERROR').length

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '同步类型',
      dataIndex: 'syncType',
      key: 'syncType',
      width: 120,
      render: t => <Tag color="blue">{t}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: s => {
        if (s === 'SUCCESS') return <Tag color="green" icon={<CheckCircleOutlined />}>成功</Tag>
        if (s === 'ERROR') return <Tag color="red" icon={<WarningOutlined />}>失败</Tag>
        return <Tag>{s}</Tag>
      }
    },
    { title: '错误信息', dataIndex: 'errorMsg', key: 'errorMsg', render: v => v || '-' },
    {
      title: '处理建议',
      dataIndex: 'suggestion',
      key: 'suggestion',
      render: v => v ? (
        <span style={{ color: '#52c41a' }}>
          <BulbOutlined style={{ marginRight: 4 }} />
          {v}
        </span>
      ) : '-'
    },
    { title: '同步时间', dataIndex: 'syncTime', key: 'syncTime', width: 170, render: t => dayjs(t).format('YYYY-MM-DD HH:mm:ss') },
    { title: '备注', dataIndex: 'remark', key: 'remark', render: v => v || '-' }
  ]

  const syncTypes = [
    { type: '订单数据', desc: '同步订单、档期、交付节点等数据' },
    { type: '品牌数据', desc: '同步品牌、报价、合同等数据' },
    { type: '会员数据', desc: '同步会员信息和订阅数据' },
    { type: '照片数据', desc: '同步选片和成片数据' },
    { type: '财务数据', desc: '同步回款和财务报表数据' }
  ]

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>同步日志</h2>
        <p style={{ color: '#666', marginTop: 8 }}>
          查看系统同步记录，同步失败时会显示可处理建议
        </p>
      </div>

      {errorCount > 0 && (
        <Alert
          className="sync-error-tip"
          type="warning"
          showIcon
          message={`有 ${errorCount} 条同步失败记录`}
          description="请查看下方日志列表中的处理建议，或点击对应类型的重试按钮重新同步。"
          action={<Button size="small" type="primary" onClick={loadData}>刷新</Button>}
          closable
        />
      )}

      <Card title="同步操作" style={{ marginBottom: 16 }}>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          <Form form={filterForm} layout="inline" onFinish={handleSearch}>
            <Form.Item name="syncType" label="同步类型">
              <Select placeholder="全部类型" style={{ width: 150 }} allowClear>
                {syncTypes.map(s => (
                  <Select.Option key={s.type} value={s.type}>{s.type}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select placeholder="全部状态" style={{ width: 120 }} allowClear>
                <Select.Option value="SUCCESS">成功</Select.Option>
                <Select.Option value="ERROR">失败</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">搜索</Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </div>

        <Space wrap style={{ marginTop: 16 }}>
          {syncTypes.map(s => (
            <Button
              key={s.type}
              icon={<SyncOutlined />}
              onClick={() => handleTestSync(s.type)}
            >
              同步{s.type}
            </Button>
          ))}
        </Space>
      </Card>

      <Card title="同步日志">
        <div className="table-toolbar">
          <span style={{ color: '#666' }}>共 {total} 条记录</span>
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        </div>
        <Table
          loading={loading}
          columns={columns}
          dataSource={list}
          rowKey="id"
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showTotal: t => `共 ${t} 条`
          }}
          onChange={pag => setPagination({ current: pag.current, pageSize: pag.pageSize })}
          expandedRowRender={record => (
            <div style={{ padding: '0 24px' }}>
              {record.errorMsg && (
                <div style={{ marginBottom: 12 }}>
                  <h4 style={{ color: '#f5222d', marginBottom: 8 }}>
                    <WarningOutlined style={{ marginRight: 8 }} />
                    错误详情
                  </h4>
                  <p style={{ background: '#fff1f0', padding: 12, borderRadius: 4, margin: 0 }}>
                    {record.errorMsg}
                  </p>
                </div>
              )}
              {record.suggestion && (
                <div>
                  <h4 style={{ color: '#52c41a', marginBottom: 8 }}>
                    <BulbOutlined style={{ marginRight: 8 }} />
                    可处理建议
                  </h4>
                  <p style={{ background: '#f6ffed', padding: 12, borderRadius: 4, margin: 0 }}>
                    {record.suggestion}
                  </p>
                </div>
              )}
              {!record.errorMsg && !record.suggestion && (
                <p style={{ color: '#999' }}>本次同步无异常</p>
              )}
            </div>
          )}
        />
      </Card>
    </div>
  )
}

export default SyncLogs
