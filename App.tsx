import React, { useState, useEffect } from 'react';
import { FinancialState, Debt, Expense, Asset, Goal, Currency } from './types';
import { Dashboard } from './components/Dashboard';
import { AIChat } from './components/AIChat';
import { ReportsView } from './components/ReportsView';
import { GoalsView } from './components/GoalsView';
import { SettingsView } from './components/SettingsView';
import { 
  Target, 
  PieChart, 
  BrainCircuit,
  FileText,
  Settings
} from './components/ui/Icons';

// Default data for reset
const INITIAL_DATA: FinancialState = {
  debts: [
    { id: '1', title: 'iPhone 15 Pro', source: 'ReStore', totalAmount: 1500, remainingAmount: 1000, currency: Currency.USD, isInstallment: true, totalInstallments: 12, paidInstallments: 4, monthlyPayment: 125, date: '2023-11-15T10:00:00Z' },
    { id: '2', title: 'Ипотека', source: 'СберБанк', totalAmount: 5000000, remainingAmount: 4200000, currency: Currency.RUB, isInstallment: false, date: '2020-05-20T10:00:00Z' },
  ],
  expenses: [
    { id: '1', title: 'Аренда квартиры', amount: 45000, currency: Currency.RUB, category: 'Жилье', frequency: 'Monthly', date: '2024-02-01T10:00:00Z' },
    { id: '2', title: 'Подписка Яндекс', amount: 299, currency: Currency.RUB, category: 'Развлечения', frequency: 'Monthly', date: '2024-02-05T10:00:00Z' },
    { id: '3', title: 'Спортзал', amount: 25000, currency: Currency.RUB, category: 'Здоровье', frequency: 'Yearly', date: '2024-01-10T10:00:00Z' },
  ],
  assets: [
    { id: '1', title: 'Основная работа', amount: 120000, currency: Currency.RUB, type: 'Income', date: '2024-02-10T10:00:00Z' },
    { id: '2', title: 'Накопительный счет', amount: 350000, currency: Currency.RUB, type: 'Balance', date: '2023-12-01T10:00:00Z' },
    { id: '3', title: 'Наличные (USD)', amount: 2000, currency: Currency.USD, type: 'Balance', date: '2024-02-15T10:00:00Z' },
  ],
  goals: [
    { id: '1', title: 'Подушка безопасности', targetAmount: 500000, currentAmount: 350000, currency: Currency.RUB, deadline: '2024-12-31', date: '2023-09-01T10:00:00Z' },
    { id: '2', title: 'Закрыть кредитку', targetAmount: 100000, currentAmount: 20000, currency: Currency.RUB, date: '2024-01-15T10:00:00Z' }
  ]
};

