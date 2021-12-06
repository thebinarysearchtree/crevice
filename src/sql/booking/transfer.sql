update bookings
set shift_role_id = r.shift_role_id
from (
    select
        b.id as booking_id,
        sr2.id as shift_role_id
    from
        bookings b join
        shift_roles sr1 on b.shift_role_id = sr1.id join
        shift_roles sr2 on 
            sr2.role_id = sr1.role_id and 
            sr2.series_id = $2
    where
        b.shift_id = $1 and
        b.organisation_id = $3 and
        sr2.organisation_id = $3) as r
where id = r.booking_id
