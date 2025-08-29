import Image from "next/image";
import Link from "next/link";
import TimelinePage from "./timeline/page";

export default function Home() {
  return (
    <main>
      <Link href="/timeline">Click here to see timelineviewer</Link>
    </main>
  );
}
