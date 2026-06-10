import mongoose, { type Document } from 'mongoose'

export interface IAlertRule extends Document {
  type: string
  name: string
  condition: Record<string, unknown>
  notifyMethods: string[]
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const alertRuleSchema = new mongoose.Schema<IAlertRule>(
  {
    type: { type: String, required: true },
    name: { type: String, required: true },
    condition: { type: mongoose.Schema.Types.Mixed, required: true },
    notifyMethods: { type: [String] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model<IAlertRule>('AlertRule', alertRuleSchema)
