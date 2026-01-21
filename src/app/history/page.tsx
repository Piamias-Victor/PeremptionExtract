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
                        <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{invoice.filename}</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                           Traitement le {new Date(invoice.uploadDate).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                        </p>
                     </div>
                  </div>
                  <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                     {invoice.products.length} Produits extraits
                  </Badge>
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
                                    {/* @ts-expect-error createdAt may not be in type def yet but is in DB */}
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
                                   {/* @ts-expect-error createdAt dynamic */}
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
