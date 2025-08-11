// app/api/debug-vectors/route.js
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET(request) {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    
    // Check blogs collection
    const blogs = await db.collection('blogs').find({}).limit(3).toArray();
    
    // Check vectors collection
    const vectors = await db.collection('blog_vectors').find({}).limit(3).toArray();
    
    await client.close();
    
    return NextResponse.json({
      blogsCount: blogs.length,
      vectorsCount: vectors.length,
      sampleBlogs: blogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        descriptionLength: blog.description?.length || 0,
        description: blog.description?.substring(0, 200) + '...'
      })),
      sampleVectors: vectors.map(vector => ({
        blogId: vector.blogId,
        title: vector.title,
        chunkIndex: vector.chunkIndex,
        chunkLength: vector.chunk?.length || 0,
        chunk: vector.chunk?.substring(0, 100) + '...',
        vectorLength: vector.vector?.length || 0
      }))
    });
    
  } catch (error) {
    console.error('Debug API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}