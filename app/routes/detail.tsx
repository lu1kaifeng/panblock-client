import { useNavigate } from "react-router";
import type { Route } from "./+types/detail";
import { BlockDetailDialog } from "~/pages/BlockDetailDialog";

export default function BlockDialogRoute({ params }: Route.ComponentProps) {
    const navigate = useNavigate();

    return (
        <BlockDetailDialog
        />
    );
}