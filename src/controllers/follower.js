import followerRepository from '../repositories/follower.js';

const db = {
  followers: followerRepository
};

const insert = async (req, res) => {
  const follower = req.body;
  const rowCount = await db.followers.insert(follower, req.user.organisationId);
  return res.json({ rowCount });
}

const find = async (req, res) => {
  const query = req.body;
  const users = await db.followers.find(query, req.user.organisationId);
  return res.send(users);
}

const remove = async (req, res) => {
  const follower = req.body;
  const rowCount = await db.followers.remove(follower, req.user.organisationId);
  return res.json({ rowCount });
}

export {
  insert,
  find,
  remove
};
