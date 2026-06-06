const createMockTable = () => ({
  findFirst: async () => null,
  findMany: async () => [],
});

const createMockInsert = () => ({
  values: async (data: unknown) => {
    console.log('[DB Mock] Insert:', data);
    return Array.isArray(data) ? data : [data];
  },
  returning: async () => [],
});

export const db = {
  query: {
    users: createMockTable(),
    projects: createMockTable(),
    clients: createMockTable(),
    tasks: createMockTable(),
    quotes: createMockTable(),
    invoices: createMockTable(),
    payments: createMockTable(),
    timeEntries: createMockTable(),
    attachments: createMockTable(),
    notifications: createMockTable(),
    auditLogs: createMockTable(),
    importExportTasks: createMockTable(),
  },
  insert: (_table: unknown) => createMockInsert(),
  update: (_table: unknown) => ({
    set: async (_data: unknown) => ({
      where: async () => {
        console.log('[DB Mock] Update');
        return [];
      },
    }),
  }),
  delete: (_table: unknown) => ({
    where: async () => {
      console.log('[DB Mock] Delete');
      return [];
    },
  }),
};
