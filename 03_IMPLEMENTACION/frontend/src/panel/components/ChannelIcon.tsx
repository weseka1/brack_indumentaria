import { Globe, MessageCircle, Instagram, Mail, Phone } from "lucide-react";
import type { Canal } from "@/data/types";
import { cn } from "../ui/cn";

const map: Record<Canal, { Icon: typeof Globe; cls: string }> = {
  web: { Icon: Globe, cls: "text-brand-700 bg-brand/10" },
  whatsapp: { Icon: MessageCircle, cls: "text-emerald-700 bg-emerald-500/10" },
  instagram: { Icon: Instagram, cls: "text-pink-700 bg-pink-500/10" },
  mail: { Icon: Mail, cls: "text-amber-700 bg-amber-500/10" },
  telefono: { Icon: Phone, cls: "text-graph-500 bg-graph/[0.06]" },
};

export default function ChannelIcon({ canal, size = "md" }: { canal: Canal; size?: "sm" | "md" }) {
  const { Icon, cls } = map[canal] ?? map.web;
  const box = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const ic = size === "sm" ? 14 : 16;
  return (
    <span className={cn("inline-flex items-center justify-center rounded-lg", box, cls)}>
      <Icon size={ic} strokeWidth={2} />
    </span>
  );
}
