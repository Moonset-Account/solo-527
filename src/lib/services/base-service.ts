import { supabase } from '../supabase'

export interface DatabaseServiceOptions {
  tableName: string
  useMock?: boolean
}

export abstract class BaseService<T extends { id: string }> {
  protected tableName: string
  protected useMock: boolean
  protected mockData: T[] = []

  constructor(options: DatabaseServiceOptions) {
    this.tableName = options.tableName
    this.useMock = options.useMock ?? true
  }

  setMockData(data: T[]) {
    this.mockData = data
  }

  setUseMock(useMock: boolean) {
    this.useMock = useMock
  }

  async getAll(): Promise<T[]> {
    if (this.useMock) {
      return [...this.mockData]
    }
    try {
      const { data, error } = await supabase.from(this.tableName).select('*')
      if (error) throw error
      return data as T[]
    } catch (err) {
      console.error(`Error fetching ${this.tableName}:`, err)
      return [...this.mockData]
    }
  }

  async getById(id: string): Promise<T | null> {
    if (this.useMock) {
      return this.mockData.find((item) => item.id === id) ?? null
    }
    try {
      const { data, error } = await supabase.from(this.tableName).select('*').eq('id', id).single()
      if (error) throw error
      return data as T
    } catch (err) {
      console.error(`Error fetching ${this.tableName} by id:`, err)
      return this.mockData.find((item) => item.id === id) ?? null
    }
  }

  async create(item: Omit<T, 'id'> & { id?: string }): Promise<T> {
    const newItem = {
      ...item,
      id: item.id ?? crypto.randomUUID(),
    } as T

    if (this.useMock) {
      this.mockData.push(newItem)
      return newItem
    }
    try {
      const { data, error } = await supabase.from(this.tableName).insert(newItem).select().single()
      if (error) throw error
      return data as T
    } catch (err) {
      console.error(`Error creating ${this.tableName}:`, err)
      this.mockData.push(newItem)
      return newItem
    }
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    if (this.useMock) {
      const index = this.mockData.findIndex((item) => item.id === id)
      if (index === -1) return null
      this.mockData[index] = { ...this.mockData[index], ...updates }
      return this.mockData[index]
    }
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as T
    } catch (err) {
      console.error(`Error updating ${this.tableName}:`, err)
      const index = this.mockData.findIndex((item) => item.id === id)
      if (index === -1) return null
      this.mockData[index] = { ...this.mockData[index], ...updates }
      return this.mockData[index]
    }
  }

  async delete(id: string): Promise<boolean> {
    if (this.useMock) {
      const index = this.mockData.findIndex((item) => item.id === id)
      if (index === -1) return false
      this.mockData.splice(index, 1)
      return true
    }
    try {
      const { error } = await supabase.from(this.tableName).delete().eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      console.error(`Error deleting ${this.tableName}:`, err)
      const index = this.mockData.findIndex((item) => item.id === id)
      if (index === -1) return false
      this.mockData.splice(index, 1)
      return true
    }
  }
}
