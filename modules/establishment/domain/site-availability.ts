export function siteAcceptsOrders({
  ordersPaused,
  operationalMenuAvailable,
}: {
  ordersPaused: boolean;
  operationalMenuAvailable: boolean;
}) {
  return !ordersPaused && operationalMenuAvailable;
}
