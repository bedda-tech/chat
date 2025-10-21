"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import { chatModels } from "@/lib/ai/models";
import {
  type ModelTool,
  getModelTools,
  getToolDisplayName,
  getToolIcon,
} from "@/lib/ai/model-tools";
import { myProvider } from "@/lib/ai/providers";
import type { Attachment, ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { cn } from "@/lib/utils";
import { Context } from "./elements/context";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "./elements/prompt-input";
import {
  ArrowUpIcon,
  CpuIcon,
  PaperclipIcon,
  StopIcon,
} from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import type { VisibilityType } from "./visibility-selector";

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages: _messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType: _selectedVisibilityType,
  selectedModelId,
  onModelChange,
  usage,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  className?: string;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  usage?: AppUsage;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [adjustHeight]);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, []);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustHeight, localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, "", `/chat/${chatId}`);

    sendMessage({
      role: "user",
      parts: [
        ...attachments.map((attachment) => ({
          type: "file" as const,
          url: attachment.url,
          name: attachment.name,
          mediaType: attachment.contentType,
        })),
        {
          type: "text",
          text: input,
        },
      ],
    });

    setAttachments([]);
    setLocalStorageInput("");
    resetHeight();
    setInput("");

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    resetHeight,
  ]);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (_error) {
      toast.error("Failed to upload file, please try again!");
    }
  }, []);

  const _modelResolver = useMemo(() => {
    return myProvider.languageModel(selectedModelId);
  }, [selectedModelId]);

  const contextProps = useMemo(
    () => ({
      usage,
    }),
    [usage]
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error("Error uploading files!", error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile]
  );

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      <input
        className="-top-4 -left-4 pointer-events-none fixed size-0.5 opacity-0"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <PromptInput
        className="rounded-xl border border-border bg-background p-3 shadow-xs transition-all duration-200 focus-within:border-border hover:border-muted-foreground/50"
        onSubmit={(event) => {
          event.preventDefault();
          if (status !== "ready") {
            toast.error("Please wait for the model to finish its response!");
          } else {
            submitForm();
          }
        }}
      >
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            className="flex flex-row items-end gap-2 overflow-x-scroll"
            data-testid="attachments-preview"
          >
            {attachments.map((attachment) => (
              <PreviewAttachment
                attachment={attachment}
                key={attachment.url}
                onRemove={() => {
                  setAttachments((currentAttachments) =>
                    currentAttachments.filter((a) => a.url !== attachment.url)
                  );
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              />
            ))}

            {uploadQueue.map((filename) => (
              <PreviewAttachment
                attachment={{
                  url: "",
                  name: filename,
                  contentType: "",
                }}
                isUploading={true}
                key={filename}
              />
            ))}
          </div>
        )}
        <div className="flex flex-row items-start gap-1 sm:gap-2">
          <PromptInputTextarea
            autoFocus
            className="grow resize-none border-0! border-none! bg-transparent p-2 text-sm outline-none ring-0 [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden"
            data-testid="multimodal-input"
            disableAutoResize={true}
            maxHeight={200}
            minHeight={44}
            onChange={handleInput}
            placeholder="Send a message..."
            ref={textareaRef}
            rows={1}
            value={input}
          />{" "}
          <Context {...contextProps} />
        </div>
        <PromptInputToolbar className="!border-top-0 border-t-0! p-0 shadow-none dark:border-0 dark:border-transparent!">
          <PromptInputTools className="gap-0 sm:gap-0.5">
            <AttachmentsButton
              fileInputRef={fileInputRef}
              selectedModelId={selectedModelId}
              status={status}
            />
            <ModelSelectorCompact
              onModelChange={onModelChange}
              selectedModelId={selectedModelId}
            />
          </PromptInputTools>

          {status === "submitted" ? (
            <StopButton setMessages={setMessages} stop={stop} />
          ) : (
            <PromptInputSubmit
              className="size-8 rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
              disabled={!input.trim() || uploadQueue.length > 0}
              status={status}
            >
              <ArrowUpIcon size={14} />
            </PromptInputSubmit>
          )}
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) {
      return false;
    }
    if (prevProps.status !== nextProps.status) {
      return false;
    }
    if (!equal(prevProps.attachments, nextProps.attachments)) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.selectedModelId !== nextProps.selectedModelId) {
      return false;
    }

    return true;
  }
);