const App: React.FC = () => {
  // --- State Management ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'goals' | 'settings'>('dashboard');
  const [showAI, setShowAI] = useState(false);
  
  const [financialData, setFinancialData] = useState<FinancialState>(() => {
    try {
      const saved = localStorage.getItem('finance_data');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch (e) {
      console.error('Failed to parse local storage', e);
      return INITIAL_DATA;
    }
  });

  // Persist data on change
  useEffect(() => {
    localStorage.setItem('finance_data', JSON.stringify(financialData));
  }, [financialData]);

  // --- Handlers ---

  const addDebt = (debt: Debt) => {
    const newDebt = { ...debt, date: debt.date || new Date().toISOString() };
    setFinancialData(prev => ({ ...prev, debts: [newDebt, ...prev.debts] }));
  };
  const updateDebt = (debt: Debt) => {
    setFinancialData(prev => ({ ...prev, debts: prev.debts.map(d => d.id === debt.id ? debt : d) }));
  };
  const deleteDebt = (id: string) => {
    setFinancialData(prev => ({ ...prev, debts: prev.debts.filter(d => d.id !== id) }));
  };

  const addExpense = (expense: Expense) => {
    const newExpense = { ...expense, date: expense.date || new Date().toISOString() };
    setFinancialData(prev => ({ ...prev, expenses: [newExpense, ...prev.expenses] }));
  };
  const updateExpense = (expense: Expense) => {
    setFinancialData(prev => ({ ...prev, expenses: prev.expenses.map(e => e.id === expense.id ? expense : e) }));
  };
  const deleteExpense = (id: string) => {
    setFinancialData(prev => ({ ...prev, expenses: prev.expenses.filter(d => d.id !== id) }));
  };

  const addAsset = (asset: Asset) => {
    const newAsset = { ...asset, date: asset.date || new Date().toISOString() };
    setFinancialData(prev => ({ ...prev, assets: [newAsset, ...prev.assets] }));
  };
  const updateAsset = (asset: Asset) => {
    setFinancialData(prev => ({ ...prev, assets: prev.assets.map(a => a.id === asset.id ? asset : a) }));
  };
  const deleteAsset = (id: string) => {
    setFinancialData(prev => ({ ...prev, assets: prev.assets.filter(d => d.id !== id) }));
  };

  const addGoal = (goal: Goal) => {
    const newGoal = { ...goal, date: goal.date || new Date().toISOString() };
    setFinancialData(prev => ({ ...prev, goals: [newGoal, ...prev.goals] }));
  };
  const deleteGoal = (id: string) => {
    setFinancialData(prev => ({ ...prev, goals: prev.goals.filter(d => d.id !== id) }));
  };

  const clearAllData = () => {
    setFinancialData({
      debts: [],
      expenses: [],
      assets: [],
      goals: []
    });
    // Visual feedback: Redirect to dashboard to show empty state
    setActiveTab('dashboard');
  };

  const resetData = () => {
    setFinancialData(INITIAL_DATA);
    setActiveTab('dashboard');
  };

  const importData = (data: FinancialState) => {
    setFinancialData(data);
    setActiveTab('dashboard');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2"><PieChart className="text-accent" /> FinanceAI</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'dashboard' ? 'bg-slate-800 text-accent' : 'hover:bg-slate-800/50 text-slate-400'}`}>
            <PieChart size={20} /> Дашборд
          </button>
          <button onClick={() => setActiveTab('reports')} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'reports' ? 'bg-slate-800 text-accent' : 'hover:bg-slate-800/50 text-slate-400'}`}>
            <FileText size={20} /> Отчеты и Лог
          </button>
          <button onClick={() => setActiveTab('goals')} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'goals' ? 'bg-slate-800 text-accent' : 'hover:bg-slate-800/50 text-slate-400'}`}>
            <Target size={20} /> Цели
          </button>
          <div className="pt-4 mt-4 border-t border-slate-800">
             <button onClick={() => setActiveTab('settings')} className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'settings' ? 'bg-slate-800 text-accent' : 'hover:bg-slate-800/50 text-slate-400'}`}>
              <Settings size={20} /> Настройки
            </button>
          </div>
        </nav>
        <div className="p-4">
           <button onClick={() => setShowAI(true)} className="w-full bg-gradient-to-r from-blue-600 to-violet-600 p-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg hover:shadow-xl transition-all">
             <BrainCircuit size={20} /> AI Советник
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center md:hidden sticky top-0 z-10">
           <h1 className="font-bold text-slate-800">FinanceAI</h1>
           <button onClick={() => setShowAI(true)} className="text-accent"><BrainCircuit /></button>
        </header>
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl font-bold text-slate-800 capitalize">
              {activeTab === 'dashboard' && 'Дашборд'}
              {activeTab === 'reports' && 'Журнал операций'}
              {activeTab === 'goals' && 'Финансовые цели'}
              {activeTab === 'settings' && 'Настройки'}
            </h2>
            <p className="text-slate-500 text-sm">
              {activeTab === 'reports' ? 'Доходы, расходы и долги в одном месте' : 'Управление вашими финансами'}
            </p>
          </div>

          {activeTab === 'dashboard' && <Dashboard data={financialData} />}
          
          {activeTab === 'reports' && (
            <ReportsView 
              debts={financialData.debts}
              expenses={financialData.expenses}
              assets={financialData.assets}
              onAddDebt={addDebt}
              onUpdateDebt={updateDebt}
              onDeleteDebt={deleteDebt}
              onAddExpense={addExpense}
              onUpdateExpense={updateExpense}
              onDeleteExpense={deleteExpense}
              onAddAsset={addAsset}
              onUpdateAsset={updateAsset}
              onDeleteAsset={deleteAsset}
            />
          )}

          {activeTab === 'goals' && <GoalsView goals={financialData.goals} onAdd={addGoal} onDelete={deleteGoal} />}
          
          {activeTab === 'settings' && <SettingsView onClearData={clearAllData} onResetData={resetData} onImportData={importData} />}
        </div>
      </main>

      {/* AI Chat Modal/Overlay */}
      {showAI && (
        <AIChat 
          data={financialData} 
          onClose={() => setShowAI(false)} 
          onAddDebt={addDebt}
          onAddExpense={addExpense}
          onAddAsset={addAsset}
          onAddGoal={addGoal}
        />
      )}
      
      {/* Mobile Nav Bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-40 safe-area-pb">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-accent' : 'text-slate-400'}`}>
          <PieChart size={20} />
          <span className="text-[10px]">Дашборд</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1 ${activeTab === 'reports' ? 'text-accent' : 'text-slate-400'}`}>
          <FileText size={20} />
          <span className="text-[10px]">Отчеты</span>
        </button>
        <button onClick={() => setActiveTab('goals')} className={`flex flex-col items-center gap-1 ${activeTab === 'goals' ? 'text-accent' : 'text-slate-400'}`}>
          <Target size={20} />
          <span className="text-[10px]">Цели</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 ${activeTab === 'settings' ? 'text-accent' : 'text-slate-400'}`}>
          <Settings size={20} />
          <span className="text-[10px]">Меню</span>
        </button>
      </div>
    </div>
  );
};

export default App;