const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const POSTS_FILE = path.join(__dirname, 'posts.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Helper: Read posts from file
function readPosts() {
    try {
        if (fs.existsSync(POSTS_FILE)) {
            const data = fs.readFileSync(POSTS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading posts:', error);
    }
    return [];
}

// Helper: Write posts to file
function writePosts(posts) {
    try {
        fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing posts:', error);
        return false;
    }
}

// API: Get all posts
app.get('/api/posts', (req, res) => {
    const posts = readPosts();
    res.json(posts);
});

// API: Add new post
app.post('/api/posts', (req, res) => {
    const { title, content, category, author } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const posts = readPosts();
    const now = new Date();
    
    const newPost = {
        id: Date.now().toString(),
        title,
        content,
        category: category || 'general',
        author: author || 'אנונימי',
        date: now.toLocaleDateString('he-IL'),
        time: now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        timestamp: now.toISOString()
    };
    
    posts.unshift(newPost); // Add to beginning
    
    if (writePosts(posts)) {
        res.status(201).json(newPost);
    } else {
        res.status(500).json({ error: 'Failed to save post' });
    }
});

// API: Delete post
app.delete('/api/posts/:id', (req, res) => {
    const { id } = req.params;
    let posts = readPosts();
    
    const initialLength = posts.length;
    posts = posts.filter(post => post.id !== id);
    
    if (posts.length === initialLength) {
        return res.status(404).json({ error: 'Post not found' });
    }
    
    if (writePosts(posts)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 T4 News Server running on port ${PORT}`);
    console.log(`📰 Open: http://localhost:${PORT}`);
    
    // Create posts.json if it doesn't exist
    if (!fs.existsSync(POSTS_FILE)) {
        const initialPosts = [
            {
                id: '1',
                title: 'מערך החדשות של ט4 עולה לאוויר!',
                content: 'אנחנו שמחים להשיק את מערך החדשות הרשמי של ט4. מעכשיו תוכלו לקבל עדכונים שוטפים ישירות מהצוות שלנו.',
                category: 'urgent',
                author: 'צוות ט4',
                date: new Date().toLocaleDateString('he-IL'),
                time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date().toISOString()
            }
        ];
        writePosts(initialPosts);
        console.log('📄 Created initial posts.json');
    }
});
