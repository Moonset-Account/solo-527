import { QuestionBankModel as QBM, QuestionBankVersionModel as QBVM } from "@/server/models/QuestionBank";
import { demoStore } from "@/server/db/demoData";
import type { QuestionBank, QuestionBankVersion } from "@/shared/types";

const QuestionBankModel: any = QBM;
const QuestionBankVersionModel: any = QBVM;

export async function listBanks() {
  try {
    const docs = await QuestionBankModel.find().lean();
    if (docs && docs.length > 0) return docs.map((d: any) => ({ ...d, id: d._id.toString() })) as QuestionBank[];
  } catch {}
  return demoStore.all("questionBanks") as QuestionBank[];
}

export async function listVersions(bankId?: string) {
  const filter = bankId ? { bankId } : {};
  try {
    const docs = await QuestionBankVersionModel.find(filter).sort({ publishedAt: -1 }).lean();
    if (docs && docs.length > 0) return docs.map((d: any) => ({ ...d, id: d._id.toString() })) as QuestionBankVersion[];
  } catch {}
  const list = bankId ? demoStore.find("questionBankVersions", { bankId }) : demoStore.all("questionBankVersions");
  return list as QuestionBankVersion[];
}

export async function getActiveVersions() {
  try {
    const docs = await QuestionBankVersionModel.find({ isActive: true }).lean();
    if (docs && docs.length > 0) return docs.map((d: any) => ({ ...d, id: d._id.toString() })) as QuestionBankVersion[];
  } catch {}
  return demoStore.find("questionBankVersions", { isActive: true }) as QuestionBankVersion[];
}