function PureAttachmentsButton({
  fileInputRef,
  status,
  selectedModelId,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>["status"];
  selectedModelId: string;
}) {
  const isReasoningModel = selectedModelId === "chat-model-reasoning";

  return (
    <Button
      className="aspect-square h-8 rounded-lg p-1 transition-colors hover:bg-accent"
      data-testid="attachments-button"
      disabled={status !== "ready" || isReasoningModel}
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      variant="ghost"
    >
      <PaperclipIcon size={14} style={{ width: 14, height: 14 }} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const [optimisticModelId, setOptimisticModelId] = useState(selectedModelId);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToolFilters, setSelectedToolFilters] = useState<Set<ModelTool>>(new Set());
  
  const selectedModelRef = useCallback((node: HTMLButtonElement | null) => {
    if (node && isOpen && !searchQuery) {
      // Use requestAnimationFrame to ensure the dialog is fully rendered
      requestAnimationFrame(() => {
        setTimeout(() => {
          node.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        }, 100);
      });
    }
  }, [isOpen, searchQuery]);

  useEffect(() => {
    setOptimisticModelId(selectedModelId);
  }, [selectedModelId]);

  const allAvailableTools = useMemo(() => {
    const toolsSet = new Set<ModelTool>();
    for (const model of chatModels) {
      const tools = getModelTools(model.id);
      for (const tool of tools) {
        toolsSet.add(tool);
      }
    }
    return Array.from(toolsSet);
  }, []);

  const filteredModels = useMemo(() => {
    let models = chatModels;

    // Apply text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const queryWords = query.split(/\s+/).filter(word => word.length > 0);

      models = models.filter((model) => {
        const searchText = `${model.name} ${model.description}`.toLowerCase();

        // Match if all query words are found in the combined text
        return queryWords.every(word => searchText.includes(word));
      });
    }
    
    // Apply tool filters
    if (selectedToolFilters.size > 0) {
      models = models.filter((model) => {
        const modelTools = getModelTools(model.id);
        // Model must have ALL selected tools
        return Array.from(selectedToolFilters).every((tool) =>
          modelTools.includes(tool)
        );
      });
    }
    
    return models;
  }, [searchQuery, selectedToolFilters]);

  const handleModelSelect = (modelId: string) => {
    setOptimisticModelId(modelId);
    onModelChange?.(modelId);
    startTransition(() => {
      saveChatModelAsCookie(modelId);
    });
    setIsOpen(false);
    setSearchQuery("");
    setSelectedToolFilters(new Set());
  };

  const toggleToolFilter = (tool: ModelTool) => {
    setSelectedToolFilters((prev) => {
      const newFilters = new Set(prev);
      if (newFilters.has(tool)) {
        newFilters.delete(tool);
      } else {
        newFilters.add(tool);
      }
      return newFilters;
    });
  };

  const selectedModel = useMemo(
    () => chatModels.find((m) => m.id === optimisticModelId),
    [optimisticModelId]
  );

  return (
    <>
      <Button
        className="h-8 rounded-lg px-2 transition-colors hover:bg-accent flex items-center gap-1.5"
        onClick={() => setIsOpen(true)}
        variant="ghost"
        type="button"
      >
        <CpuIcon size={16} />
        <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
          {selectedModel?.name || "Select Model"}
        </span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Model</DialogTitle>
            <DialogDescription className="text-foreground/70">
              Choose an AI model to use for your conversation
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              autoFocus
            />
            
            {allAvailableTools.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="font-medium text-muted-foreground text-xs">
                  Filter by tools:
                </div>
                <div className="flex flex-wrap gap-2">
                  {allAvailableTools.map((tool) => (
                    <Badge
                      key={tool}
                      variant={selectedToolFilters.has(tool) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedToolFilters.has(tool) && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => toggleToolFilter(tool)}
                    >
                      {(() => {
                        const Icon = getToolIcon(tool);
                        return <Icon className="mr-1 h-3 w-3" />;
                      })()}
                      {getToolDisplayName(tool)}
                    </Badge>
                  ))}
                  {selectedToolFilters.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedToolFilters(new Set())}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <div className="max-h-[400px] overflow-y-auto">
              <div className="flex flex-col gap-1">
                {filteredModels.map((model) => {
                  const modelTools = getModelTools(model.id);
                  
                  return (
                    <button
                      key={model.id}
                      ref={model.id === optimisticModelId ? selectedModelRef : null}
                      onClick={() => handleModelSelect(model.id)}
                      className={cn(
                        "flex w-full flex-col gap-2 rounded-lg p-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground",
                        model.id === optimisticModelId && "bg-accent text-accent-foreground"
                      )}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-medium text-sm">
                          {model.name}
                        </div>
                        {model.id === optimisticModelId && (
                          <div className="size-2 rounded-full bg-accent-foreground" />
                        )}
                      </div>
                      <div className={cn(
                        "text-xs leading-tight",
                        model.id === optimisticModelId ? "text-accent-foreground/80" : "text-foreground/60"
                      )}>
                        {model.description}
                      </div>
                      {modelTools.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {modelTools.map((tool) => (
                            <Badge
                              key={tool}
                              variant="secondary"
                              className={cn(
                                "h-5 px-1.5 text-[10px]",
                                model.id === optimisticModelId 
                                  ? "bg-accent-foreground/20 text-accent-foreground" 
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {(() => {
                                const Icon = getToolIcon(tool);
                                return <Icon className="mr-0.5 h-2.5 w-2.5" />;
                              })()}
                              {getToolDisplayName(tool)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
                {filteredModels.length === 0 && (
                  <div className="py-8 text-center text-foreground/60 text-sm">
                    {selectedToolFilters.size > 0 
                      ? "No models found with selected tools"
                      : "No models found"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  return (
    <Button
      className="size-7 rounded-full bg-foreground p-1 text-background transition-colors duration-200 hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground"
      data-testid="stop-button"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);
