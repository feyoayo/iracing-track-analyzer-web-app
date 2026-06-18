"use client";

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
        <Button type="button" variant="outline">
          <MessageSquareMore className="h-4 w-4" />
          Share your feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share your feedback</DialogTitle>
          <DialogDescription>
            Tell me what works, what is confusing, or what should be added next.
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

              const payload = (await response.json()) as { error?: string };
              if (!response.ok) {
                throw new Error(payload.error || "Failed to submit feedback.");
              }

              setMessage("");
              setName("");
              setSuccess("Thanks. Your feedback was submitted.");
            } catch (submissionError) {
              setError(
                submissionError instanceof Error
                  ? submissionError.message
                  : "Failed to submit feedback.",
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="feedback-message">Share your thoughts:</Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={1000}
              placeholder="What should be improved?"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="feedback-name">Your name (optional):</Label>
            <Input
              id="feedback-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              placeholder="How should I refer to you?"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-green-700">{success}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
