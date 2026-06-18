import { Router } from "express";
import technicianRouter from "./technician.js";
import treatmentRouter from "./treatment.js";
import scheduleRouter from "./schedule.js";
import appointmentRouter from "./appointment.js";
import customerRouter from "./customer.js";
import customerTreatmentRouter from "./customerTreatment.js";
import materialRouter from "./material.js";
import materialUsageRouter from "./materialUsage.js";
import commissionRouter from "./commission.js";
import reminderRouter from "./reminder.js";
import changeLogRouter from "./changeLog.js";
import consultantRouter from "./consultant.js";
import dashboardRouter from "./dashboard.js";
import exportRouter from "./export.js";

const router = Router();

router.use("/technicians", technicianRouter);
router.use("/treatments", treatmentRouter);
router.use("/schedules", scheduleRouter);
router.use("/appointments", appointmentRouter);
router.use("/customers", customerRouter);
router.use("/customer-treatments", customerTreatmentRouter);
router.use("/materials", materialRouter);
router.use("/material-usages", materialUsageRouter);
router.use("/commissions", commissionRouter);
router.use("/reminders", reminderRouter);
router.use("/change-logs", changeLogRouter);
router.use("/consultants", consultantRouter);
router.use("/dashboard", dashboardRouter);
router.use("/export", exportRouter);

router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
