import followerNoteRepository from '../repositories/followerNote.js';

const db = {
  followerNotes: followerNoteRepository
};

const insert = async (req, res) => {
  const userId = req.user.id;
  const notes = req.body;
  const rowCount = await db.followerNotes.insert(notes, userId, req.user.organisationId);
  return res.json({ rowCount });
}

const remove = async (req, res) => {
  const { noteId } = req.body;
  const rowCount = await db.followerNotes.remove(noteId, req.user.organisationId);
  return res.json({ rowCount });
}

export {
  insert,
  remove
};
