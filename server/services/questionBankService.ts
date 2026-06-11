import { QuestionBankModel as QBM, QuestionBankVersionModel as QBVM } from "@/server/models/QuestionBank";
import type { QuestionBank, QuestionBankVersion } from "@/shared/types";

const QuestionBankModel: any = QBM;
const QuestionBankVersionModel: any = QBVM;

export async function listBanks() {
  const docs = await QuestionBankModel.find().lean();
  return docs.map((d) => ({ ...d, id: d._id.toString() })) as QuestionBank[];
}

export async function listVersions(bankId?: string) {
  const filter = bankId ? { bankId } : {};
  const docs = await QuestionBankVersionModel.find(filter).sort({ publishedAt: -1 }).lean();
  return docs.map((d) => ({ ...d, id: d._id.toString() })) as QuestionBankVersion[];
}

export async function getActiveVersions() {
  const docs = await QuestionBankVersionModel.find({ isActive: true }).lean();
  return docs.map((d) => ({ ...d, id: d._id.toString() })) as QuestionBankVersion[];
}
