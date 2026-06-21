import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import dayjs from "dayjs";

export default function Dictionaries() {
  const [dictionaries, setDictionaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDict, setSelectedDict] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ label: "", value: "", color: "", description: "" });

  useEffect(() => {
    loadDictionaries();
  }, []);

  const loadDictionaries = async () => {
    setLoading(true);
    try {
      const data = await api.get("/dictionaries");
      setDictionaries(data);
    } catch (err) {
      console.error("加载字典失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDict = (dict) => {
    setSelectedDict(dict);
  };

  const handleInitDefaults = async () => {
    if (!confirm("确定要初始化默认字典吗？只会添加不存在的字典。")) return;
    try {
      await api.post("/dictionaries/init-defaults");
      loadDictionaries();
      alert("初始化成功");
    } catch (err) {
      alert("初始化失败：" + err.message);
    }
  };

  const handleToggleItem = async (item) => {
    try {
      const updatedItems = selectedDict.items.map(i =>
        i.id === item.id ? { ...i, enabled: !i.enabled } : i
      );
      await api.put(`/dictionaries/${selectedDict._id}`, { items: updatedItems });
      loadDictionaries();
      setSelectedDict({ ...selectedDict, items: updatedItems });
    } catch (err) {
      alert("操作失败：" + err.message);
    }
  };

  const handleSaveItem = async () => {
    if (!newItem.label || !newItem.value) {
      alert("请填写标签和值");
      return;
    }

    try {
      let items;
      if (editingItem) {
        items = selectedDict.items.map(i =>
          i.id === editingItem.id
            ? { ...i, ...newItem }
            : i
        );
      } else {
        items = [
          ...selectedDict.items,
          {
            ...newItem,
            id: Date.now().toString(),
            sort: selectedDict.items.length,
            enabled: true,
          },
        ];
      }

      await api.put(`/dictionaries/${selectedDict._id}`, { items });
      loadDictionaries();
      setShowAddItemModal(false);
      setNewItem({ label: "", value: "", color: "", description: "" });
      setEditingItem(null);
    } catch (err) {
      alert("保存失败：" + err.message);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setNewItem({
      label: item.label,
      value: item.value,
      color: item.color || "",
      description: item.description || "",
    });
    setShowAddItemModal(true);
  };

  const handleDeleteItem = async (item) => {
    if (!confirm("确定要删除这个字典项吗？")) return;
    try {
      const items = selectedDict.items.filter(i => i.id !== item.id);
      await api.put(`/dictionaries/${selectedDict._id}`, { items });
      loadDictionaries();
      setSelectedDict({ ...selectedDict, items });
    } catch (err) {
      alert("删除失败：" + err.message);
    }
  };

  const handleMoveItem = async (item, direction) => {
    const items = [...selectedDict.items];
    const idx = items.findIndex(i => i.id === item.id);
    if (idx === -1) return;

    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= items.length) return;

    [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
    items.forEach((item, index) => {
      item.sort = index;
    });

    try {
      await api.put(`/dictionaries/${selectedDict._id}`, { items });
      loadDictionaries();
      setSelectedDict({ ...selectedDict, items });
    } catch (err) {
      alert("操作失败：" + err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="page-title" style={{ margin: 0 }}>字段字典</h1>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={handleInitDefaults}>
            初始化默认字典
          </button>
          <button className="btn btn-primary">+ 新建字典</button>
        </div>
      </div>

      <div className="flex gap-4">
        <div style={{ width: 280, flexShrink: 0 }}>
          <div className="card">
            <h3 className="font-semibold mb-3">字典列表</h3>
            {loading ? (
              <div className="loading"><div className="spinner"></div></div>
            ) : (
              <div>
                {dictionaries.map((dict) => (
                  <div
                    key={dict._id}
                    className={`p-3 rounded cursor-pointer mb-1 ${
                      selectedDict?._id === dict._id ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleSelectDict(dict)}
                  >
                    <div className="font-medium">{dict.name}</div>
                    <div className="text-sm text-muted">
                      {dict.code} · {dict.items?.length || 0} 项
                      {dict.system && <span className="badge badge-info ml-2">系统</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {selectedDict ? (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedDict.name}</h3>
                  <div className="text-sm text-muted">
                    编码：{selectedDict.code} · 类型：{getTypeLabel(selectedDict.type)}
                    {selectedDict.system && <span className="badge badge-info ml-2">系统字典</span>}
                  </div>
                </div>
                {!selectedDict.system && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setEditingItem(null);
                      setNewItem({ label: "", value: "", color: "", description: "" });
                      setShowAddItemModal(true);
                    }}
                  >
                    + 添加项
                  </button>
                )}
              </div>

              {selectedDict.description && (
                <p className="text-muted mb-4">{selectedDict.description}</p>
              )}

              <div>
                {(selectedDict.items || []).length > 0 ? (
                  <div>
                    {selectedDict.items
                      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
                      .map((item) => (
                      <div
                        key={item.id}
                        className="dictionary-item justify-between"
                        style={{ opacity: item.enabled === false ? 0.5 : 1 }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {item.color && (
                            <span
                              className="color-dot"
                              style={{ background: item.color }}
                            ></span>
                          )}
                          <div>
                            <span className="font-medium">{item.label}</span>
                            <span className="text-muted text-sm ml-2">({item.value})</span>
                          </div>
                          {item.description && (
                            <span className="text-sm text-muted">— {item.description}</span>
                          )}
                          {item.enabled === false && (
                            <span className="badge text-sm" style={{ marginLeft: 8 }}>已禁用</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleMoveItem(item, "up")}
                          >
                            ↑
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleMoveItem(item, "down")}
                          >
                            ↓
                          </button>
                          {!selectedDict.system && (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleToggleItem(item)}
                              >
                                {item.enabled === false ? "启用" : "禁用"}
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleEditItem(item)}
                              >
                                编辑
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteItem(item)}
                              >
                                删除
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">暂无字典项</div>
                )}
              </div>

              <div className="divider"></div>
              <div className="text-sm text-muted">
                最后更新：{dayjs(selectedDict.updatedAt).format("YYYY-MM-DD HH:mm")}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📚</div>
                <p>请选择左侧字典查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddItemModal && (
        <div className="modal-overlay" onClick={() => setShowAddItemModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingItem ? "编辑字典项" : "添加字典项"}</h3>
              <button className="modal-close" onClick={() => setShowAddItemModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">标签（显示名称）</label>
                <input
                  type="text"
                  className="form-input"
                  value={newItem.label}
                  onChange={e => setNewItem({ ...newItem, label: e.target.value })}
                  placeholder="如：已发布"
                />
              </div>
              <div className="form-group">
                <label className="form-label">值</label>
                <input
                  type="text"
                  className="form-input"
                  value={newItem.value}
                  onChange={e => setNewItem({ ...newItem, value: e.target.value })}
                  placeholder="如：published"
                />
              </div>
              <div className="form-group">
                <label className="form-label">颜色（可选）</label>
                <input
                  type="color"
                  className="form-input"
                  style={{ height: 38, padding: 4 }}
                  value={newItem.color || "#3b82f6"}
                  onChange={e => setNewItem({ ...newItem, color: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">描述（可选）</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 60 }}
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="字典项描述"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddItemModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSaveItem}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTypeLabel(type) {
  const map = {
    select: "单选",
    multi_select: "多选",
    radio: "单选按钮",
    checkbox: "复选框",
    tree: "树形",
    tag: "标签",
  };
  return map[type] || type;
}
