const User = require('../models/User');
const { successResponse, errorResponse, paginationQuery } = require('../utils/response');
const { logOperation, getFieldChanges } = require('../services/operationLogService');

const KEY_FIELDS = ['name', 'role', 'status', 'store', 'permissions'];

const getUsers = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, role, status, keyword, storeId } = req.query;
    const { skip, limit } = paginationQuery(page, pageSize);

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (storeId) query.store = storeId;
    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { name: { $regex: keyword, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('store')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);

    successResponse(res, { list: users, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('store');
    if (!user) {
      return errorResponse(res, '用户不存在', 404);
    }
    successResponse(res, { user });
  } catch (error) {
    errorResponse(res, error.message || '获取失败', 500);
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, name, role, store, email, phone, permissions } = req.body;

    if (!username || !password || !name) {
      return errorResponse(res, '用户名、密码和姓名不能为空');
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return errorResponse(res, '用户名已存在');
    }

    const user = new User({
      username,
      password,
      name,
      role: role || 'store_manager',
      store,
      email,
      phone,
      permissions: permissions || []
    });

    await user.save();

    await logOperation({
      user: req.user,
      store: req.user?.store,
      module: 'user',
      action: 'create',
      targetType: 'User',
      targetId: user._id,
      description: `创建用户: ${username}`,
      req,
      status: 'success'
    });

    const userData = user.toObject();
    delete userData.password;

    successResponse(res, { user: userData }, '创建成功');
  } catch (error) {
    errorResponse(res, error.message || '创建失败', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const oldUser = await User.findById(id);
    if (!oldUser) {
      return errorResponse(res, '用户不存在', 404);
    }

    const updates = { ...req.body };
    delete updates.password;
    delete updates.username;

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .select('-password')
      .populate('store');

    const fieldChanges = getFieldChanges(oldUser.toObject(), updates, KEY_FIELDS);
    
    await logOperation({
      user: req.user,
      store: req.user?.store,
      module: 'user',
      action: 'update',
      targetType: 'User',
      targetId: updatedUser._id,
      description: `更新用户: ${updatedUser.username}`,
      fieldChanges,
      req,
      status: 'success'
    });

    successResponse(res, { user: updatedUser }, '更新成功');
  } catch (error) {
    errorResponse(res, error.message || '更新失败', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, '用户不存在', 404);
    }

    await User.findByIdAndDelete(req.params.id);

    await logOperation({
      user: req.user,
      module: 'user',
      action: 'delete',
      targetType: 'User',
      targetId: req.params.id,
      description: `删除用户: ${user.username}`,
      req,
      status: 'success'
    });

    successResponse(res, null, '删除成功');
  } catch (error) {
    errorResponse(res, error.message || '删除失败', 500);
  }
};

const updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    const oldUser = await User.findById(id);
    
    if (!oldUser) {
      return errorResponse(res, '用户不存在', 404);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { permissions },
      { new: true }
    ).select('-password').populate('store');

    const fieldChanges = getFieldChanges(oldUser.toObject(), { permissions }, ['permissions']);
    
    await logOperation({
      user: req.user,
      module: 'user',
      action: 'update_permissions',
      targetType: 'User',
      targetId: id,
      description: `更新用户权限: ${updatedUser.username}`,
      fieldChanges,
      req,
      status: 'success'
    });

    successResponse(res, { user: updatedUser }, '权限更新成功');
  } catch (error) {
    errorResponse(res, error.message || '更新失败', 500);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserPermissions
};
