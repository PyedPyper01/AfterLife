// Netlify serverless function for AI chat
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { message, postcode } = JSON.parse(event.body)
    
    const systemPrompt = `You are a compassionate AI assistant for the AfterLife bereavement support platform. Your role is to provide accurate, empathetic guidance on the UK bereavement process.

IMPORTANT GUIDELINES:
- Be compassionate but factual - do not simulate emotions or act as a therapist
- Provide administrative and procedural guidance only
- Do NOT give legal, financial, or clinical advice
- Keep responses concise and actionable
- Use plain English - explain legal jargon when necessary
- Always include relevant links to authoritative UK resources (GOV.UK, Citizens Advice, Cruse, etc.)

SUPPLIER RECOMMENDATIONS:
When users ask about finding suppliers (funeral directors, florists, stonemasons, etc.), provide helpful recommendations and suggest they visit the Marketplace for local verified suppliers.

CONTEXT:
- User's postcode: ${postcode || 'Not provided'}
- Jurisdiction: England & Wales (default)

JURISDICTION-SPECIFIC NOTES:
- England/Wales: 5-day registration deadline, "Probate", Tell Us Once available
- Scotland: 8-day registration deadline, "Confirmation" (not Probate), Tell Us Once available
- Northern Ireland: 5-day registration deadline, "Probate", Tell Us Once NOT available

Provide helpful, accurate guidance based on this context.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices[0]?.message?.content || 'I apologize, but I encountered an issue. Please try again.'

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: assistantMessage })
    }
  } catch (error) {
    console.error('Chat function error:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        response: "I'm having trouble connecting right now. Please try again in a moment, or contact our support team if the issue persists."
      })
    }
  }
}
