import { Router } from "express";
import { authRouter } from "./auth.js";
import { borrowOrdersRouter } from "./borrow-orders.js";
import { partsRouter } from "./parts.js";
import { inventoryRouter } from "./inventory.js";
import { financeRouter } from "./finance.js";
import { auditRouter } from "./audit.js";
import { notificationsRouter } from "./notifications.js";
import { requireAuth } from "../middleware/auth.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/borrow-orders", requireAuth, borrowOrdersRouter);
apiRouter.use("/parts", requireAuth, partsRouter);
apiRouter.use("/inventory", requireAuth, inventoryRouter);
apiRouter.use("/finance", requireAuth, financeRouter);
apiRouter.use("/audit", requireAuth, auditRouter);
apiRouter.use("/notifications", requireAuth, notificationsRouter);
