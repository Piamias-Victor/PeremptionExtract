'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Invoice, Product } from '@/types';
import SyncEmailButton from '@/components/SyncEmailButton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function HistoryPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  /* eslint-disable react-hooks/exhaustive-deps */
  const fetchInvoices = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/invoices');
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Already loading by default state, so strict mode double-invoc won't flash
    // We pass false mainly to avoid setting loading=true again if it confuses strict checks
    fetchInvoices(false); 
  }, []);
/* eslint-enable react-hooks/exhaustive-deps */

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture et tous ses produits ?')) return;

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Erreur lors de la suppression de la facture');
    }
  };

  const handleRename = async (invoice: Invoice) => {
    const newName = prompt('Nouveau nom pour cette facture :', invoice.filename);
    if (!newName || newName === invoice.filename) return;

    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: newName }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setInvoices((prev) => 
        prev.map((inv) => inv.id === invoice.id ? { ...inv, filename: newName } : inv)
      );
    } catch (error) {
      console.error('Error renaming invoice:', error);
      alert('Erreur lors du renommage');
    }
  };

  const handleExportCSV = (invoice: Invoice) => {
    const headers = ['Code 13', 'Produit', 'Qté', 'Rotation', 'Prix HT', 'Remise', 'Prix Net', 'Expiration', 'Lot', 'Ajouté le'];
    const rows = invoice.products.map(p => [
      p.code13 || '',
      `"${p.name.replace(/"/g, '""')}"`,
      p.quantity || '',
      p.rotation_mensuelle || '',
      p.prix_sans_remise || '',
      p.remise || '',
      p.prix_remisee || '',
      p.expirationDate || '',
      p.lotNumber || '',
      p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : ''
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';')) 
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `facture_${invoice.filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in space-y-8">
      {/* Header handled globally */}


      {loading ? (
         <div className="flex justify-center p-12">
            <span className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full"/>
         </div>
      ) : (
        <div className="space-y-6">
          {invoices.length === 0 && (
             <Card className="flex flex-col items-center justify-center p-12 opacity-80">
                <p className="text-muted-foreground">Aucune facture trouvée dans l&apos;historique.</p>
             </Card>
          )}
          
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="group overflow-hidden">
               <div className="flex justify-between items-center mb-6 border-b border-border/50 pb-4">
                  <div className="flex items-start gap-4">
                     <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                     </div>
                     <div>
                        <div className="flex items-center gap-2 group/edit">
                           <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{invoice.filename}</h2>
                           <button 
                              onClick={() => handleRename(invoice)}
                              className="text-muted-foreground hover:text-indigo-400 opacity-0 group-hover/edit:opacity-100 transition-opacity"
                              title="Renommer"
                           >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                           </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                           Traitement le {new Date(invoice.uploadDate).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                     <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        {invoice.products.length} Produits extraits
                     </Badge>
                     <div className="flex gap-2">
                        <Button 
                           variant="outline" 
                           size="sm" 
                           onClick={() => handleExportCSV(invoice)}
                           className="text-xs h-7"
                        >
                           <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                           </svg>
                           Export CSV
                        </Button>
                        <Button 
                           variant="destructive" 
                           size="sm" 
                           onClick={() => handleDelete(invoice.id)}
                           className="text-xs h-7"
                        >
                           <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                           </svg>
                           Supprimer
                        </Button>
                     </div>
                  </div>
               </div>

               <div className="relative overflow-x-auto rounded-lg border border-border/30">
                  {/* Mobile View (Cards) */}
                  <div className="md:hidden space-y-4 p-4">
                     {invoice.products.map((product: Product) => (
                        <div key={product.id} className="bg-muted/30 p-4 rounded-lg border border-border/50 space-y-2">
                           <div className="flex justify-between items-start">
                              <span className="font-semibold text-foreground text-sm line-clamp-2">{product.name}</span>
                              <Badge variant="outline" className="text-xs whitespace-nowrap ml-2">Qty: {product.quantity}</Badge>
                           </div>
                           <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-2">
                              <div>
                                 <span className="block font-medium text-xs opacity-70">Code</span>
                                 <span className="font-mono">{product.code13 || '-'}</span>
                              </div>
                              <div className="text-right">
                                 <span className="block font-medium text-xs opacity-70">Lot</span>
                                 <span className="font-mono">{product.lotNumber || '-'}</span>
                              </div>
                              <div>
                                 <span className="block font-medium text-xs opacity-70">Péremption</span>
                                 <span className={product.expirationDate ? "text-orange-400 font-medium" : ""}>{product.expirationDate || '-'}</span>
                              </div>
                               <div className="text-right">
                                 <span className="block font-medium text-xs opacity-70">Ajouté le</span>
                                 <span>
                                    {product.createdAt ? new Date(product.createdAt).toLocaleDateString('fr-FR') : '-'}
                                 </span>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Desktop View (Table) */}
                  <table className="hidden md:table w-full text-sm text-left text-muted-foreground">
                     <thead className="text-xs uppercase bg-muted/40 text-muted-foreground">
                        <tr>
                           <th className="px-4 py-3 font-medium">Code 13</th>
                           <th className="px-4 py-3 font-medium">Produit</th>
                           <th className="px-4 py-3 font-medium">Qté</th>
                           <th className="px-4 py-3 font-medium">Rotation</th>
                           <th className="px-4 py-3 font-medium">Prix HT</th>
                           <th className="px-4 py-3 font-medium">Remise</th>
                           <th className="px-4 py-3 font-medium">Prix Net</th>
                           <th className="px-4 py-3 font-medium">Expiration</th>
                           <th className="px-4 py-3 font-medium">Lot</th>
                           <th className="px-4 py-3 font-medium">Ajouté le</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-border/30">
                        {invoice.products.map((product: Product) => (
                           <tr key={product.id} className="hover:bg-muted/10 transition-colors">
                              <td className="px-4 py-3 font-mono text-muted-foreground">{product.code13 || '-'}</td>
                              <td className="px-4 py-3 text-foreground">{product.name}</td>
                              <td className="px-4 py-3 text-foreground font-medium">{product.quantity}</td>
                              <td className="px-4 py-3 text-muted-foreground">{product.rotation_mensuelle || '-'}</td>
                              <td className="px-4 py-3 text-muted-foreground">{product.prix_sans_remise || '-'}</td>
                              <td className="px-4 py-3 text-muted-foreground">{product.remise || '-'}</td>
                              <td className="px-4 py-3 font-medium text-foreground">{product.prix_remisee || '-'}</td>
                              <td className="px-4 py-3">
                                 {product.expirationDate ? (
                                    <span className="text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded text-xs border border-orange-500/20">
                                       {product.expirationDate}
                                    </span>
                                 ) : '-'}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs">{product.lotNumber || '-'}</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                   {product.createdAt ? new Date(product.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : '-'}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
