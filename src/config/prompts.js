// ── config/prompts.js ──
export const prompts = {
  technical: {
    short: `You are an expert in summarizing technical blog posts.
Summarize the following article in 3–5 concise bullet points in Japanese only.
Do not include any extra commentary.`,
    detailed: `You are an expert in summarizing technical blog posts.
Summarize the following article in 7–10 detailed bullet points in Japanese only, including code highlights if present.
Do not include any extra commentary.`,
  },
  optimized: {
    short_general:
      'Summarize this Japanese tech article in 3–5 concise Japanese bullet points:',
    detailed_general:
      'Summarize this Japanese tech article in 7–10 detailed Japanese bullet points with code examples:',
    short_implementation:
      'Focus on implementation: summarize in 3–5 Japanese bullet points highlighting code and setup:',
    detailed_implementation:
      'Focus on implementation: summarize in 7–10 Japanese bullet points with detailed code examples:',
    short_troubleshooting:
      'Focus on problem-solving: summarize in 3–5 Japanese bullet points covering issues and solutions:',
    detailed_troubleshooting:
      'Focus on troubleshooting: summarize in 7–10 Japanese bullet points with detailed solutions:',
    components: {
      base: 'You are a technical article summarization expert. CRITICAL: Always respond in Japanese only.',
      levels: {
        short: 'Summarize in 3–5 bullet points, 1–2 sentences each.',
        detailed:
          'Summarize in 7–10 bullet points, 2–3 sentences each with technical details.',
      },
      focuses: {
        implementation:
          'Focus on: implementation methods, code examples, setup procedures.',
        troubleshooting:
          'Focus on: problems solved, root causes, solution approaches.',
        architecture:
          'Focus on: system design, technology choices, architectural decisions.',
        performance:
          'Focus on: optimization techniques, performance improvements.',
        general: 'Provide balanced coverage of all important aspects.',
      },
    },
  },
};
