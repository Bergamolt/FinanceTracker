import React, { useState, useMemo } from 'react';
import { Debt, Expense, Asset, Currency } from '../types';
import { Plus, Trash2, CreditCard, Wallet, TrendingUp as TrendingUpIcon, CheckCircle, RefreshCw, PieChart as PieChartIcon } from './ui/Icons';
import { InputGroup } from './ui/InputGroup';
import { Modal } from './ui/Modal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ReportsViewProps {
  debts: Debt[];
  expenses: Expense[];
  assets: Asset[];
  onAddDebt: (debt: Debt) => void;
  onUpdateDebt: (debt: Debt) => void;
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onAddAsset: (asset: Asset) => void;
  onUpdateAsset: (asset: Asset) => void;
  onDeleteDebt: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteAsset: (id: string) => void;
  exchangeRates: Record<string, number>;
  mainCurrency: Currency;
}

type EntryType = 'expense' | 'income' | 'debt';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const ReportsView: React.FC<ReportsViewProps> = ({
  debts, expenses, assets,
  onAddDebt, onUpdateDebt, 
  onAddExpense, onUpdateExpense, 
  onAddAsset, onUpdateAsset,
  onDeleteDebt, onDeleteExpense, onDeleteAsset,
  exchangeRates,
  mainCurrency
}) => {
  const [activeType, setActiveType] = useState<EntryType>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalDate, setOriginalDate] = useState<string | null>(null);

  // Unified Form States
  const [formData, setFormData] = useState({
    title: '',
    amount: '' as any,
    currency: Currency.USD as Currency,
    category: '', // for expense
    source: '', // for debt
    isInstallment: false, // for debt
    totalInstallments: 12,
    paidInstallments: 0,
    frequency: 'One-time' as 'One-time' | 'Monthly' | 'Weekly' | 'Yearly', // for expense
    expenseIsPaid: true, // for expense
    expenseDate: new Date().toISOString().split('T')[0], // for expense
    assetType: 'Income' as 'Income' | 'Balance', // for asset
    assetReceived: true, // for asset
    assetAutoCredit: false, // for asset
    assetDate: new Date().toISOString().split('T')[0], // for asset
    startDate: new Date().toISOString().split('T')[0], // for debt
    dayOfMonth: 1 // for expense
  });

  // --- Currency Logic ---
  const { dominantCurrency, convert } = useMemo(() => {
    // No longer auto-calculating volume. Using mainCurrency from props.
    const bestCurrency = mainCurrency;

    const convertFn = (amount: number, curr: string) => {
      if (curr === bestCurrency) return amount;
      const rateFrom = exchangeRates[curr] || 1;
      const rateTo = exchangeRates[bestCurrency] || 1;
      return (amount / rateFrom) * rateTo;
    };

    return { dominantCurrency: bestCurrency, convert: convertFn };
  }, [expenses, assets, debts, exchangeRates, mainCurrency]);

  // --- Analytics Data ---
  const categoryData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const map: Record<string, number> = {};
    monthlyExpenses.forEach(e => {
        const cat = e.category || 'Прочее';
        // Convert amount to dominant currency for chart accuracy
        const val = convert(e.amount, e.currency);
        map[cat] = (map[cat] || 0) + val;
    });

    return Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [expenses, convert]);

  const handleOpenModal = (type: EntryType) => {
    setActiveType(type);
    setIsFabOpen(false);
    setIsModalOpen(true);
    setEditingId(null);
    setOriginalDate(null);
    // Reset minimal fields, preserve currency/settings if needed
    setFormData(prev => ({ 
      ...prev, 
      title: '', 
      amount: '', 
      category: '', 
      source: '',
      paidInstallments: 0,
      expenseIsPaid: true,
      expenseDate: new Date().toISOString().split('T')[0],
      assetReceived: true,
      assetAutoCredit: false,
      assetDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      dayOfMonth: 1,
      frequency: 'One-time' // Default for new
    }));
  };

  const handleEdit = (item: any, type: EntryType) => {
    setActiveType(type);
    setEditingId(item.id);
    setOriginalDate(item.date);
    setIsModalOpen(true);
    setIsFabOpen(false);

    if (type === 'expense') {
      const exp = item as Expense;
      setFormData({
        title: exp.title,
        amount: exp.amount,
        currency: exp.currency,
        category: exp.category,
        frequency: exp.frequency,
        dayOfMonth: exp.dayOfMonth || 1,
        expenseIsPaid: exp.isPaid ?? true,
        expenseDate: new Date(exp.date).toISOString().split('T')[0],
        // Reset defaults for others
        source: '',
        isInstallment: false,
        totalInstallments: 12,
        paidInstallments: 0,
        assetType: 'Income',
        assetReceived: true,
        assetAutoCredit: false,
        assetDate: new Date().toISOString().split('T')[0],
        startDate: new Date(exp.date).toISOString().split('T')[0]
      });
    } else if (type === 'income') { // Asset
      const ast = item as Asset;
      setFormData({
        title: ast.title,
        amount: ast.amount,
        currency: ast.currency,
        assetType: ast.type,
        assetReceived: ast.isReceived ?? true,
        assetAutoCredit: ast.autoCredit ?? false,
        assetDate: new Date(ast.date).toISOString().split('T')[0],
        // Reset defaults
        category: '',
        frequency: 'Monthly',
        expenseIsPaid: true,
        expenseDate: new Date().toISOString().split('T')[0],
        dayOfMonth: 1,
        source: '',
        isInstallment: false,
        totalInstallments: 12,
        paidInstallments: 0,
        startDate: new Date(ast.date).toISOString().split('T')[0]
      });
    } else { // Debt
      const debt = item as Debt;
      setFormData({
        title: debt.title,
        amount: debt.totalAmount,
        currency: debt.currency,
        source: debt.source,
        isInstallment: debt.isInstallment,
        totalInstallments: debt.totalInstallments || 12,
        paidInstallments: debt.paidInstallments || 0,
        startDate: new Date(debt.date).toISOString().split('T')[0],
        // Reset defaults
        category: '',
        frequency: 'Monthly',
        expenseIsPaid: true,
        expenseDate: new Date().toISOString().split('T')[0],
        dayOfMonth: 1,
        assetType: 'Income',
        assetReceived: true,
        assetAutoCredit: false,
        assetDate: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleSave = () => {
    if (!formData.title || !formData.amount) return;
    
    // Determine the date
    let dateStr = new Date().toISOString();
    
    // Logic for date selection based on type
    if (activeType === 'income') {
       dateStr = new Date(formData.assetDate).toISOString();
    } else if (activeType === 'expense') {
        // If not paid (planned), use the selected date. 
        // If paid, also use selected date or original.
        dateStr = new Date(formData.expenseDate).toISOString();
    } else if (activeType === 'debt' && formData.isInstallment && formData.startDate) {
       dateStr = new Date(formData.startDate).toISOString();
    } else if (editingId && originalDate) {
       dateStr = originalDate;
    }

    const base = {
      id: editingId || Date.now().toString(),
      date: dateStr,
      title: formData.title,
      currency: formData.currency,
    };

    if (activeType === 'expense') {
      const expenseObj = {
        ...base,
        amount: parseFloat(formData.amount),
        category: formData.category || 'Общее',
        frequency: formData.frequency,
        dayOfMonth: formData.frequency === 'Monthly' ? formData.dayOfMonth : undefined,
        isPaid: formData.expenseIsPaid
      } as Expense;
      
      editingId ? onUpdateExpense(expenseObj) : onAddExpense(expenseObj);

    } else if (activeType === 'income') {
      const assetObj = {
        ...base,
        amount: parseFloat(formData.amount),
        type: formData.assetType,
        isReceived: formData.assetReceived,
        autoCredit: formData.assetAutoCredit
      } as Asset;

      editingId ? onUpdateAsset(assetObj) : onAddAsset(assetObj);

    } else if (activeType === 'debt') {
      const totalAmount = parseFloat(formData.amount);
      const paidAmount = formData.isInstallment 
        ? (totalAmount / formData.totalInstallments) * formData.paidInstallments 
        : 0;
        
      const monthlyPayment = formData.isInstallment && formData.totalInstallments > 0
         ? totalAmount / formData.totalInstallments
         : undefined;

      const debtObj = {
        ...base,
        source: formData.source || 'Не указан',
        totalAmount: totalAmount,
        remainingAmount: totalAmount - paidAmount, 
        isInstallment: formData.isInstallment,
        totalInstallments: formData.isInstallment ? formData.totalInstallments : undefined,
        paidInstallments: formData.isInstallment ? formData.paidInstallments : undefined,
        monthlyPayment: monthlyPayment
      } as Debt;

      editingId ? onUpdateDebt(debtObj) : onAddDebt(debtObj);
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!editingId) return;
    if (activeType === 'expense') onDeleteExpense(editingId);
    else if (activeType === 'income') onDeleteAsset(editingId);
    else if (activeType === 'debt') onDeleteDebt(editingId);
    setIsModalOpen(false);
  };

  // Combine and sort all data for the log
  const unifiedLog = useMemo(() => {
    const allItems = [
      ...expenses.map(e => ({ ...e, entryType: 'expense' as const })),
      ...assets.map(a => ({ ...a, entryType: 'asset' as const })),
      ...debts.map(d => ({ ...d, entryType: 'debt' as const }))
    ];
    // Sort by date descending
    return allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, assets, debts]);

  // Calculate paid amount for display in form
  const calculatedPaidAmount = useMemo(() => {
    if (!formData.amount || !formData.totalInstallments) return 0;
    const onePayment = parseFloat(formData.amount) / formData.totalInstallments;
    return onePayment * formData.paidInstallments;
  }, [formData.amount, formData.totalInstallments, formData.paidInstallments]);

  return (
    <div className="space-y-6 pb-20 md:pb-0 relative min-h-[80vh]">
      
      {/* Chart Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
         <div className="flex justify-between items-start mb-4">
           <div>
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <PieChartIcon size={20} className="text-orange-500" />
                Расходы (Текущий месяц)
             </h3>
             <p className="text-xs text-slate-400 mt-1">Все валюты конвертированы в {dominantCurrency}</p>
           </div>
         </div>
         
         {categoryData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any) => [`${Math.round(value).toLocaleString()} ${dominantCurrency}`, name]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
         ) : (
            <div className="h-32 flex flex-col items-center justify-center text-slate-400">
               <p>Нет расходов за этот месяц</p>
            </div>
         )}
      </div>

      {/* Unified Log Section */}
      <div className="space-y-3">
        {unifiedLog.map((item) => {
          let typeColor = '';
          let icon = null;
          let sign = '';
          let subtitle = '';
          let logType: EntryType = 'expense';
          let isPending = false;
          let pendingDate = '';

          if (item.entryType === 'expense') {
            logType = 'expense';
            isPending = (item as Expense).isPaid === false;
            pendingDate = new Date(item.date).toLocaleDateString('ru-RU');
            typeColor = isPending ? 'border-l-slate-300' : 'border-l-orange-400';
            icon = <div className={`${isPending ? 'bg-slate-100 text-slate-500' : 'bg-orange-50 text-orange-500'} p-2 rounded`}><TrendingUpIcon size={16} className="rotate-180"/></div>;
            sign = '';
            subtitle = (item as Expense).category;
            if (isPending) subtitle += ` • План: ${pendingDate}`;
            else if ((item as Expense).frequency === 'Monthly' && (item as Expense).dayOfMonth) {
               subtitle += ` • ${(item as Expense).dayOfMonth}-го числа`;
            } else if ((item as Expense).frequency === 'One-time') {
               subtitle += ` • Разовый`;
            }
          } else if (item.entryType === 'asset') {
            logType = 'income';
            // Because we didn't overwrite 'type' in Asset with 'asset', (item as Asset).type works correctly (Income/Balance)
            isPending = (item as Asset).isReceived === false;
            pendingDate = new Date(item.date).toLocaleDateString('ru-RU');
            typeColor = isPending ? 'border-l-slate-300' : 'border-l-emerald-500';
            icon = <div className={`${isPending ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'} p-2 rounded`}><Wallet size={16} /></div>;
            sign = '+';
            subtitle = (item as Asset).type === 'Income' ? 'Доход' : 'Баланс';
            if (isPending) subtitle += ` • Ожидается: ${pendingDate}`;
            if (isPending && (item as Asset).autoCredit) subtitle += ` (Авто)`;
          } else {
            // Debt
            logType = 'debt';
            typeColor = 'border-l-slate-800';
            icon = <div className="bg-red-50 p-2 rounded text-red-600"><CreditCard size={16} /></div>;
            sign = '-';
            subtitle = (item as Debt).source;
            if ((item as Debt).isInstallment) {
               subtitle += ` • ${(item as Debt).paidInstallments}/${(item as Debt).totalInstallments}`;
            }
          }

          // Use totalAmount for debt, amount for others
          const originalAmount = item.entryType === 'debt' ? (item as Debt).totalAmount : (item as any).amount;

          return (
            <div 
              key={item.id} 
              onClick={() => handleEdit(item, logType)}
              className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${typeColor} flex justify-between items-center group transition-all hover:shadow-md cursor-pointer hover:bg-slate-50 ${isPending ? 'opacity-75' : ''}`}
            >
              <div className="flex items-center gap-3">
                {icon}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <h4 className={`font-bold text-sm md:text-base ${isPending ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>{item.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                 <span className={`font-mono font-bold text-lg ${isPending ? 'text-slate-400' : (item.entryType === 'asset' ? 'text-emerald-600' : 'text-slate-800')}`}>
                   {sign}{originalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {item.currency}
                 </span>
              </div>
            </div>
          );
        })}
        {unifiedLog.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <div className="flex justify-center mb-4">
               <div className="p-4 bg-slate-100 rounded-full">
                 <TrendingUpIcon size={32} className="text-slate-300" />
               </div>
            </div>
            <p className="text-lg font-medium text-slate-600">История пуста</p>
            <p className="text-sm">Нажмите кнопку + чтобы добавить запись</p>
          </div>
        )}
      </div>

      {/* FAB & Speed Dial */}
      <div className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-30 flex flex-col items-end gap-3">
        {isFabOpen && (
          <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-5 duration-200">
             <button onClick={() => handleOpenModal('debt')} className="flex items-center justify-between w-32 bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg border border-slate-100 hover:bg-red-50 hover:text-red-600 transition-colors">
               <span className="text-sm font-bold">Долг</span>
               <div className="p-1 bg-red-100 text-red-600 rounded-full"><CreditCard size={16} /></div>
             </button>
             <button onClick={() => handleOpenModal('income')} className="flex items-center justify-between w-32 bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg border border-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
               <span className="text-sm font-bold">Доход</span>
               <div className="p-1 bg-emerald-100 text-emerald-600 rounded-full"><Wallet size={16} /></div>
             </button>
             <button onClick={() => handleOpenModal('expense')} className="flex items-center justify-between w-32 bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg border border-slate-100 hover:bg-orange-50 hover:text-orange-600 transition-colors">
               <span className="text-sm font-bold">Расход</span>
                <div className="p-1 bg-orange-100 text-orange-600 rounded-full"><TrendingUpIcon size={16} className="rotate-180"/></div>
             </button>
          </div>
        )}
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`p-4 rounded-full shadow-xl transition-all duration-300 transform ${isFabOpen ? 'bg-slate-700 rotate-45' : 'bg-primary hover:scale-105'} text-white`}
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Input Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={
          editingId ? 'Редактирование записи' :
           (activeType === 'expense' ? 'Записать Расход' : 
           activeType === 'income' ? 'Добавить Доход/Актив' : 
           'Добавить Долг')
        }
      >
        <div className="space-y-4">
          <InputGroup label="Название">
            <input className="border p-3 rounded-xl w-full bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20" placeholder="Название записи" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} autoFocus />
          </InputGroup>
          <div className="grid grid-cols-2 gap-4">
            <InputGroup label="Сумма">
              <input type="number" className="border p-3 rounded-xl w-full bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </InputGroup>
            <InputGroup label="Валюта">
              <select className="border p-3 rounded-xl w-full bg-slate-50" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as Currency})}>
                {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </InputGroup>
          </div>

          {/* Dynamic Fields */}
          {activeType === 'expense' && (
            <>
              <InputGroup label="Категория">
                <input className="border p-3 rounded-xl w-full bg-slate-50" placeholder="Еда, Жилье..." value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </InputGroup>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Частота">
                  <select className="border p-3 rounded-xl w-full bg-slate-50" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value as any})}>
                    <option value="One-time">Разовый</option>
                    <option value="Monthly">Ежемесячно</option>
                    <option value="Weekly">Еженедельно</option>
                    <option value="Yearly">Ежегодно</option>
                  </select>
                </InputGroup>
                {formData.frequency === 'Monthly' && (
                   <InputGroup label="Число месяца">
                     <select className="border p-3 rounded-xl w-full bg-slate-50" value={formData.dayOfMonth} onChange={e => setFormData({...formData, dayOfMonth: parseInt(e.target.value)})}>
                       {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                         <option key={d} value={d}>{d}</option>
                       ))}
                     </select>
                   </InputGroup>
                )}
              </div>
               <div className="pt-2">
                 <InputGroup label="Статус оплаты">
                    <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors mt-1">
                      <input type="checkbox" checked={formData.expenseIsPaid} onChange={e => setFormData({...formData, expenseIsPaid: e.target.checked})} />
                      <span className="text-sm font-medium">Расход уже оплачен?</span>
                    </label>
                 </InputGroup>
                 {!formData.expenseIsPaid && (
                   <div className="mt-3 animate-in slide-in-from-top-2">
                     <InputGroup label="Дата планируемой оплаты">
                       <input type="date" className="border p-3 rounded-xl w-full bg-slate-50" value={formData.expenseDate} onChange={e => setFormData({...formData, expenseDate: e.target.value})} />
                     </InputGroup>
                   </div>
                 )}
              </div>
            </>
          )}

          {activeType === 'income' && (
            <>
             <div className="grid grid-cols-2 gap-4">
               <InputGroup label="Тип Актива">
                  <select className="border p-3 rounded-xl w-full bg-slate-50" value={formData.assetType} onChange={e => setFormData({...formData, assetType: e.target.value as any})}>
                    <option value="Income">Доход (Регулярный)</option>
                    <option value="Balance">Баланс (Разовый)</option>
                  </select>
               </InputGroup>
               <InputGroup label="Дата получения">
                  <input type="date" className="border p-3 rounded-xl w-full bg-slate-50" value={formData.assetDate} onChange={e => setFormData({...formData, assetDate: e.target.value})} />
               </InputGroup>
             </div>
             
             <div className="pt-2 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <input type="checkbox" checked={formData.assetReceived} onChange={e => setFormData({...formData, assetReceived: e.target.checked})} />
                  <span className="text-sm font-medium">Средства уже получены?</span>
                </label>
                
                {!formData.assetReceived && (
                  <div className="ml-4 pl-4 border-l-2 border-slate-200 animate-in slide-in-from-top-2">
                    <label className="flex items-center gap-2 cursor-pointer mb-1">
                      <input type="checkbox" checked={formData.assetAutoCredit} onChange={e => setFormData({...formData, assetAutoCredit: e.target.checked})} />
                      <span className="text-sm text-slate-700">Зачислить автоматически при наступлении даты</span>
                    </label>
                    <p className="text-xs text-slate-400">
                      Если выключено, вам нужно будет вручную подтвердить получение средств.
                    </p>
                  </div>
                )}
             </div>
            </>
          )}

          {activeType === 'debt' && (
             <>
               <InputGroup label="Кредитор / Источник">
                 <input className="border p-3 rounded-xl w-full bg-slate-50" placeholder="Банк, Друг..." value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} />
               </InputGroup>
               <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-xl bg-slate-50">
                    <input type="checkbox" checked={formData.isInstallment} onChange={e => setFormData({...formData, isInstallment: e.target.checked})} />
                    <span className="text-sm font-medium">Это рассрочка?</span>
                  </label>
                  {formData.isInstallment && (
                     <div className="mt-4 space-y-4">
                        <InputGroup label="Дата оформления">
                          <input type="date" className="border p-3 rounded-xl w-full bg-slate-50" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                        </InputGroup>
                        <div className="grid grid-cols-3 gap-2">
                          <InputGroup label="Всего плат.">
                            <input type="number" className="border p-3 rounded-xl w-full bg-slate-50" value={formData.totalInstallments} onChange={e => setFormData({...formData, totalInstallments: parseInt(e.target.value)})} />
                          </InputGroup>
                          <InputGroup label="Оплачено">
                            <input type="number" className="border p-3 rounded-xl w-full bg-slate-50" value={formData.paidInstallments} onChange={e => setFormData({...formData, paidInstallments: parseInt(e.target.value)})} />
                          </InputGroup>
                           <InputGroup label="Сумма (Опл.)">
                            <input type="text" disabled className="border p-3 rounded-xl w-full bg-slate-100 text-slate-500" value={calculatedPaidAmount.toFixed(0)} />
                          </InputGroup>
                        </div>
                     </div>
                  )}
               </div>
             </>
          )}

          <div className="flex flex-col gap-3 mt-4">
             <button 
                onClick={handleSave}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-lg shadow-lg transition-transform active:scale-95
                  ${activeType === 'expense' ? 'bg-orange-500 hover:bg-orange-600' : 
                    activeType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                    'bg-slate-800 hover:bg-slate-900'}`}
              >
                <Plus size={20} /> 
                {editingId ? 'Обновить' : 'Сохранить'}
              </button>
              
              {editingId && (
                <button 
                  onClick={handleDelete}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-red-500 font-bold bg-red-50 hover:bg-red-100 transition-colors"
                >
                   <Trash2 size={20} /> Удалить запись
                </button>
              )}
          </div>
        </div>
      </Modal>
    </div>
  );
};