export enum ChangeStatus {
  DRAFT = "DRAFT",
  PENDING_CONFIRMATION = "PENDING_CONFIRMATION",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
  PURCHASED = "PURCHASED",
}

export enum ConfirmationType {
  CONFIRM = "CONFIRM",
  REJECT = "REJECT",
  WITHDRAW = "WITHDRAW",
}

export enum Role {
  OWNER = "OWNER",
  PROJECT_MANAGER = "PROJECT_MANAGER",
  DESIGNER = "DESIGNER",
  FINANCE = "FINANCE",
}

export class Decimal {
  constructor(private value: number | string) {}
  toNumber() {
    return Number(this.value);
  }
  toString() {
    return String(this.value);
  }
}

export class PrismaClient {
  user = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };
  project = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };
  changeRequest = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };
  changeVersion = {
    create: jest.fn(),
  };
  confirmationRecord = {
    create: jest.fn(),
  };
  schedule = {
    findMany: jest.fn(),
    update: jest.fn(),
  };
  purchaseOrder = {
    create: jest.fn(),
    findUnique: jest.fn(),
  };
  purchaseItem = {
    create: jest.fn(),
  };
  attachment = {
    create: jest.fn(),
    findMany: jest.fn(),
  };
  $transaction = jest.fn((fn) => fn({
    confirmationRecord: { create: jest.fn() },
    changeRequest: { update: jest.fn(), findUnique: jest.fn() },
    changeVersion: { create: jest.fn() },
    schedule: { findMany: jest.fn(), update: jest.fn() },
    purchaseOrder: { create: jest.fn() },
  }));
}

export const Prisma = {
  Decimal,
};
