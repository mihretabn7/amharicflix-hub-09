
import { Outlet } from "react-router-dom";
import DashboardLayout from "@/components/admin/DashboardLayout";
import DonationsManagement from "@/components/admin/DonationsManagement";

const Donations = () => {
  return (
    <div>
      <DonationsManagement />
      <Outlet />
    </div>
  );
};

export default Donations;
