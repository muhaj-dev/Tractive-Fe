"use client";
import { TransporterProfile_AsideNav } from "@/components/nav/TransporterNav/TransporterProfile_AsideNav";
import { TransporterProfileNavbar } from "@/components/nav/TransporterNav/TransporterProfileNavbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useModalA11y } from "@/hooks/useModalA11y";
import { toast } from "sonner";
import { IoIosMenu } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";

export default function ProfileSettingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { status } = useSession();
  const [isAsideOpen, setIsAsideOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Login to become a buyer.", {
        duration: 3000,
        position: "top-center",
      });
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    }
  }, [status, router]);

  const toggleAside = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setIsAsideOpen((prev) => {
      const newState = !prev;
      return newState;
    });
  };

  // On mobile the aside is a drawer over a backdrop, so while it is open it
  // behaves as a modal: focus moves in, Tab stays inside, Escape closes it.
  const asideRef = useRef<HTMLElement>(null);
  useModalA11y(isAsideOpen, asideRef, {
    onEscape: () => setIsAsideOpen(false),
  });

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="bg-[#f1f1f1] min-h-screen">
      <nav className="bg-[#fefefe] w-full">
        <TransporterProfileNavbar />
      </nav>
      <div className="w-full relative">
        <div className="w-[95%] mx-auto flex flex-col md:flex-row gap-6 pt-4">
          {/* Hamburger menu icon for mobile */}
          {isAsideOpen ? (
            <IoCloseOutline
              className="md:hidden w-8 h-8 text-[#2b2b2b] absolute -top-25 right-3 z-50 p-1 bg-white rounded-md shadow-md cursor-pointer"
              onClick={toggleAside}
              role="button"
              aria-label="Close menu"
            />
          ) : (
            <IoIosMenu
              className="md:hidden w-8 h-8 text-[#2b2b2b] absolute top-4 right-3 p-1 bg-white rounded-md shadow-md cursor-pointer"
              onClick={toggleAside}
              role="button"
              aria-label="Open menu"
            />
          )}
          <aside
            ref={asideRef}
            role={isAsideOpen ? "dialog" : undefined}
            aria-modal={isAsideOpen ? true : undefined}
            aria-label={isAsideOpen ? "Profile menu" : undefined}
            className={`
              w-[100%] md:w-[40%] rounded-md fixed md:static top-0 left-0 h-screen md:h-auto
              bg-[#fefefe] md:bg-transparent transform transition-transform duration-300 ease-in-out
              ${
                isAsideOpen ? "translate-x-0" : "-translate-x-full"
              } md:translate-x-0
              z-40
            `}
          >
            <TransporterProfile_AsideNav />
          </aside>
          {/* Overlay for mobile when aside is open */}
          {isAsideOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
              onClick={toggleAside}
              aria-label="Close menu"
            />
          )}
          <main className="flex-1 mt-12 md:mt-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
