import { ChatProvider } from "@/components/chat-store";
import { KeyboardShortcuts, OfflineBanner, Sidebar, TabBar } from "@/components/shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatProvider>
      <KeyboardShortcuts />
      <div className="shell">
        <Sidebar />
        <div className="shell-main" id="main">
          <OfflineBanner />
          {children}
          <TabBar />
        </div>
      </div>
    </ChatProvider>
  );
}
