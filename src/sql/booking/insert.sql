insert into bookings(
    shift_id,
    shift_role_id,
    user_id,
    booked_by,
    organisation_id)
select $1, $2, $3, $4, $6
where
    ($5 is true or exists(
        select count(b.id) < sr.capacity
        from
            shift_roles sr left join
            bookings b on b.shift_role_id = sr.id
        where
            b.shift_id = $1 and
            sr.id = $2
        group by sr.id)) and
    exists(
        select 1
        from
            shifts s join
            shift_series ss on s.series_id = ss.id join
            shift_roles sr on sr.series_id = ss.id join
            roles r on sr.role_id = r.id join
            user_areas ua on ua.area_id = s.area_id and ua.role_id = sr.role_id
        where
            s.id = $1 and
            sr.id = $2 and
            sr.organisation_id = $6 and
            ua.user_id = $3 and
            s.start_time >= ua.start_time and
            (ua.end_time is null or s.end_time < ua.end_time) and
            ($5 is true or s.start_time - interval '1 minute' * r.book_before_minutes > now())) and
    not exists(
        select 1
        from
            shifts s join
            shift_series ss on s.series_id = ss.id join
            shift_roles sr on sr.series_id = ss.id join
            bookings b on b.shift_id = s.id and b.shift_role_id = sr.id join
            (
                select s.start_time, s.end_time
                from
                    shifts s join
                    shift_series ss on s.series_id = ss.id join
                    shift_roles sr on sr.series_id = ss.id
                where
                    s.id = $1 and
                    sr.id = $2
            ) as o on o.start_time <= s.end_time and o.end_time >= s.start_time
        where b.user_id = $3)
