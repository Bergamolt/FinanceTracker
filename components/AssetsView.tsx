import React, { useState } from 'react';
import { Asset, Currency } from '../types';
import { Plus, Wallet, CreditCard, Trash2 } from './ui/Icons';
import { InputGroup } from './ui/InputGroup';

interface AssetsViewProps {
  assets: Asset[];
  onAdd: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({ assets, onAdd, onDelete }) => {
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({ 
    currency: Currency.USD, 
    type: 'Income',
    isReceived: true,
    autoCredit: false,
    date: new Date().toISOString().split('T')[0]
  });

  const handleAdd = () => {
    if (newAsset.title && newAsset.amount) {
      onAdd({ 
        ...newAsset, 
        id: Date.now().toString(), 
        date: new Date(newAsset.date || new Date()).toISOString() 
      } as Asset);
      
      setNewAsset({ 
        currency: Currency.USD, 
        type: 'Income', 
        title: '', 
        amount: 0,
        isReceived: true,
        autoCredit: false,
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  return (
    <div className="space-y-6">
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
         <h3 className="text-lg font-bold text-slate-800 mb-4">Добавить Доход или Баланс</h3>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <InputGroup label="Тип">
              <select className="border p-2 rounded" value={newAsset.type} onChange={e => setNewAsset({...newAsset, type: e.target.value as 'Income' | 'Balance'})}>
                <option value="Income">Доход</option>
                <option value="Balance">Корректировка Баланса</option>
              </select>
           </InputGroup>
           <InputGroup label="Название">
             <input className="border p-2 rounded" placeholder="Зарплата" value={newAsset.title || ''} onChange={e => setNewAsset({...newAsset, title: e.target.value})} />
           </InputGroup>
           <InputGroup label="Сумма">
             <input type="number" className="border p-2 rounded" value={newAsset.amount || ''} onChange={e => setNewAsset({...newAsset, amount: parseFloat(e.target.value)})} />
           </InputGroup>
           <InputGroup label="Валюта">
             <select className="border p-2 rounded" value={newAsset.currency} onChange={e => setNewAsset({...newAsset, currency: e.target.value as Currency})}>
               {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
             </select>
           </InputGroup>
           <InputGroup label="Дата">
             <input type="date" className="border p-2 rounded" value={newAsset.date} onChange={e => setNewAsset({...newAsset, date: e.target.value})} />
           </InputGroup>
         </div>

         <div className="mt-4 flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={newAsset.isReceived} 
                  onChange={e => setNewAsset({...newAsset, isReceived: e.target.checked, autoCredit: false})} 
                />
                <span className="text-sm font-medium text-slate-700">Средства уже получены?</span>
            </label>
            
            {newAsset.type === 'Income' && !newAsset.isReceived && (
              <label className="flex items-center gap-2 cursor-pointer ml-6 animate-in slide-in-from-top-1">
                  <input 
                    type="checkbox" 
                    checked={newAsset.autoCredit} 
                    onChange={e => setNewAsset({...newAsset, autoCredit: e.target.checked})} 
                  />
                  <span className="text-sm text-slate-600">Авто-зачисление при наступлении даты</span>
              </label>
            )}
         </div>

         <button 
          onClick={handleAdd}
          className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 w-full md:w-auto justify-center"
        >
          <Plus size={16} /> Добавить в историю
        </button>
       </div>

       <div className="grid grid-cols-1 gap-4">
         {assets.map(a => (
            <div key={a.id} className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group ${!a.isReceived ? 'opacity-70' : ''}`}>
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${a.type === 'Income' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {a.type === 'Income' ? <CreditCard size={20} /> : <Wallet size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-slate-400">{new Date(a.date).toLocaleDateString('ru-RU')}</span>
                       <h4 className="font-bold text-slate-700">{a.title}</h4>
                       {!a.isReceived && <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded">Ожидается</span>}
                       {a.autoCredit && !a.isReceived && <span className="text-[10px] bg-blue-100 text-blue-500 px-1 rounded">Авто</span>}
                    </div>
                    <p className="text-xs text-slate-500">{a.type === 'Income' ? 'Доход' : 'Баланс'}</p>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                 <div className="font-mono font-bold text-lg" style={{ color: a.type === 'Income' ? '#2563eb' : '#059669' }}>
                   +{a.amount.toLocaleString()} {a.currency}
                 </div>
                 <button onClick={() => onDelete(a.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
               </div>
            </div>
         ))}
         {assets.length === 0 && <p className="text-center text-slate-400 py-8">История операций пуста</p>}
       </div>
    </div>
  );
};