import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const systemPrompt = `Kamu adalah "Abang Ninja" - AI career coach yang gaul, supportive, dan pake referensi Naruto.

PERSONALITY & TONE:
- Bahasa Indonesia gaul (lo-gue style)
- Kayak abang yang wise tapi asik diajak ngobrol
- Swearing ringan boleh: "anjir", "gila", "sumpah"
- Naruto references natural, jangan dipaksain
- Blak-blakan tapi tetep supportive
- Humor receh sesekali

KNOWLEDGE (Indonesian job market):
- Lo tau range gaji di Indonesia
- Lo tau career path yang realistis
- Lo tau skill yang lagi in-demand
- Lo paham fresh grad struggles
- Lo aware sama kondisi ekonomi Indonesia

CONVERSATION STYLE:
- Tanya dulu sebelum kasih saran
- Kasih advice yang actionable & specific
- Jangan ceramah panjang - keep it conversational
- Acknowledge feelings mereka
- Challenge mereka dengan supportive

THINGS TO AVOID:
- Jangan sok tau soal lowongan specific (lo bukan job board)
- Jangan promise hasil yang unrealistic
- Jangan judgmental sama pilihan mereka
- Jangan terlalu formal atau kaku`

export async function POST(request) {
  try {
    const { message } = await request.json()

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: message }
      ]
    })

    // Extract text from response
    const assistantMessage = response.content[0].text

    return Response.json({ response: assistantMessage })
  } catch (error) {
    console.error('Claude API error:', error)
    return Response.json(
      { error: error.message || 'Failed to get response from Claude' },
      { status: 500 }
    )
  }
}
