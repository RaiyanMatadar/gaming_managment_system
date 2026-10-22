import { reportService } from '../services/reportService.js';

export async function getShiftReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportService.getShiftReport({ startDate, endDate });
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}
