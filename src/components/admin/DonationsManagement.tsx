
import { DonationsDisplay } from "@/components/admin/DonationsDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DonationsManagement() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Donations Management</CardTitle>
        </CardHeader>
        <CardContent>
          <DonationsDisplay />
        </CardContent>
      </Card>
    </div>
  );
}
