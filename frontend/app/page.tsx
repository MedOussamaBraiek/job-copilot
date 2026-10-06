import UploadForm from "../components/UploadForm";

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Job Copilot</h1>
      <UploadForm />
    </div>
  );
}
