"use client";

import { useState } from 'react';

export default function LeadForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      nombre_1756323674763: formData.get('nombre'),
      email: formData.get('email'),
      number_1756324629878: formData.get('telefono'),
      tipo_de_cliente_1756316577683: formData.get('tipo_cliente'),
      facturacion_actual_1756754260699: formData.get('facturacion'),
      url_de_pagina_1756753569495: formData.get('url'),
      que_reto_quieres_resolver_ejemplo_mas_ventas_mejor_seo_mejorar_campanas_1756754365420: formData.get('reto'),
      medio: "Web Rankerize Home",
      fecha: new Date().toISOString()
    };

    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycby6uNGaVVERbXd3IzFLOq5O6e8brNOGcfamlfAsToGMRDELIyCTVf5CI0YiQqvYQvhG/exec', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "text/plain;charset=utf-8", 
        }
      });

      const result = await response.json();
      if (result.ok) {
        setSuccess(true);
      } else {
        setError('Tuvimos un problema procesando tu solicitud. Intenta nuevamente.');
      }
    } catch (err) {
      console.error(err);
      setError('Hubo un error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
        <h3 className="font-display text-2xl font-bold text-white mb-2">¡Solicitud Enviada!</h3>
        <p className="text-slate-700">Un experto de Rankerize se comunicará contigo muy pronto para escalar tu negocio.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 shadow-2xl relative z-10 mx-auto max-w-xl">
      <h3 className="font-display text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-indigo-400 mb-6 text-center">
        Hablemos de tus metas
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Nombre completo</label>
          <input required type="text" name="nombre" className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Tu nombre" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Email profesional</label>
          <input required type="email" name="email" className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="tu@empresa.com" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Tu Teléfono (WhatsApp)</label>
          <input required type="tel" name="telefono" className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="+57 320 000 0000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Cliente</label>
          <select name="tipo_cliente" className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
            <option value="B2B">Empresa B2B</option>
            <option value="Ecommerce">Ecommerce</option>
            <option value="Agencia">Agencia</option>
            <option value="Servicios Locales">Servicios Locales</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">URL de tu web</label>
          <input type="url" name="url" className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="https://tuweb.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Facturación (USD)</label>
          <select name="facturacion" className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 transition-colors appearance-none">
            <option value="Menos de $10,000">Menos de $10K USD</option>
            <option value="$10,000 - $50,000">$10K - $50K USD</option>
            <option value="Más de $50,000">Más de $50K USD</option>
          </select>
        </div>
      </div>

      <div className="text-left">
        <label className="block text-sm font-medium text-slate-600 mb-1">¿Qué reto quieres resolver?</label>
        <textarea required name="reto" rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Ejemplo: quiero lograr más ventas, captar leads B2B, limpiar SEO..." />
      </div>

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

      <button disabled={loading} type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed mt-4">
        {loading ? 'Enviando...' : 'Hablar con un Experto'}
      </button>

      <p className="text-xs text-slate-500 text-center mt-4">
        Tus datos están seguros.
      </p>
    </form>
  );
}
