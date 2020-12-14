module.exports = {
  key: 'crevice',
  port: 8080,
  host: 'localhost',
  database: {
    user: 'crevice',
    host: 'localhost',
    database: 'crevice',
    password: 'crevice'
  },
  email: {
    host: 'localhost',
    port: 587,
    username: '',
    password: '',
    from: ''
  },
  upload: {
    filesDir: '/Users/andrew/Projects/crevice/files',
    photosDir: '/Users/andrew/Projects/crevice/photos'
  },
  environment: 'test'
};
