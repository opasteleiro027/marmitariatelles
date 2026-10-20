import { AdminPageHeader } from "@/modules/admin/ui/admin-page-header/AdminPageHeader";
import { getCashRegisterSnapshot } from "@/modules/ordering/application/cash-register";
import { CashRegister } from "@/modules/ordering/ui/cash-register/CashRegister";

export const dynamic = "force-dynamic";

export default async function AdminCashRegisterPage() {
  const snapshot = await getCashRegisterSnapshot();
  return (
    <>
      <AdminPageHeader
        eyebrow="Financeiro"
        title="Caixa"
        description="Abra o expediente, acompanhe os pagamentos recebidos e confira o dinheiro antes de fechar."
      />
      <CashRegister snapshot={snapshot} />
    </>
  );
}
