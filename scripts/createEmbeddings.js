// scripts/createEmbeddings.js
import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { getEmbedding, chunkText } from '../lib/utils.js';

function stripHtml(html) {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function main() {
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    console.log('MONGODB_DB:', process.env.MONGODB_DB);

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }
    if (!process.env.MONGODB_DB) {
        throw new Error('MONGODB_DB is not defined in environment variables');
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);

    const blogs = await db.collection('blogs').find({}).toArray();
    const vectorsColl = db.collection('blog_vectors');
    await vectorsColl.createIndex({ blogId: 1 });
    await vectorsColl.deleteMany({}); // Clear existing vectors

    for (const blog of blogs) {
        const content = blog.description || blog.content || '';
        const clean = stripHtml(content);
        const chunks = chunkText(clean, 800);

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i].trim();
            if (!chunk) continue;

            try {
                const vector = await getEmbedding(chunk);

                await vectorsColl.insertOne({
                    blogId: blog._id,
                    title: blog.title,
                    chunkIndex: i,
                    chunk,
                    vector,
                    createdAt: new Date(),
                });

                console.log(`Saved vector for blog ${blog._id} chunk ${i}`);
            } catch (error) {
                console.error(`Error processing chunk for blog ${blog._id}:`, error);
            }
        }
    }
    await client.close();
    console.log('Embeddings creation completed!');
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});