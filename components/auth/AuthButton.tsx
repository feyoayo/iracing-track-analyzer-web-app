"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { UserRound, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SignInMethods } from "@/components/auth/SignInMethods";

export function SignInButton() {
  const { t } = useI18n();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="flex items-center gap-3 rounded-full border bg-card px-3 py-2 text-left shadow-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 text-sm">
            <span className="block font-medium">{t("Sign in")}</span>
            <span className="block text-xs text-muted-foreground">{t("Save your preferences")}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm gap-6 p-6 sm:p-8">
        <DialogHeader className="items-center space-y-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-muted">
            <UserRound className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </span>
          <DialogTitle className="text-xl">{t("Sign in")}</DialogTitle>
          <DialogDescription>{t("Keep your favorite series and owned tracks with you on any device.")}</DialogDescription>
        </DialogHeader>
        <SignInMethods />
      </DialogContent>
    </Dialog>
  );
}
