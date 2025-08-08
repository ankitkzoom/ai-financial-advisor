// This is a Netlify serverless function.
// It acts as a secure backend to call the Gemini API.

// Increase the timeout for this specific function.
// The default is 10 seconds, which might not be enough for a cold start + Gemini API call.
export const config = {
  timeout: 30,
};

exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Get the user's answers from the request body sent by the React app.
    const { answers } = JSON.parse(event.body);
    
    // Your secret API key is stored as an environment variable on your hosting provider, NOT in the code.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("API key is not configured on the server.");
    }

    // Construct the detailed prompt for the Gemini API.
    const prompt = `
        You are an expert financial advisor in India. Based on the following user profile, create a personalized, actionable financial plan.
        The user's details are:
        ${JSON.stringify(answers, null, 2)}

        Please provide advice on the following:
        1.  **Budgeting and Cash Flow:** Analyze income vs. expenses and suggest a budget.
        2.  **Emergency Fund:** Recommend an ideal emergency fund size and where to keep it.
        3.  **Debt Management:** Suggest strategies for managing any existing loans or credit card debt.
        4.  **Investment Strategy:** Based on their goals and risk appetite, recommend specific investment avenues (e.g., Mutual Funds - specify types like index, ELSS; Stocks; FDs; PPF).
        5.  **Goal-Based Planning:** Link the investment strategy to their short-term and long-term goals.
        6.  **Insurance:** Comment on the importance of health insurance based on their profile.

        Present the plan in a clear, encouraging, and easy-to-understand format. Use markdown for formatting.
    `;

    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }]
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    // Call the Gemini API from the secure serverless function.
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API Error:", errorBody);
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error("Unexpected API response format from Gemini.");
    }

    // Send the successful response back to the React app.
    return {
      statusCode: 200,
      body: JSON.stringify({ plan: text }),
    };

  } catch (error) {
    console.error("Error in serverless function:", error);
    // Send an error response back to the React app.
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
