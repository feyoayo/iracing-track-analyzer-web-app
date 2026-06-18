import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  classes: string[];
  selectedClass: string;
  seriesNames: string[];
  selectedSeries: string[];
  onClassChange: (value: string) => void;
  onSeriesToggle: (value: string) => void;
  onSelectAllSeries: () => void;
  onClearSeries: () => void;
};

export function AnalysisFilters(props: Props) {
  return (
    <section className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Analysis scope
          </p>
          <h2 className="mt-1 text-lg font-semibold">Series selection</h2>
        </div>
        <p className="text-right text-sm text-muted-foreground">
          {props.selectedSeries.length} of {props.seriesNames.length} series
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="class-select">Class</Label>
        <Select value={props.selectedClass} onValueChange={props.onClassChange}>
          <SelectTrigger id="class-select">
            <SelectValue placeholder="Choose class" />
          </SelectTrigger>
          <SelectContent>
            {props.classes.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Series</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={props.onSelectAllSeries}
            >
              Select all
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={props.onClearSeries}
            >
              Clear
            </Button>
          </div>
        </div>

        <ScrollArea className="h-72 rounded-md border bg-muted/30">
          <div className="grid p-1">
            {props.seriesNames.map((name) => (
              <label
                key={name}
                className="flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Checkbox
                  checked={props.selectedSeries.includes(name)}
                  onCheckedChange={() => props.onSeriesToggle(name)}
                  className="mt-0.5"
                />
                <span className="leading-5">{name}</span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </div>
    </section>
  );
}
