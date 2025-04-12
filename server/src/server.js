const { ApolloServer } = require('apollo-server');
const { readFileSync } = require('fs');
const path = require('path');
const resolvers = require('./resolvers');
const { generateMockData } = require('./dataGenerator');

generateMockData();

const typeDefs = readFileSync(path.join(__dirname, 'schema', 'typeDefs.graphql'), 'utf-8');

const server = new ApolloServer({
    typeDefs,
    resolvers
});

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`);
});
