create table organisations (
    id serial primary key,
    name text not null,
    createdAt timestamptz not null default now(),
    trialEnds timestamptz default now() + interval '14 days',
    logoImageId uuid
);

create table users (
    id serial primary key,
    firstName text not null,
    lastName text not null,
    email text not null,
    username text not null,
    password text not null,
    refreshToken uuid not null,
    organisationId integer not null references organisations on delete cascade,
    createdAt timestamptz not null default now(),
    isAdmin boolean not null,
    unique(username, organisationId),
    unique(email, organisationId)
);

create index usersOrganisationIdIndex on users(organisationId);

create table roles (
    id serial primary key,
    name text not null,
    canBookBefore boolean not null,
    canBookAfter boolean not null,
    canCancelBefore boolean not null,
    canCancelAfter boolean not null,
    canBookForRoleId integer references roles on delete set null,
    canCancelForRoleId integer references roles on delete set null,
    canDelete boolean not null,
    canEditBefore boolean not null,
    canEditAfter boolean not null,
    canChangeCapacity boolean not null,
    organisationId integer not null references organisations on delete cascade
);

create index rolesOrganisationIdIndex on roles(organisationId);

create table userRoles (
    id serial primary key,
    userId integer not null references users on delete cascade,
    roleId integer not null references roles on delete cascade,
    organisationId integer not null references organisations on delete cascade
);

create index userRolesUserIdIndex on userRoles(userId);

create table areas (
    id serial primary key,
    name text not null,
    timezone text not null,
    organisationId integer not null references organisations on delete cascade
);

create index areasOrganisationIdIndex on areas(organisationId);

create table placementGroups (
    id serial primary key,
    name text not null,
    startTime timestamptz,
    endTime timestamptz,
    notes text,
    organisationId integer not null references organisations on delete cascade
);

create index placementGroupsOrganisationIdIndex on placementGroups(organisationId);

create table placements (
    id serial primary key,
    groupId integer not null references placementGroups on delete cascade,
    userId integer references users on delete set null,
    minutesRequired integer,
    organisationId integer not null references organisations on delete cascade
);

create index placementsGroupIdIndex on placements(groupId);
create index placementsUserIdIndex on placements(userId);

create table fieldGroups (
    id serial primary key,
    label text not null,
    organisationId integer not null references organisations on delete cascade
);

create index fieldGroupsOrganisationIdIndex on fieldGroups(organisationId);

create table fields (
    id serial primary key,
    groupId integer references fieldGroups on delete cascade,
    label text not null,
    fieldType text not null check (fieldType in (
        'smallText',
        'text',
        'textarea',
        'select',
        'date',
        'numeric'
    )),
    organisationId integer not null references organisations on delete cascade
);

create index fieldsGroupIdIndex on fields(groupId);
create index fieldsOrganisationIdIndex on fields(organisationId);

create table fieldItems (
    id serial primary key,
    fieldId integer not null references fields on delete cascade,
    label text not null,
    organisationId integer not null references organisations on delete cascade
);

create index fieldItemsFieldIdIndex on fieldItems(fieldId);

create table placementFields (
    id serial primary key,
    placementId integer not null references placements on delete cascade,
    fieldId integer not null references fields on delete cascade,
    requiredValue text,
    atLeast timestamptz,
    atMost timestamptz,
    organisationId integer not null references organisations on delete cascade
);

create index placementFieldsPlacementIdIndex on placementFields(placementId);

create table userFields (
    id serial primary key,
    userId integer not null references users on delete cascade,
    fieldId integer not null references fields on delete cascade,
    fieldItemId integer references fieldItems on delete cascade,
    fieldValue text,
    dateValue timestamptz,
    organisationId integer not null references organisations on delete cascade
);

create index userFieldsUserIdIndex on userFields(userId);

create table userAreas (
    id serial primary key,
    userId integer not null references users on delete cascade,
    areaId integer not null references areas on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    roleId integer not null references roles on delete cascade,
    organisationId integer not null references organisations on delete cascade
);

