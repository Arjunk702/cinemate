import MouseScroll from "@/components/MouseScroll";

export const metadata = {
  title: "WSP - Wireless Mouse",
  description: "Experience precision and titanium drivers in the WSP Wireless Mouse.",
};

export default function MousePage() {
  return (
    <main className="min-h-screen bg-black">
      {/* 
        This renders the MouseScroll animation component 
        We place it on its own layout to prevent other elements from overlapping 
      */}
      <MouseScroll />
    </main>
  );
}
