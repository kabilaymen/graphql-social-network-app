# GraphQL Social Network App

A full-stack application that demonstrates the power of GraphQL with React, Apollo Client, subscriptions, and real-time updates.

## Features

- **Real-time Updates**: Live feed of posts with WebSocket subscriptions
- **Interactive UI**: Post creation, comments, and likes with instant updates
- **GraphQL API**: Complete CRUD operations with pagination
- **Apollo Client Integration**: State management with Apollo Client cache
- **Responsive Design**: Mobile-friendly interface

## Project Structure

```
graphql-social-network-app/
├── client/                     # React frontend
│   ├── public/                 # Static assets
│   ├── src/                    # React source code
│   │   ├── App.js              # Main application component
│   │   ├── App.css             # Application styles
│   │   └── index.js            # React entry point
│   └── package.json            # Frontend dependencies
└── server/                     # Node.js GraphQL server
    ├── schema/                 # GraphQL schema
    │   └── typeDefs.graphql    # GraphQL type definitions
    ├── dataGenerator.js        # Mock data generation
    ├── pubsub.js               # PubSub setup for subscriptions
    ├── resolvers.js            # GraphQL resolvers
    ├── server.js               # Express server setup
    └── package.json            # Backend dependencies
```

## Technologies

### Frontend
- React
- Apollo Client
- GraphQL WebSocket subscriptions
- CSS3

### Backend
- Node.js
- Express
- Apollo Server
- GraphQL subscriptions with WebSockets
- In-memory mock database

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/kabilaymen/graphql-social-network-app.git
cd graphql-social-network-app
```

2. Install server dependencies
```bash
cd server
npm install
```

3. Install client dependencies
```bash
cd ../client
npm install
```

### Running the App

1. Start the server (from the server directory)
```bash
npm start
```

2. Start the client (from the client directory)
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## GraphQL API

The GraphQL API provides the following operations:

### Queries
- `users`: List all users with pagination
- `user`: Get a specific user
- `posts`: List all posts with pagination
- `post`: Get a specific post
- `commentsByPost`: Get comments for a specific post

### Mutations
- `createPost`: Create a new post
- `likePost`: Like or unlike a post
- `createComment`: Add a comment to a post

### Subscriptions
- `postCreated`: Notifies when a new post is created
- `commentCreated`: Notifies when a new comment is added
- `postLiked`: Notifies when a post is liked

## Demo Features

The app automatically generates new posts every 5 seconds to demonstrate real-time subscription capabilities.
