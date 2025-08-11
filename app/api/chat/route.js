// app/api/chat/route.js
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getEmbedding, cosineSimilarity } from '@/lib/utils.js';

export async function POST(request) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    console.log('Processing question:', question);

    // 1. Get embedding for the user's question
    let questionVector;
    try {
      questionVector = await getEmbedding(question);
      console.log('Got question embedding, length:', questionVector.length);
    } catch (embeddingError) {
      console.error('Embedding error:', embeddingError);
      return NextResponse.json({ error: 'Failed to process question' }, { status: 500 });
    }

    // 2. Retrieve relevant blog chunks from MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    let relevantChunks = [];
    
    try {
      await client.connect();
      const db = client.db(process.env.MONGODB_DB);
      const vectorsColl = db.collection('blog_vectors');

      const allVectors = await vectorsColl.find({}).toArray();
      console.log(`Found ${allVectors.length} vectors in database`);

      if (allVectors.length > 0) {
        const similarities = allVectors.map(doc => ({
          ...doc,
          score: cosineSimilarity(questionVector, doc.vector),
        }));

        const topSimilarities = similarities
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        
        console.log('Top 5 similarity scores:');
        topSimilarities.forEach((doc, i) => {
          console.log(`${i + 1}. Score: ${doc.score.toFixed(4)}, Title: "${doc.title}"`);
        });

        const threshold = parseFloat(process.env.SIMILARITY_THRESHOLD || 0.3);
        relevantChunks = similarities
          .filter(doc => doc.score > threshold)
          .sort((a, b) => b.score - a.score)
          .slice(0, parseInt(process.env.TOP_K || 4));

        console.log(`Found ${relevantChunks.length} relevant chunks after filtering`);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    } finally {
      await client.close();
    }

    // 3. Create answer from relevant chunks (without LLM)
    let answer;
    
    if (relevantChunks.length > 0) {
      // Format the response nicely
      const topChunk = relevantChunks[0];
      
      answer = `Based on the blog content about "${topChunk.title}":\n\n${topChunk.chunk}`;
      
      // If there are more relevant chunks, add them
      if (relevantChunks.length > 1) {
        answer += "\n\nAdditional related information:\n";
        relevantChunks.slice(1, 3).forEach((chunk, index) => {
          answer += `\n${index + 2}. From "${chunk.title}":\n${chunk.chunk.substring(0, 200)}...`;
        });
      }
    } else {
      answer = `I couldn't find specific information about "${question}" in the blog content. The available topics include various medical and pharmaceutical subjects. Could you try asking about a more specific topic?`;
    }

    return NextResponse.json({ answer });
    
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate response',
      details: error.message 
    }, { status: 500 });
  }
}