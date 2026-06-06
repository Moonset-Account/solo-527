import React, { useState } from 'react';
import { Dropdown, Button, Modal, Input, message, Popconfirm } from 'antd';
import { Save, FolderOpen, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { useViewStore } from '../../stores/viewStore';
import { useFilterStore } from '../../stores/filterStore';
import { FilterState } from '../../data/types';

export const ViewManager: React.FC = () => {
  const { views, saveView, deleteView, renameView, selectedViewId, selectView } = useViewStore();
  const filters = useFilterStore();
  
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [renamingViewId, setRenamingViewId] = useState<string | null>(null);
  
  const handleSaveView = () => {
    if (!newViewName.trim()) {
      message.warning('请输入视图名称');
      return;
    }
    saveView(newViewName.trim(), filters as unknown as FilterState);
    message.success('视图保存成功');
    setSaveModalOpen(false);
    setNewViewName('');
  };
  
  const handleRename = () => {
    if (!renamingViewId || !newViewName.trim()) {
      message.warning('请输入视图名称');
      return;
    }
    renameView(renamingViewId, newViewName.trim());
    message.success('视图重命名成功');
    setRenameModalOpen(false);
    setNewViewName('');
    setRenamingViewId(null);
  };
  
  const handleLoadView = (viewId: string) => {
    const view = views.find((v) => v.id === viewId);
    if (view) {
      filters.applyFilters(view.filters);
      selectView(viewId);
      message.success(`已加载视图: ${view.name}`);
    }
  };
  
  const handleDelete = (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteView(viewId);
    message.success('视图已删除');
  };
  
  const openRenameModal = (viewId: string, viewName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingViewId(viewId);
    setNewViewName(viewName);
    setRenameModalOpen(true);
  };
  
  const menuItems = [
    {
      key: 'header',
      label: <span className="text-xs text-gray-400 font-medium">已保存视图</span>,
      disabled: true,
    },
    ...views.map((view) => ({
      key: view.id,
      label: (
        <div className="flex items-center justify-between gap-4 py-1">
          <span
            className={`cursor-pointer flex-1 truncate ${selectedViewId === view.id ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
            onClick={() => handleLoadView(view.id)}
          >
            {view.name}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="text"
              size="small"
              icon={<Edit3 size={12} />}
              onClick={(e) => openRenameModal(view.id, view.name, e)}
              className="text-gray-400 hover:text-blue-500 p-0"
            />
            <Popconfirm
              title="确认删除此视图？"
              onConfirm={(e) => handleDelete(view.id, e as React.MouseEvent)}
              okText="删除"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                icon={<Trash2 size={12} />}
                className="text-gray-400 hover:text-red-500 p-0"
              />
            </Popconfirm>
          </div>
        </div>
      ),
    })),
    {
      type: 'divider' as const,
    },
    {
      key: 'save',
      label: (
        <span onClick={() => setSaveModalOpen(true)} className="text-blue-600">
          <Save size={14} className="inline mr-1" />
          保存当前视图
        </span>
      ),
    },
  ];
  
  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        placement="bottomRight"
        trigger={['click']}
      >
        <Button icon={<FolderOpen size={16} />}>
          视图
          {selectedViewId && views.find((v) => v.id === selectedViewId) && (
            <span className="ml-1 text-blue-600">
              ({views.find((v) => v.id === selectedViewId)?.name})
            </span>
          )}
        </Button>
      </Dropdown>
      
      <Modal
        title="保存视图"
        open={saveModalOpen}
        onOk={handleSaveView}
        onCancel={() => {
          setSaveModalOpen(false);
          setNewViewName('');
        }}
        okText="保存"
        cancelText="取消"
      >
        <Input
          placeholder="请输入视图名称"
          value={newViewName}
          onChange={(e) => setNewViewName(e.target.value)}
          onPressEnter={handleSaveView}
        />
        <p className="text-xs text-gray-400 mt-2">
          保存当前所有筛选条件，便于日后快速切换
        </p>
      </Modal>
      
      <Modal
        title="重命名视图"
        open={renameModalOpen}
        onOk={handleRename}
        onCancel={() => {
          setRenameModalOpen(false);
          setNewViewName('');
          setRenamingViewId(null);
        }}
        okText="确定"
        cancelText="取消"
      >
        <Input
          placeholder="请输入视图名称"
          value={newViewName}
          onChange={(e) => setNewViewName(e.target.value)}
          onPressEnter={handleRename}
        />
      </Modal>
    </>
  );
};
