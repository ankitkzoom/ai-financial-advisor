import React, { useState, useEffect, useRef } from 'react';

// --- Helper Components ---

// Icon for the chatbot avatar
const BotAvatar = () => (
    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
        F
    </div>
);

// Icon for the user avatar
const UserAvatar = () => (
    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-xl shadow-md flex-shrink-0">
        U
    </div>
);

// A single chat bubble
const ChatBubble = ({ message, sender }) => (
    <div className={`flex items-start gap-3 my-4 ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
        {sender === 'bot' && <BotAvatar />}
        <div
            className={`px-4 py-3 rounded-2xl max-w-md md:max-w-lg shadow-md break-words ${
                sender === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none'
            }`}
        >
            {message}
        </div>
        {sender === 'user' && <UserAvatar />}
    </div>
);

// Loading spinner component
const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-gray-600">Generating your personalized plan...</p>
    </div>
);

// --- Main Application ---

export default function App() {
    // --- State Management ---
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [chatHistory, setChatHistory] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isFinished, setIsFinished] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [financialPlan, setFinancialPlan] = useState('');
    const [apiError, setApiError] = useState('');
    const chatEndRef = useRef(null);

    // --- Questions Data ---
    const questions = [
        // Section 1: Basic Profile
        { id: 'name', text: "To get started, what's your full name?", category: 'Basic Profile', type: 'text' },
        { id: 'age', text: "Great! What's your age?", category: 'Basic Profile', type: 'number' },
        { id: 'location', text: "Which city and state do you live in? This helps with location-specific advice.", category: 'Basic Profile', type: 'text' },

        // Section 2: Employment & Income
        { id: 'occupation', text: "What is your current occupation? (e.g., Salaried, Self-employed, Student)", category: 'Employment & Income', type: 'text' },
        { id: 'monthlyIncome', text: "What is your approximate monthly take-home income (in INR)?", category: 'Employment & Income', type: 'number' },
        { id: 'incomeType', text: "Is your income generally fixed or does it vary each month?", category: 'Employment & Income', options: ['Fixed', 'Variable'] },

        // Section 3: Expenses & Lifestyle
        { id: 'monthlyExpenses', text: "On average, how much do you spend on essentials like rent, groceries, and utilities each month?", category: 'Expenses & Lifestyle', type: 'number' },
        { id: 'dependents', text: "Do you have any dependents you support financially? (e.g., Spouse, Children, Parents)", category: 'Expenses & Lifestyle', type: 'text' },
        { id: 'healthInsurance', text: "Do you currently have health insurance?", category: 'Expenses & Lifestyle', options: ['Yes', 'No'] },

        // Section 4: Liabilities & Debt
        { id: 'loans', text: "Do you have any ongoing loans like a home, car, or personal loan?", category: 'Liabilities & Debt', options: ['Yes', 'No'] },
        { id: 'creditCardDebt', text: "Do you typically carry an outstanding balance on your credit cards?", category: 'Liabilities & Debt', options: ['Yes', 'No'] },

        // Section 5: Current Financial Assets
        { id: 'savings', text: "Roughly how much do you have in savings accounts?", category: 'Financial Assets', type: 'number' },
        { id: 'investments', text: "Do you invest in Mutual Funds, Stocks, or FDs?", category: 'Financial Assets', options: ['Yes', 'No'] },

        // Section 6: Financial Goals
        { id: 'shortTermGoals', text: "What's a short-term financial goal you have? (e.g., Vacation, new gadget, emergency fund)", category: 'Financial Goals', type: 'text' },
        { id: 'longTermGoals', text: "And what about a long-term goal? (e.g., Retirement, buying a house)", category: 'Financial Goals', type: 'text' },
        { id: 'monthlyInvestment', text: "How much are you comfortable investing each month towards these goals?", category: 'Financial Goals', type: 'number' },

        // Section 7: Risk Appetite
        { id: 'riskAppetite', text: "How comfortable are you with investment risk?", category: 'Risk Appetite', options: ['Low', 'Medium', 'High'] },
        { id: 'investmentPreference', text: "Do you prefer guaranteed returns (safer) or higher potential returns (with risk)?", category: 'Risk Appetite', options: ['Guaranteed Returns', 'Higher Potential Returns'] },
    ];

    // --- Effects ---

    useEffect(() => {
        if (chatHistory.length === 0) {
            setChatHistory([{ sender: 'bot', message: "Hi there! I'm your personal finance assistant. I'll ask a few questions to understand your financial situation. Let's start with the basics." }]);
            setTimeout(() => {
                 setChatHistory(prev => [...prev, { sender: 'bot', message: questions[0].text }]);
            }, 1000);
        }
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isGenerating, financialPlan]);

    // --- Functions ---

    const handleSend = () => {
        const currentQuestion = questions[currentQuestionIndex];
        if (!inputValue.trim() && currentQuestion.type !== 'options') return;

        const userAnswer = inputValue;
        
        setChatHistory(prev => [...prev, { sender: 'user', message: userAnswer }]);
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: userAnswer }));
        setInputValue('');

        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            setCurrentQuestionIndex(nextIndex);
            setTimeout(() => {
                 setChatHistory(prev => [...prev, { sender: 'bot', message: questions[nextIndex].text }]);
            }, 1000);
        } else {
            finishConversation();
        }
    };
    
    const handleOptionClick = (option) => {
        const currentQuestion = questions[currentQuestionIndex];
        
        setChatHistory(prev => [...prev, { sender: 'user', message: option }]);
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));

        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < questions.length) {
            setCurrentQuestionIndex(nextIndex);
            setTimeout(() => {
                setChatHistory(prev => [...prev, { sender: 'bot', message: questions[nextIndex].text }]);
            }, 1000);
        } else {
            finishConversation();
        }
    };

    const finishConversation = () => {
        setTimeout(() => {
            setChatHistory(prev => [...prev, { sender: 'bot', message: "That's all the information I need for now. Thank you! Here is a summary of your profile. Click the button below to get your personalized financial plan." }]);
            setIsFinished(true);
        }, 1000);
    };
    
    // --- Secure API Integration ---
    const getFinancialPlan = async () => {
        setIsGenerating(true);
        setFinancialPlan('');
        setApiError('');

        // The API endpoint is now our own serverless function.
        // For Netlify, the path is /.netlify/functions/YOUR_FUNCTION_NAME
        const apiUrl = `/.netlify/functions/getPlan`;

        try {
            // We send our collected answers to our secure function.
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || `API Error: ${response.status}`);
            }

            const result = await response.json();
            setFinancialPlan(result.plan);

        } catch (error) {
            console.error("Error fetching financial plan:", error);
            setApiError(`Failed to generate plan. ${error.message}. Please try again later.`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRestart = () => {
        setCurrentQuestionIndex(0);
        setAnswers({});
        setChatHistory([]);
        setInputValue('');
        setIsFinished(false);
        setFinancialPlan('');
        setApiError('');
        setIsGenerating(false);
        
        setTimeout(() => {
             setChatHistory([{ sender: 'bot', message: "Hi there! I'm your personal finance assistant. I'll ask a few questions to understand your financial situation. Let's start with the basics." }]);
             setTimeout(() => {
                setChatHistory(prev => [...prev, { sender: 'bot', message: questions[0].text }]);
             }, 1000);
        }, 100);
    };

    const currentQuestion = questions[currentQuestionIndex];
    const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

    // --- Render ---
    return (
        <div className="font-sans bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col h-[90vh]">
                
                <div className="p-4 border-b border-gray-200 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Financial Health Check</h1>
                    <p className="text-sm text-gray-500">Your Personal AI Advisor</p>
                </div>

                {!isFinished && (
                     <div className="w-full bg-gray-200">
                        <div className="bg-indigo-600 h-2.5" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
                        <p className="text-xs text-center text-gray-500 mt-1">{currentQuestion?.category} ({currentQuestionIndex + 1} / {questions.length})</p>
                    </div>
                )}
               
                <div className="flex-1 p-6 overflow-y-auto">
                    {chatHistory.map((chat, index) => (
                        <ChatBubble key={index} message={chat.message} sender={chat.sender} />
                    ))}
                    
                    {isFinished && !financialPlan && !isGenerating && (
                        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <h2 className="text-xl font-bold mb-4 text-center">Your Financial Summary</h2>
                            <div className="space-y-2 text-sm text-gray-700 max-h-60 overflow-y-auto p-2">
                                {questions.map(q => (
                                    <div key={q.id} className="flex justify-between p-2 bg-white rounded-lg shadow-sm">
                                        <span className="font-semibold">{q.text.split('?')[0]}</span>
                                        <span className="text-blue-600 font-medium">{answers[q.id] || 'N/A'}</span>
                                    </div>
                                ))}
                            </div>
                             <button
                                onClick={getFinancialPlan}
                                disabled={isGenerating}
                                className="w-full mt-6 bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-colors duration-300 font-semibold text-lg shadow-lg disabled:bg-gray-400"
                            >
                                {isGenerating ? 'Generating...' : 'Get My Financial Plan'}
                            </button>
                        </div>
                    )}

                    {isGenerating && <LoadingSpinner />}
                    
                    {apiError && <div className="p-4 my-4 bg-red-100 text-red-700 rounded-lg">{apiError}</div>}

                    {financialPlan && (
                        <div className="mt-4 p-5 bg-indigo-50 rounded-lg border border-indigo-200">
                             <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">Your Personalized Financial Plan</h2>
                             <div className="prose prose-indigo max-w-none" style={{whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{ __html: financialPlan.replace(/\n/g, '<br />') }}></div>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {isFinished ? (
                     <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl text-center">
                         <button
                            onClick={handleRestart}
                            className="w-1/2 bg-indigo-500 text-white py-3 rounded-xl hover:bg-indigo-600 transition-colors duration-300 font-semibold text-lg shadow-lg"
                        >
                            Start Over
                        </button>
                    </div>
                ) : (
                    <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                        {currentQuestion?.options ? (
                            <div className="flex flex-wrap gap-2 justify-center">
                                {currentQuestion.options.map(option => (
                                    <button
                                        key={option}
                                        onClick={() => handleOptionClick(option)}
                                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <input
                                    type={currentQuestion?.type || 'text'}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type your answer here..."
                                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSend}
                                    className="bg-indigo-500 text-white p-3 rounded-xl hover:bg-indigo-600 transition-colors duration-300 shadow-md"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}