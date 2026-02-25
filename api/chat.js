/**
 * Vercel Serverless Function — Chat Proxy
 * Purpose: Hide the Groq API key on the backend to prevent exposure to users.
 */

export default async function handler(req, res) {
    // 1. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, model, max_tokens, temperature } = req.body;

    // 2. Validate environment variable
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'Groq API Key not configured on server' });
    }

    try {
        // 3. Forward the request to Groq
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: model || 'llama-3.3-70b-versatile',
                messages,
                max_tokens: max_tokens || 512,
                temperature: temperature || 0.7,
                stream: false,
            }),
        });

        const data = await groqResponse.json();

        if (!groqResponse.ok) {
            return res.status(groqResponse.status).json(data);
        }

        // 4. Return the result to the browser
        return res.status(200).json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).json({ error: 'Internal server error while calling Groq' });
    }
}
