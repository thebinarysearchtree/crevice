with available_query as (
    select sr.id, s.id as shift_id
    from
        user_areas ua left join
        shifts s on s.area_id = ua.area_id left join
        shift_series ss on s.series_id = ss.id left join
        shift_roles sr on sr.series_id = ss.id and sr.role_id = ua.role_id left join
        bookings b on b.shift_id = s.id and b.shift_role_id = sr.id
    where
        ua.user_id = $1 and
        ua.start_time <= now() and (ua.end_time is null or ua.end_time > now()) and
        s.start_time >= now() - (interval '1 minute' * s.break_minutes) and
        s.start_time < $3 and
        ua.organisation_id = $4
    group by s.id, sr.id
    having sr.capacity > count(b.id)
), booked_query as (
    select sr.id, s.id as shift_id
    from
        shift_series ss join
        shifts s on s.series_id = ss.id join
        shift_roles sr on sr.series_id = ss.id join
        bookings b on b.shift_id = s.id and b.shift_role_id = sr.id
    where
        b.user_id = $1 and
        s.start_time >= $2 and
        s.start_time < $3
), roles_query as (
    select
        sr.*,
        s.id as shift_id,
        r.name,
        s.start_time - interval '1 minute' * r.book_before_minutes > now() as can_book,
        s.start_time - interval '1 minute' * r.cancel_before_minutes > now() as can_cancel,
        coalesce(bool_or(b.user_id = $1), false) as booked,
        coalesce(json_agg(json_build_object(
            'id', b.user_id,
            'booking_id', b.id,
            'name', concat_ws(' ', u.first_name, u.last_name),
            'image_id', u.image_id) order by u.last_name asc) filter (where b.id is not null), json_build_array()) as booked_users
    from
        shift_series ss join
        shifts s on s.series_id = ss.id join
        shift_roles sr on sr.series_id = ss.id join
        roles r on sr.role_id = r.id left join
        bookings b on b.shift_id = s.id and b.shift_role_id = sr.id left join
        users u on b.user_id = u.id
    group by s.id, sr.id, r.id, s.start_time
)
select
    s.id,
    s.area_id,
    a.name as area_name,
    s.start_time at time zone l.time_zone as start_time,
    s.end_time at time zone l.time_zone as end_time,
    s.break_minutes,
    to_char(coalesce(s.end_time - s.start_time, interval '0 hours'), 'HH24:MI') as duration,
    ss.notes,
    s.series_id,
    json_agg(rq) as shift_roles,
    coalesce(bool_or(rq.booked), false) as booked,
    b.id as shift_role_id
from
    shift_series ss join
    shifts s on s.series_id = ss.id join
    roles_query rq on rq.shift_id = s.id join
    areas a on s.area_id = a.id join
    locations l on a.location_id = l.id join
    (select * from available_query union select * from booked_query) as b on s.id = b.shift_id
group by s.id, ss.id, a.name, l.time_zone, b.id
order by s.start_time asc
