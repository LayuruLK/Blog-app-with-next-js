// app/api/chat/route.js
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getEmbedding, cosineSimilarity } from '@/lib/utils.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // 3. Use GPT-4o-mini to generate a contextual answer
    let systemPrompt = `You are a helpful assistant. 
Use the following blog excerpts to answer the question. 
If you are unsure or the answer is not contained in the context, say so clearly.

Context:
${relevantChunks.map(c => `From "${c.title}": ${c.chunk}`).join("\n\n")}`;

    let finalAnswer;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      finalAnswer = completion.choices[0].message.content.trim();
    } catch (llmError) {
      console.error("OpenAI API error:", llmError);
      finalAnswer = `I couldn't generate a GPT-4o-mini response due to an API error.`;
    }

    return NextResponse.json({ answer: finalAnswer });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate response',
      details: error.message 
    }, { status: 500 });
  }
}
