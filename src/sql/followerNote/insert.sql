insert into follower_notes(
    booking_id,
    notes,
    created_by,
    organisation_id)
select $1, $2, $3, $4
where
    exists(
        select 1
        from
            followers f join
            bookings b on f.following_user_id = b.user_id
        where
            f.user_id = $3 and
            b.id = $1 and
            f.organisation_id = $4)
