"use client";

import { useState } from "react";
import { Check, Loader2, MessageCircle } from "lucide-react";

interface PricingFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  features: PricingFeature[];
  isPopular?: boolean;
}

const TIER_PRO: Plan = {
  id: 'pro',
  name: 'SEO Orgánico',
  description: 'Automatiza tu estrategia de contenido SEO mes a mes.',
  price: '20',
  currency: 'USD',
  isPopular: true,
  features: [
    { text: '5,000 créditos / mes', included: true },
    { text: 'Auditorías SEO ilimitadas', included: true },
    { text: 'Enlazado Interno Inteligente', included: true },
    { text: 'Integración WordPress/Shopify', included: true },
    { text: 'Editor con DataForSEO (Volumen)', included: true },
  ],
};

const TIER_AGENCY: Plan = {
  id: 'agency',
  name: 'Plan Agencia',
  description: 'Soluciones a la medida para manejar múltiples marcas o alto volumen.',
  price: 'Custom',
  currency: '',
  features: [
    { text: 'Cuentas Multi-cliente', included: true },
    { text: 'Marca Blanca (White Label)', included: true },
    { text: 'Bolsa de artículos personalizados', included: true },
    { text: 'Soporte Comercial Prioritario', included: true },
  ],
};

export default function PricingCards() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribePro = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payments/create-preapproval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert(data.error || "Ocurrió un error inicializando el pago de Mercado Pago.");
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión al procesar el pago");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">Escala tu tráfico orgánico en piloto automático</h2>
        <p className="mt-4 text-xl text-gray-600">Elige el plan que se adapte mejor al tamaño de tu operación.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* PRO CARD */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-indigo-500 relative flex flex-col">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white px-4 py-1 rounded-bl-xl font-medium text-sm">
            Más Popular
          </div>
          <div className="p-8 pb-0">
            <h3 className="font-display text-2xl font-bold text-gray-900">{TIER_PRO.name}</h3>
            <p className="mt-2 text-gray-500">{TIER_PRO.description}</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-5xl font-extrabold tracking-tight text-gray-900">${TIER_PRO.price}</span>
              <span className="ml-1 text-xl font-medium text-gray-500"> {TIER_PRO.currency} /mes</span>
            </div>
          </div>
          <div className="p-8 pt-6 flex flex-col flex-1">
            <ul className="space-y-4 flex-1">
              {TIER_PRO.features.map((feature, idx) => (
                <li key={idx} className="flex">
                  <Check className="h-6 w-6 text-indigo-500 shrink-0" />
                  <span className="ml-3 text-gray-600">{feature.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <button
                onClick={handleSubscribePro}
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-medium text-center tracking-wide transition-colors flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Empezar Plan Pro — $20 USD/mes"}
              </button>
            </div>
          </div>
        </div>

        {/* AGENCY CARD */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-8 pb-0">
            <h3 className="font-display text-2xl font-bold text-gray-900">{TIER_AGENCY.name}</h3>
            <p className="mt-2 text-gray-500">{TIER_AGENCY.description}</p>
            <div className="mt-6 flex items-baseline">
              <span className="text-4xl font-extrabold tracking-tight text-gray-900">A la medida</span>
            </div>
          </div>
          <div className="p-8 pt-6 flex flex-col flex-1">
            <ul className="space-y-4 flex-1">
              {TIER_AGENCY.features.map((feature, idx) => (
                <li key={idx} className="flex">
                  <Check className="h-6 w-6 text-gray-400 shrink-0" />
                  <span className="ml-3 text-gray-600">{feature.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <a
                href={`https://wa.me/573124714236?text=${encodeURIComponent("Hola Rankerize, quiero un plan a la medida para agencia.")}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 px-4 rounded-xl font-medium text-center tracking-wide transition-colors flex justify-center items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Contactar en WhatsApp
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
