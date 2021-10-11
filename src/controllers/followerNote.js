import followerNoteRepository from '../repositories/followerNote.js';

const db = {
  followerNotes: followerNoteRepository
};

const insert = async (req, res) => {
  const userId = req.user.id;
  const noteInfo = req.body;
  const result = await db.followerNotes.insert(noteInfo, userId, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

const remove = async (req, res) => {
  const { noteId } = req.body;
  const result = await db.followerNotes.remove(noteId, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

export {
  insert,
  remove
};
