"use client";

import { useRouter } from "next/navigation";
import { useChat } from "@/components/chat-store";
import { Composer } from "@/components/composer";
import { Logo } from "@/components/ui";

export default function NewChat() {
  const { send } = useChat();
  const router = useRouter();
  return (
    <>
      <div className="mobile-logo"><Logo height={24} /></div>
      <main className="chat-home">
        <div className="chat-home-inner">
          <h1 className="hero">One chat. A whole finance team.</h1>
          <Composer autoFocus onSend={(text, files) => router.push(`/chat/${send(null, text, files)}`)} />
        </div>
      </main>
    </>
  );
}
