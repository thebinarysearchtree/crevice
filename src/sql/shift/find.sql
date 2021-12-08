with roles_query as (
    select
        sr.*,
        s.id as shift_id,
        r.name as role_name,
        r.colour as role_colour,
        count(b.id) as booked_count,
        coalesce(json_agg(json_build_object(
            'id', b.user_id,
            'booking_id', b.id,
            'name', concat_ws(' ', u.first_name, u.last_name),
            'image_id', u.image_id)) filter (where b.id is not null), json_build_array()) as booked_users
    from
        shift_series ss join
        shifts s on s.series_id = ss.id join
        shift_roles sr on sr.series_id = ss.id join
        roles r on sr.role_id = r.id left join
        bookings b on b.shift_id = s.id and b.shift_role_id = sr.id left join
        users u on b.user_id = u.id
    where
        s.area_id = $1 and
        s.start_time >= $2 and
        s.start_time < $3 and
        s.organisation_id = $4
    group by s.id, sr.id, r.name, r.colour
), shifts_query as (
    select
        s.id,
        s.start_time at time zone l.time_zone as start_time,
        s.end_time at time zone l.time_zone as end_time,
        s.break_minutes,
        to_char(coalesce(s.end_time - s.start_time, interval '0 hours'), 'HH24:MI') as duration,
        ss.is_single,
        ss.notes,
        s.series_id,
        json_agg(rq order by rq.role_name asc) as shift_roles,
        sum(rq.capacity) as capacity,
        sum(rq.booked_count) as booked
    from
        shift_series ss join
        shifts s on s.series_id = ss.id join
        roles_query rq on rq.shift_id = s.id join
        areas a on s.area_id = a.id join
        locations l on a.location_id = l.id
    group by s.id, ss.id, l.time_zone
    order by s.start_time asc
)
select
    cast($1 as integer) as area_id,
    coalesce(json_agg(s), json_build_array()) as shifts
from shifts_query s
