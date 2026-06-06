import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Space, Select, Button, Collapse } from 'antd'
import { masterDataApi } from '../api'

const temperatureZoneMap = {
  LOW: { text: '低温', color: 'blue' },
  MIDDLE: { text: '中温', color: 'orange' },
  HIGH: { text: '高温', color: 'red' }
}

export default function FiringCurveList() {
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [zoneFilter, setZoneFilter] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await masterDataApi.getFiringCurves()
      setData(data)
      setFilteredData(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (zoneFilter) {
      setFilteredData(data.filter(d => d.temperatureZone === zoneFilter))
    } else {
      setFilteredData(data)
    }
  }, [zoneFilter, data])

  const columns = [
    { title: '曲线编码', dataIndex: 'code', width: 180 },
    { title: '曲线名称', dataIndex: 'name', width: 150 },
    { 
      title: '温区', 
      dataIndex: 'temperatureZone', 
      width: 100,
      render: zone => <Tag color={temperatureZoneMap[zone]?.color}>
        {temperatureZoneMap[zone]?.text}
      </Tag>
    },
    { title: '目标温度(℃)', dataIndex: 'targetTemperature', width: 120 },
    { title: '总时长(分钟)', dataIndex: 'totalDuration', width: 120 },
    { title: '说明', dataIndex: 'description' }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>曲线模板</h2>
        <Space>
          <Select 
            placeholder="按温区筛选" 
            style={{ width: 120 }} 
            allowClear
            onChange={setZoneFilter}
          >
            <Select.Option value="LOW">低温</Select.Option>
            <Select.Option value="MIDDLE">中温</Select.Option>
            <Select.Option value="HIGH">高温</Select.Option>
          </Select>
        </Space>
      </div>

      <div className="table-container">
        <Collapse 
          items={filteredData.map(curve => ({
            key: curve.id,
            label: (
              <Space>
                <strong>{curve.name}</strong>
                <Tag color={temperatureZoneMap[curve.temperatureZone]?.color}>
                  {temperatureZoneMap[curve.temperatureZone]?.text}
                </Tag>
                <span style={{ color: '#999' }}>{curve.code}</span>
              </Space>
            ),
            children: (
              <div>
                <p><strong>目标温度：</strong>{curve.targetTemperature}℃</p>
                <p><strong>总时长：</strong>{curve.totalDuration} 分钟</p>
                <p><strong>说明：</strong>{curve.description || '-'}</p>
                {curve.curveData?.segments && (
                  <>
                    <p><strong>曲线段：</strong></p>
                    <ul>
                      {curve.curveData.segments.map((seg, idx) => (
                        <li key={idx}>
                          第{idx + 1}段：{seg.duration}分钟，目标{seg.target}℃
                          {seg.soak && '（保温）'}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )
          }))}
        />
      </div>
    </div>
  )
}
