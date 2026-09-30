import Image from "next/image";
import Link from "next/link";

interface ErrorScreenProps {
  title: string;
  message: string;
  /** Shown as a "Try again" button when supplied (error boundaries only). */
  onRetry?: () => void;
}

/** Full-page fallback shared by not-found, error and global-error, so a crash
 * or bad link still leaves the user on a branded page with a way home. */
export default function ErrorScreen({ title, message, onRetry }: ErrorScreenProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#fefefe] px-4 font-montserrat">
      <div className="flex flex-col items-center text-center max-w-[420px] gap-4">
        <Image
          src="/images/signinloginlogo.png"
          alt="Agrictech"
          width={127}
          height={80}
          className="w-[127px] h-[80px]"
        />
        <h1 className="text-[22px] text-[#2b2b2b] font-semibold">{title}</h1>
        <p className="text-[14px] text-[#808080]">{message}</p>
        <div className="flex gap-3 pt-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="py-2 px-5 rounded-md border border-[#538e53] text-[#538e53] text-[13px] cursor-pointer"
            >
              Try again
            </button>
          )}
          <Link
            href="/"
            className="py-2 px-5 rounded-md bg-[#538e53] text-white text-[13px]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
