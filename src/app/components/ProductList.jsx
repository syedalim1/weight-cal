"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
} from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Separator } from "@/components/ui/separator.jsx";
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
  ArrowUpDown,
  Filter,
  Plus,
  Weight,
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
  const [filterType, setFilterType] = useState("all"); // all, chair, table, set
  const [sortBy, setSortBy] = useState("model"); // model, cost, date

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
      .order("created_at", { ascending: false });

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
    Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  const fmtDec = (v) =>
    Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  // Filtered + sorted products
  const filtered = useMemo(() => {
    let list = products;

    // Filter by type
    if (filterType !== "all") {
      list = list.filter((p) => p.product_type === filterType);
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          (p.model_number || "").toLowerCase().includes(term) ||
          (p.product_type || "").toLowerCase().includes(term) ||
          (p.material_type || "").toLowerCase().includes(term)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === "model") return (a.model_number || "").localeCompare(b.model_number || "");
      if (sortBy === "cost") return (b.total_cost || 0) - (a.total_cost || 0);
      if (sortBy === "date") return new Date(b.created_at) - new Date(a.created_at);
      return 0;
    });

    return list;
  }, [products, filterType, searchTerm, sortBy]);

  const typeLabel = (t) => t?.charAt(0).toUpperCase() + t?.slice(1);

  const typeEmoji = (t) => {
    if (t === "chair") return "🪑";
    if (t === "table") return "🪵";
    if (t === "set") return "🛋️";
    return "📦";
  };

  const filterCounts = useMemo(() => ({
    all: products.length,
    chair: products.filter((p) => p.product_type === "chair").length,
    table: products.filter((p) => p.product_type === "table").length,
    set: products.filter((p) => p.product_type === "set").length,
  }), [products]);

  return (
    <div className="min-h-screen p-3 md:p-6 lg:p-8 bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                Products
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {products.length} products saved
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchProducts}
              disabled={loading}
              className="h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Link href="/pricing">
              <Button size="sm" className="h-9 gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search model, type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs shrink-0"
            onClick={() => {
              const options = ["model", "cost", "date"];
              const idx = options.indexOf(sortBy);
              setSortBy(options[(idx + 1) % options.length]);
            }}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {sortBy === "model" ? "A-Z" : sortBy === "cost" ? "Price" : "Recent"}
            </span>
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {[
            { key: "all", label: "All" },
            { key: "chair", label: "🪑 Chairs" },
            { key: "table", label: "🪵 Tables" },
            { key: "set", label: "🛋️ Sets" },
          ].map((f) => (
            <Button
              key={f.key}
              variant={filterType === f.key ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs rounded-full px-3 shrink-0"
              onClick={() => setFilterType(f.key)}
            >
              {f.label}
              <Badge
                variant="secondary"
                className={`ml-1.5 h-5 min-w-[20px] text-[10px] px-1.5 ${
                  filterType === f.key
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : ""
                }`}
              >
                {filterCounts[f.key]}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
                {searchTerm ? "No products match your search" : "No products saved yet"}
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

        {/* Product Cards */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Card
                key={p.id}
                className="group hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Card Header */}
                  <div className="flex items-center justify-between p-3 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{typeEmoji(p.product_type)}</span>
                      <div className="min-w-0">
                        <p className="font-mono font-bold text-base truncate">
                          {p.model_number || (
                            <span className="text-muted-foreground italic text-sm">No Model</span>
                          )}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] h-5 capitalize">
                            {typeLabel(p.product_type)}
                          </Badge>
                          {p.width && p.length && (
                            <span className="text-[10px] text-muted-foreground">
                              {p.width}×{p.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => handleEdit(p.id)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500"
                            disabled={deletingId === p.id}
                          >
                            {deletingId === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete{" "}
                              <strong>{p.model_number || "this product"}</strong>?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => handleDelete(p.id, p.model_number)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Pipe Weight Info */}
                  {p.total_pipe_weight > 0 && (
                    <div className="mx-3 mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Weight className="h-3 w-3" />
                      <span>{fmtDec(p.total_pipe_weight)} kg pipe weight</span>
                    </div>
                  )}

                  <Separator />

                  {/* SS vs MS Pricing */}
                  <div className="grid grid-cols-2 divide-x">
                    {/* SS Column */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-2 h-2 rounded-full bg-sky-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                          SS
                        </span>
                        {p.ss_price_per_kg > 0 && (
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            ₹{fmt(p.ss_price_per_kg)}/kg
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                        <p className="text-sm font-bold tabular-nums">
                          ₹{fmt(p.ss_total_cost || p.total_cost)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-blue-600 dark:text-blue-400">Wholesale</span>
                          <span className="font-semibold tabular-nums">
                            ₹{fmt((p.ss_total_cost || p.total_cost) * (1 + (p.ss_wholesale_percent || 15) / 100))}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-amber-600 dark:text-amber-400">Retail</span>
                          <span className="font-semibold tabular-nums">
                            ₹{fmt((p.ss_total_cost || p.total_cost) * (1 + (p.ss_retail_percent || 25) / 100))}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-emerald-600 dark:text-emerald-400">Showroom</span>
                          <span className="font-semibold tabular-nums">
                            ₹{fmt((p.ss_total_cost || p.total_cost) * (1 + (p.ss_showroom_percent || 45) / 100))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* MS Column */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                          MS
                        </span>
                        {p.ms_price_per_kg > 0 && (
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            ₹{fmt(p.ms_price_per_kg)}/kg
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                        <p className="text-sm font-bold tabular-nums">
                          ₹{fmt(p.ms_total_cost || p.total_cost)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-blue-600 dark:text-blue-400">Wholesale</span>
                          <span className="font-semibold tabular-nums">
                            ₹{fmt((p.ms_total_cost || p.total_cost) * (1 + (p.ms_wholesale_percent || 12) / 100))}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-amber-600 dark:text-amber-400">Retail</span>
                          <span className="font-semibold tabular-nums">
                            ₹{fmt((p.ms_total_cost || p.total_cost) * (1 + (p.ms_retail_percent || 20) / 100))}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-emerald-600 dark:text-emerald-400">Showroom</span>
                          <span className="font-semibold tabular-nums">
                            ₹{fmt((p.ms_total_cost || p.total_cost) * (1 + (p.ms_showroom_percent || 28) / 100))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
