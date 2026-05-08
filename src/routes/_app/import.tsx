import { createFileRoute } from "@tanstack/react-router";
import UploadPage from "@/pages/Upload";

export const Route = createFileRoute("/_app/import")({
  component: UploadPage,
});
