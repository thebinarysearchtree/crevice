delete from bookings
where
    id = $2 and
    user_id = $1 and
    organisation_id = $3 and
    ($4 is true or exists(
      select 1
      from
        shift_series ss join
        shifts s on s.series_id = ss.id join
        shift_roles sr on sr.series_id = ss.id join
        roles r on sr.role_id = r.id join
        bookings b on b.shift_id = s.id and b.shift_role_id = sr.id
      where
        b.id = $2 and
        s.start_time - interval '1 minute' * r.cancel_before_minutes > now()))
