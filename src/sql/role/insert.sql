insert into roles(
    name,
    colour,
    cancel_before_minutes,
    book_before_minutes,
    organisation_id)
values($1, $2, $3, $4, $5)
