import { defineStore } from 'pinia'
import { api } from '@/utils/request'

export const useBookStore = defineStore('books', {
  state: () => ({
    books: [],
    categories: [],
    suppliers: [],
    currentBook: null,
    loading: false,
    pagination: {
      page: 1,
      page_size: 20,
      total: 0
    },
    filters: {
      search: '',
      category: null,
      status: '',
      isbn: ''
    }
  }),

  actions: {
    async fetchBooks(params = {}) {
      this.loading = true
      try {
        const { data } = await api.get('/books/books/', {
          params: {
            page: this.pagination.page,
            page_size: this.pagination.page_size,
            ...this.filters,
            ...params
          }
        })
        this.books = data.results
        this.pagination.total = data.count
        return data
      } finally {
        this.loading = false
      }
    },

    async fetchBook(id) {
      const { data } = await api.get(`/books/books/${id}/`)
      this.currentBook = data
      return data
    },

    async fetchByIsbn(isbn) {
      const { data } = await api.get('/books/books/search_by_isbn/', { params: { isbn } })
      return data
    },

    async createBook(bookData) {
      const { data } = await api.post('/books/books/', bookData)
      return data
    },

    async updateBook(id, bookData) {
      const { data } = await api.put(`/books/books/${id}/`, bookData)
      return data
    },

    async adjustStock(id, adjustData) {
      const { data } = await api.post(`/books/books/${id}/adjust_stock/`, adjustData)
      return data
    },

    async fetchCategories() {
      const { data } = await api.get('/books/categories/tree/')
      this.categories = data
      return data
    },

    async fetchSuppliers() {
      const { data } = await api.get('/books/suppliers/')
      this.suppliers = data.results
      return data
    },

    async checkAvailability(bookId, quantity = 1) {
      const { data } = await api.post('/reservations/reservations/check_availability/', {
        book_id: bookId,
        quantity
      })
      return data
    }
  }
})
