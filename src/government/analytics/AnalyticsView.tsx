import React, { useState, useEffect } from 'react';
import { sevaStore } from '../../services/store';
import { Complaint, Department } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2,
  PieChart as PieIcon
} from 'lucide-react';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#eab308',
  LOW: '#10b981'
};

const CATEGORY_COLORS = ['#3b82f6', '#06b6d4', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

export const AnalyticsView: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    setComplaints(sevaStore.getComplaints());
    setDepartments(sevaStore.getDepartments());
  }, []);

  // Category counts
  const categoryCounts = complaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({
    name: name.replace('_', ' '),
    count
  }));

  // Priority counts
  const priorityCounts = complaints.reduce((acc, c) => {
    acc[c.priority] = (acc[c.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityData = Object.entries(priorityCounts).map(([name, value]) => ({
    name,
    value
  }));

  // SLA Trend simulation (Last 7 days)
  const slaTrendData = [
    { day: 'Mon', reported: 18, resolved: 14, breached: 2 },
    { day: 'Tue', reported: 24, resolved: 21, breached: 1 },
    { day: 'Wed', reported: 32, resolved: 28, breached: 3 },
    { day: 'Thu', reported: 29, resolved: 26, breached: 2 },
    { day: 'Fri', reported: 35, resolved: 31, breached: 4 },
    { day: 'Sat', reported: 22, resolved: 20, breached: 1 },
    { day: 'Sun', reported: 15, resolved: 16, breached: 0 }
  ];

  // Ward Distribution
  const wardCounts = complaints.reduce((acc, c) => {
    const area = c.location.area || 'Unknown';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const wardData = Object.entries(wardCounts).map(([ward, count]) => ({
    ward,
    count: Number(count)
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h1 className="text-xl font-black text-white tracking-tight">
                Civic Grievance Intelligence & SLA Analytics
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time statistical breakdown across municipal zones, categories, and resolution velocity.
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        
        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SLA Resolution Velocity Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                7-Day Grievance Intake vs Resolution Velocity
              </h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={slaTrendData}>
                  <defs>
                    <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="reported" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReported)" name="Intake (Reported)" />
                  <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" name="Remediated (Resolved)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Risk Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-400" />
                Priority & Risk Level Distribution
              </h3>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Bar Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              Complaints Volume by Civic Category
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ward Hotspots Volume */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Highest Volume Municipal Wards (Chennai)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wardData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="ward" type="category" stroke="#64748b" fontSize={10} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
};
