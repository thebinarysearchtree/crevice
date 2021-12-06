select
    u.id,
    concat_ws(' ', u.first_name, u.last_name) as name,
    u.image_id,
    case when s.id is null then null else json_build_object(
        'booking_id', b.id,
        'area_name', a.name,
        'role_name', r.name,
        'role_colour', r.colour,
        'start_time', s.start_time,
        'end_time', s.end_time) end as shift,
    fn.notes
from
    followers f join
    users u on f.following_user_id = u.id left join
    bookings b on u.id = b.user_id left join
    shifts s on 
    b.shift_id = s.id and 
    s.start_time < $3 and 
    s.start_time >= $2 left join
    areas a on s.area_id = a.id left join
    shift_roles sr on b.shift_role_id = sr.id left join
    roles r on sr.role_id = r.id left join
    follower_notes fn on u.id = fn.created_by and b.id = fn.booking_id
where
    f.user_id = $1 and
    f.organisation_id = $4
order by u.last_name, u.id asc
