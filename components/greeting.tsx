import { motion } from "framer-motion";
import Image from "next/image";

export const Greeting = () => {
  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col items-center justify-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-center"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3 }}
      >
        <Image
          alt="Bedda.ai Logo"
          className="h-auto w-full max-w-md"
          height={400}
          priority
          src="/images/bedda-logo-large-transparent.png"
          width={800}
        />
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-xl md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        Welcome to <span className="font-bold">bedda.ai</span> chat!
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-muted-foreground text-xl md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        What would you like to do today?
      </motion.div>
    </div>
  );
};
