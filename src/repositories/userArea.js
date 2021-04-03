const getPool = require('../database/db');

const pool = getPool();

const insert = async ({
  userId, 
  areaId, 
  roleId, 
  startTime, 
  endTime,
  isAdmin
}, organisationId, client = pool) => {
  const where = endTime ? 'start_time <= $5 and ' : '';
  if (endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start.getTime() > end.getTime()) {
      throw new Error();
    }
  }
  const result = await client.query(`
    insert into user_areas(
      user_id,
      area_id,
      role_id,
      start_time,
      end_time,
      is_admin,
      organisation_id)
    select $1, $2, $3, $4, $5, $6, $7
    where 
      not exists(
        select 1 from user_areas
        where
          user_id = $1 and
          area_id = $2 and
          ${where}
          (end_time is null or end_time >= $4)) and
      exists(
        select 1 from areas
        where
          id = $2 and
          organisation_id = $7 and
          deleted_at is null) and
      exists(
        select 1 from roles
        where
          id = $3 and
          organisation_id = $7 and
          deleted_at is null)
    returning id`, [
      userId, 
      areaId, 
      roleId, 
      startTime, 
      endTime,
      isAdmin,
      organisationId]);
  if (result.rowCount !== 1) {
    throw new Error();
  }
  return result.rows[0].id;
}

const update = async ({
  id,
  userId,
  areaId,
  roleId,
  startTime,
  endTime,
  isAdmin
}, organisationId, client = pool) => {
  const where = endTime ? 'start_time <= $6 and ' : '';
  const result = await client.query(`
    update user_areas
    set
      area_id = $3,
      role_id = $4,
      start_date = $5,
      end_date = $6,
      is_admin = $7
    where
      id = $1 and
      organisation_id = $8 and
      not exists(
        select 1 from user_areas
        where
          user_id = $2 and
          area_id = $3 and
          ${where}
          (end_time is null or end_time >= $5)) and
      exists(
        select 1 from areas
        where
          id = $3 and
          organisation_id = $8 and
          deleted_at is null) and
      exists(
        select 1 from roles
        where
          id = $4 and
          organisation_id = $8 and
          deleted_at is null)`, [
            id,
            userId,
            areaId,
            roleId,
            startTime,
            endTime,
            isAdmin,
            organisationId]);
  if (result.rowCount !== 1) {
    throw new Error();
  }
}

const remove = async (userAreaId, organisationId, client = pool) => {
  await client.query(`
    delete from user_areas
    where
      id = $1 and
      organisationId = $2`, [userAreaId, organisationId]);
}

module.exports = {
  insert,
  update,
  remove
};
