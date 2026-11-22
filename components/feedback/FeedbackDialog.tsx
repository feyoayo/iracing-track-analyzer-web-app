"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { useState } from "react";
import { MessageSquareMore } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function FeedbackDialog() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setError("");
          setSuccess("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          aria-label={t("Share your feedback")}
          className="group fixed right-4 bottom-4 z-40 h-12 gap-0 rounded-full px-4 shadow-lg motion-reduce:transition-none sm:right-6 sm:bottom-6"
        >
          <MessageSquareMore aria-hidden="true" className="h-5 w-5 shrink-0" />
          <span className="grid grid-cols-[0fr] opacity-0 transition-[grid-template-columns,opacity] duration-200 ease-out group-hover:grid-cols-[1fr] group-hover:opacity-100 group-focus-visible:grid-cols-[1fr] group-focus-visible:opacity-100 motion-reduce:transition-none">
            <span className="overflow-hidden">
              <span className="pl-2">{t("Share your feedback")}</span>
            </span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Share your feedback")}</DialogTitle>
          <DialogDescription>
            {t("Tell me what works, what is confusing, or what should be added next.")}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setSuccess("");

            const trimmedMessage = message.trim();
            const trimmedName = name.trim();

            if (trimmedMessage.length < 5) {
              setError("Please share at least a short thought.");
              return;
            }

            setIsSubmitting(true);
            try {
              const response = await fetch("/api/feedback", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  message: trimmedMessage,
                  name: trimmedName || null,
                  pagePath: pathname,
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to submit feedback.");
              }

              setMessage("");
              setName("");
              setSuccess("Thanks. Your feedback was submitted.");
            } catch {
              setError(
                "Failed to submit feedback.",
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="feedback-message">{t("Share your thoughts:")}</Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={1000}
              placeholder={t("What should be improved?")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="feedback-name">{t("Your name (optional):")}</Label>
            <Input
              id="feedback-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              placeholder={t("How should I refer to you?")}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{t(error)}</p> : null}
          {success ? <p className="text-sm text-green-700">{t(success)}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {t(isSubmitting ? "Submitting..." : "Submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
