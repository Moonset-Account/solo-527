import { Button, Dropdown, Menu, Modal, Input, message, Space } from 'antd'
import { FilterOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getSavedFilters, saveFilter, deleteFilter } from '../api/admin'

function FilterSaver({ pageName, filters, onApplyFilter }) {
  const [savedFilters, setSavedFilters] = useState([])
  const [saveModalVisible, setSaveModalVisible] = useState(false)
  const [filterName, setFilterName] = useState('')

  useEffect(() => {
    loadFilters()
  }, [pageName])

  const loadFilters = async () => {
    try {
      const res = await getSavedFilters({ page_name: pageName })
      setSavedFilters(res.data || [])
    } catch (e) {}
  }

  const handleSave = async () => {
    if (!filterName.trim()) {
      message.warning('请输入筛选条件名称')
      return
    }
    try {
      await saveFilter({
        page_name: pageName,
        filter_name: filterName,
        filter_data: filters
      })
      message.success('已保存筛选条件')
      setSaveModalVisible(false)
      setFilterName('')
      loadFilters()
    } catch (e) {}
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await deleteFilter(id)
      message.success('已删除')
      loadFilters()
    } catch (e) {}
  }

  const menuItems = [
    ...savedFilters.map(f => ({
      key: f.id,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span onClick={() => onApplyFilter(JSON.parse(f.filter_data))}>{f.filter_name}</span>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => handleDelete(f.id, e)} />
        </div>
      )
    })),
    { type: 'divider' },
    {
      key: 'save',
      label: <span onClick={() => setSaveModalVisible(true)}><SaveOutlined /> 保存当前筛选</span>
    }
  ]

  return (
    <>
      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Button icon={<FilterOutlined />}>筛选条件</Button>
      </Dropdown>

      <Modal
        title="保存筛选条件"
        open={saveModalVisible}
        onOk={handleSave}
        onCancel={() => setSaveModalVisible(false)}
      >
        <Input
          placeholder="请输入筛选条件名称"
          value={filterName}
          onChange={e => setFilterName(e.target.value)}
        />
      </Modal>
    </>
  )
}

export default FilterSaver
