/**
 * Enhance response formatting with modern Gemini-style features:
 * - Auto-bold key technical terms
 * - Insert section dividers between major sections
 */
function enhanceResponseFormatting(htmlContent) {
    // List of key technical terms to auto-bold
    const keyTerms = [
        // Quantum Computing
        'Superposition', 'Entanglement', 'Qubits', 'Qubit', 'Decoherence', 'Quantum Gate',
        'Quantum Algorithm', 'Quantum Circuit', 'Quantum State', 'Wave Function',
        // AI & Machine Learning
        'Neural Network', 'Deep Learning', 'Machine Learning', 'Artificial Intelligence',
        'Transformer', 'GPT', 'LLM', 'Training', 'Inference', 'Backpropagation',
        // Web & APIs
        'API', 'REST', 'GraphQL', 'HTTP', 'HTTPS', 'WebSocket', 'JSON', 'XML',
        'OAuth', 'JWT', 'CORS', 'Endpoint', 'Middleware',
        // Programming Concepts
        'Function', 'Class', 'Module', 'Component', 'Interface', 'Abstract',
        'Async', 'Await', 'Promise', 'Callback', 'Closure', 'Constructor',
        // Database
        'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'Redis', 'Database', 'Query',
        'Index', 'Schema', 'Transaction', 'ACID',
        // Other Tech
        'Docker', 'Kubernetes', 'Microservice', 'Serverless', 'Cloud',
        'Frontend', 'Backend', 'Fullstack', 'DevOps', 'CI/CD'
    ];

    // Create a regex pattern that matches whole words only (case-insensitive)
    const pattern = new RegExp(`\\b(${keyTerms.join('|')})\\b`, 'gi');

    // Track positions of code blocks and existing tags to avoid modifying them
    const protectedRanges = [];

    // Find all code blocks and pre tags
    const codeBlockRegex = /<code[\s\S]*?<\/code>|<pre[\s\S]*?<\/pre>|<strong[\s\S]*?<\/strong>/g;
    let match;
    while ((match = codeBlockRegex.exec(htmlContent)) !== null) {
        protectedRanges.push({ start: match.index, end: match.index + match[0].length });
    }

    // Function to check if position is in protected range
    const isProtected = (pos) => {
        return protectedRanges.some(range => pos >= range.start && pos < range.end);
    };

    // Replace key terms with bold tags, but only outside of protected ranges
    let result = '';
    let lastIndex = 0;

    const termMatches = [...htmlContent.matchAll(pattern)];
    termMatches.forEach(termMatch => {
        const matchStart = termMatch.index;
        const matchEnd = matchStart + termMatch[0].length;

        // Check if this match is not in a protected range
        if (!isProtected(matchStart)) {
            // Add text before match
            result += htmlContent.substring(lastIndex, matchStart);
            // Add bolded term
            result += `<strong>${termMatch[0]}</strong>`;
            lastIndex = matchEnd;
        }
    });

    // Add remaining text
    result += htmlContent.substring(lastIndex);

    // If no terms were replaced, use original content
    if (result === '') {
        result = htmlContent;
    }

    // Insert section dividers after h2 headings
    result = result.replace(/(<\/h2>)/g, '$1<hr>');

    return result;
}
