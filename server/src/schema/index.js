const { readFileSync } = require('fs');
const path = require('path');

const typeDefs = readFileSync(
    path.join(__dirname, 'typeDefs.graphql'),
    'utf8'
);

module.exports = typeDefs;