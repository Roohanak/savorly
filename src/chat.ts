export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; action?: string };
export function validConversation(value: unknown): value is ChatMessage[] | undefined {
  return value === undefined || (Array.isArray(value) && value.length <= 60 && new Set(value.map(m=>m?.id)).size === value.length && value.every(m=>m && typeof m.id === "string" && ["user","assistant"].includes(m.role) && typeof m.content === "string" && m.content.length > 0 && m.content.length <= 12000 && (m.action === undefined || ["question","polish","compare","swaps","caption"].includes(m.action))));
}
export function recentHistory(messages: ChatMessage[]) {
  let size=0;
  const recent: {role:"user"|"assistant";content:string}[]=[];
  for (const m of messages.slice(-20).reverse()) {if(size+m.content.length>24000)break;recent.unshift({role:m.role,content:m.content});size+=m.content.length;}
  // A truncated history should start at a user turn.
  while(recent[0]?.role === "assistant")recent.shift();
  return recent;
}
