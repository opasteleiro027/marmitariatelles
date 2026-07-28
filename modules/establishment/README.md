# Establishment

Owns the site availability switch, editable business settings, delivery areas
and enabled payment methods. Turning the site on or off is the only
administrator-facing rule that releases or blocks new orders.

Delivery areas can be deleted without removing historical order snapshots.

Business settings and delivery areas expose independent queries and dedicated
interfaces. `/admin/configuracoes` does not load areas, and
`/admin/areas-entrega` does not load business settings.
