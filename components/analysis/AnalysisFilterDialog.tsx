"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { AnalysisFilters } from "@/components/analysis/AnalysisFilters";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { SavedSelection } from "@/lib/state/storage";

type Props = SavedSelection & {
  classes: string[];
  series: { seriesName: string; seriesClass: string }[];
  includePastWeeks: boolean;
  preferenceBusy: boolean;
  onApply: (selection: SavedSelection, includePastWeeks: boolean) => void;
};

export function AnalysisFilterDialog(props: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SavedSelection>({ selectedClasses: [], selectedSeries: [] });
  const [includePastWeeks, setIncludePastWeeks] = useState(false);
  const seriesNames = props.series
    .filter(series => draft.selectedClasses.includes(series.seriesClass))
    .map(series => series.seriesName);

  return (
    <Dialog open={open} onOpenChange={value => {
      if (value) {
        setDraft({ selectedClasses: [...props.selectedClasses], selectedSeries: [...props.selectedSeries] });
        setIncludePastWeeks(props.includePastWeeks);
      }
      setOpen(value);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-5 pr-12">
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>Choose which series and weeks to compare.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-6 py-5">
          <AnalysisFilters
            classes={props.classes}
            selectedClasses={draft.selectedClasses}
            seriesNames={seriesNames}
            selectedSeries={draft.selectedSeries}
            onClassToggle={value => {
              const selectedClasses = draft.selectedClasses.includes(value)
                ? draft.selectedClasses.filter(item => item !== value)
                : [...draft.selectedClasses, value];
              const allowed = new Set(props.series.filter(series => selectedClasses.includes(series.seriesClass)).map(series => series.seriesName));
              setDraft({ selectedClasses, selectedSeries: draft.selectedSeries.filter(name => allowed.has(name)) });
            }}
            onSeriesToggle={value => setDraft(current => ({ ...current, selectedSeries: current.selectedSeries.includes(value)
              ? current.selectedSeries.filter(name => name !== value)
              : [...current.selectedSeries, value] }))}
            onSelectAllSeries={() => setDraft(current => ({ ...current, selectedSeries: seriesNames }))}
            onClearSeries={() => setDraft(current => ({ ...current, selectedSeries: [] }))}
          />
          <label className="mt-5 flex cursor-pointer items-center gap-3 border-t pt-5 text-sm">
            <Checkbox checked={includePastWeeks} disabled={props.preferenceBusy} onCheckedChange={value => setIncludePastWeeks(value === true)} />
            Include past weeks
          </label>
        </div>
        <DialogFooter className="shrink-0 gap-2 border-t px-6 py-4 sm:space-x-0">
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" disabled={props.preferenceBusy} onClick={() => {
            props.onApply(draft, includePastWeeks);
            setOpen(false);
          }}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
