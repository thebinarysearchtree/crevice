update user_areas as a
set
    area_id = $3,
    start_time = $4,
    end_time = $5
where
    (cast($5 as timestamptz) is null or cast($4 as timestamptz) < cast($5 as timestamptz)) and
    id = $1 and
    organisation_id = $6 and
    not exists(
        select 1 from user_areas
        where
            id != ${id} and
            user_id = ${userId} and
            area_id = ${areaId} and
            (cast($5 as timestamptz) is null or start_time < $5) and
            (end_time is null or end_time > $5)) and
    exists(
        select 1 from user_areas
        where
            id = $1 and
            user_id = $2) and
    exists(
        select 1 from areas
        where
            id = $3 and
            organisation_id = $6)
