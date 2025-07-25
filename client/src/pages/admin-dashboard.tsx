import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Heart, 
  Users, 
  Shield, 
  Search,
  Download,
  Mail,
  Trash2,
  Calendar,
  User,
  AtSign
} from "lucide-react";

interface WaitlistEntry {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const { toast } = useToast();

  // Fetch waitlist entries
  const { data: waitlistData, isLoading } = useQuery({
    queryKey: ['/api/admin/waitlist'],
    refetchInterval: 30000
  });

  const waitlist = Array.isArray(waitlistData) ? waitlistData : [];

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return fetch(`/api/admin/waitlist/${id}/status`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/waitlist'] });
      toast({
        title: "Status updated",
        description: "Waitlist entry status has been updated"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive"
      });
    }
  });

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      return fetch(`/api/admin/waitlist/${id}`, {
        method: "DELETE"
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/waitlist'] });
      toast({
        title: "Entry deleted",
        description: "Waitlist entry has been removed"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete entry",
        variant: "destructive"
      });
    }
  });

  // Export waitlist mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      return fetch("/api/admin/waitlist/export").then(res => res.json());
    },
    onSuccess: (data) => {
      // Create and download CSV
      const csv = convertToCSV(data);
      downloadCSV(csv, 'pediasignal-waitlist.csv');
      toast({
        title: "Export successful",
        description: "Waitlist exported to CSV"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export waitlist",
        variant: "destructive"
      });
    }
  });

  // Filter waitlist based on search and filters
  const filteredWaitlist = waitlist.filter((entry: WaitlistEntry) => {
    const matchesSearch = !searchTerm || 
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !filterRole || entry.role === filterRole;
    const matchesStatus = !filterStatus || entry.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Statistics
  const stats = {
    total: waitlist.length,
    pending: waitlist.filter((entry: WaitlistEntry) => entry.status === 'pending').length,
    approved: waitlist.filter((entry: WaitlistEntry) => entry.status === 'approved').length,
    rejected: waitlist.filter((entry: WaitlistEntry) => entry.status === 'rejected').length
  };

  const handleStatusUpdate = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteEntryMutation.mutate(id);
    }
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    window.location.href = '/admin/login';
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-900/30 text-green-300 border-green-600/30';
      case 'rejected':
        return 'bg-red-900/30 text-red-300 border-red-600/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/30';
    }
  };

  const convertToCSV = (data: WaitlistEntry[]) => {
    if (!data.length) return '';
    
    const headers = ['Name', 'Email', 'Role', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...data.map(entry => [
        entry.name,
        entry.email,
        entry.role,
        entry.status,
        entry.createdAt
      ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    return csvContent;
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-slate-300" />
              <h1 className="professional-heading text-xl font-light text-white">PediaSignal AI</h1>
              <div className="ml-4 flex items-center space-x-2">
                <Shield className="h-4 w-4 text-slate-400" />
                <span className="professional-text text-sm font-light text-slate-400">Admin Panel</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleExport}
                disabled={exportMutation.isPending}
                variant="outline"
                className="professional-text font-light"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="professional-text font-light"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-slate-400 mr-4" />
                <div>
                  <div className="professional-text text-2xl font-light text-white">
                    {stats.total}
                  </div>
                  <div className="professional-text text-sm text-slate-400 font-light">
                    Total Signups
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-slate-400 mr-4" />
                <div>
                  <div className="professional-text text-2xl font-light text-white">
                    {stats.pending}
                  </div>
                  <div className="professional-text text-sm text-slate-400 font-light">
                    Pending Review
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-400 mr-4" />
                <div>
                  <div className="professional-text text-2xl font-light text-white">
                    {stats.approved}
                  </div>
                  <div className="professional-text text-sm text-slate-400 font-light">
                    Approved
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trash2 className="h-8 w-8 text-red-400 mr-4" />
                <div>
                  <div className="professional-text text-2xl font-light text-white">
                    {stats.rejected}
                  </div>
                  <div className="professional-text text-sm text-slate-400 font-light">
                    Rejected
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/30 border-slate-700/50 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="professional-text font-light pl-10"
                  />
                </div>
              </div>
              
              <div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 professional-text font-light"
                >
                  <option value="">All Roles</option>
                  <option value="pediatrician">Pediatrician</option>
                  <option value="medical_student">Medical Student</option>
                  <option value="radiologist">Radiologist</option>
                  <option value="hospital_admin">Hospital Admin</option>
                  <option value="nurse">Pediatric Nurse</option>
                  <option value="researcher">Medical Researcher</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 professional-text font-light"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Waitlist Table */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="professional-text text-slate-400 font-light">Loading waitlist...</div>
              </div>
            ) : filteredWaitlist.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <div className="professional-text text-slate-400 font-light">No waitlist entries found</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-700/50">
                    <tr>
                      <th className="text-left p-4 professional-text font-light text-slate-300">Name</th>
                      <th className="text-left p-4 professional-text font-light text-slate-300">Email</th>
                      <th className="text-left p-4 professional-text font-light text-slate-300">Role</th>
                      <th className="text-left p-4 professional-text font-light text-slate-300">Date</th>
                      <th className="text-left p-4 professional-text font-light text-slate-300">Status</th>
                      <th className="text-left p-4 professional-text font-light text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWaitlist.map((entry: WaitlistEntry) => (
                      <tr key={entry.id} className="border-b border-slate-700/30">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <User className="h-5 w-5 text-slate-400" />
                            <span className="professional-text text-slate-200 font-light">
                              {entry.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <AtSign className="h-4 w-4 text-slate-400" />
                            <span className="professional-text text-slate-300 font-light text-sm">
                              {entry.email}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="professional-text text-slate-300 font-light">
                            {formatRole(entry.role)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="professional-text text-slate-400 font-light text-sm">
                            {formatDate(entry.createdAt)}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge className={`font-light ${getStatusColor(entry.status)}`}>
                            {entry.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {entry.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusUpdate(entry.id, 'approved')}
                                  className="professional-text font-light text-xs bg-green-900/30 hover:bg-green-900/50 border-green-600/30"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusUpdate(entry.id, 'rejected')}
                                  className="professional-text font-light text-xs bg-red-900/30 hover:bg-red-900/50 border-red-600/30"
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(entry.id)}
                              className="professional-text font-light text-xs"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Helper functions for CSV export
function convertToCSV(data: any[]): string {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}