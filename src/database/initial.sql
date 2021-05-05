create table organisations (
    id serial primary key,
    name text not null,
    created_at timestamptz not null default now(),
    logo_image_id uuid
);

create table email_templates (
    id serial primary key,
    type text not null check (type in (
        'SignUp',
        'Invite',
        'LostPassword'
    )),
    name text not null,
    subject text not null,
    slate json not null,
    html text not null,
    plaintext text not null,
    is_default boolean not null,
    organisation_id integer not null references organisations on delete cascade
);

create index email_templates_organisation_id_index on email_templates(organisation_id);

create table users (
    id serial primary key,
    first_name text not null,
    last_name text not null,
    email text not null unique,
    password text not null,
    refresh_token uuid not null,
    email_token uuid,
    email_token_expiry timestamptz default now() + interval '7 days',
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    is_admin boolean not null,
    is_disabled boolean not null default false,
    is_verified boolean not null default false,
    failed_password_attempts integer not null default 0,
    image_id uuid,
    phone text,
    pager text
);

create table assigned_users (
    id serial primary key,
    user_id integer not null references users on delete cascade,
    assigned_user_id integer not null references users on delete cascade,
    start_time timestamptz not null,
    end_time timestamptz,
    organisation_id integer not null references organisations on delete cascade,
    unique(user_id, assigned_user_id)
);

create table user_organisations (
    id serial primary key,
    user_id integer not null references users on delete cascade,
    organisation_id integer not null references organisations on delete cascade,
    is_default boolean not null default true,
    unique(user_id, organisation_id)
);

create table roles (
    id serial primary key,
    name text not null,
    colour text not null,
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    organisation_id integer not null references organisations on delete cascade
);

create index roles_organisation_id_index on roles(organisation_id);

create table booking_followers (
    id serial primary key,
    user_id integer not null references users on delete cascade,
    follower_id integer not null references users on delete cascade,
    follower_role_id integer not null references roles,
    start_time timestamptz not null,
    end_time timestamptz not null,
    organisation_id integer not null references organisations on delete cascade
);

create index booking_followers_user_id_index on booking_followers(user_id);

create table files (
    id uuid primary key,
    filename text not null,
    original_name text not null,
    size_bytes integer not null,
    mime_type text not null,
    uploaded_by integer not null references users,
    uploaded_at timestamptz not null default now(),
    organisation_id integer not null references organisations on delete cascade
);

create index files_organisation_id_index on files(organisation_id);

create table user_files (
    id serial primary key,
    user_id integer not null references users on delete cascade,
    file_id uuid not null references files on delete cascade,
    organisation_id integer not null references organisations on delete cascade
);

create index user_files_user_id_index on user_files(user_id);

create table locations (
    id serial primary key,
    name text not null,
    abbreviation text not null,
    time_zone text not null,
    address text,
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    organisation_id integer not null references organisations on delete cascade
);

create index locations_organisation_id_index on locations(organisation_id);

create table areas (
    id serial primary key,
    name text not null,
    abbreviation text not null,
    location_id integer not null references locations on delete cascade,
    notes text,
    address text,
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    organisation_id integer not null references organisations on delete cascade
);

create index areas_location_id_index on areas(location_id);
create index areas_organisation_id_index on areas(organisation_id);

create table placement_groups (
    id serial primary key,
    name text not null,
    start_time timestamptz,
    end_time timestamptz,
    notes text,
    organisation_id integer not null references organisations on delete cascade
);

create index placement_groups_organisation_id_index on placement_groups(organisation_id);

create table placements (
    id serial primary key,
    group_id integer not null references placement_groups on delete cascade,
    user_id integer not null references users,
    minutes_required integer,
    organisation_id integer not null references organisations on delete cascade
);

create index placements_group_id_index on placements(group_id);
create index placements_user_id_index on placements(user_id);

create table placement_files (
    id serial primary key,
    placement_id integer not null references placements on delete cascade,
    file_id uuid not null references files on delete cascade,
    organisation_id integer not null references organisations on delete cascade
);

create index placement_files_placement_id_index on placement_files(placement_id);

create table fields (
    id serial primary key,
    name text not null,
    field_type text not null check (field_type in (
        'Short',
        'Standard',
        'Comment',
        'Select',
        'Date',
        'Number'
    )),
    field_number integer not null,
    deleted_at timestamptz,
    organisation_id integer not null references organisations on delete cascade
);

create index fields_organisation_id_index on fields(organisation_id);

create table field_items (
    id serial primary key,
    field_id integer not null references fields on delete cascade,
    name text not null,
    item_number integer not null,
    deleted_at timestamptz,
    organisation_id integer not null references organisations on delete cascade
);

create index field_items_field_id_index on field_items(field_id);

create table placement_fields (
    id serial primary key,
    placement_id integer not null references placements on delete cascade,
    field_id integer not null references fields on delete cascade,
    required_value text,
    at_least timestamptz,
    at_most timestamptz,
    organisation_id integer not null references organisations on delete cascade
);

create index placement_fields_placement_id_index on placement_fields(placement_id);

