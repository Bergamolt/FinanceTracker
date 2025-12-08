import React, { useState, useEffect, useRef } from 'react';
import { FinancialState, Debt, Expense, Asset, Goal, Currency, AppNotification } from './types';
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
  Settings,
  Bell,
  X,
  CheckCircle,
  ChevronRight
} from './components/ui/Icons';

// Default data for reset
const INITIAL_DATA: FinancialState = {
  debts: [
    { id: '1', title: 'iPhone 15 Pro', source: 'ReStore', totalAmount: 1500, remainingAmount: 1000, currency: Currency.USD, isInstallment: true, totalInstallments: 12, paidInstallments: 4, monthlyPayment: 125, date: '2023-11-15T10:00:00Z' },
    // Mortgage updated to be an installment so monthly projection calculates correctly
    { id: '2', title: 'Ипотека', source: 'СберБанк', totalAmount: 5000000, remainingAmount: 4200000, currency: Currency.RUB, isInstallment: true, totalInstallments: 240, paidInstallments: 38, monthlyPayment: 28500, date: '2020-05-20T10:00:00Z' },
  ],
  expenses: [
    { id: '1', title: 'Аренда квартиры', amount: 45000, currency: Currency.RUB, category: 'Жилье', frequency: 'Monthly', date: '2024-02-01T10:00:00Z', dayOfMonth: 1, isPaid: true },
    { id: '2', title: 'Подписка Яндекс', amount: 299, currency: Currency.RUB, category: 'Развлечения', frequency: 'Monthly', date: '2024-02-05T10:00:00Z', dayOfMonth: 5, isPaid: true },
    { id: '3', title: 'Спортзал', amount: 25000, currency: Currency.RUB, category: 'Здоровье', frequency: 'Yearly', date: '2024-01-10T10:00:00Z', isPaid: true },
    { id: '4', title: 'Подарок на ДР', amount: 5000, currency: Currency.RUB, category: 'Подарки', frequency: 'Monthly', date: new Date().toISOString(), isPaid: false },
  ],
  assets: [
    { id: '1', title: 'Основная работа', amount: 120000, currency: Currency.RUB, type: 'Income', isReceived: true, date: '2024-02-10T10:00:00Z' },
    { id: '2', title: 'Накопительный счет', amount: 350000, currency: Currency.RUB, type: 'Balance', isReceived: true, date: '2023-12-01T10:00:00Z' },
    { id: '3', title: 'Будущая премия', amount: 50000, currency: Currency.RUB, type: 'Income', isReceived: false, autoCredit: true, date: '2024-12-25T10:00:00Z' },
  ],
  goals: [
    { id: '1', title: 'Подушка безопасности', targetAmount: 500000, currentAmount: 350000, currency: Currency.RUB, deadline: '2024-12-31', date: '2023-09-01T10:00:00Z' },
    { id: '2', title: 'Закрыть кредитку', targetAmount: 100000, currentAmount: 20000, currency: Currency.RUB, date: '2024-01-15T10:00:00Z' }
  ],
  notifications: []
};

const DEFAULT_RATES: Record<string, number> = {
  [Currency.USD]: 1,
  [Currency.EUR]: 0.92,
  [Currency.RUB]: 92.5,
  [Currency.UAH]: 41.5,
  [Currency.GBP]: 0.79
};

