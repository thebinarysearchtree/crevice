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
    email text not null unique,
    username text not null,
    password text not null,
    refreshToken uuid not null,
    organisationId integer not null references organisations on delete cascade,
    createdAt timestamptz not null default now(),
    isAdmin boolean not null default false,
    unique(organisationId, username)
);

create table roles (
    id serial primary key,
    name text not null,
    organisationId integer not null references organisations on delete cascade
);

create index rolesOrganisationIdIndex on roles(organisationId);

create table userRoles (
    id serial primary key,
    userId integer not null references users,
    roleId integer not null references roles,
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

create table placements (
    id serial primary key,
    userId integer not null references users on delete cascade,
    areaId integer not null references areas on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    roleId integer not null references roles on delete cascade,
    canBook boolean not null,
    canCancel boolean not null,
    canDelete boolean not null,
    canEditBefore boolean not null,
    canEditAfter boolean not null,
    canChangeCapacity boolean not null,
    organisationId integer not null references organisations on delete cascade
);

create index placementsIndex on placements(areaId, startTime, endTime);

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

create table templateShifts (
    id serial primary key,
    templateId integer not null references templates on delete cascade,
    areaId integer not null references areas on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    breakSeconds integer not null,
    capacity integer,
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
    breakSeconds integer not null,
    cancelSeconds integer,
    capacity integer,
    notes text,
    templateId integer references templateApplications on delete set null,
    organisationId integer not null references organisations on delete cascade
);

create index shiftsIndex on shifts(areaId, startTime, endTime);

create table bookings (
    id serial primary key,
    shiftId integer not null references shifts on delete cascade,
    userId integer not null references users on delete cascade,
    roleId integer not null references roles on delete cascade,
    bookedAt timestamptz not null default now(),
    cancelledAt timestamptz,
    cancelledBy integer references users on delete set null,
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

create table shiftTasks (
    id serial primary key,
    shiftId integer not null references shifts on delete cascade,
    taskId integer not null references tasks on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    organisationId integer not null references organisations on delete cascade
);

create index shiftTasksShiftIdIndex on shiftTasks(shiftId);

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
