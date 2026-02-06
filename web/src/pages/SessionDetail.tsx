import { useParams } from "react-router";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-semibold">Session Detail</h1>
      <p className="text-muted-foreground mt-2">Session ID: {id}</p>
    </div>
  );
}
