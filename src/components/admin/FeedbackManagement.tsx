
import { FeedbackDisplay } from "@/components/admin/FeedbackDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FeedbackManagement() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feedback Management</CardTitle>
        </CardHeader>
        <CardContent>
          <FeedbackDisplay />
        </CardContent>
      </Card>
    </div>
  );
}
