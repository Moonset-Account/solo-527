import React from 'react'
import { Card, Descriptions, Tabs, Tag, List, Avatar, Button, Space } from 'antd'
import { useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { childApi } from '@/services/children'
import type { Child } from '@/types'
import dayjs from 'dayjs'

const { TabPane } = Tabs

const ChildDetail = () => {
  const { id } = useParams<{ id: string }>()

  const { data: child, isLoading } = useQuery(
    ['child', id],
    () => childApi.getDetail(Number(id)).then((res) => res.data)
  )

  const { data: authorizedPersons } = useQuery(
    ['child-authorized', id],
    () => childApi.getAuthorizedPersons(Number(id)).then((res) => res.data),
    { enabled: !!id }
  )

  if (isLoading || !child) {
    return <Card loading />
  }

  const typedChild = child as Child

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">{typedChild.name} - 儿童档案</h2>
        <Space>
          <Button>编辑</Button>
        </Space>
      </div>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Descriptions column={4}>
          <Descriptions.Item label="姓名">{typedChild.name}</Descriptions.Item>
          <Descriptions.Item label="性别">{typedChild.gender_display}</Descriptions.Item>
          <Descriptions.Item label="出生日期">{typedChild.birth_date}</Descriptions.Item>
          <Descriptions.Item label="年龄">{typedChild.age}岁</Descriptions.Item>
          <Descriptions.Item label="班级">{typedChild.class_name}</Descriptions.Item>
          <Descriptions.Item label="入园日期">{typedChild.enrollment_date}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={typedChild.status === 'active' ? 'green' : 'orange'}>
              {typedChild.status_display}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="身份证号">{typedChild.id_card || '-'}</Descriptions.Item>
          <Descriptions.Item label="紧急联系人">{typedChild.emergency_contact}</Descriptions.Item>
          <Descriptions.Item label="紧急电话">{typedChild.emergency_phone}</Descriptions.Item>
          <Descriptions.Item label="过敏史">{typedChild.allergies || '-'}</Descriptions.Item>
          <Descriptions.Item label="医疗备注">{typedChild.medical_notes || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card bordered={false}>
        <Tabs defaultActiveKey="authorized">
          <TabPane tab="授权接送人" key="authorized">
            <List
              dataSource={authorizedPersons}
              renderItem={(item: any) => (
                <List.Item
                  actions={[
                    item.is_active
                      ? <Tag color="green">有效</Tag>
                      : <Tag color="red">已失效</Tag>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar>{item.name?.[0]}</Avatar>}
                    title={item.name}
                    description={
                      <>
                        <div>关系：{item.relation}</div>
                        <div>电话：{item.phone}</div>
                        {item.expires_at && (
                          <div>有效期至：{dayjs(item.expires_at).format('YYYY-MM-DD')}</div>
                        )}
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>
          <TabPane tab="接送记录" key="pickup">
            <p style={{ color: '#8c8c8c' }}>接送记录列表...</p>
          </TabPane>
          <TabPane tab="每日记录" key="daily">
            <p style={{ color: '#8c8c8c' }}>每日记录列表...</p>
          </TabPane>
          <TabPane tab="成长记录" key="growth">
            <p style={{ color: '#8c8c8c' }}>成长记录列表...</p>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default ChildDetail
