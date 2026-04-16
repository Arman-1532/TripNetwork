// Centralized app/domain constants to reduce enum drift across routes/controllers.

const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  BLOCKED: 'BLOCKED'
};

const USER_ROLE = {
  TRAVELER: 'TRAVELER',
  PROVIDER: 'PROVIDER',
  ADMIN: 'ADMIN'
};

const PROVIDER_TYPE = {
  AGENCY: 'AGENCY',
  HOTEL: 'HOTEL'
};

const PACKAGE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

module.exports = {
  USER_STATUS,
  USER_ROLE,
  PROVIDER_TYPE,
  PACKAGE_STATUS
};

