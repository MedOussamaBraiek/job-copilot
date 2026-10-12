import Link from "next/link";
import UploadForm from "../../components/UploadForm";
import { Button } from "@/components/ui/button";

export default function NewApplication() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <Link href="/history">
          <Button variant="outline">View Applications</Button>
        </Link>
      </div>
      <UploadForm />
    </div>
  );
}
