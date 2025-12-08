import React, { useState } from 'react';
import { Expense, Currency } from '../types';
import { Plus, Trash2 } from './ui/Icons';
import { InputGroup } from './ui/InputGroup';

interface ExpensesViewProps {
  expenses: Expense[];
  onAdd: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, onAdd, onDelete }) => {
  const [newExp, setNewExp] = useState<Partial<Expense>>({ currency: Currency.USD, frequency: 'Monthly' });

  return (
    <div className="space-y-6">
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
         <h3 className="text-lg font-bold text-slate-800 mb-4">Записать расход</h3>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <InputGroup label="Название">
             <input className="border p-2 rounded" placeholder="Аренда" value={newExp.title || ''} onChange={e => setNewExp({...newExp, title: e.target.value})} />
           </InputGroup>
           <InputGroup label="Сумма">
             <input type="number" className="border p-2 rounded" value={newExp.amount || ''} onChange={e => setNewExp({...newExp, amount: parseFloat(e.target.value)})} />
           </InputGroup>
           <InputGroup label="Валюта">
             <select className="border p-2 rounded" value={newExp.currency} onChange={e => setNewExp({...newExp, currency: e.target.value as Currency})}>
               {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
             </select>
           </InputGroup>
           <InputGroup label="Категория">
             <input className="border p-2 rounded" placeholder="ЖКХ" value={newExp.category || ''} onChange={e => setNewExp({...newExp, category: e.target.value})} />
           </InputGroup>
           <InputGroup label="Тип">
             <select className="border p-2 rounded" value={newExp.frequency} onChange={e => setNewExp({...newExp, frequency: e.target.value as 'Monthly' | 'Weekly' | 'Yearly'})}>
               <option value="Weekly">Еженедельно</option>
               <option value="Monthly">Ежемесячно</option>
               <option value="Yearly">Ежегодно</option>
             </select>
           </InputGroup>
         </div>
         <button 
          onClick={() => {
            if (newExp.title && newExp.amount) {
              onAdd({ ...newExp, id: Date.now().toString(), date: new Date().toISOString() } as Expense);
              setNewExp({ currency: Currency.USD, frequency: 'Monthly', title: '', amount: 0, category: '' });
            }
          }}
          className="mt-4 bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700 w-full md:w-auto justify-center"
        >
          <Plus size={16} /> Добавить в лог
        </button>
       </div>

       <div className="space-y-3">
         {expenses.map(e => (
           <div key={e.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border-l-4 border-l-orange-400 group">
             <div className="flex-1 pr-4">
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                   {new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                 </span>
                 <h4 className="font-bold text-slate-800 text-sm md:text-base">{e.title}</h4>
               </div>
               <p className="text-xs text-slate-500">{e.category} • {e.frequency === 'Monthly' ? 'Ежемес.' : 'Разово/Прочее'}</p>
             </div>
             <div className="flex items-center gap-4">
                <span className="font-mono font-bold text-lg text-slate-800">{e.amount} {e.currency}</span>
                <button onClick={() => onDelete(e.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
             </div>
           </div>
         ))}
         {expenses.length === 0 && <p className="text-center text-slate-400 py-8">Лента расходов пуста</p>}
       </div>
    </div>
  );
};