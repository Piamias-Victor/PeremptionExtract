'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { parseExpirationDate, getDaysRemaining, getUrgencyLevel, UrgencyLevel, formatFrenchDate } from '@/lib/dateUtils';
import SyncEmailButton from '@/components/SyncEmailButton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// Type matchings
interface RawProduct extends Omit<Product, 'expirationDate'> {
    expirationDate: string;
    catalogStock: number | null;
    catalogRotation: number | null;
    catalogLastUpdated: string | null;
    invoice: {
        filename: string;
        uploadDate: string;
    };
}

interface ProductWithInvoice extends Product {
  invoice: {
    filename: string;
    uploadDate: Date;
  };
  parsedDate: Date | null;
  daysRemaining: number;
  urgency: UrgencyLevel;
  catalogStock: number | null;
  catalogRotation: number | null;
  catalogLastUpdated: Date | null;
}

const SortIcon = ({ field, currentSort, ascending }: { field: string, currentSort: string, ascending: boolean }) => {
    if (currentSort !== field) return <span className="text-muted-foreground/50 ml-1 opacity-50">⇅</span>;
    return <span className="text-primary ml-1">{ascending ? '↑' : '↓'}</span>;
};

export default function DashboardPage() {
  const [products, setProducts] = useState<ProductWithInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'warning' | 'custom'>('all');
  
  // Custom Date Filter State
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Sorting
  const [sortField, setSortField] = useState<keyof ProductWithInvoice | 'daysRemaining'>('daysRemaining');
  const [sortAsc, setSortAsc] = useState(true);

  const fetchProducts = useCallback(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data: RawProduct[]) => { 
        const enriched = data.map((p): ProductWithInvoice => {
             const parsedDate = parseExpirationDate(p.expirationDate);
             const daysRemaining = parsedDate ? getDaysRemaining(parsedDate) : 9999;
             const urgency = getUrgencyLevel(parsedDate);
             const invoiceDate = new Date(p.invoice.uploadDate);
             const lastUpdated = p.catalogLastUpdated ? new Date(p.catalogLastUpdated) : null;
             
             return { 
                 ...p, 
                 invoice: { ...p.invoice, uploadDate: invoiceDate },
                 parsedDate, 
                 daysRemaining, 
                 urgency,
                 catalogLastUpdated: lastUpdated
             };
        });
        setProducts(enriched);
        setLoading(false);
      })
      .catch((err) => {
          console.error("Failed to fetch products", err);
          setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchProducts(); 
  }, [fetchProducts]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by search
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        (p.code13 && p.code13.includes(lower)) ||
        (p.lotNumber && p.lotNumber.toLowerCase().includes(lower))
      );
    }

    // Filter by mode
    if (filterMode === 'critical') {
        result = result.filter(p => p.urgency === 'critical');
    } else if (filterMode === 'warning') {
        result = result.filter(p => p.urgency === 'critical' || p.urgency === 'warning');
    } else if (filterMode === 'custom') {
        if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);

            result = result.filter(p => {
                if (!p.parsedDate) return false;
                return p.parsedDate >= start && p.parsedDate <= end;
            });
        }
    }

    // Sort
    result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (sortField === 'daysRemaining') {
             if (a.parsedDate === null) return 1;
             if (b.parsedDate === null) return -1;
             
             const daysA = a.daysRemaining;
             const daysB = b.daysRemaining;
             return sortAsc ? daysA - daysB : daysB - daysA;
        }

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    return result;
  }, [products, search, filterMode, sortField, sortAsc, customStartDate, customEndDate]);

  const handleSort = (field: keyof ProductWithInvoice | 'daysRemaining') => {
    if (sortField === field) {
        setSortAsc(!sortAsc);
    } else {
        setSortField(field);
        setSortAsc(true);
    }
  };

  const handleExport = () => {
    if (filteredAndSortedProducts.length === 0) return;

    // Define CSV headers
    const headers = ['Produit', 'Code 13', 'Lot', 'Quantité', 'Date Péremption', 'Jours Restants', 'Zone', 'Opérateur', 'Date Ajout'];
    
    // Convert data to CSV rows
    const rows = filteredAndSortedProducts.map(p => [
        `"${p.name.replace(/"/g, '""')}"`, // Escape quotes
        `"${p.code13 || ''}"`,
        `"${p.lotNumber || ''}"`,
        `"${p.quantity || ''}"`,
        `"${p.expirationDate || ''}"`,
        `"${p.daysRemaining}"`,
        `"${p.zone || ''}"`,
        `"${p.operator || ''}"`,
        `"${p.invoice.uploadDate.toLocaleDateString()}"`
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(','), 
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blobs and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `export_peremptions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Tableau de Bord</h1>
            <p className="text-muted-foreground">Analysez et gérez les dates de péremption de vos produits.</p>
          </div>
          <div className="flex items-center gap-3">
               <Link href="/">
                 <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground">
                    ← Accueil
                 </Button>
               </Link>
               <Button 
                 onClick={handleExport}
                 variant="outline"
                 className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                 disabled={filteredAndSortedProducts.length === 0}
               >
                 ↓ Exporter CSV
               </Button>
               <SyncEmailButton onSyncComplete={() => { setLoading(true); fetchProducts(); }} />
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-red-500/20 bg-red-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                </div>
                <h3 className="text-sm font-medium text-red-500 uppercase tracking-wider">Critique (&lt; 30 jours)</h3>
                <p className="text-4xl font-bold text-foreground mt-2">
                    {products.filter(p => p.urgency === 'critical').length}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Action immédiate requise
                </div>
            </Card>
            
            <Card className="border-orange-500/20 bg-orange-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                     <svg className="w-16 h-16 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
                </div>
                <h3 className="text-sm font-medium text-orange-500 uppercase tracking-wider">Attention (&lt; 3 mois)</h3>
                <p className="text-4xl font-bold text-foreground mt-2">
                    {products.filter(p => p.urgency === 'warning').length}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-orange-400">
                     <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    À surveiller
                </div>
            </Card>

            <Card className="border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-16 h-16 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/></svg>
                </div>
                <h3 className="text-sm font-medium text-indigo-500 uppercase tracking-wider">Total Produits</h3>
                <p className="text-4xl font-bold text-foreground mt-2">
                    {products.length}
                </p>
                 <div className="mt-4 flex items-center gap-2 text-xs text-indigo-400">
                    Base de données active
                </div>
            </Card>
        </div>

        {/* Filters Toolbar */}
        <div className="glass-panel p-4 rounded-xl flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <span className="text-sm font-medium text-muted-foreground mr-2">Filtres:</span>
                    <div className="inline-flex rounded-lg shadow-sm border border-input overflow-hidden">
                        <button 
                            onClick={() => setFilterMode('all')}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${filterMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'}`}>
                            Tout
                        </button>
                        <button 
                            onClick={() => setFilterMode('warning')}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-input ${filterMode === 'warning' ? 'bg-orange-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'}`}>
                            &lt; 3 Mois
                        </button>
                        <button 
                            onClick={() => setFilterMode('critical')}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-input ${filterMode === 'critical' ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'}`}>
                            &lt; 1 Mois
                        </button>
                         <button 
                            onClick={() => setFilterMode('custom')}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-input ${filterMode === 'custom' ? 'bg-purple-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'}`}>
                            Personnalisé
                        </button>
                    </div>
                </div>

                <div className="relative w-full lg:w-96">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg className="w-4 h-4 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                        </svg>
                    </div>
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full p-2.5 pl-10 text-sm text-foreground bg-muted/50 border border-input rounded-lg focus:ring-indigo-500 focus:border-indigo-500 placeholder-muted-foreground transition-all focus:bg-muted" 
                        placeholder="Rechercher (Nom, Code 13, Lot...)" 
                    />
                </div>
            </div>

            {/* Custom Date Inputs */}
            {filterMode === 'custom' && (
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-input animate-fade-in">
                    <span className="text-sm font-medium text-muted-foreground">Période:</span>
                    <div className="flex items-center gap-2">
                        <label htmlFor="start-date" className="text-xs text-muted-foreground">Du</label>
                        <input 
                            type="date" 
                            id="start-date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="bg-muted border border-input text-foreground text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                         <label htmlFor="end-date" className="text-xs text-muted-foreground">Au</label>
                        <input 
                            type="date" 
                            id="end-date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                             className="bg-muted border border-input text-foreground text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2"
                        />
                    </div>
                </div>
            )}
        </div>

        {/* Data Table */}
        <div className="glass-panel rounded-xl overflow-hidden border border-border/50">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-muted-foreground">
                    <thead className="text-xs uppercase bg-muted/80 text-foreground border-b border-border">
                        <tr>
                            <th scope="col" className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('name')}>
                                Produit <SortIcon field="name" currentSort={sortField} ascending={sortAsc} />
                            </th>
                            <th scope="col" className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('catalogStock')}>
                                Stock <SortIcon field="catalogStock" currentSort={sortField} ascending={sortAsc} />
                            </th>
                            <th scope="col" className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('catalogRotation')}>
                                Rot. <SortIcon field="catalogRotation" currentSort={sortField} ascending={sortAsc} />
                            </th>
                            <th scope="col" className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('quantity')}>
                                Qté Saisie <SortIcon field="quantity" currentSort={sortField} ascending={sortAsc} />
                            </th>
                            <th scope="col" className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('code13')}>
                                Code 13 <SortIcon field="code13" currentSort={sortField} ascending={sortAsc} />
                            </th>
                            <th scope="col" className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('lotNumber')}>
                                Lot <SortIcon field="lotNumber" currentSort={sortField} ascending={sortAsc} />
                            </th>
                            <th scope="col" className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('daysRemaining')}>
                                Péremption <SortIcon field="daysRemaining" currentSort={sortField} ascending={sortAsc} />
                            </th>
                            <th scope="col" className="px-6 py-4 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('operator')}>
                                Opérateur <SortIcon field="operator" currentSort={sortField} ascending={sortAsc} />
                            </th>
                            <th scope="col" className="px-6 py-4 cursor-pointer hover:text-primary transition-colors text-center" onClick={() => handleSort('daysRemaining')}>
                                État <SortIcon field="daysRemaining" currentSort={sortField} ascending={sortAsc} />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {loading ? (
                            <tr><td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">Chargement des données...</td></tr>
                        ) : filteredAndSortedProducts.length === 0 ? (
                            <tr><td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">Aucun produit trouvé.</td></tr>
                        ) : (
                            filteredAndSortedProducts.map((p) => (
                                <tr key={p.id} className="hover:bg-muted/10 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-foreground group-hover:text-primary transition-colors max-w-[250px]">
                                        <div className="flex flex-col">
                                            <span className="truncate" title={p.name}>{p.name}</span>
                                            <span className="text-xs text-muted-foreground hidden lg:inline-block">{p.zone || '-'}</span>
                                            {p.catalogLastUpdated && (
                                                <span className="text-[10px] text-muted-foreground opacity-60">
                                                   Màj: {p.catalogLastUpdated.toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {p.catalogStock !== null ? (
                                            <Badge variant="outline" className={`border-0 ${p.catalogStock > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {p.catalogStock}
                                            </Badge>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                                        {p.catalogRotation !== null ? p.catalogRotation.toFixed(1) : '-'}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-foreground">{p.quantity || '1'}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{p.code13 || '-'}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{p.lotNumber || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground">{formatFrenchDate(p.parsedDate)}</span>
                                            <span className="text-xs text-muted-foreground">Source: {p.expirationDate}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-semibold text-indigo-400">
                                        {p.operator || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {p.parsedDate ? (
                                            <Badge variant={
                                                p.daysRemaining <= 30 ? 'destructive' : 
                                                p.daysRemaining <= 90 ? 'warning' : 'success'
                                            } className="w-28 justify-center">
                                                {p.daysRemaining} Jours
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="w-28 justify-center border-input text-muted-foreground">
                                                Inconnu
                                            </Badge>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
             <div className="bg-muted/50 px-6 py-3 border-t border-border text-xs text-muted-foreground flex justify-between items-center">
                <span>Total: {filteredAndSortedProducts.length} produits</span>
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> &lt; 30j</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> &lt; 90j</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> &gt; 90j</span>
                </div>
            </div>
        </div>

    </div>
  );
}
