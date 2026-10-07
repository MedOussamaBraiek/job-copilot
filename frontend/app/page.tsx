import Link from "next/link";
import UploadForm from "../components/UploadForm";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Job Copilot</h1>
        <Link href="/history">
          <Button variant="outline">View Applications</Button>
        </Link>
      </div>
      <UploadForm />
    </div>
  );
}
