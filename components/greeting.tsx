import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { ChatMessage } from "@/lib/types";
import { SuggestedActions } from "./suggested-actions";
import type { VisibilityType } from "./visibility-selector";

type GreetingProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
  onModelChange?: (modelId: string) => void;
};

export const Greeting = ({
  chatId,
  sendMessage,
  selectedVisibilityType,
  onModelChange,
}: GreetingProps) => {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 sm:py-4"
      key="overview"
    >
      {/* Logo container - scales based on available space */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-[80px] shrink-0 justify-center sm:max-w-[100px] md:max-w-[120px]"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3 }}
      >
        <Image
          alt="Bedda.ai Logo"
          className="h-auto w-full object-contain"
          height={400}
          priority
          src="/images/bedda-logo-large-transparent.png"
          width={800}
        />
      </motion.div>

      {/* Text container - responsive sizing */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex shrink-0 flex-col gap-1 text-center sm:gap-2"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-sm font-normal sm:text-base md:text-lg">
          Welcome to <span className="font-bold">bedda.ai</span> chat!
        </div>
        <div className="text-muted-foreground text-xs sm:text-sm md:text-base">
          What would you like to do today?
        </div>
      </motion.div>

      {/* Suggested actions - grows to fill space but doesn't overflow */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl shrink-0"
        exit={{ opacity: 0, y: 20 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.7 }}
      >
        <SuggestedActions
          chatId={chatId}
          onModelChange={onModelChange}
          selectedVisibilityType={selectedVisibilityType}
          sendMessage={sendMessage}
        />
      </motion.div>
    </div>
  );
};
