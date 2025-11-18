import PathDesigner from "./path-designer";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PathDesignerPage({ params }: PageProps) {
  const { id } = await params;
  
  return <PathDesigner pathId={id} />;
}
