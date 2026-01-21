'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ManualItem {
  id: string; // temp id for list management
  code13: string;
  quantity: string;
  expirationDate: string;
}

export default function ManualEntryPage() {
  const router = useRouter();
  const [items, setItems] = useState<ManualItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const saved = localStorage.getItem('manual_draft');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        // ignore invalid JSON
      }
    }
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    localStorage.setItem('manual_draft', JSON.stringify(items));
  }, [items]);



  // Form State
  const [code, setCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');

  // Reusable Add Logic
  const addItem = (codeVal: string, qtyVal: string, dateVal: string) => {
    if (!codeVal || !dateVal) return;

    const newItem: ManualItem = {
      id: crypto.randomUUID(),
      code13: codeVal,
      quantity: qtyVal || '1',
      expirationDate: dateVal,
    };

    setItems((prev) => [...prev, newItem]);
    
    // Reset ALL fields as requested
    setCode('');
    setQuantity(''); 
    setDate('');

    // Force focus back to Code input for next scan
    setTimeout(() => {
        const codeInput = document.querySelector('input[name="code13"]') as HTMLInputElement;
        if (codeInput) codeInput.focus();
    }, 50);
  };

  // Input Change Handler with Auto-Submit
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setCode(val);

      // Auto-Submit on EAN13 length
      if (val.length === 13) {
          // Move focus to Quantity field
          const qtyInput = document.querySelector('input[name="quantity"]') as HTMLInputElement;
          if (qtyInput) qtyInput.focus();
      }
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault(); 
        // Move focus to Date field
        const dateInput = document.querySelector('input[name="expirationDate"]') as HTMLInputElement;
        if (dateInput) dateInput.focus();
    }
  };

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addItem(
        formData.get('code13') as string, 
        formData.get('quantity') as string, 
        formData.get('expirationDate') as string
    );
  };

  const handleDateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent default form submit which might reload or do weird things
        if (code && date) {
            addItem(code, quantity, date);
        }
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter(item => item.id !== id));
  };

  const handleSubmitBatch = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/products/manual-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: items }),
      });

      if (res.ok) {
        setSuccessMsg('Lot ajouté avec succès ! Redirection...');
        localStorage.removeItem('manual_draft'); // Clear persistence on success
        setItems([]);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        alert('Erreur lors de l\'envoi du lot.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur technique.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full animate-fade-in space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Saisie Manuelle</h1>
          <p className="text-muted-foreground">Ajoutez des produits manuellement via une saisie rapide.</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground">
            ← Retour Dashboard
          </Button>
        </Link>
      </header>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-4 rounded-lg animate-fade-in">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Formulaire */}
        <div className="md:col-span-1 space-y-6">
          <Card className="p-6 border-indigo-500/20 bg-muted/30">
            <h2 className="font-semibold text-lg mb-4 text-foreground">Nouvel Article</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Code EAN / Article</label>
                <input 
                  name="code13"
                  type="text" 
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="Scannez ou tapez..."
                  className="w-full bg-background border border-input rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  autoFocus
                  onBlur={(e) => {
                      // Optional: Force keep focus for continuous scanning?
                      // Let's not be too aggressive to allow user to click Date
                     // e.target.focus(); 
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Quantité</label>
                <input 
                  name="quantity"
                  type="number" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onKeyDown={handleQtyKeyDown}
                  placeholder="1"
                  className="w-full bg-background border border-input rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Date de Péremption</label>
                <input 
                  name="expirationDate"
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onKeyDown={handleDateKeyDown}
                  className="w-full bg-background border border-input rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                Ajouter à la liste
              </Button>
            </form>
          </Card>
        </div>

        {/* Liste Panier */}
        <div className="md:col-span-2 space-y-6">
          <Card className="min-h-[400px] flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
              <h2 className="font-semibold text-foreground">Articles à valider ({items.length})</h2>
              {items.length > 0 && <span className="text-xs text-muted-foreground">Lot non enregistré</span>}
            </div>

            <div className="flex-1 overflow-auto p-0">
               {items.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 opacity-50">
                    <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <p>Votre liste est vide</p>
                 </div>
               ) : (
                 <>
                    {/* Mobile View (Cards) */}
                    <div className="md:hidden space-y-3 p-4">
                        {items.map((item) => (
                            <div key={item.id} className="bg-muted/30 p-3 rounded-lg border border-border/50 flex justify-between items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-sm font-medium text-foreground">{item.code13}</span>
                                        <Badge variant="outline" className="text-xs h-5 px-1.5">x{item.quantity}</Badge>
                                    </div>
                                    <div className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        {item.expirationDate}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleRemoveItem(item.id)}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                    title="Retirer"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View (Table) */}
                    <table className="hidden md:table w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3">Code</th>
                                <th className="px-4 py-3">Qté</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/10">
                                    <td className="px-4 py-3 font-mono">{item.code13}</td>
                                    <td className="px-4 py-3">{item.quantity}</td>
                                    <td className="px-4 py-3 text-indigo-400 font-medium">{item.expirationDate}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-1 rounded transition-colors"
                                            title="Retirer"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </>
               )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
                 <Button 
                    variant="ghost" 
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setItems([])}
                    disabled={items.length === 0 || loading}
                 >
                    Tout effacer
                 </Button>
                 <Button 
                    className={`bg-emerald-600 hover:bg-emerald-700 text-white min-w-[150px] ${loading ? 'opacity-80' : ''}`}
                    onClick={handleSubmitBatch}
                    disabled={items.length === 0 || loading}
                 >
                    {loading ? 'Envoi...' : `Valider ${items.length} article(s)`}
                 </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
