import type { ReactNode } from "react";
import { Section } from "@/modules/marketing/ui/wrapper";

interface LegalArticleProps {
  children: ReactNode;
}

export function LegalArticle({ children }: LegalArticleProps) {
  return (
    <Section variant="card">
      <article className="relative mx-auto max-w-[50em] overflow-hidden p-4 text-left">
        <div className="text-muted-foreground [&_a]:text-primary [&_a:hover]:text-primary/80 [&_blockquote]:border-primary/40 [&_blockquote]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_hr]:border-border/60 [&_p]:text-muted-foreground [&_strong]:text-foreground flex w-full flex-col gap-6 text-base leading-relaxed **:transition-colors [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_hr]:my-8 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </div>
      </article>
    </Section>
  );
}
