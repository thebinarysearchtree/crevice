delete from follower_notes
where
    id = $1 and
    organisation_id = $2
