# Analysis filter dialog

Move the season planner's persistent sidebar into a Filters dialog above a full-width analysis table. Keep Export alongside Filters and show the applied classes and series count without opening the dialog.

The dialog contains classes, searchable series with Select all/Clear, and Include past weeks. Apply commits the draft; Cancel, Escape and closing discard it. Preserve URL class precedence, saved selections (including an intentional empty selection), account favorites and existing preference persistence. With no saved selection or favorites, select every series in Sports Car (or the existing fallback class). A shared class URL limits that default to its classes.

Approaches considered: persistent sidebar consumes table width; an expanding toolbar moves results down; the user chose a modal. Use existing Radix Dialog and project controls, with a scrollable mobile layout. No database or authentication changes.

Approved in conversation: modal approach and all Sports Car series when no user settings exist. Implementation details follow the proposed Apply/Cancel behavior.
