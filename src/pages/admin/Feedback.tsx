
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { DashboardHeader } from "@/components/admin/DashboardHeader";
import { FeedbackManagement } from "@/components/admin/FeedbackManagement";
import { DonationsManagement } from "@/components/admin/DonationsManagement";

const AdminFeedback = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardHeader
          title="Feedback & Support"
          description="Manage user feedback and financial contributions"
        />
        
        <div className="grid gap-6">
          <FeedbackManagement />
          <DonationsManagement />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminFeedback;
