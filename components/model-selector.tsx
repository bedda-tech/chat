"use client";

import type { Session } from "next-auth";
import { startTransition, useMemo, useOptimistic, useState } from "react";
import { saveChatModelAsCookie } from "@/app/(chat)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { chatModels } from "@/lib/ai/models";
import {
  type ModelTool,
  getModelTools,
  getToolDisplayName,
  getToolIcon,
} from "@/lib/ai/model-tools";
import { getModelIdealUse } from "@/lib/ai/model-config";
import { useAvailableModels } from "@/hooks/use-available-models";
import { cn } from "@/lib/utils";
import { CheckCircleFillIcon, ChevronDownIcon } from "./icons";

export function ModelSelector({
  session,
  selectedModelId,
  className,
}: {
  session: Session;
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedToolFilters, setSelectedToolFilters] = useState<Set<ModelTool>>(new Set());

  // Fetch dynamic models from AI Gateway
  const { models: dynamicModels, isLoading, isFallback } = useAvailableModels();

  const userType = session.user.type;
  const { availableChatModelIds } = entitlementsByUserType[userType];

  // Use dynamic models if available, fallback to static models
  const availableChatModels = useMemo(() => {
    // Merge dynamic models with static models for backward compatibility
    const allModels = dynamicModels.length > 0 ? [
      ...dynamicModels.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
      })),
      ...chatModels // Keep legacy models
    ] : chatModels;

    // Filter by entitlements
    return allModels.filter((chatModel) =>
      availableChatModelIds.includes(chatModel.id)
    );
  }, [dynamicModels, availableChatModelIds]);

  const allAvailableTools = useMemo(() => {
    const toolsSet = new Set<ModelTool>();
    for (const model of availableChatModels) {
      const tools = getModelTools(model.id);
      for (const tool of tools) {
        toolsSet.add(tool);
      }
    }
    return Array.from(toolsSet);
  }, [availableChatModels]);

  const filteredModels = useMemo(() => {
    let models = availableChatModels;
    
    // Apply text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      models = models.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.description.toLowerCase().includes(query)
      );
    }
    
    // Apply tool filters
    if (selectedToolFilters.size > 0) {
      models = models.filter((model) => {
        const modelTools = getModelTools(model.id);
        return Array.from(selectedToolFilters).every((tool) =>
          modelTools.includes(tool)
        );
      });
    }
    
    return models;
  }, [availableChatModels, searchQuery, selectedToolFilters]);

  const selectedChatModel = useMemo(
    () =>
      availableChatModels.find(
        (chatModel) => chatModel.id === optimisticModelId
      ),
    [optimisticModelId, availableChatModels]
  );

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

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
          className
        )}
      >
        <Button
          className="md:h-[34px] md:px-2"
          data-testid="model-selector"
          variant="outline"
        >
          {selectedChatModel?.name}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[280px] max-w-[90vw] sm:min-w-[400px]"
      >
        {/* Dynamic Model Discovery Status */}
        {(isLoading || isFallback || dynamicModels.length > 0) && (
          <div className="border-b border-border px-3 py-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                Loading models from AI Gateway...
              </div>
            )}
            {!isLoading && dynamicModels.length > 0 && !isFallback && (
              <div className="flex items-center gap-2 text-green-600 text-xs dark:text-green-400">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                {dynamicModels.length} models discovered dynamically
              </div>
            )}
            {isFallback && (
              <div className="flex items-center gap-2 text-yellow-600 text-xs dark:text-yellow-400">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                Using cached models (live data unavailable)
              </div>
            )}
          </div>
        )}

        <div className="p-2 pb-0">
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2 h-8 text-sm"
          />
          
          {allAvailableTools.length > 0 && (
            <div className="mb-2 flex flex-col gap-2">
              <div className="font-medium text-muted-foreground text-xs">
                Filter by tools:
              </div>
              <div className="flex flex-wrap gap-1">
                {allAvailableTools.map((tool) => (
                  <Badge
                    key={tool}
                    variant={selectedToolFilters.has(tool) ? "default" : "outline"}
                    className={cn(
                      "h-6 cursor-pointer px-2 text-xs transition-colors",
                      selectedToolFilters.has(tool) && "bg-primary text-primary-foreground"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleToolFilter(tool);
                    }}
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
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {filteredModels.map((chatModel) => {
            const { id } = chatModel;
            const modelTools = getModelTools(id);
            const idealUse = getModelIdealUse(id);

            return (
              <DropdownMenuItem
                asChild
                data-active={id === optimisticModelId}
                data-testid={`model-selector-item-${id}`}
                key={id}
                onSelect={() => {
                  setOpen(false);
                  setSearchQuery("");
                  setSelectedToolFilters(new Set());

                  startTransition(() => {
                    setOptimisticModelId(id);
                    saveChatModelAsCookie(id);
                  });
                }}
              >
                <button
                  className="group/item flex w-full flex-row items-center justify-between gap-2 sm:gap-4"
                  type="button"
                >
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                    <div className="text-sm sm:text-base">{chatModel.name}</div>
                    <div className="line-clamp-2 text-muted-foreground text-xs">
                      {chatModel.description}
                    </div>
                    {idealUse && (
                      <div className="text-[10px] text-muted-foreground/70 italic">
                        Best for: {idealUse}
                      </div>
                    )}
                    {modelTools.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {modelTools.map((tool) => (
                          <Badge
                            key={tool}
                            variant="secondary"
                            className="h-5 px-1.5 text-[10px]"
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
                  </div>

                  <div className="shrink-0 text-foreground opacity-0 group-data-[active=true]/item:opacity-100 dark:text-foreground">
                    <CheckCircleFillIcon />
                  </div>
                </button>
              </DropdownMenuItem>
            );
          })}
          {filteredModels.length === 0 && (
            <div className="py-8 text-center text-foreground/60 text-sm">
              {selectedToolFilters.size > 0 
                ? "No models found with selected tools"
                : searchQuery.trim()
                  ? "No models found"
                  : "No models available"}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
