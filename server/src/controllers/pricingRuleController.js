const { PricingRule } = require('../models');
const { createAuditLog } = require('../utils/auditLog');

async function getPricingRules(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      ruleType, 
      status = 'active',
      keyword,
      sortBy = 'priority',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (ruleType && ruleType !== 'all') {
      query.ruleType = ruleType;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    const [rules, total] = await Promise.all([
      PricingRule.find(query).sort(sort).skip(skip).limit(limit),
      PricingRule.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: rules,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取加价规则列表失败',
      error: error.message
    });
  }
}

async function getPricingRuleById(req, res) {
  try {
    const rule = await PricingRule.findById(req.params.id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: '加价规则不存在'
      });
    }
    
    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取加价规则详情失败',
      error: error.message
    });
  }
}

async function createPricingRule(req, res) {
  try {
    const rule = new PricingRule(req.body);
    await rule.save();
    
    await createAuditLog({
      action: 'create',
      entityType: 'pricing_rule',
      entityId: rule._id,
      afterData: rule.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `创建加价规则: ${rule.name}`
    });
    
    res.status(201).json({
      success: true,
      message: '加价规则创建成功',
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建加价规则失败',
      error: error.message
    });
  }
}

async function updatePricingRule(req, res) {
  try {
    const beforeData = await PricingRule.findById(req.params.id);
    
    if (!beforeData) {
      return res.status(404).json({
        success: false,
        message: '加价规则不存在'
      });
    }
    
    const rule = await PricingRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    await createAuditLog({
      action: 'update',
      entityType: 'pricing_rule',
      entityId: rule._id,
      beforeData: beforeData.toObject(),
      afterData: rule.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `更新加价规则: ${rule.name}`
    });
    
    res.json({
      success: true,
      message: '加价规则更新成功',
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新加价规则失败',
      error: error.message
    });
  }
}

async function deletePricingRule(req, res) {
  try {
    const rule = await PricingRule.findById(req.params.id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: '加价规则不存在'
      });
    }
    
    await PricingRule.findByIdAndDelete(req.params.id);
    
    await createAuditLog({
      action: 'delete',
      entityType: 'pricing_rule',
      entityId: rule._id,
      beforeData: rule.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `删除加价规则: ${rule.name}`
    });
    
    res.json({
      success: true,
      message: '加价规则删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除加价规则失败',
      error: error.message
    });
  }
}

async function calculatePrice(req, res) {
  try {
    const { 
      serviceId, 
      category,
      appointmentTime,
      urgencyLevel = 'normal',
      distance = 0,
      quantity = 1
    } = req.body;
    
    let basePrice = 0;
    let serviceName = '';
    
    if (serviceId) {
      const service = await PricingRule.findOne({ _id: serviceId });
      if (service) {
        basePrice = service.basePrice || 0;
        serviceName = service.name;
      }
    }
    
    const rules = await PricingRule.find({ 
      status: 'active',
      $or: [
        { applicableCategories: { $in: [category] } },
        { applicableCategories: { $size: 0 } }
      ]
    }).sort({ priority: -1 });
    
    const breakdown = [];
    let totalAddon = 0;
    
    breakdown.push({
      type: 'base',
      name: '基础服务费',
      amount: basePrice * quantity,
      description: serviceName || '基础服务'
    });
    
    for (const rule of rules) {
      let ruleAmount = 0;
      let ruleDesc = '';
      
      switch (rule.ruleType) {
        case 'urgent':
          if (urgencyLevel === 'urgent' || urgencyLevel === 'emergency') {
            if (rule.priceType === 'fixed') {
              ruleAmount = rule.value;
            } else if (rule.priceType === 'percentage') {
              ruleAmount = basePrice * quantity * (rule.value / 100);
            }
            ruleDesc = urgencyLevel === 'emergency' ? '紧急加价' : '加急加价';
          }
          break;
          
        case 'time_slot':
          if (appointmentTime && rule.timeSlots && rule.timeSlots.length > 0) {
            const apptTime = new Date(appointmentTime);
            const dayOfWeek = apptTime.getDay();
            const hours = apptTime.getHours();
            const minutes = apptTime.getMinutes();
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            for (const slot of rule.timeSlots) {
              if (slot.dayOfWeek === dayOfWeek && 
                  timeStr >= slot.startTime && 
                  timeStr <= slot.endTime) {
                if (slot.priceType === 'fixed') {
                  ruleAmount = slot.value;
                } else {
                  ruleAmount = basePrice * quantity * (slot.value / 100);
                }
                ruleDesc = `时段加价 (${slot.startTime}-${slot.endTime})`;
                break;
              }
            }
          }
          break;
          
        case 'distance':
          if (distance > 0) {
            if (rule.priceType === 'fixed') {
              ruleAmount = rule.value * Math.ceil(distance);
            } else if (rule.priceType === 'tiered' && rule.tieredRules) {
              for (const tier of rule.tieredRules) {
                if (distance >= tier.min && (!tier.max || distance <= tier.max)) {
                  if (tier.priceType === 'fixed') {
                    ruleAmount = tier.value;
                  } else {
                    ruleAmount = basePrice * quantity * (tier.value / 100);
                  }
                  break;
                }
              }
            }
            ruleDesc = `距离加价 (${distance}公里)`;
          }
          break;
          
        case 'quantity':
          if (quantity > 1) {
            if (rule.priceType === 'fixed') {
              ruleAmount = rule.value * (quantity - 1);
            } else if (rule.priceType === 'percentage') {
              ruleAmount = basePrice * (quantity - 1) * (rule.value / 100);
            }
            ruleDesc = `数量加价 (${quantity}件)`;
          }
          break;
      }
      
      if (ruleAmount > 0) {
        totalAddon += ruleAmount;
        breakdown.push({
          type: rule.ruleType,
          name: rule.name,
          amount: Math.round(ruleAmount * 100) / 100,
          description: ruleDesc
        });
      }
    }
    
    const totalPrice = Math.round((basePrice * quantity + totalAddon) * 100) / 100;
    
    res.json({
      success: true,
      data: {
        basePrice: basePrice * quantity,
        addonPrice: Math.round(totalAddon * 100) / 100,
        totalPrice,
        breakdown
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '价格计算失败',
      error: error.message
    });
  }
}

module.exports = {
  getPricingRules,
  getPricingRuleById,
  createPricingRule,
  updatePricingRule,
  deletePricingRule,
  calculatePrice
};
