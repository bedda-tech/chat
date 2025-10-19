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
      className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 py-4"
      key="overview"
    >
      {/* Logo container - scales based on available space */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-[200px] shrink-0 justify-center"
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
        className="flex shrink-0 flex-col gap-2 text-center"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        <div className="font-normal text-base sm:text-lg md:text-xl">
          Welcome to <span className="font-bold">bedda.ai</span> chat!
        </div>
        <div className="text-muted-foreground text-sm sm:text-base">
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
