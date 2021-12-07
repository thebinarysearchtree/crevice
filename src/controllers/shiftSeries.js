import shiftSeriesRepository from '../repositories/shiftSeries.js';

const db = {
  shiftSeries: shiftSeriesRepository
};

const remove = async (req, res) => {
  const { seriesId } = req.body;
  const rowCount = await db.shiftSeries.remove(seriesId, req.user.organisationId);
  return res.json({ rowCount });
}

export {
  remove
};
