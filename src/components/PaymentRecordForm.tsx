import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordUPIPayment } from "@/lib/api";
import { Plus, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentRecordFormProps {
  onSuccess?: () => void;
}

const PaymentRecordForm = ({ onSuccess }: PaymentRecordFormProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    amount: "",
    upiReference: "",
    donorName: "",
    donorPhone: "",
    region: "",
    description: "",
  });

  const mutation = useMutation({
    mutationFn: recordUPIPayment,
    onSuccess: async (data) => {
      // Show success message with blockchain details
      if (data.transaction.status === 'verified' && data.transaction.hash.startsWith('0x')) {
        toast.success("Payment confirmed on blockchain!", {
          description: `Transaction ${data.transaction.id} verified on Polygon Amoy. Block: ${data.transaction.blockNumber || 'N/A'}`,
          duration: 6000,
          action: {
            label: "View on PolygonScan",
            onClick: () => window.open(`https://amoy.polygonscan.com/tx/${data.transaction.hash}`, '_blank'),
          },
        });
      } else {
        toast.success("Payment recorded successfully!", {
          description: `Transaction ${data.transaction.id} saved (blockchain verification pending)`,
          duration: 5000,
        });
      }

      // Reset form
      setFormData({
        amount: "",
        upiReference: "",
        donorName: "",
        donorPhone: "",
        region: "",
        description: "",
      });

      // Add transaction optimistically to cache (will show immediately)
      queryClient.setQueryData(['transactions'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          transactions: [data.transaction, ...(oldData.transactions || [])],
        };
      });

      // Refetch to get latest state (includes real blockchain hash)
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.refetchQueries({ queryKey: ['transactions'] });
      
      // Continue auto-refreshing for a few seconds to catch blockchain confirmation updates
      let refreshCount = 0;
      const refreshInterval = setInterval(() => {
        refreshCount++;
        queryClient.refetchQueries({ queryKey: ['transactions'] });
        if (refreshCount >= 5) { // Refetch 5 times (10 seconds total)
          clearInterval(refreshInterval);
        }
      }, 2000);
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to record payment", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.upiReference) {
      toast.error("Required fields missing", {
        description: "Please fill in Amount and UPI Reference.",
      });
      return;
    }

    mutation.mutate({
      amount: parseFloat(formData.amount),
      upiReference: formData.upiReference,
      donorName: formData.donorName || undefined,
      donorPhone: formData.donorPhone || undefined,
      region: formData.region || undefined,
      description: formData.description || undefined,
    });
  };

  const regions = [
    "Kerala Flood Zones",
    "Assam Flood Plains",
    "Mumbai Coastal Area",
    "Odisha Cyclone Zone",
    "Bihar Flood Plains",
    "Uttar Pradesh Flood Zone",
    "West Bengal Delta",
    "Andhra Pradesh Coast",
    "Tamil Nadu Coast",
    "Gujarat Coast",
    "Sikkim",
    "Arunachal Pradesh",
    "Rajasthan Desert",
    "Maharashtra Drought Zone",
    "Telangana",
  ];

  return (
    <Card className="p-6 border-accent/30">
      <div className="flex items-center gap-3 mb-6">
        <Plus className="w-6 h-6 text-accent" />
        <h3 className="text-xl font-semibold">Record UPI Payment</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Amount */}
          <div>
            <Label htmlFor="amount">
              Amount (₹) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="500"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          {/* UPI Reference */}
          <div>
            <Label htmlFor="upiReference">
              UPI Reference <span className="text-destructive">*</span>
            </Label>
            <Input
              id="upiReference"
              type="text"
              placeholder="UPI1234567890123456"
              value={formData.upiReference}
              onChange={(e) => setFormData({ ...formData, upiReference: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Donor Name */}
          <div>
            <Label htmlFor="donorName">Donor Name</Label>
            <Input
              id="donorName"
              type="text"
              placeholder="John Doe"
              value={formData.donorName}
              onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
            />
          </div>

          {/* Donor Phone */}
          <div>
            <Label htmlFor="donorPhone">Donor Phone</Label>
            <Input
              id="donorPhone"
              type="tel"
              placeholder="+91-9876543210"
              value={formData.donorPhone}
              onChange={(e) => setFormData({ ...formData, donorPhone: e.target.value })}
            />
          </div>
        </div>

        {/* Region */}
        <div>
          <Label htmlFor="region">Region</Label>
          <Select
            value={formData.region}
            onValueChange={(value) => setFormData({ ...formData, region: value })}
          >
            <SelectTrigger id="region">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Donation for flood relief"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Processing on Blockchain... (2-5 seconds)</span>
            </>
          ) : mutation.isSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Recorded & Verified!
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </>
          )}
        </Button>

        {/* Loading State Info */}
        {mutation.isPending && (
          <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-600 flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Sending transaction to Polygon Amoy blockchain and waiting for confirmation...</span>
            </p>
            <p className="text-xs text-blue-500/70 mt-1">
              This creates a real blockchain transaction with verifiable hash on PolygonScan
            </p>
          </div>
        )}

        {mutation.isError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>{mutation.error?.message || "Failed to record payment"}</span>
          </div>
        )}
      </form>
    </Card>
  );
};

export default PaymentRecordForm;

