"use client";

import { useState, useRef } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  MailOpen,
  FileText,
  Send,
  Loader2,
  Users,
  Building2,
  Phone,
  Save,
} from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import {
  RichTextEditor,
  type RichTextEditorRef,
} from "~/components/admin/rich-text-editor";

export default function CRMPage() {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<string | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [emailSubject, setEmailSubject] = useState("");
  const editorRef = useRef<RichTextEditorRef>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data: sourcesData } = api.crm.sources.useQuery();
  const sources = sourcesData ?? [];

  const { data } = api.crm.list.useQuery({
    search: debouncedSearch || undefined,
    source,
    limit: 50,
    offset: 0,
  });

  const { data: contactDetail } = api.crm.getContact.useQuery(
    { id: expandedId! },
    { enabled: !!expandedId },
  );

  const utils = api.useUtils();

  const updateNotes = api.crm.updateNotes.useMutation({
    onSuccess: () => {
      toast.success("Notes saved");
      utils.crm.getContact.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendEmail = api.crm.sendEmail.useMutation({
    onSuccess: () => {
      toast.success("Email sent");
      setEmailSubject("");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSearch(value: string) {
    setSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(value), 300);
  }

  function handleSaveNotes(contactId: string) {
    const noteValue = notes[contactId];
    if (noteValue !== undefined) {
      updateNotes.mutate({ id: contactId, notes: noteValue });
    }
  }

  function handleSendEmail(to: string) {
    const html = editorRef.current?.getHTML() ?? "";
    if (!emailSubject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!html.trim() || html === "<p></p>") {
      toast.error("Email body is required");
      return;
    }
    sendEmail.mutate({ to, subject: emailSubject, htmlBody: html });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Contacts</h1>
        <p className="text-sm text-gray-400">{data?.total ?? 0} total</p>
      </div>

      {/* Source filter pills */}
      {sources.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSource(undefined)}
            className={
              !source
                ? "bg-[#2D5A5A]/20 text-[#5B8A8A] hover:bg-[#2D5A5A]/30 hover:text-[#5B8A8A]"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }
          >
            All Sources
          </Button>
          {sources.map((s) => (
            <Button
              key={s.source}
              variant="ghost"
              size="sm"
              onClick={() => setSource(s.source)}
              className={
                source === s.source
                  ? "bg-[#2D5A5A]/20 text-[#5B8A8A] hover:bg-[#2D5A5A]/30 hover:text-[#5B8A8A]"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }
            >
              {s.source}
              <span className="ml-1.5 text-xs text-gray-500">{s.count}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or email..."
          aria-label="Search contacts"
          className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-[#2D5A5A]/50 focus:ring-1 focus:ring-[#2D5A5A]/50"
        />
      </div>

      {/* Contact cards */}
      <div className="space-y-3">
        {!data?.items || data.items.length === 0 ? (
          <Card className="border-0 bg-white/5">
            <CardContent className="py-12 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-gray-500" />
              <p className="text-gray-500">No contacts found</p>
            </CardContent>
          </Card>
        ) : (
          data.items.map((contact) => {
            const isExpanded = expandedId === contact.id;
            const detail = isExpanded ? contactDetail : null;

            return (
              <Card key={contact.id} className="border-0 bg-white/5">
                <CardContent className="p-4">
                  {/* Collapsed row */}
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-start justify-between text-left"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : contact.id)
                    }
                    aria-expanded={isExpanded}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {contact.name}
                        </p>
                        <Badge
                          variant="secondary"
                          className="bg-[#2D5A5A]/20 text-[10px] text-[#5B8A8A]"
                        >
                          {contact.source}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">
                        {contact.email}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                        {contact.organization && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {contact.organization}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {contact.submissionCount} submission
                          {contact.submissionCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex flex-shrink-0 flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {new Date(
                            contact.lastContactAt,
                          ).toLocaleDateString()}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mt-4 space-y-5 border-t border-white/10 pt-4">
                      {/* Notes */}
                      <div>
                        <label htmlFor={`notes-${contact.id}`} className="mb-1.5 block text-xs font-medium text-gray-400">
                          Notes
                        </label>
                        <div className="flex gap-2">
                          <textarea
                            id={`notes-${contact.id}`}
                            value={
                              notes[contact.id] ??
                              detail?.notes ??
                              contact.notes ??
                              ""
                            }
                            onChange={(e) =>
                              setNotes((prev) => ({
                                ...prev,
                                [contact.id]: e.target.value,
                              }))
                            }
                            placeholder="Add notes about this contact..."
                            rows={2}
                            className="flex-1 resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#2D5A5A]/50"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="self-end text-gray-400 hover:text-white"
                            onClick={() => handleSaveNotes(contact.id)}
                            disabled={updateNotes.isPending}
                            aria-label="Save notes"
                          >
                            {updateNotes.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Submission History */}
                      <div>
                        <h3 className="mb-2 text-xs font-medium text-gray-400">
                          Submission History
                        </h3>
                        {detail?.submissions?.length ? (
                          <div className="space-y-2">
                            {detail.submissions.map((sub) => (
                              <div
                                key={sub.id}
                                className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {sub.isRead ? (
                                      <MailOpen className="h-3.5 w-3.5 text-gray-500" />
                                    ) : (
                                      <Mail className="h-3.5 w-3.5 text-[#C9725B]" />
                                    )}
                                    <span className="text-xs text-gray-500">
                                      {sub.source}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {new Date(
                                      sub.createdAt,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
                                  {sub.message.slice(0, 200)}
                                  {sub.message.length > 200 ? "..." : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No submissions yet
                          </p>
                        )}
                      </div>

                      {/* Email Composer */}
                      <div>
                        <h3 className="mb-2 text-xs font-medium text-gray-400">
                          Send Email
                        </h3>
                        <div className="space-y-2">
                          <Input
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            placeholder="Subject"
                            aria-label="Email subject"
                            className="border-white/10 bg-white/5 text-white placeholder-gray-500"
                          />
                          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
                            <RichTextEditor
                              ref={editorRef}
                              placeholder="Write your email..."
                              minHeight="120px"
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              className="rounded-full bg-[#C9725B] text-white hover:bg-[#B5624D]"
                              onClick={() => handleSendEmail(contact.email)}
                              disabled={sendEmail.isPending}
                            >
                              {sendEmail.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="mr-2 h-4 w-4" />
                                  Send Email
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
