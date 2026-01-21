'use client';

import { useEffect, useState, useCallback } from 'react';
import { Invoice } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function ControleRemisePage() {
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
    fetchInvoices(false); 
  }, []);
/* eslint-enable react-hooks/exhaustive-deps */

  // Flatten products from all invoices
  const allProducts = invoices.flatMap(invoice => invoice.products.map(p => ({ ...p, invoiceDate: invoice.uploadDate })));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Contrôle Remise</h1>
        <p className="text-muted-foreground">Consultez les remises appliquées sur vos produits.</p>
      </div>

      {loading ? (
         <div className="flex justify-center p-12">
            <span className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"/>
         </div>
      ) : (
        <Card className="glass-card border-border/50 bg-background/50 dark:bg-zinc-900/50">
            <div className="relative overflow-x-auto rounded-lg">
                <table className="w-full text-sm text-left text-muted-foreground">
                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4 font-medium">Code 13</th>
                            <th className="px-6 py-4 font-medium">Produit</th>
                            <th className="px-6 py-4 font-medium">Qté</th>
                            <th className="px-6 py-4 font-medium">Prix HT</th>
                            <th className="px-6 py-4 font-medium bg-primary/10 text-primary">Remise</th>
                            <th className="px-6 py-4 font-medium">Prix Net</th>
                            <th className="px-6 py-4 font-medium">Rotation</th>
                            <th className="px-6 py-4 font-medium">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {allProducts.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">Aucune donnée disponible.</td>
                            </tr>
                        ) : (
                            allProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-6 py-4 font-mono text-muted-foreground">{product.code13 || '-'}</td>
                                    <td className="px-6 py-4 text-foreground font-medium">{product.name}</td>
                                    <td className="px-6 py-4 text-foreground">{product.quantity}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{product.prix_sans_remise || '-'}</td>
                                    <td className="px-6 py-4 bg-primary/5">
                                        {product.remise ? (
                                            <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/20">
                                                {product.remise}
                                            </Badge>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-foreground font-medium">{product.prix_remisee || '-'}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{product.rotation_mensuelle || '-'}</td>
                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                        {new Date(product.invoiceDate).toLocaleDateString('fr-FR')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
      )}
    </div>
  );
}
