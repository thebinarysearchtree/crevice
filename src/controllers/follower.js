import followerRepository from '../repositories/follower.js';

const db = {
  followers: followerRepository
};

const insert = async (req, res) => {
  const { userId, followingId } = req.body;
  const result = await db.followers.insert(userId, followingId, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

const find = async (req, res) => {
  const query = req.body;
  const users = await db.followers.find(query, req.user.organisationId);
  return res.send(users);
}

const remove = async (req, res) => {
  const { userId, followingId } = req.body;
  const result = await db.followers.remove(userId, followingId, req.user.organisationId);
  return res.json({ rowCount: result.rowCount });
}

export {
  insert,
  find,
  remove
};
