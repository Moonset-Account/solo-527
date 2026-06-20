import { DataTypes } from 'sequelize'
import sequelize from '../db/index.js'

const Tour = sequelize.define('Tour', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  destination: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '时长（分钟）'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '每场次容量'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  highlights: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  meetingPoint: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '负责人'
  }
}, {
  tableName: 'tours',
  timestamps: true
})

export default Tour
