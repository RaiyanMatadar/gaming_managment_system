import { reportService } from '../services/reportService.js';

export async function getShiftReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportService.getShiftReport({
      startDate,
      endDate,
      userId: req.user?.id || null
    });
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}
