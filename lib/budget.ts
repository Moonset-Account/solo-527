import { prisma } from "./prisma";
import { createVersionHistory, takeSnapshot } from "./version-history";
import type { Prisma, ProjectStatus, AddonStatus, QuoteStatus } from "@prisma/client";

export async function createBudgetChange(
  projectId: string,
  changeType: string,
  description: string,
  amount: number,
  referenceType: string,
  referenceId: string,
  createdById: string,
  note?: string
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { currentBudget: true, initialBudget: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const oldBudget = project.currentBudget.toNumber();
  const newBudget = oldBudget + amount;
  const budgetVariance = ((newBudget - project.initialBudget.toNumber()) / project.initialBudget.toNumber()) * 100;

  return prisma.$transaction(async (tx) => {
    const budgetChange = await tx.budgetChange.create({
      data: {
        projectId,
        changeType,
        description,
        oldBudget,
        newBudget,
        amount,
        referenceType,
        referenceId,
        createdById,
        note,
      },
    });

    await tx.project.update({
      where: { id: projectId },
      data: {
        currentBudget: newBudget,
        budgetVariance,
      },
    });

    return budgetChange;
  });
}

export async function confirmQuote(
  quoteId: string,
  confirmedById: string,
  note?: string
) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { project: true },
  });

  if (!quote) {
    throw new Error("Quote not found");
  }

  if (quote.status !== "PENDING_CONFIRMATION") {
    throw new Error("Quote is not pending confirmation");
  }

  return prisma.$transaction(async (tx) => {
    const snapshot = takeSnapshot(quote);
    const newVersion = quote.version + 1;

    const updatedQuote = await tx.quote.update({
      where: { id: quoteId },
      data: {
        status: "CONFIRMED" as QuoteStatus,
        version: newVersion,
        confirmedAt: new Date(),
        confirmedById,
        note,
      },
    });

    await createVersionHistory(
      "Quote",
      quoteId,
      newVersion,
      snapshot,
      confirmedById,
      note || "Quote confirmed"
    );

    if (updatedQuote.status === "CONFIRMED") {
      const amount = quote.totalAmount.toNumber();
      const currentBudget = quote.project.currentBudget.toNumber();

      await tx.project.update({
        where: { id: quote.projectId },
        data: {
          status: "QUOTE_CONFIRMED" as ProjectStatus,
          currentBudget: currentBudget + amount,
        },
      });

      await createBudgetChange(
        quote.projectId,
        "QUOTE_CONFIRMED",
        `报价确认 - ${quote.version}版`,
        amount,
        "Quote",
        quoteId,
        confirmedById,
        note
      );
    }

    return updatedQuote;
  });
}

export async function confirmAddon(
  addonId: string,
  confirmedById: string,
  note?: string
) {
  const addon = await prisma.addon.findUnique({
    where: { id: addonId },
  });

  if (!addon) {
    throw new Error("Addon not found");
  }

  if (addon.status !== "PENDING_CONFIRMATION") {
    throw new Error("Addon is not pending confirmation");
  }

  return prisma.$transaction(async (tx) => {
    const snapshot = takeSnapshot(addon);
    const newVersion = addon.version + 1;

    const updatedAddon = await tx.addon.update({
      where: { id: addonId },
      data: {
        status: "CONFIRMED" as AddonStatus,
        version: newVersion,
        confirmedAt: new Date(),
        confirmedById,
      },
    });

    await createVersionHistory(
      "Addon",
      addonId,
      newVersion,
      snapshot,
      confirmedById,
      note || "Addon confirmed"
    );

    if (updatedAddon.status === "CONFIRMED") {
      const amount = addon.amount.toNumber();
      await createBudgetChange(
        addon.projectId,
        "ADDON_CONFIRMED",
        `增项确认 - ${addon.name}`,
        amount,
        "Addon",
        addonId,
        confirmedById,
        note
      );
    }

    return updatedAddon;
  });
}

export async function getProjectBudgetHistory(projectId: string) {
  return prisma.budgetChange.findMany({
    where: { projectId },
    include: {
      createdBy: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBudgetSummary(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      initialBudget: true,
      currentBudget: true,
      totalSpent: true,
      budgetVariance: true,
    },
  });

  if (!project) return null;

  const budgetChanges = await prisma.budgetChange.findMany({
    where: { projectId },
    select: { amount: true, changeType: true },
  });

  const quoteTotal = budgetChanges
    .filter((bc) => bc.changeType === "QUOTE_CONFIRMED")
    .reduce((sum, bc) => sum + bc.amount.toNumber(), 0);

  const addonTotal = budgetChanges
    .filter((bc) => bc.changeType === "ADDON_CONFIRMED")
    .reduce((sum, bc) => sum + bc.amount.toNumber(), 0);

  const otherTotal = budgetChanges
    .filter((bc) => !["QUOTE_CONFIRMED", "ADDON_CONFIRMED"].includes(bc.changeType))
    .reduce((sum, bc) => sum + bc.amount.toNumber(), 0);

  return {
    initialBudget: project.initialBudget.toNumber(),
    currentBudget: project.currentBudget.toNumber(),
    totalSpent: project.totalSpent.toNumber(),
    budgetVariance: project.budgetVariance.toNumber(),
    remainingBudget: project.currentBudget.toNumber() - project.totalSpent.toNumber(),
    breakdown: {
      quoteTotal,
      addonTotal,
      otherTotal,
    },
    changeCount: budgetChanges.length,
  };
}
