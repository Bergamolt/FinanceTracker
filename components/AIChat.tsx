import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FinancialState, Debt, Expense, Asset, Goal, Currency } from '../types';
import { createFinancialChat, analyzeFinances } from '../services/geminiService';
import { MessageSquare, BrainCircuit, X } from './ui/Icons';
import { Chat, GenerateContentResponse, FunctionDeclaration, Type, Tool, Part } from '@google/genai';
import ReactMarkdown from 'react-markdown';

interface AIChatProps {
  data: FinancialState;
  onClose: () => void;
  onAddDebt: (debt: Debt) => void;
  onAddExpense: (expense: Expense) => void;
  onAddAsset: (asset: Asset) => void;
  onAddGoal: (goal: Goal) => void;
}

// --- Tool Definitions ---

const addExpenseTool: FunctionDeclaration = {
  name: 'addExpense',
  description: 'Add a new expense transaction. Use this when user wants to log spending.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Description of the expense' },
      amount: { type: Type.NUMBER, description: 'Amount of money spent' },
      currency: { type: Type.STRING, description: 'Currency code (USD, EUR, RUB, etc.)' },
      category: { type: Type.STRING, description: 'Category (Food, Rent, Transport, etc.)' },
      frequency: { type: Type.STRING, description: 'Frequency: Monthly, Weekly, or Yearly. Default to Monthly if unsure but recurring.' },
    },
    required: ['title', 'amount', 'currency', 'category']
  }
};

const addAssetTool: FunctionDeclaration = {
  name: 'addAsset',
  description: 'Add a new income source or asset balance adjustment.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Title of income (Salary, Bonus)' },
      amount: { type: Type.NUMBER, description: 'Amount received' },
      currency: { type: Type.STRING, description: 'Currency code' },
      type: { type: Type.STRING, description: 'Type: "Income" for regular earnings, "Balance" for one-time adjustments' },
    },
    required: ['title', 'amount', 'currency', 'type']
  }
};

const addDebtTool: FunctionDeclaration = {
  name: 'addDebt',
  description: 'Add a new debt or loan record.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Name of the debt (e.g. Mortgage, Credit Card)' },
      source: { type: Type.STRING, description: 'Lender or source (Bank name, Person name)' },
      totalAmount: { type: Type.NUMBER, description: 'Total amount borrowed' },
      currency: { type: Type.STRING, description: 'Currency code' },
    },
    required: ['title', 'totalAmount', 'currency']
  }
};

const addGoalTool: FunctionDeclaration = {
  name: 'addGoal',
  description: 'Create a new financial goal.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Goal name (e.g. Buy Car)' },
      targetAmount: { type: Type.NUMBER, description: 'Target amount to save' },
      currency: { type: Type.STRING, description: 'Currency code' },
    },
    required: ['title', 'targetAmount', 'currency']
  }
};

const tools: Tool[] = [
  { functionDeclarations: [addExpenseTool, addAssetTool, addDebtTool, addGoalTool] }
];

export const AIChat: React.FC<AIChatProps> = ({ 
  data, onClose,
  onAddDebt, onAddExpense, onAddAsset, onAddGoal
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis'>('chat');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session on mount
    chatSessionRef.current = createFinancialChat(data, tools);
    
    // Add initial greeting
    setMessages([
      {
        id: 'init',
        role: 'model',
        text: "Привет! Я твой финансовый советник FinanceAI. Я могу проанализировать твои финансы, а также помочь добавить новые записи. Просто напиши 'Я потратил 500 руб на такси' или пришли список покупок.",
        timestamp: Date.now()
      }
    ]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, analysisResult]);

  const handleSendMessage = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Send user message
      let response = await chatSessionRef.current.sendMessage({ message: input });
      
      // 2. Handle function calls loop
      while (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponses: Part[] = [];

        for (const call of response.functionCalls) {
          const args = call.args as any;
          console.log("AI executing tool:", call.name, args);
          
          // Execute React State Updates
          if (call.name === 'addExpense') {
            onAddExpense({
              id: Date.now().toString() + Math.random(),
              date: new Date().toISOString(),
              title: args.title,
              amount: args.amount,
              currency: (args.currency as Currency) || Currency.RUB,
              category: args.category,
              frequency: (args.frequency as any) || 'Monthly'
            });
          } else if (call.name === 'addAsset') {
            onAddAsset({
              id: Date.now().toString() + Math.random(),
              date: new Date().toISOString(),
              title: args.title,
              amount: args.amount,
              currency: (args.currency as Currency) || Currency.RUB,
              type: (args.type as any) || 'Income'
            });
          } else if (call.name === 'addDebt') {
             onAddDebt({
              id: Date.now().toString() + Math.random(),
              date: new Date().toISOString(),
              title: args.title,
              source: args.source || 'Unknown',
              totalAmount: args.totalAmount,
              remainingAmount: args.totalAmount, // Default to full amount
              currency: (args.currency as Currency) || Currency.RUB,
              isInstallment: false
            });
          } else if (call.name === 'addGoal') {
            onAddGoal({
              id: Date.now().toString() + Math.random(),
              date: new Date().toISOString(),
              title: args.title,
              targetAmount: args.targetAmount,
              currentAmount: 0,
              currency: (args.currency as Currency) || Currency.RUB
            });
          }

          // Structure the response as a Part with functionResponse
          functionResponses.push({
            functionResponse: {
              id: call.id,
              name: call.name,
              response: { result: "Success: Data added to database." }
            }
          });
        }

        // 3. Send the function execution results back to the model
        // Passing the parts inside a message object
        response = await chatSessionRef.current.sendMessage({ message: functionResponses });
      }

      // 4. Display the final text response from the model
      if (response.text) {
         setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: response.text,
            timestamp: Date.now()
          }]);
      }

    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Произошла ошибка при обработке запроса. Попробуйте еще раз. (См. консоль для деталей)",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const runAnalysis = async () => {
    setIsLoading(true);
    const result = await analyzeFinances(data);
    setAnalysisResult(result);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 w-[90vw] md:w-[450px] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-accent" />
          <h2 className="font-bold">Ассистент FinanceAI</h2>
        </div>
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          className={`flex-1 py-3 font-medium text-sm ${activeTab === 'chat' ? 'text-accent border-b-2 border-accent' : 'text-slate-500'}`}
          onClick={() => setActiveTab('chat')}
        >
          Чат-советник
        </button>
        <button 
          className={`flex-1 py-3 font-medium text-sm ${activeTab === 'analysis' ? 'text-accent border-b-2 border-accent' : 'text-slate-500'}`}
          onClick={() => { setActiveTab('analysis'); if(!analysisResult) runAnalysis(); }}
        >
          Полный анализ
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        {activeTab === 'chat' ? (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-accent text-white rounded-br-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                }`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                 <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                   <div className="flex space-x-1">
                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                     <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                   </div>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-slate-700">
             {isLoading ? (
               <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                 <BrainCircuit size={48} className="animate-pulse mb-4 text-accent/50" />
                 <p>Анализирую ваши финансовые данные...</p>
               </div>
             ) : (
               <ReactMarkdown>{analysisResult || ''}</ReactMarkdown>
             )}
          </div>
        )}
      </div>

      {/* Input Area (Only for Chat) */}
      {activeTab === 'chat' && (
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Спросите о долгах или дайте список трат..."
              className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-accent text-white p-2 rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <MessageSquare size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};