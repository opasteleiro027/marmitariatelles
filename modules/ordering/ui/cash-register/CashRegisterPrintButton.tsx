"use client";

export function CashRegisterPrintButton({ className }: { className?: string }) {
  return <button className={className} onClick={() => window.print()} type="button">Imprimir relatório</button>;
}
