select
    subject,
    html,
    plaintext
from email_templates
where
    id = $1 and
    type = $2 and
    organisation_id = $3
