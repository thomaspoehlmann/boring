export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "sending" | "streaming" | "done" | "error";
};
