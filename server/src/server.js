import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { useServer } from 'graphql-ws/use/ws';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { pubsub } from './pubsub.js';
import { resolvers, EVENTS } from './resolvers.js';
import { generateMockData, db } from './dataGenerator.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

generateMockData();

const typeDefs = readFileSync(path.join(__dirname, 'schema', 'typeDefs.graphql'), 'utf-8');
const schema = makeExecutableSchema({ typeDefs, resolvers });

async function startServer() {
    const app = express();

    app.use(cors({
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    }));

    const httpServer = createServer(app);

    const apolloServer = new ApolloServer({
        schema,
        context: ({ req }) => ({ pubsub })
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({ app });

    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
        verifyClient: (info, done) => {
            const allowedOrigins = ['http://localhost:3000'];
            if (allowedOrigins.includes(info.origin) || process.env.NODE_ENV === 'development') {
                return done(true);
            }
            done(false, 401, 'Origin non autorisé');
        }
    });

    const serverCleanup = useServer(
        {
            schema,
            context: () => ({ pubsub })
        },
        wsServer
    );

    httpServer.on('close', () => {
        serverCleanup.dispose();
    });

    const PORT = 4000;
    httpServer.listen(PORT, () => {
        console.log(`Server ready at http://localhost:${PORT}${apolloServer.graphqlPath}`);
        console.log(`Subscriptions ready at ws://localhost:${PORT}/graphql`);
    });
}

startServer();

setInterval(() => {
    const owner = db.users[Math.floor(Math.random() * db.users.length)];

    const newPost = {
        id: uuidv4(),
        text: `Live post at ${new Date().toLocaleTimeString()}`,
        image: `https://picsum.photos/600/400?random=${Math.floor(Math.random() * 1000)}`,
        likes: 0,
        tags: ['live'],
        publishDate: new Date().toISOString(),
        owner: owner.id,
        comments: []
    };

    db.posts.unshift(newPost);
    pubsub.publish(EVENTS.POST_CREATED, { postCreated: newPost });
    console.log('New post created:', newPost);
}, 5000);
