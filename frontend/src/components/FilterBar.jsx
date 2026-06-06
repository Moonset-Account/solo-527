import React, { useEffect, useState } from 'react';
import { Row, Col, Select, DatePicker, Button, Tag, Space, Tooltip } from 'antd';
import { ReloadOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import { useFilter } from '../context/FilterContext';
import { getFloors, getAreas, getUserGroups, getSeatTypes, getTimeSlots, exportCSV, exportPDF } from '../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const FilterBar = () => {
  const { filters, updateFilter, updateFilters, resetFilters, getActiveFilters } = useFilter();
  const [floors, setFloors] = useState([]);
  const [areas, setAreas] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [seatTypes, setSeatTypes] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    if (filters.floor_id) {
      fetchAreas(filters.floor_id);
    } else {
      setAreas([]);
    }
  }, [filters.floor_id]);

  const fetchOptions = async () => {
    try {
      const [floorsRes, groupsRes, typesRes, slotsRes] = await Promise.all([
        getFloors(),
        getUserGroups(),
        getSeatTypes(),
        getTimeSlots()
      ]);
      setFloors(floorsRes.data.data || []);
      setUserGroups(groupsRes.data.data || []);
      setSeatTypes(typesRes.data.data || []);
      setTimeSlots(slotsRes.data.data || []);
    } catch (error) {
      console.error('获取筛选选项失败:', error);
    }
  };

  const fetchAreas = async (floorId) => {
    try {
      const res = await getAreas(floorId);
      setAreas(res.data.data || []);
    } catch (error) {
      console.error('获取区域列表失败:', error);
    }
  };

  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      updateFilters({
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD')
      });
    }
  };

  const handleExportCSV = () => {
    exportCSV(filters);
  };

  const handleExportPDF = () => {
    exportPDF(filters);
  };

  const activeFilters = getActiveFilters();

  const getFilterLabel = (key, value) => {
    const labels = {
      start_date: '开始日期',
      end_date: '结束日期',
      floor_id: '楼层',
      area_id: '区域',
      seat_type: '座位类型',
      user_group_id: '用户组',
      time_slot: '时间段'
    };
    
    let displayValue = value;
    if (key === 'time_slot') {
      const slot = timeSlots.find(s => s.key === value);
      displayValue = slot ? slot.label : value;
    }
    if (key === 'floor_id') {
      const floor = floors.find(f => f.id === value);
      displayValue = floor ? floor.floor_name : value;
    }
    if (key === 'area_id') {
      const area = areas.find(a => a.id === value);
      displayValue = area ? area.area_name : value;
    }
    if (key === 'user_group_id') {
      const group = userGroups.find(g => g.id === value);
      displayValue = group ? group.group_name : value;
    }
    
    return `${labels[key] || key}: ${displayValue}`;
  };

  return (
    <div className="filter-bar">
      <Row gutter={16} align="middle">
        <Col xs={24} sm={12} md={5}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>日期范围</span>
            <RangePicker
              style={{ width: '100%' }}
              size="middle"
              value={[
                filters.start_date ? dayjs(filters.start_date) : null,
                filters.end_date ? dayjs(filters.end_date) : null
              ]}
              onChange={handleDateChange}
            />
          </Space>
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>楼层</span>
            <Select
              style={{ width: '100%' }}
              placeholder="选择楼层"
              allowClear
              size="middle"
              value={filters.floor_id}
              onChange={(v) => updateFilter('floor_id', v)}
            >
              {floors.map(f => (
                <Option key={f.id} value={f.id}>{f.floor_name}</Option>
              ))}
            </Select>
          </Space>
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>区域</span>
            <Select
              style={{ width: '100%' }}
              placeholder="选择区域"
              allowClear
              size="middle"
              disabled={!filters.floor_id}
              value={filters.area_id}
              onChange={(v) => updateFilter('area_id', v)}
            >
              {areas.map(a => (
                <Option key={a.id} value={a.id}>{a.area_name}</Option>
              ))}
            </Select>
          </Space>
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>座位类型</span>
            <Select
              style={{ width: '100%' }}
              placeholder="选择类型"
              allowClear
              size="middle"
              value={filters.seat_type}
              onChange={(v) => updateFilter('seat_type', v)}
            >
              {seatTypes.map(t => (
                <Option key={t} value={t}>{t}</Option>
              ))}
            </Select>
          </Space>
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>用户组</span>
            <Select
              style={{ width: '100%' }}
              placeholder="用户组"
              allowClear
              size="middle"
              value={filters.user_group_id}
              onChange={(v) => updateFilter('user_group_id', v)}
            >
              {userGroups.map(g => (
                <Option key={g.id} value={g.id}>{g.group_name}</Option>
              ))}
            </Select>
          </Space>
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>时间段</span>
            <Select
              style={{ width: '100%' }}
              placeholder="选择时段"
              allowClear
              size="middle"
              value={filters.time_slot}
              onChange={(v) => updateFilter('time_slot', v)}
            >
              {timeSlots.map(s => (
                <Option key={s.key} value={s.key}>{s.label}</Option>
              ))}
            </Select>
          </Space>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={resetFilters}>
              重置
            </Button>
            <Tooltip title="导出 CSV">
              <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
                CSV
              </Button>
            </Tooltip>
            <Tooltip title="导出 PDF">
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportPDF}>
                PDF
              </Button>
            </Tooltip>
          </Space>
        </Col>
      </Row>
      {activeFilters.length > 0 && (
        <div className="filter-tags">
          <Space wrap>
            <Tag icon={<FilterOutlined />} color="blue">
              当前筛选:
            </Tag>
            {activeFilters.map(([key, value]) => (
              <Tag
                key={key}
                closable
                onClose={() => updateFilter(key, null)}
              >
                {getFilterLabel(key, value)}
              </Tag>
            ))}
          </Space>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