create table user_fields (
    id serial primary key,
    user_id integer not null references users on delete cascade,
    field_id integer not null references fields,
    item_id integer references field_items,
    text_value text,
    date_value timestamptz,
    organisation_id integer not null references organisations on delete cascade
);

create index user_fields_user_id_index on user_fields(user_id);

create table user_areas (
    id serial primary key,
    user_id integer not null references users,
    area_id integer not null references areas,
    start_time timestamptz not null,
    end_time timestamptz,
    role_id integer not null references roles,
    is_admin boolean not null,
    deleted_at timestamptz,
    organisation_id integer not null references organisations on delete cascade
);

create index user_areas_index on user_areas(area_id, start_time, end_time);
create index user_areas_user_id_index on user_areas(user_id);

create table templates (
    id serial primary key,
    name text not null,
    created_at timestamptz not null default now(),
    created_by integer not null references users,
    deleted_at timestamptz,
    organisation_id integer not null references organisations on delete cascade
);

create index templates_organisation_id_index on templates(organisation_id);

create table template_applications (
    id serial primary key,
    template_id integer not null references templates on delete cascade,
    start_time timestamptz not null,
    end_time timestamptz not null,
    organisation_id integer not null references organisations on delete cascade
);

create table template_area_capacities (
    id serial primary key,
    template_id integer not null references templates on delete cascade,
    area_id integer not null references areas on delete cascade,
    start_time timestamptz not null,
    end_time timestamptz not null,
    capacity integer not null,
    organisation_id integer not null references organisations on delete cascade
);

create index template_area_capacities_template_id_index on template_area_capacities(template_id);

create table area_capacities (
    id serial primary key,
    area_id integer not null references areas on delete cascade,
    start_time timestamptz not null,
    end_time timestamptz not null,
    capacity integer not null,
    template_id integer not null references template_applications on delete set null,
    organisation_id integer not null references organisations on delete cascade
);

create index area_capacities_area_id_index on area_capacities(area_id);

create table question_groups (
    id serial primary key,
    name text not null,
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    organisation_id integer not null references organisations on delete cascade
);

create index question_groups_organisation_id_index on question_groups(organisation_id);

create table template_shifts (
    id serial primary key,
    template_id integer not null references templates on delete cascade,
    area_id integer not null references areas on delete cascade,
    start_time timestamptz not null,
    end_time timestamptz not null,
    break_seconds integer not null,
    capacity integer,
    question_group_id integer references question_groups on delete set null,
    organisation_id integer not null references organisations on delete cascade
);

create index template_shifts_template_id_index on template_shifts(template_id);

create table shifts (
    id serial primary key,
    area_id integer not null references areas,
    start_time timestamptz not null,
    end_time timestamptz not null,
    break_minutes integer not null,
    capacity integer,
    notes text,
    created_at timestamptz not null default now(),
    created_by integer not null references users,
    deleted_at timestamptz,
    deleted_by integer references users,
    requires_approval boolean not null,
    approved_by integer references users,
    question_group_id integer references question_groups on delete set null,
    template_id integer references template_applications on delete set null,
    organisation_id integer not null references organisations on delete cascade
);

create index shifts_index on shifts(area_id, start_time, end_time);

create table booking_templates (
    id serial primary key,
    name text not null,
    created_at timestamptz not null default now(),
    created_by integer not null references users,
    organisation_id integer not null references organisations on delete cascade
);

create index booking_templates_organisation_id_index on booking_templates(organisation_id);

create table booking_template_bookings (
    id serial primary key,
    template_id integer not null references booking_templates on delete cascade,
    shift_id integer not null references shifts on delete cascade,
    role_id integer not null references roles on delete cascade,
    organisation_id integer not null references organisations on delete cascade
);

create index booking_template_bookings_template_id_index on booking_template_bookings(template_id);

create table bookings (
    id serial primary key,
    shift_id integer not null references shifts on delete cascade,
    user_id integer not null references users,
    role_id integer not null references roles,
    booked_at timestamptz not null default now(),
    booked_by integer not null references users,
    cancelled_at timestamptz,
    cancelled_by integer references users,
    cancellation_requested_at timestamptz,
    cancellation_request_reason text,
    template_id integer references booking_templates on delete set null,
    organisation_id integer not null references organisations on delete cascade
);

create index bookings_shift_id_index on bookings(shift_id);
create index bookings_user_id_index on bookings(user_id);

create table tasks (
    id serial primary key,
    name text not null,
    organisation_id integer not null references organisations on delete cascade
);

create index tasks_organisation_id_index on tasks(organisation_id);

create table placement_tasks (
    id serial primary key,
    placement_id integer not null references placements on delete cascade,
    task_id integer not null references tasks on delete cascade,
    minutes_required integer not null,
    organisation_id integer not null references organisations on delete cascade
);

create index placement_tasks_placement_id_index on placement_tasks(placement_id);

create table shift_tasks (
    id serial primary key,
    shift_id integer not null references shifts on delete cascade,
    task_id integer not null references tasks on delete cascade,
    duration_minutes integer not null,
    organisation_id integer not null references organisations on delete cascade
);

