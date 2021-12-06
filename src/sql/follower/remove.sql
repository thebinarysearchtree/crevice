delete from followers
where
    user_id = $1 and
    following_user_id = $2 and
    organisation_id = $3
