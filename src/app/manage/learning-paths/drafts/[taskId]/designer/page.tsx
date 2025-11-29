import DraftDesigner from "./draft-designer";

interface PageProps {
  params: Promise<{
    taskId: string;
  }>;
}

export default async function DraftDesignerPage({ params }: PageProps) {
  const { taskId } = await params;
  
  return <DraftDesigner taskId={taskId} />;
}
