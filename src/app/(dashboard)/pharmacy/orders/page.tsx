import { Suspense } from "react";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default function PharmacyOrdersPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto p-6">Loading orders…</div>}>
      <OrdersClient />
    </Suspense>
  );
}
