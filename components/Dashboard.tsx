import React, { useMemo } from 'react';
import { FinancialState, Currency } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Wallet, TrendingUp, AlertCircle } from './ui/Icons';

interface DashboardProps {
  data: FinancialState;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  
  const totals = useMemo(() => {
    // A simplified summary assuming we just group by currency for now
    const debtMap: Record<string, number> = {};
    const assetMap: Record<string, number> = {};
    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};

    data.debts.forEach(d => {
      debtMap[d.currency] = (debtMap[d.currency] || 0) + d.remainingAmount;
    });

    data.assets.forEach(a => {
      if (a.type === 'Balance') {
        assetMap[a.currency] = (assetMap[a.currency] || 0) + a.amount;
      } else {
        // Normalize income to monthly for the "Net" calculation roughly
        incomeMap[a.currency] = (incomeMap[a.currency] || 0) + a.amount;
      }
    });

    data.expenses.forEach(e => {
      let amount = e.amount;
      if (e.frequency === 'Yearly') amount = amount / 12;
      if (e.frequency === 'Weekly') amount = amount * 4;
      
      expenseMap[e.currency] = (expenseMap[e.currency] || 0) + amount;
    });

    return { debtMap, assetMap, incomeMap, expenseMap };
  }, [data]);

  const debtChartData = data.debts.map(d => ({
    name: d.title,
    value: d.remainingAmount,
    currency: d.currency
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Summary Cards */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Общий долг</h3>
        </div>
        <div className="space-y-2">
          {Object.entries(totals.debtMap).length === 0 && <p className="text-slate-400">Долгов нет</p>}
          {Object.entries(totals.debtMap).map(([curr, amount]) => (
            <div key={curr} className="flex justify-between font-mono text-slate-800">
              <span>{curr}</span>
              <span className="font-bold text-red-500">-{amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
            <Wallet size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Текущие активы</h3>
        </div>
        <div className="space-y-2">
          {Object.entries(totals.assetMap).length === 0 && <p className="text-slate-400">Активов нет</p>}
          {Object.entries(totals.assetMap).map(([curr, amount]) => (
            <div key={curr} className="flex justify-between font-mono text-slate-800">
              <span>{curr}</span>
              <span className="font-bold text-emerald-600">{amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

       <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Месячный итог</h3>
        </div>
        <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-2">Доходы - Расходы (Прим.)</p>
          {Object.keys(totals.incomeMap).concat(Object.keys(totals.expenseMap)).filter((v, i, a) => a.indexOf(v) === i).map((curr) => {
              const inc = totals.incomeMap[curr] || 0;
              const exp = totals.expenseMap[curr] || 0;
              const net = inc - exp;
              return (
                <div key={curr} className="flex justify-between font-mono text-slate-800 border-b border-dashed border-slate-200 pb-1 last:border-0">
                  <span>{curr}</span>
                  <span className={net >= 0 ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
                    {net > 0 ? '+' : ''}{net.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )
          })}
           {Object.keys(totals.incomeMap).length === 0 && Object.keys(totals.expenseMap).length === 0 && <p className="text-slate-400">Нет повторяющихся операций</p>}
        </div>
      </div>

      {/* Charts */}
      {debtChartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 col-span-1 md:col-span-2 lg:col-span-3">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Структура долга</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={debtChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {debtChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => {
                    return [`${value.toLocaleString()} ${props.payload.currency}`, name];
                  }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};