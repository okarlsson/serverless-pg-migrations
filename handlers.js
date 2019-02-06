const Migration = require("./migration");

const success = response => ({
  statusCode: 200,
  body: JSON.stringify(response)
});

const failure = response => ({
  statusCode: 500,
  body: JSON.stringify(response)
});

const handler = handlerName => async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${
    process.env.DB_PORT
  }/${process.env.DB_NAME}`;
  
  let result;
  const migrations = new Migration(connectionString, 'migrations');
  try{
    const migrationResult = await migrations[handlerName]();
    result = migrationResult.map(({ file }) => file).join("\n");
    migrations.close();
  }
  catch(err){
    migrations.close();
    callback(err);
  }
  
  if(process.env.SHOULD_SEED === 'true'){
    const seeders = new Migration(connectionString, 'seeders');
    try{
      const seedingResult = await seeders[handlerName]();
      result += seedingResult.map(({ file }) => file).join("\n");
      seeders.close();
    }catch(err){
      seeders.close();
      callback(err);
    }
  }

  callback(null, success(result));
};

module.exports.up = handler("up");

module.exports.down = handler("down");