create index userAreasIndex on userAreas(areaId, startTime, endTime);
create index userAreasUserIdIndex on userAreas(userId);

create table templates (
    id serial primary key,
    name text not null,
    createdAt timestamptz not null default now(),
    createdBy integer references users on delete set null,
    organisationId integer not null references organisations on delete cascade
);

create index templatesOrganisationIdIndex on templates(organisationId);

create table templateApplications (
    id serial primary key,
    templateId integer not null references templates on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    organisationId integer not null references organisations on delete cascade
);

create table templateAreaCapacities (
    id serial primary key,
    templateId integer not null references templates on delete cascade,
    areaId integer not null references areas on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    capacity integer not null,
    organisationId integer not null references organisations on delete cascade
);

create index templateAreaCapacitiesTemplateIdIndex on templateAreaCapacities(templateId);

create table areaCapacities (
    id serial primary key,
    areaId integer not null references areas on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    capacity integer not null,
    templateId integer not null references areaCapacityTemplateApplications on delete set null,
    organisationId integer not null references organisations on delete cascade
);

create index areaCapacitiesAreaIdIndex on areaCapacities(areaId);

create table questionGroups (
    id serial primary key,
    name text not null,
    organisationId integer not null references organisations on delete cascade
);

create index questionGroupsOrganisationIdIndex on questionGroups(organisationId);

create table templateShifts (
    id serial primary key,
    templateId integer not null references templates on delete cascade,
    areaId integer not null references areas on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    breakSeconds integer not null,
    capacity integer,
    questionGroupId integer references questionGroups on delete set null,
    organisationId integer not null references organisations on delete cascade
);

create index templateShiftsTemplateIdIndex on templateShifts(templateId);

create table shifts (
    id serial primary key,
    areaId integer not null references areas on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    editedStartTime timestamptz,
    editedEndTime timestamptz,
    editedBy integer references users on delete set null,
    breakMinutes integer not null,
    cancelBeforeMinutes integer,
    bookBeforeMinutes integer,
    capacity integer,
    notes text,
    questionGroupId integer references questionGroups on delete set null,
    templateId integer references templateApplications on delete set null,
    organisationId integer not null references organisations on delete cascade
);

create index shiftsIndex on shifts(areaId, startTime, endTime);

create table bookingTemplates (
    id serial primary key,
    name text not null,
    createdAt timestamptz not null default now(),
    createdBy integer references users on delete set null,
    organisationId integer not null references organisations on delete cascade
);

create index bookingTemplatesOrganisationIdIndex on bookingTemplates(organisationId);

create table bookingTemplateBookings (
    id serial primary key,
    templateId integer not null references bookingTemplates on delete cascade,
    shiftId integer not null references shifts on delete cascade,
    roleId integer not null references roles on delete cascade,
    organisationId integer not null references organisations on delete cascade
);

create index bookingTemplateBookingsTemplateIdIndex on bookingTemplateBookings(templateId);

create table bookings (
    id serial primary key,
    shiftId integer not null references shifts on delete cascade,
    userId integer references users on delete set null,
    roleId integer not null references roles on delete cascade,
    bookedAt timestamptz not null default now(),
    bookedBy integer references users on delete set null,
    cancelledAt timestamptz,
    cancelledBy integer references users on delete set null,
    templateId integer references bookingTemplates on delete set null,
    organisationId integer not null references organisations on delete cascade
);

create index bookingsShiftIdIndex on bookings(shiftId);
create index bookingsUserIdIndex on bookings(userId);

create table tasks (
    id serial primary key,
    name text not null,
    organisationId integer not null references organisations on delete cascade
);

create index tasksOrganisationIdIndex on tasks(organisationId);

