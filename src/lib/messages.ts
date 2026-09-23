import type { MessagePriorityTag } from "@/types/database";

export const MESSAGE_PRIORITY_TAGS: {
  value: MessagePriorityTag;
  label: string;
  description: string;
}[] = [
  {
    value: "normal",
    label: "Normal",
    description: "Mensagem padrão",
  },
  {
    value: "urgent",
    label: "Urgente",
    description: "Exige atenção imediata",
  },
  {
    value: "important",
    label: "Informativa",
    description: "Contexto ou aviso",
  },
];

export function getMessagePriorityLabel(tag: MessagePriorityTag) {
  return (
    MESSAGE_PRIORITY_TAGS.find((item) => item.value === tag)?.label ?? tag
  );
}
