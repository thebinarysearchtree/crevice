import shiftSeriesRepository from '../repositories/shiftSeries.js';

const db = {
  shiftSeries: shiftSeriesRepository
};

const remove = async (req, res) => {
  const { seriesId } = req.body;
  const result = await db.shiftSeries.remove(seriesId, req.user.organisationId);
  return res.json({ deletedCount: result.rowCount });
}

export {
  remove
};
