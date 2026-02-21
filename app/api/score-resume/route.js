import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) analyst and resume coach. 
Analyze the provided resume text against a job description and return a JSON response only — no markdown, no prose.

Return this exact JSON shape:
{
  "score": <integer 0-100>,
  "summary": "<2-sentence overall assessment>",
  "matchedKeywords": ["<keyword>", ...],
  "missingKeywords": ["<keyword>", ...],
  "suggestions": ["<actionable suggestion>", ...],
  "sectionScores": {
    "skills": <0-100>,
    "experience": <0-100>,
    "education": <0-100>,
    "formatting": <0-100>
  }
}

Scoring guide:
- score: weighted average across keyword match (40%), experience relevance (30%), skills alignment (20%), format (10%)
- matchedKeywords: important skills/tools/terms from the JD found in the resume (max 20)
- missingKeywords: important skills/tools/terms from the JD NOT found in the resume (max 15)
- suggestions: 3-6 concrete, specific, actionable improvements the candidate can make
- sectionScores: individual section quality as a % (not keyword match — quality of the section content)

Be strict but fair. Return ONLY valid JSON.`;

export async function POST(req) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return Response.json(
        { error: "resumeText and jobDescription are required." },
        { status: 400 }
      );
    }

    if (resumeText.length < 50) {
      return Response.json(
        { error: "Resume text is too short — PDF extraction may have failed." },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `RESUME:\n${resumeText.slice(0, 8000)}\n\nJOB DESCRIPTION:\n${jobDescription.slice(0, 4000)}`,
        },
      ],
    });

    const raw = message.content[0]?.text ?? "";

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```(?:json)?/g, "").trim();
    const result = JSON.parse(cleaned);

    return Response.json(result);
  } catch (err) {
    console.error("Resume scorer error:", err);
    if (err instanceof SyntaxError) {
      return Response.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }
    return Response.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}