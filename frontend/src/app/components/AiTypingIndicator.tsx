import { motion } from 'motion/react';
import { Bot } from 'lucide-react';

export default function AiTypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg p-3 bg-secondary/10 border border-secondary/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
              <Bot className="h-3 w-3 text-secondary-foreground" />
            </div>
            <span className="text-xs font-medium text-secondary">AI Assistant</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 pl-0.5">
          <span className="text-sm text-muted-foreground">AI печатает</span>
          <div className="flex items-center gap-0.5">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-secondary/60"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-secondary/60"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: 0.2,
              }}
            />
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-secondary/60"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: 0.4,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