create table placementTasks (
    id serial primary key,
    placementId integer not null references placements on delete cascade,
    taskId integer not null references tasks on delete cascade,
    minutesRequired integer not null,
    organisationId integer not null references organisations on delete cascade
);

create index placementTasksPlacementIdIndex on placementTasks(placementId);

create table shiftTasks (
    id serial primary key,
    shiftId integer not null references shifts on delete cascade,
    taskId integer not null references tasks on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    organisationId integer not null references organisations on delete cascade
);

create index shiftTasksShiftIdIndex on shiftTasks(shiftId);

create table shiftPrerequisites (
    id serial primary key,
    shiftId integer not null references shifts on delete cascade,
    taskId integer not null references tasks on delete cascade,
    minutesRequired integer not null,
    organisationId integer not null references organisations on delete cascade
);

create index shiftPrerequisitesShiftIndex on shiftPrerequisites(shiftId);

create table shiftRoles (
    id serial primary key,
    shiftId integer not null references shifts on delete cascade,
    roleId integer not null references roles on delete cascade,
    amount integer not null,
    organisationId integer not null references organisations on delete cascade
);

create index shiftRolesShiftIdIndex on shiftRoles(shiftId);

create table templateShiftGroups (
    id serial primary key,
    templateId integer not null references templates on delete cascade,
    capacity integer,
    organisationId integer not null references organisations on delete cascade
);

create index templateShiftGroupsTemplateIdIndex on templateShiftGroups(templateId);

create table templateShiftGroupCapacities (
    id serial primary key,
    groupId integer not null references templateShiftGroups on delete cascade,
    templateShiftId integer not null references templateShifts on delete cascade,
    capacity integer,
    organisationId integer not null references organisations on delete cascade
);

create index shiftGroupTemplateShiftGroupCapacitiesGroupIdIndex on shiftGroupTemplateShiftGroupCapacities(groupId);

create table shiftGroups (
    id serial primary key,
    capacity integer,
    templateId integer references templateApplications on delete set null,
    organisationId integer not null references organisations on delete cascade
);

create table shiftGroupCapacities (
    id serial primary key,
    shiftGroupId integer not null references shiftGroups on delete cascade,
    shiftId integer not null references shifts on delete cascade,
    capacity integer,
    organisationId integer not null references organisations on delete cascade
);

create index shiftGroupCapacitiesShiftIdIndex on shiftGroupCapacities(shiftId);

create table templateTimePeriods (
    id serial primary key,
    templateId integer not null references templates on delete cascade,
    areaId integer not null references areas on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    capacity integer not null,
    organisationId integer not null references organisations on delete cascade
);

create index timePeriodTemplateTimePeriodsTemplateIdIndex on timePeriodTemplateTimePeriods(templateId);

create table timePeriods (
    id serial primary key,
    areaId integer not null references areas on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    capacity integer not null,
    templateId integer references templateApplications on delete set null,
    organisationId integer not null references organisations on delete cascade
);

create index timePeriodsIndex on timePeriods(areaId, startTime, endTime);

create table questions (
    id serial primary key,
    groupId integer not null references questionGroups on delete cascade,
    questionType text not null check (questionType in (
        'Multiple-choice',
        'Comment',
        'Scale',
        'Numeric')),
    questionOrder integer not null,
    question text not null,
    organisationId integer not null references organisations on delete cascade
);

create index questionsGroupIdIndex on questions(groupId);

create table options (
    id serial primary key,
    questionId integer not null references questions on delete cascade,
    optionOrder integer not null,
    label text not null,
    alertIfSelected boolean not null,
    alertWords text,
    organisationId integer not null references organisations on delete cascade
);

create index optionsQuestionIdIndex on options(questionId);

create table answers (
    id serial primary key,
    bookingId integer not null references bookings on delete cascade,
    optionId integer not null references options,
    comments text,
    organisationId integer not null references organisations on delete cascade
);

create index answersBookingIdIndex on answers(bookingId);
create index answersOptionIdIndex on answers(optionId);
