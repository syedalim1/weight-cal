"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.jsx";
import {
  Package,
  IndianRupee,
  Search,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase.js";
import { toast } from "sonner";

export default function ProductList() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchProducts = async () => {
    if (!supabase) {
      setError("Supabase not configured. Please add credentials to .env.local");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("product_pricing")
      .select("*")
      .order("model_number", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id, modelNumber) => {
    setDeletingId(id);
    const { error: deleteError } = await supabase
      .from("product_pricing")
      .delete()
      .eq("id", id);

    if (deleteError) {
      toast.error("Failed to delete product", {
        description: deleteError.message,
      });
    } else {
      toast.success("Product deleted", {
        description: `${modelNumber || "Product"} has been removed`,
      });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
    setDeletingId(null);
  };

  const handleEdit = (id) => {
    router.push(`/pricing?edit=${id}`);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fmt = (v) =>
    Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const filtered = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.model_number || "").toLowerCase().includes(term) ||
      (p.product_type || "").toLowerCase().includes(term) ||
      (p.material_type || "").toLowerCase().includes(term)
    );
  });

  const materialLabel = (t) => (t === "ss" ? "SS" : t === "ms" ? "MS" : t);
  const typeLabel = (t) => t?.charAt(0).toUpperCase() + t?.slice(1);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <Button variant="ghost" size="icon" className="rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Product Prices
              </h1>
              <p className="text-sm text-muted-foreground">
                All saved products sorted by model number
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search model, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchProducts}
              disabled={loading}
              className="shrink-0"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Total Products
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {products.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Chairs
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {products.filter((p) => p.product_type === "chair").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Tables
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {products.filter((p) => p.product_type === "table").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Sets
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {products.filter((p) => p.product_type === "set").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <Card>
            <CardContent className="pt-10 pb-10 text-center space-y-3">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="text-lg font-medium text-muted-foreground">
                {searchTerm
                  ? "No products match your search"
                  : "No products saved yet"}
              </p>
              {!searchTerm && (
                <Link href="/pricing">
                  <Button variant="outline" className="mt-2">
                    <IndianRupee className="h-4 w-4 mr-2" />
                    Go to Pricing Calculator
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Products Table */}
        {!loading && filtered.length > 0 && (
          <Card>
            <CardContent className="pt-0 px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Model</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right text-blue-600 dark:text-blue-400">
                        Wholesale
                      </TableHead>
                      <TableHead className="text-right text-amber-600 dark:text-amber-400">
                        Retail
                      </TableHead>
                      <TableHead className="text-right text-emerald-600 dark:text-emerald-400">
                        Showroom
                      </TableHead>
                      <TableHead className="text-center pr-6">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id} className="group">
                        <TableCell className="pl-6 font-mono font-semibold">
                          {p.model_number || (
                            <span className="text-muted-foreground italic">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {typeLabel(p.product_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              p.material_type === "ss"
                                ? "border-sky-500/40 text-sky-600 dark:text-sky-400"
                                : "border-orange-500/40 text-orange-600 dark:text-orange-400"
                            }
                          >
                            {materialLabel(p.material_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {p.width && p.length
                            ? `${p.width} × ${p.length}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          ₹{fmt(p.total_cost)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-blue-600 dark:text-blue-400">
                          ₹{fmt(p.wholesale_price)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-amber-600 dark:text-amber-400">
                          ₹{fmt(p.retail_price)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                          ₹{fmt(p.showroom_price)}
                        </TableCell>
                        <TableCell className="pr-6">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleEdit(p.id)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                  disabled={deletingId === p.id}
                                >
                                  {deletingId === p.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Product
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete{" "}
                                    <strong>
                                      {p.model_number || "this product"}
                                    </strong>
                                    ? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() =>
                                      handleDelete(p.id, p.model_number)
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""} — All
          prices in INR (₹)
        </p>
      </div>
    </div>
  );
}
