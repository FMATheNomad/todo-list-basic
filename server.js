const http = require('http');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const url = require('url');

const client = new MongoClient('mongodb://localhost:27017', { useUnifiedTopology: true });

let db, todosCollection;

async function connectDB() {
  await client.connect();
  db = client.db('todoDB');
  todosCollection = db.collection('todos');
}
connectDB();

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }
  
  if (parsedUrl.pathname === '/todos' && method === 'GET') {
    const todos = await todosCollection.find().toArray();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(todos));
  } else if (parsedUrl.pathname === '/todos' && method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      const todo = JSON.parse(body);
      const result = await todosCollection.insertOne(todo);
      res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(result.ops[0]));
    });
  } else if (parsedUrl.pathname.startsWith('/todos/') && method === 'DELETE') {
    const id = parsedUrl.pathname.split('/')[2];
    await todosCollection.deleteOne({ _id: ObjectId(id) });
    res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ message: 'Todo deleted' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ message: 'Not Found' }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
