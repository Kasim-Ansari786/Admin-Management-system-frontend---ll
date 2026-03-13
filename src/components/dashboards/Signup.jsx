import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Ban, CheckCircle, Search } from "lucide-react";
import CreateAccountDialog from "@/components/CreateAccountDialog";
import { fetchUserProfile, deactivateUser } from "../../../api";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const [accounts, setAccounts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const [loadingIds, setLoadingIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAccountCreated = (account) => {
    const newAccount = {
      ...account,
      id: account.id || crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      is_active: true, // Default to active
    };
    setAccounts((prev) => [newAccount, ...prev]);
    setDialogOpen(false);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await fetchUserProfile();
        if (!mounted) return;

        const normalizeUser = (u) => ({
          id: u.id || u.user_id,
          name: u.full_name || u.name || u.username || "Unknown",
          email: u.email || u.login_email || "",
          role: (u.role || "staff").toString(),
          createdAt: u.created_at || u.createdAt || new Date().toISOString(),
          // Ensure this is a boolean based on backend response
          is_active: typeof u.is_active === "boolean" ? u.is_active : true,
        });

        const normalizedData = Array.isArray(data)
          ? data.map(normalizeUser)
          : [normalizeUser(data)];
        setAccounts(normalizedData);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleBlockToggle = async (account) => {
    const userId = account.id;
    if (loadingIds.includes(userId)) return;

    try {
      setLoadingIds((prev) => [...prev, userId]);
      const response = await deactivateUser(userId);

      // Update state directly using the response from the backend
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === userId ? { ...a, is_active: response.user.is_active } : a,
        ),
      );

      toast({ title: "Success", description: response.message });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const filteredAccounts = accounts.filter(
    (account) => {
      if (!account) return false;
      const name = (account.name || "").toString().toLowerCase();
      const email = (account.email || "").toString().toLowerCase();
      const term = (searchTerm || "").toString().toLowerCase();
      return name.includes(term) || email.includes(term);
    },
  );

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE));
  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="w-full min-h-screen px-6 py-6">
      <div className="max-w-8xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Users className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Accounts</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search name or email..."
                className="pl-8 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Create Button */}
            <Button onClick={() => setDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Create Account
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr/No</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedAccounts.map((account, index) => (
                  <TableRow
                    key={account.id}
                    className={!account.is_active ? "opacity-60" : ""}
                  >
                    <TableCell>
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </TableCell>

                    <TableCell>{account.name}</TableCell>
                    <TableCell>{account.email}</TableCell>
                    <TableCell>{account.role}</TableCell>
                    <TableCell>
                      {new Date(account.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={account.is_active ? "default" : "destructive"}
                      >
                        {account.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={account.is_active ? "outline" : "default"}
                        onClick={() => handleBlockToggle(account)}
                        disabled={loadingIds.includes(account.id)}
                      >
                        {account.is_active ? (
                          <>
                            <Ban className="mr-1 h-3 w-3" /> Block
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" /> Unblock
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>

              <span className="px-2 text-sm flex items-center">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
      <CreateAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAccountCreated={handleAccountCreated}
      />
    </div>
  );
};

export default Signup;
