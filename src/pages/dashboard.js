import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/layout/PageHeader';
import HeaderQuickActions from '../components/layout/HeaderQuickActions';
import Divider from '../components/ui/Divider';
import Card from '../components/ui/Card';

export default function DashboardPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your workspace."
        actions={<HeaderQuickActions />}
      />
      <Divider className="mb-1" />
      <Card className="w-full">
        <p className="font-body text-body text-ch-main">
          Dashboard content is being rebuilt in the next milestone — this page currently proves the
          shared shell (sidebar, header, quick actions) matches the design.
        </p>
      </Card>
    </AppLayout>
  );
}
