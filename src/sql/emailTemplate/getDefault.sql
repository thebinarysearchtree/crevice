select
    subject,
    html,
    plaintext
from email_templates
where
    type = $1 and
    organisation_id = $2 and
    is_default is true
