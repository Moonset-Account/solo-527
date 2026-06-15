export interface InspectionTemplate {
  id: string;
  name: string;
  description: string;
  items: InspectionTemplateItem[];
  frequency: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionTemplateItem {
  name: string;
  description: string;
  category: string;
  expectedValue: string;
}
