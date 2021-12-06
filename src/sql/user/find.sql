with shifts_query as (
    select
        b.user_id,
        count(*) as booked,
        count(*) filter (where s.start_time <= now()) as attended,
        sum(s.end_time - s.start_time) filter (where s.start_time <= now()) as attended_time
    from
        shift_series ss join
        shifts s on s.series_id = ss.id join
        shift_roles sr on sr.series_id = ss.id join
        bookings b on b.shift_id = s.id and b.shift_role_id = sr.id
    group by b.user_id
)
select 
    u.id,
    concat_ws(' ', u.first_name, u.last_name) as name,
    u.image_id,
    case when $4 is true then 0 else count(*) over() end as total_count,
    json_agg(distinct r) as roles,
    json_agg(distinct a.name) as area_names,
    coalesce(s.booked, 0) as booked,
    coalesce(s.attended, 0) as attended,
    to_char(coalesce(s.attended_time, interval '0 hours'), 'HH24:MI') as attended_time
from 
    user_areas ua join
    users u on ua.user_id = u.id join
    areas a on ua.area_id = a.id join
    roles r on ua.role_id = r.id left join
    shifts_query s on s.user_id = u.id
where
    ($5 is true or a.id = any(cast($6 as int[]))) and
    ($1 = '' or (
        concat_ws(' ', u.first_name, u.last_name) ilike $1 or
        u.email ilike $1)) and
    ($2 = -1 or r.id = $2) and
    ($3 = -1 or a.id = $3) and
    u.organisation_id = $9
group by u.id, s.booked, s.attended, s.attended_time
order by u.last_name asc
limit $7 offset $8
