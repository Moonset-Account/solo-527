import { create } from 'zustand'
import type { Annotation } from '@/types'
import { getDefaultAnnotations } from '@/data/mock'

interface AnnotationStore {
  annotations: Annotation[]
  addAnnotation: (annotation: Annotation) => void
  removeAnnotation: (id: string) => void
}

export const useAnnotationStore = create<AnnotationStore>((set) => ({
  annotations: getDefaultAnnotations(),
  addAnnotation: (annotation) => set((state) => ({ annotations: [...state.annotations, annotation] })),
  removeAnnotation: (id) => set((state) => ({ annotations: state.annotations.filter((a) => a.id !== id) })),
}))