const App: React.FC = () => {
  // --- State Management ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'goals' | 'settings'>('dashboard');
  const [showAI, setShowAI] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [financialData, setFinancialData] = useState<FinancialState>(() => {
    try {
      const saved = localStorage.getItem('finance_data');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch (e) {
      console.error('Failed to parse local storage', e);
      return INITIAL_DATA;
    }
  });

  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('finance_rates');
      return saved ? JSON.parse(saved) : DEFAULT_RATES;
    } catch {
      return DEFAULT_RATES;
    }
  });

  const notificationPanelRef = useRef<HTMLDivElement>(null);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Persist data on change
  useEffect(() => {
    localStorage.setItem('finance_data', JSON.stringify(financialData));
  }, [financialData]);

  // Persist rates on change
  useEffect(() => {
    localStorage.setItem('finance_rates', JSON.stringify(exchangeRates));
  }, [exchangeRates]);

  // Logic: Auto-Credit & Payment Notifications
  useEffect(() => {
    const checkUpdates = () => {
      const now = new Date();
      let newData = { ...financialData };
      let hasChanges = false;

      // 1. Auto-credit Logic
      const updatedAssets = newData.assets.map(asset => {
        if (!asset.isReceived && asset.autoCredit) {
           const targetDate = new Date(asset.date);
           if (targetDate <= now) {
             hasChanges = true;
             return { ...asset, isReceived: true };
           }
        }
        return asset;
      });

      if (hasChanges) {
        newData.assets = updatedAssets;
      }

      // 2. Notification Logic
      // Check Expenses
      const newNotifications: AppNotification[] = [];
      const existingIds = new Set(newData.notifications?.map(n => n.id) || []);

      newData.expenses.forEach(exp => {
        // Notify for recurring expenses due soon
        if (exp.frequency === 'Monthly' && exp.dayOfMonth) {
           const currentMonthDate = new Date();
           currentMonthDate.setDate(exp.dayOfMonth);
           
           if (currentMonthDate < new Date(now.getTime() - 86400000)) {
              currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
           }

           const diffTime = currentMonthDate.getTime() - now.getTime();
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

           if (diffDays >= 0 && diffDays <= 3) {
             const notifId = `notif_exp_${exp.id}_${currentMonthDate.getMonth()}`;
             if (!existingIds.has(notifId)) {
               const msg = `Скоро оплата: ${exp.title} (${exp.amount} ${exp.currency})`;
               newNotifications.push({
                 id: notifId,
                 title: 'Напоминание об оплате',
                 message: msg,
                 date: new Date().toISOString(),
                 isRead: false,
                 type: 'expense'
               });
               if ('Notification' in window && Notification.permission === 'granted') {
                 new Notification('FinanceAI: Скоро оплата', { body: msg, icon: '/vite.svg' });
               }
             }
           }
        }
        // Also notify for planned ONE-TIME expenses that are not paid
        if (!exp.isPaid && !exp.dayOfMonth) {
           const targetDate = new Date(exp.date);
           const diffTime = targetDate.getTime() - now.getTime();
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
           
           if (diffDays >= 0 && diffDays <= 3) {
              const notifId = `notif_exp_plan_${exp.id}`;
              if (!existingIds.has(notifId)) {
                 const msg = `Запланированный расход: ${exp.title}`;
                 newNotifications.push({
                   id: notifId,
                   title: 'Плановый расход',
                   message: msg,
                   date: new Date().toISOString(),
                   isRead: false,
                   type: 'expense'
                 });
              }
           }
        }
      });

      // Check Debts (Installments)
      newData.debts.forEach(debt => {
        if (debt.isInstallment && debt.remainingAmount > 0) {
           const startDate = new Date(debt.date);
           const dueDay = startDate.getDate();
           
           const currentMonthDate = new Date();
           currentMonthDate.setDate(dueDay);

           if (currentMonthDate < new Date(now.getTime() - 86400000)) {
              currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
           }

           const diffTime = currentMonthDate.getTime() - now.getTime();
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

           if (diffDays >= 0 && diffDays <= 3) {
              const notifId = `notif_debt_${debt.id}_${currentMonthDate.getMonth()}`;
              if (!existingIds.has(notifId)) {
                const msg = `Платеж по кредиту: ${debt.title}`;
                newNotifications.push({
                  id: notifId,
                  title: 'Напоминание о долге',
                  message: msg,
                  date: new Date().toISOString(),
                  isRead: false,
                  type: 'debt'
                });
                if ('Notification' in window && Notification.permission === 'granted') {
                 new Notification('FinanceAI: Платеж по долгу', { body: msg, icon: '/vite.svg' });
               }
              }
           }
        }
      });

      if (newNotifications.length > 0) {
        hasChanges = true;
        newData.notifications = [...(newData.notifications || []), ...newNotifications];
      }

      if (hasChanges) {
        setFinancialData(newData);
      }
    };

    const timer = setTimeout(checkUpdates, 1000); 
    return () => clearTimeout(timer);
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
      goals: [],
      notifications: []
    });
    setActiveTab('dashboard');
  };

  const resetData = () => {
    setFinancialData(INITIAL_DATA);
    setExchangeRates(DEFAULT_RATES);
    setActiveTab('dashboard');
  };

  const importData = (data: FinancialState) => {
    setFinancialData(data);
    setActiveTab('dashboard');
  };

  const markNotificationRead = (id: string) => {
    setFinancialData(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  };

  const unreadCount = financialData.notifications?.length || 0;

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
          
           {/* Notification Button in Sidebar */}
           <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }}
              className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors hover:bg-slate-800/50 text-slate-400`}
            >
              <Bell size={20} /> Уведомления
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{unreadCount}</span>
              )}
            </button>
            
            {/* Desktop Notification Dropdown */}
            {showNotifications && (
              <div ref={notificationPanelRef} className="absolute left-full top-0 ml-2 w-80 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in slide-in-from-left-2">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold">Напоминания</h3>
                  <button onClick={() => setShowNotifications(false)}><X size={16} /></button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                   {unreadCount === 0 ? (
                     <div className="p-8 text-center text-slate-400">
                       <p>Нет новых уведомлений</p>
                     </div>
                   ) : (
                     financialData.notifications.map(notif => (
                       <div key={notif.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 relative group">
                          <div className="flex items-start gap-3">
                             <div className={`p-2 rounded-full shrink-0 ${notif.type === 'expense' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                               {notif.type === 'expense' ? <FileText size={16} /> : <Target size={16} />}
                             </div>
                             <div>
                               <h4 className="text-sm font-bold">{notif.title}</h4>
                               <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                               <p className="text-[10px] text-slate-400 mt-2">{new Date(notif.date).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => markNotificationRead(notif.id)}
                            className="absolute right-2 top-2 text-slate-300 hover:text-emerald-600 p-2"
                            title="Пометить как прочитанное"
                          >
                            <CheckCircle size={16} />
                          </button>
                       </div>
                     ))
                   )}
                </div>
              </div>
            )}
           </div>

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
      <main className="flex-1 overflow-auto pb-20 md:pb-0 relative">
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center md:hidden sticky top-0 z-10">
           <h1 className="font-bold text-slate-800">FinanceAI</h1>
           <div className="flex items-center gap-4">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-slate-600">
                <Bell size={24} />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border-2 border-white"></span>}
              </button>
              <button onClick={() => setShowAI(true)} className="text-accent"><BrainCircuit /></button>
           </div>
        </header>

        {/* Mobile Notification Dropdown */}
        {showNotifications && (
              <div className="absolute top-16 right-4 left-4 md:hidden bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800">Напоминания ({unreadCount})</h3>
                  <button onClick={() => setShowNotifications(false)}><X size={20} /></button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                   {unreadCount === 0 ? (
                     <div className="p-8 text-center text-slate-400">
                       <p>Нет новых уведомлений</p>
                     </div>
                   ) : (
                     financialData.notifications.map(notif => (
                       <div key={notif.id} className="p-4 border-b border-slate-100 bg-white">
                          <div className="flex items-start gap-3">
                             <div className={`p-2 rounded-full shrink-0 ${notif.type === 'expense' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                               {notif.type === 'expense' ? <FileText size={16} /> : <Target size={16} />}
                             </div>
                             <div className="flex-1">
                               <h4 className="text-sm font-bold text-slate-800">{notif.title}</h4>
                               <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                               <div className="flex justify-between items-center mt-3">
                                 <span className="text-[10px] text-slate-400">{new Date(notif.date).toLocaleDateString()}</span>
                                 <button 
                                    onClick={() => markNotificationRead(notif.id)}
                                    className="text-emerald-600 text-xs font-bold flex items-center gap-1"
                                  >
                                    <CheckCircle size={12} /> Прочитано
                                  </button>
                               </div>
                             </div>
                          </div>
                       </div>
                     ))
                   )}
                </div>
              </div>
            )}
        
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

          {activeTab === 'dashboard' && (
            <Dashboard 
              data={financialData} 
              exchangeRates={exchangeRates} 
            />
          )}
          
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
          
          {activeTab === 'settings' && (
            <SettingsView 
              onClearData={clearAllData} 
              onResetData={resetData} 
              onImportData={importData} 
              exchangeRates={exchangeRates}
              onUpdateRates={setExchangeRates}
            />
          )}
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