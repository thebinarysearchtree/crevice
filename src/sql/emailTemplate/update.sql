update email_templates
set
    subject = $2,
    slate = $3,
    html = $4,
    plaintext = $5
where
    id = $1 and
    organisation_id = $6
