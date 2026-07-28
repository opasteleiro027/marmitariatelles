export class SalesCalendarConflictError extends Error {
  constructor(
    message = "Já existe uma agenda para essa data. Recarregue o painel para editar a agenda existente.",
  ) {
    super(message);
    this.name = "SalesCalendarConflictError";
  }
}

export function assertSalesDateAvailable(
  currentMenuId: string,
  relatedMenus: Array<{ id: string }>,
): void {
  if (relatedMenus.some((menu) => menu.id !== currentMenuId)) {
    throw new SalesCalendarConflictError();
  }
}