create index shift_tasks_shift_id_index on shift_tasks(shift_id);

create table adhoc_tasks (
    id serial primary key,
    booking_id integer not null references bookings on delete cascade,
    task_id integer not null references tasks on delete cascade,
    duration_minutes integer not null,
    created_at timestamptz not null default now(),
    created_by integer references users on delete set null,
    removed_at timestamptz,
    removed_by integer references users on delete set null,
    organisation_id integer not null references organisations on delete cascade
);

create index adhoc_tasks_booking_id_index on adhoc_tasks(booking_id);

create table shift_prerequisites (
    id serial primary key,
    shift_id integer not null references shifts on delete cascade,
    task_id integer not null references tasks on delete cascade,
    minutes_required integer not null,
    organisation_id integer not null references organisations on delete cascade
);

create index shift_prerequisites_shift_index on shift_prerequisites(shift_id);

create table shift_roles (
    id serial primary key,
    shift_id integer not null references shifts on delete cascade,
    role_id integer not null references roles,
    amount integer not null,
    cancel_before_minutes integer,
    cancel_after_minutes integer,
    book_before_minutes integer,
    book_after_minutes integer,
    can_edit_shift boolean not null,
    organisation_id integer not null references organisations on delete cascade
);

create index shift_roles_shift_id_index on shift_roles(shift_id);

create table template_shift_groups (
    id serial primary key,
    template_id integer not null references templates on delete cascade,
    capacity integer,
    organisation_id integer not null references organisations on delete cascade
);

create index template_shift_groups_template_id_index on template_shift_groups(template_id);

create table template_shift_group_capacities (
    id serial primary key,
    group_id integer not null references template_shift_groups on delete cascade,
    template_shift_id integer not null references template_shifts on delete cascade,
    capacity integer,
    organisation_id integer not null references organisations on delete cascade
);

create index template_shift_group_capacities_group_id_index on template_shift_group_capacities(group_id);

create table shift_groups (
    id serial primary key,
    capacity integer,
    template_id integer references template_applications on delete set null,
    organisation_id integer not null references organisations on delete cascade
);

create table shift_group_capacities (
    id serial primary key,
    shift_group_id integer not null references shift_groups on delete cascade,
    shift_id integer not null references shifts on delete cascade,
    capacity integer,
    organisation_id integer not null references organisations on delete cascade
);

create index shift_group_capacities_shift_id_index on shift_group_capacities(shift_id);

create table template_time_periods (
    id serial primary key,
    template_id integer not null references templates on delete cascade,
    area_id integer not null references areas on delete cascade,
    start_time timestamptz not null,
    end_time timestamptz not null,
    capacity integer,
    organisation_id integer not null references organisations on delete cascade
);

create index template_time_periods_template_id_index on template_time_periods(template_id);

create table template_time_period_roles (
    id serial primary key,
    template_time_period_id integer not null references template_time_periods on delete cascade,
    role_id integer not null references roles on delete cascade,
    capacity integer not null,
    organisation_id integer not null references organisations on delete cascade
);

create index template_time_period_roles_template_time_period_id_index on template_time_period_roles(template_time_period_id);

create table time_periods (
    id serial primary key,
    area_id integer not null references areas on delete cascade,
    start_time timestamptz not null,
    end_time timestamptz not null,
    capacity integer,
    template_id integer references template_applications on delete set null,
    organisation_id integer not null references organisations on delete cascade
);

create index time_periods_index on time_periods(area_id, start_time, end_time);

create table time_period_roles (
    id serial primary key,
    time_period_id integer not null references time_periods on delete cascade,
    role_id integer not null references roles on delete cascade,
    capacity integer not null,
    organisation_id integer not null references organisations on delete cascade
);

create index time_period_roles_time_period_id_index on time_period_roles(time_period_id);

create table questions (
    id serial primary key,
    group_id integer not null references question_groups on delete cascade,
    question_type text not null check (question_type in (
        'MultipleChoice',
        'Comment',
        'Scale',
        'Numeric')),
    question_order integer not null,
    question text not null,
    deleted_at timestamptz,
    organisation_id integer not null references organisations on delete cascade
);

create index questions_group_id_index on questions(group_id);

create table question_roles (
    id serial primary key,
    question_id integer not null references questions on delete cascade,
    role_id integer not null references roles,
    organisation_id integer not null references organisations on delete cascade
);

create index question_roles_question_id_index on question_roles(question_id);

create table options (
    id serial primary key,
    question_id integer not null references questions on delete cascade,
    option_order integer not null,
    label text not null,
    alert_if_selected boolean not null,
    alert_words text,
    deleted_at timestamptz,
    organisation_id integer not null references organisations on delete cascade
);

create index options_question_id_index on options(question_id);

create table answers (
    id serial primary key,
    booking_id integer not null references bookings,
    option_id integer not null references options,
    comments text,
    organisation_id integer not null references organisations on delete cascade
);

create index answers_booking_id_index on answers(booking_id);
create index answers_option_id_index on answers(option_id);
