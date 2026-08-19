import AppLayout from "../components/layout/AppLayout";
import PageHeader from "../components/layout/PageHeader";
import HeaderQuickActions from "../components/layout/HeaderQuickActions";
import Divider from "../components/ui/Divider";
import Card from "../components/ui/Card";

export default function QuickLinksPage() {
  return (
    <AppLayout>
      <PageHeader title="Quick Links" subtitle="Manage your quick access links." actions={<HeaderQuickActions />} />
      <Divider className="mb-1" />
      <Card className="w-full">
        <p className="font-body text-body text-ch-main">
          This page is scaffolded and routed, with full functionality to be built in a later milestone.
        </p>
      </Card>
    </AppLayout>
  );
}
