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
    (cast($5 as timestamptz) is null or cast($4 as timestamptz) < cast($5 as timestamptz)) and
    not exists(
        select 1 from user_areas
        where
            user_id = $1 and
            area_id = $2 and
            (cast($5 as timestamptz) is null or start_time < $5) and
            (end_time is null or end_time > $5)) and
    exists(
        select 1 from areas
        where
            id = $2 and
            organisation_id = $7) and
    exists(
        select 1 from roles
        where
            id = $3 and
            organisation_id = $7)
