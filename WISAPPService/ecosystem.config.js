module.exports = {
  apps : 
  [
    {
      name      : 'wiss-api',
      script    : './server.js',
      watch     : true,
      env: {
        "PORT": 8090,
        "NODE_ENV": "development"
      },
    }
  ]
};
