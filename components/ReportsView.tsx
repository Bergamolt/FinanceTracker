import React, { useState, useMemo } from 'react';
import { Debt, Expense, Asset, Currency } from '../types';
import { Plus, Trash2, CreditCard, Wallet, TrendingUp } from './ui/Icons';
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
}

type EntryType = 'expense' | 'income' | 'debt';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export const ReportsView: React.FC<ReportsViewProps> = ({
  debts, expenses, assets,
  onAddDebt, onUpdateDebt, 
  onAddExpense, onUpdateExpense, 
  onAddAsset, onUpdateAsset,
  onDeleteDebt, onDeleteExpense, onDeleteAsset
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
    frequency: 'Monthly' as 'Monthly' | 'Weekly' | 'Yearly', // for expense
    assetType: 'Income' as 'Income' | 'Balance', // for asset
    startDate: new Date().toISOString().split('T')[0], // for debt
    dayOfMonth: 1 // for expense
  });

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
        map[cat] = (map[cat] || 0) + e.amount;
    });

    return Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [expenses]);

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
      startDate: new Date().toISOString().split('T')[0],
      dayOfMonth: 1
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
        // Reset defaults for others
        source: '',
        isInstallment: false,
        totalInstallments: 12,
        paidInstallments: 0,
        assetType: 'Income',
        startDate: new Date(exp.date).toISOString().split('T')[0]
      });
    } else if (type === 'income') { // Asset
      const ast = item as Asset;
      setFormData({
        title: ast.title,
        amount: ast.amount,
        currency: ast.currency,
        assetType: ast.type,
        // Reset defaults
        category: '',
        frequency: 'Monthly',
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
        dayOfMonth: 1,
        assetType: 'Income'
      });
    }
  };

  const handleSave = () => {
    if (!formData.title || !formData.amount) return;
    
    // Determine the date
    let dateStr = new Date().toISOString();
    
    // If editing, preserve original date unless it's a debt with a specific start date logic
    if (editingId && originalDate) {
      dateStr = originalDate;
    }
    
    // If it is a debt with installment, we might favor the picked start date
    if (activeType === 'debt' && formData.isInstallment && formData.startDate) {
       dateStr = new Date(formData.startDate).toISOString();
    } else if (!editingId) {
       // New entry
       dateStr = new Date().toISOString();
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
        dayOfMonth: formData.frequency === 'Monthly' ? formData.dayOfMonth : undefined
      } as Expense;
      
      editingId ? onUpdateExpense(expenseObj) : onAddExpense(expenseObj);

    } else if (activeType === 'income') {
      const assetObj = {
        ...base,
        amount: parseFloat(formData.amount),
        type: formData.assetType
      } as Asset;

      editingId ? onUpdateAsset(assetObj) : onAddAsset(assetObj);

    } else if (activeType === 'debt') {
      const totalAmount = parseFloat(formData.amount);
      const paidAmount = formData.isInstallment 
        ? (totalAmount / formData.totalInstallments) * formData.paidInstallments 
        : 0;

      const debtObj = {
        ...base,
        source: formData.source || 'Не указан',
        totalAmount: totalAmount,
        remainingAmount: totalAmount - paidAmount, 
        isInstallment: formData.isInstallment,
        totalInstallments: formData.isInstallment ? formData.totalInstallments : undefined,
        paidInstallments: formData.isInstallment ? formData.paidInstallments : undefined
      } as Debt;

      editingId ? onUpdateDebt(debtObj) : onAddDebt(debtObj);
    }

    setIsModalOpen(false);
  };

  // Combine and sort all data for the log
  const unifiedLog = useMemo(() => {
    const allItems = [
      ...expenses.map(e => ({ ...e, type: 'expense' as const })),
      ...assets.map(a => ({ ...a, type: 'asset' as const })),
      ...debts.map(d => ({ ...d, type: 'debt' as const }))
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
         <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-orange-500" />
            Расходы (Текущий месяц)
         </h3>
         
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
                    formatter={(value: any, name: any) => [`${value.toLocaleString()}`, name]}
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

          if (item.type === 'expense') {
            logType = 'expense';
            typeColor = 'border-l-orange-400';
            icon = <div className="bg-orange-50 p-2 rounded text-orange-500"><TrendingUp size={16} className="rotate-180"/></div>;
            sign = '';
            subtitle = (item as Expense).category;
            if ((item as Expense).frequency === 'Monthly' && (item as Expense).dayOfMonth) {
               subtitle += ` • ${(item as Expense).dayOfMonth}-го числа`;
            }
          } else if (item.type === 'asset') {
            logType = 'income';
            typeColor = 'border-l-emerald-500';
            icon = <div className="bg-emerald-50 p-2 rounded text-emerald-600"><Wallet size={16} /></div>;
            sign = '+';
            subtitle = (item as Asset).type === 'Income' ? 'Доход' : 'Баланс';
          } else {
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
          const displayAmount = item.type === 'debt' ? (item as Debt).totalAmount : (item as any).amount;

          return (
            <div 
              key={item.id} 
              onClick={() => handleEdit(item, logType)}
              className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${typeColor} flex justify-between items-center group transition-all hover:shadow-md cursor-pointer hover:bg-slate-50`}
            >
              <div className="flex items-center gap-3">
                {icon}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <h4 className="font-bold text-slate-800 text-sm md:text-base">{item.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <span className={`font-mono font-bold text-lg ${item.type === 'asset' ? 'text-emerald-600' : 'text-slate-800'}`}>
                   {sign}{displayAmount.toLocaleString()} {item.currency}
                 </span>
                 <button 
                   onClick={(e) => {
                     e.stopPropagation(); // Prevent opening edit modal
                     if (item.type === 'expense') onDeleteExpense(item.id);
                     else if (item.type === 'asset') onDeleteAsset(item.id);
                     else onDeleteDebt(item.id);
                   }}
                   className="text-slate-300 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 p-2"
                 >
                   <Trash2 size={16} />
                 </button>
              </div>
            </div>
          );
        })}
        {unifiedLog.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <div className="flex justify-center mb-4">
               <div className="p-4 bg-slate-100 rounded-full">
                 <TrendingUp size={32} className="text-slate-300" />
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
             <button onClick={() => handleOpenModal('debt')} className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg border border-slate-100 hover:bg-red-50 hover:text-red-600 transition-colors">
               <span className="text-sm font-bold">Долг</span>
               <div className="p-1 bg-red-100 text-red-600 rounded-full"><CreditCard size={16} /></div>
             </button>
             <button onClick={() => handleOpenModal('income')} className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg border border-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
               <span className="text-sm font-bold">Доход</span>
               <div className="p-1 bg-emerald-100 text-emerald-600 rounded-full"><Wallet size={16} /></div>
             </button>
             <button onClick={() => handleOpenModal('expense')} className="flex items-center gap-2 bg-white text-slate-700 px-4 py-2 rounded-full shadow-lg border border-slate-100 hover:bg-orange-50 hover:text-orange-600 transition-colors">
               <span className="text-sm font-bold">Расход</span>
                <div className="p-1 bg-orange-100 text-orange-600 rounded-full"><TrendingUp size={16} className="rotate-180"/></div>
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
            </>
          )}

          {activeType === 'income' && (
             <InputGroup label="Тип Актива">
                <select className="border p-3 rounded-xl w-full bg-slate-50" value={formData.assetType} onChange={e => setFormData({...formData, assetType: e.target.value as any})}>
                  <option value="Income">Доход (Регулярный)</option>
                  <option value="Balance">Баланс (Разовый)</option>
                </select>
             </InputGroup>
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

          <button 
            onClick={handleSave}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-lg shadow-lg mt-4 transition-transform active:scale-95
              ${activeType === 'expense' ? 'bg-orange-500 hover:bg-orange-600' : 
                activeType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                'bg-slate-800 hover:bg-slate-900'}`}
          >
            <Plus size={20} /> 
            {editingId ? 'Обновить' : 'Сохранить'}
          </button>
        </div>
      </Modal>
    </div>
  );
};