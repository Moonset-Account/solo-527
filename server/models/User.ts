import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export enum UserRole {
  GRID_MEMBER = 'grid_member',
  PROPERTY = 'property',
  STREET_ADMIN = 'street_admin',
  PUBLIC = 'public'
}

export interface IUser extends Document {
  username: string
  password: string
  name: string
  phone: string
  role: UserRole
  community?: string
  gridArea?: string
  propertyCompany?: string
  supervisorId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  role: { 
    type: String, 
    enum: Object.values(UserRole), 
    required: true 
  },
  community: { type: String },
  gridArea: { type: String },
  propertyCompany: { type: String },
  supervisorId: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
})

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password as string, salt)
  next()
})

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string)
}

export default mongoose.model<IUser>('User', UserSchema)
