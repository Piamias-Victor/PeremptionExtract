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
    const savedConfig = localStorage.getItem('manual_config');
    
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        // ignore invalid JSON
      }
    }
    
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.operator) setOperator(config.operator);
        if (config.zone) setZone(config.zone);
        if (config.batchName) setBatchName(config.batchName);
        if (config.configCompleted) setConfigCompleted(config.configCompleted);
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
  const [potentialDuplicates, setPotentialDuplicates] = useState<any[]>([]);

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
    setPotentialDuplicates([]); // Reset duplicates warning

    // Force focus back to Code input for next scan
    setTimeout(() => {
        const codeInput = document.querySelector('input[name="code13"]') as HTMLInputElement;
        if (codeInput) codeInput.focus();
    }, 50);
  };

  // Check for duplicates
  const checkDuplicates = async (codeToCheck: string) => {
      if (!codeToCheck || codeToCheck.length < 3) {
          setPotentialDuplicates([]);
          return;
      }
      try {
          const res = await fetch(`/api/products/check?code=${codeToCheck}`);
          const data = await res.json();
          if (data.success && data.duplicates.length > 0) {
              setPotentialDuplicates(data.duplicates);
          } else {
              setPotentialDuplicates([]);
          }
      } catch (err) {
          console.error("Error checking duplicates", err);
      }
  };

  // Input Change Handler with Auto-Submit
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setCode(val);

      // Check for duplicates when code is long enough (e.g. 13 chars)
      if (val.length === 13) {
          checkDuplicates(val);
          // Move focus to Quantity field
          const qtyInput = document.querySelector('input[name="quantity"]') as HTMLInputElement;
          if (qtyInput) qtyInput.focus();
      } else {
          setPotentialDuplicates([]);
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

  // Batch Name State
  const [batchName, setBatchName] = useState('');
  const [zone, setZone] = useState('DEPOT'); // Default to DEPOT
  const [operator, setOperator] = useState(''); // No default operator
  const [configCompleted, setConfigCompleted] = useState(false); // Track if config is done
  const OPERATORS = ['Migue', 'Salma', 'Carla', 'P-A', 'Alex'];

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('manual_config', JSON.stringify({
      operator,
      zone,
      batchName,
      configCompleted
    }));
  }, [operator, zone, batchName, configCompleted]);

  // Readiness Check for configuration
  const isConfigReady = !!operator && !!zone;

  const handleStartScanning = () => {
    if (isConfigReady) {
      setConfigCompleted(true);
    }
  };

  const handleBackToConfig = () => {
    setConfigCompleted(false);
  };

  const handleSubmitBatch = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/api/products/manual-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            products: items,
            customName: batchName || undefined,
            zone: zone,
            operator: operator
        }),
      });

      if (res.ok) {
        setSuccessMsg('Lot ajouté avec succès ! Redirection...');
        localStorage.removeItem('manual_draft'); // Clear persistence on success
        localStorage.removeItem('manual_config'); // Clear config on success
        setItems([]);
        setBatchName('');
        setConfigCompleted(false); // Reset to config screen
        setOperator(''); // Reset operator for next session
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
          <p className="text-muted-foreground">
            {!configCompleted ? 'Configurez votre session de saisie' : 'Scannez vos produits'}
          </p>
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

      {/* Configuration Screen */}
      {!configCompleted ? (
        <Card className="p-8 border-indigo-500/20 bg-muted/10 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-center text-foreground">Configuration de la session</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Nom du lot (optionnel)</label>
              <input 
                type="text" 
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder={`Ex: Saisie du ${new Date().toLocaleDateString()}`}
                className="w-full bg-background border border-input rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Zone de signalement <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-input hover:bg-white/5 transition-colors">
                  <input 
                    type="radio" 
                    name="zone" 
                    value="DEPOT" 
                    checked={zone === 'DEPOT'}
                    onChange={(e) => setZone(e.target.value)}
                    className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-sm font-medium">Dépôt</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-input hover:bg-white/5 transition-colors">
                  <input 
                    type="radio" 
                    name="zone" 
                    value="EDV" 
                    checked={zone === 'EDV'}
                    onChange={(e) => setZone(e.target.value)}
                    className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-sm font-medium">Espace de Vente (EDV)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Opérateur <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {OPERATORS.map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setOperator(op)}
                    className={`px-4 py-3 text-sm rounded-lg border transition-all ${
                      operator === op 
                        ? 'bg-indigo-600 border-indigo-500 text-white font-medium shadow-lg transform scale-105' 
                        : 'bg-background border-input hover:border-indigo-500/50 hover:bg-muted/50'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleStartScanning}
              disabled={!isConfigReady}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-base font-semibold mt-8"
            >
              {isConfigReady ? '✓ Commencer la saisie' : '⚠ Sélectionnez une zone et un opérateur'}
            </Button>
          </div>
        </Card>
      ) : (
        /* Scanning Screen */
        <>
          {/* Session Info Banner */}
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex flex-col md:flex-row gap-3 md:gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Opérateur:</span>
                  <span className="font-semibold text-indigo-400">{operator}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">Zone:</span>
                  <span className="font-semibold text-indigo-400">{zone}</span>
                </div>
                {batchName && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">Lot:</span>
                    <span className="font-semibold text-foreground">{batchName}</span>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleBackToConfig}
                className="text-xs w-full md:w-auto"
              >
                ← Modifier la config
              </Button>
            </div>
          </div>

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
                      required
                    />
                  </div>
                  
                  {potentialDuplicates.length > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 animate-fade-in">
                          <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">⚠️</span>
                              <h3 className="text-sm font-semibold text-amber-500">Produit déjà scanné !</h3>
                          </div>
                          <div className="space-y-2 max-h-[150px] overflow-y-auto">
                              {potentialDuplicates.map((dup) => (
                                  <div key={dup.id} className="text-xs text-muted-foreground bg-amber-500/5 p-2 rounded">
                                      <div className="flex justify-between font-medium text-foreground">
                                          <span>Qté: {dup.quantity}</span>
                                          <span>{new Date(dup.expirationDate).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex justify-between mt-1">
                                          <span>{dup.operator || 'Inconnu'}</span>
                                          <span>{dup.zone || 'Inconnu'}</span>
                                      </div>
                                      <div className="text-[10px] mt-1 opacity-70">
                                          Le {new Date(dup.createdAt).toLocaleDateString()}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

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
            <div className="p-4 bg-muted/10 flex justify-end gap-3 rounded-b-lg">
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
        </>
      )}
    </div>
  );
}
