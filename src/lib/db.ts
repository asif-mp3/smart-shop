import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let dbPromise: Promise<Db>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the value
  // across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
    _mongoDbPromise?: Promise<Db>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
    globalWithMongo._mongoDbPromise = globalWithMongo._mongoClientPromise.then(
      (c) => c.db()
    );
  }
  clientPromise = globalWithMongo._mongoClientPromise;
  dbPromise = globalWithMongo._mongoDbPromise!;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  dbPromise = clientPromise.then((c) => c.db());
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
export { dbPromise };

export async function getDatabase() {
  return dbPromise;
}
