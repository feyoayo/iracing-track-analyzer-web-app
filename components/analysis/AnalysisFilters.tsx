"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClassIcon } from "@/components/analysis/ClassIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  classes: string[];
  selectedClasses: string[];
  seriesNames: string[];
  selectedSeries: string[];
  onClassToggle: (value: string) => void;
  onSeriesToggle: (value: string) => void;
  onSelectAllSeries: () => void;
  onClearSeries: () => void;
};

const CLASS_ORDER = ["Sports Car", "Formula", "Oval", "Other"];

export function AnalysisFilters(props: Props) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const visibleSeries = props.seriesNames.filter(name => name.toLowerCase().includes(search.trim().toLowerCase()));
  const orderedClasses = [...props.classes].sort((left, right) => {
    const leftIndex = CLASS_ORDER.indexOf(left);
    const rightIndex = CLASS_ORDER.indexOf(right);
    return (leftIndex < 0 ? CLASS_ORDER.length : leftIndex)
      - (rightIndex < 0 ? CLASS_ORDER.length : rightIndex);
  });

  return (
    <section className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {t("Analysis scope")}
          </p>
          <h2 className="mt-1 text-lg font-semibold">{t("Series selection")}</h2>
        </div>
        <p className="text-right text-sm text-muted-foreground">
          {t("{selected} of {total} series", { selected: props.selectedSeries.length, total: props.seriesNames.length })}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="class-select">{t("Classes")}</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id="class-select"
              variant="outline"
              aria-label={t("Classes: {classes}", { classes: orderedClasses.filter(value => props.selectedClasses.includes(value)).map(value => t(value)).join(", ") || t("Choose classes") })}
              className="h-auto min-h-10 w-full justify-between px-3 py-2 font-normal"
            >
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-left">
                {props.selectedClasses.length === 0 ? t("Choose classes") : orderedClasses
                  .filter(value => props.selectedClasses.includes(value))
                  .map(value => (
                    <span key={value} className="inline-flex items-center gap-2">
                      <ClassIcon seriesClass={value} />
                      {t(value)}
                    </span>
                  ))}
              </span>
              <ChevronDown aria-hidden="true" className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-md">
            {orderedClasses.map((value) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={props.selectedClasses.includes(value)}
                onCheckedChange={() => props.onClassToggle(value)}
                onSelect={(event) => event.preventDefault()}
                className="gap-2"
              >
                <ClassIcon seriesClass={value} />
                {t(value)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-2">
          <Label>{t("Series")}</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={props.onSelectAllSeries}
            >
              {t("Select all")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={props.onClearSeries}
            >
              {t("Clear")}
            </Button>
          </div>
        </div>

        <Input type="search" aria-label={t("Search series")} placeholder={t("Search series…")} value={search} onChange={event => setSearch(event.target.value)} />
        <ScrollArea className="h-64 rounded-md border bg-muted/30">
          <div className="grid p-1">
            {props.selectedClasses.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">{t("Choose at least one class to see its series.")}</p>
            ) : null}
            {props.selectedClasses.length > 0 && visibleSeries.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">{t("No matching series.")}</p>
            ) : null}
            {visibleSeries.map((name) => (
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
