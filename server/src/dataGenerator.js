import { v4 as uuidv4 } from 'uuid';

export const db = {
    users: [],
    posts: [],
    comments: [],
    likes: [],
    tags: new Set()
};

export function generateMockData(numUsers = 10, numPosts = 20, numComments = 50) {
    const randomDate = (startYear = 2000, endYear = 2025) => {
        const start = new Date(startYear, 0, 1);
        const end = new Date(endYear, 11, 31);
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
    };

    for (let i = 0; i < numUsers; i++) {
        const gender = i % 2 === 0 ? 'male' : 'female';
        const user = {
            id: uuidv4(),
            title: gender === 'male' ? 'mr' : 'ms',
            firstName: gender === 'male' ? 'John' : 'Jane',
            lastName: gender === 'male' ? 'Doe' : 'Smith',
            gender: gender,
            email: `${gender === 'male' ? 'john' : 'jane'}.doe${i}@example.com`,
            dateOfBirth: randomDate(1990, 2000),
            registerDate: new Date().toISOString(),
            phone: `+1${Math.floor(Math.random() * 1000000000)}`,
            picture:
                gender === 'male'
                    ? `https://randomuser.me/api/portraits/men/${i + 1}.jpg`
                    : `https://randomuser.me/api/portraits/women/${i + 1}.jpg`,
            location: {
                street: `${Math.floor(Math.random() * 1000)} Main St`,
                city: `City ${i}`,
                state: `State ${i}`,
                country: 'USA',
                timezone: `+${Math.floor(Math.random() * 12)}:00`
            }
        };
        db.users.push(user);
    }

    for (let i = 0; i < numPosts; i++) {
        const owner = db.users[Math.floor(Math.random() * db.users.length)];
        const post = {
            id: uuidv4(),
            text: `Post number ${i + 1}`,
            image: `https://picsum.photos/600/400?random=${i}`,
            likes: 0,
            link: `https://example.com/${i}`,
            tags: [`tag${Math.floor(Math.random() * 5)}`, `tag${Math.floor(Math.random() * 5)}`],
            publishDate: randomDate(2020, 2025),
            owner: owner.id
        };
        db.posts.push(post);
        post.tags.forEach(tag => db.tags.add(tag));
    }

    for (let i = 0; i < numComments; i++) {
        const post = db.posts[Math.floor(Math.random() * db.posts.length)];
        const owner = db.users[Math.floor(Math.random() * db.users.length)];
        const comment = {
            id: uuidv4(),
            message: `This is comment number ${i + 1}`,
            owner: owner.id,
            post: post.id,
            publishDate: randomDate(2020, 2025)
        };
        db.comments.push(comment);
    }

    generateRandomLikes();
}

function generateRandomLikes() {
    db.posts.forEach(post => {
        post.likes = 0;

        db.users.forEach(user => {
            if (Math.random() < 0.3) {
                db.likes.push({
                    id: uuidv4(),
                    userId: user.id,
                    postId: post.id,
                    createdAt: new Date().toISOString()
                });
                post.likes++;
            }
        });
    });
}
