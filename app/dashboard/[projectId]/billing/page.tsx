import PricingCards from "@/components/billing/PricingCards";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h3 className="font-display text-2xl font-bold leading-6 text-gray-900">Facturación y Planes</h3>
        <p className="mt-2 text-sm text-gray-500">
          Administra la suscripción y los límites de tu cuenta de Rankerize Flow.
        </p>
      </div>

      <PricingCards />
    </div>
  );
}
