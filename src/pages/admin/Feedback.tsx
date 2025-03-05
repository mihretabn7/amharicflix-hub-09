
import { Outlet } from "react-router-dom";
import DashboardLayout from "@/components/admin/DashboardLayout";
import FeedbackManagement from "@/components/admin/FeedbackManagement";

const Feedback = () => {
  return (
    <div>
      <FeedbackManagement />
      <Outlet />
    </div>
  );
};

export default Feedback;
