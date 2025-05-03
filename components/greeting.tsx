import { motion } from "framer-motion";
import Image from "next/image";

export const Greeting = () => {
  return (
    <div
      className="mx-auto mt-1 flex size-full max-w-3xl flex-col items-center justify-center px-2 md:mt-8 md:px-8 lg:mt-16"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 flex justify-center md:mb-6"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3 }}
      >
        <Image
          alt="Bedda.ai Logo"
          className="h-auto w-full max-w-[120px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-[240px] xl:max-w-[280px]"
          height={400}
          priority
          src="/images/bedda-logo-large-transparent.png"
          width={800}
        />
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-1 text-center text-sm md:mb-2 md:text-xl lg:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        Welcome to <span className="font-bold">bedda.ai</span> chat!
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="hidden text-center text-muted-foreground text-sm sm:block md:text-base lg:text-xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        What would you like to do today?
      </motion.div>
    </div>
  );
};
