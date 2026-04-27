"use client";
import { DoctorFilters } from "@/lib/types";
import { useDoctorStore } from "@/store/doctorStore";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Header from "../landing/Header";
import { FilterIcon, MapPin, Search, Star, X, BriefcaseBusiness, BadgeCheck } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cities, healthcareCategories, specializations as defaultSpecializations } from "@/lib/constant";
import { Card, CardContent } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";
import { useAppDetection } from "@/hooks/use-app-detection";

const DoctorListPage = () => {
  const isApp = useAppDetection();
  const searchParams = useSearchParams();
  const categoryParams = searchParams.get("category");
  const searchQueryParam = searchParams.get("search");

  const { doctors, loading, fetchDoctors, pagination } = useDoctorStore();

  const [filters, setFilters] = useState<DoctorFilters>({
    search: searchQueryParam || "",
    specialization: "",
    category: categoryParams || "",
    city: "",
    sortBy: "experience",
    sortOrder: "desc",
  });

  const [searchDraft, setSearchDraft] = useState(searchQueryParam || "");
  const [showFilters, setShowFilters] = useState(false);
  const [taxonomySpecializations, setTaxonomySpecializations] = useState<string[] | null>(null);
  const [taxonomyCategoryNames, setTaxonomyCategoryNames] = useState<string[] | null>(null);

  useEffect(() => {
    fetchDoctors(filters);
  }, [fetchDoctors, filters]);

  useEffect(() => {
    const next = searchQueryParam || "";
    setSearchDraft(next);
    setFilters((prev) => ({ ...prev, search: next }));
  }, [searchQueryParam]);

  useEffect(() => {
    const next = categoryParams || "";
    setFilters((prev) => ({ ...prev, category: next }));
  }, [categoryParams]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setFilters((prev) => (prev.search === searchDraft ? prev : { ...prev, search: searchDraft }));
    }, 350);
    return () => window.clearTimeout(id);
  }, [searchDraft]);

  useEffect(() => {
    let isMounted = true;

    const loadTaxonomies = async () => {
      try {
        const response = await fetch("/api/taxonomies");
        if (!response.ok) return;
        const json = (await response.json()) as {
          config?: {
            specializations?: string[];
            categories?: string[];
          } | null;
        };
        if (!isMounted || !json || !json.config) return;
        if (Array.isArray(json.config.specializations) && json.config.specializations.length) {
          setTaxonomySpecializations(json.config.specializations);
        }
        if (Array.isArray(json.config.categories) && json.config.categories.length) {
          setTaxonomyCategoryNames(json.config.categories);
        }
      } catch {
      }
    };

    loadTaxonomies();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFilterChange = (key: keyof DoctorFilters, value: string) => {
    const normalized =
      (key === "specialization" || key === "city") && value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [key]: normalized }));
  };

  const clearFilters = () => {
    setSearchDraft("");
    setFilters({
      search: "",
      specialization: "",
      category: categoryParams || "",
      city: "",
      sortBy: "experience",
      sortOrder: "desc",
    });
  };

  const activeFilterCount = Object.values(filters).filter(
    (value) => value && value !== "experience" && value !== "desc"
  ).length;

  const specializationOptions =
    taxonomySpecializations && taxonomySpecializations.length
      ? taxonomySpecializations
      : defaultSpecializations;

  const categoryChips =
    taxonomyCategoryNames && taxonomyCategoryNames.length
      ? healthcareCategories.filter((category) =>
          taxonomyCategoryNames.includes(category.title),
        )
      : healthcareCategories;

  const totalCount = typeof pagination?.total === "number" ? pagination.total : doctors.length;
  return (
    <div className={`min-h-screen bg-gradient-to-b from-blue-50 via-white to-white ${isApp ? 'pt-4' : 'pt-16'}`}>
      <Header />

      <div className={`bg-white/70 backdrop-blur border-b border-black/5 sticky ${isApp ? "top-0" : "top-16"} z-20`}>
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Doctors</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Find the right specialist and book instantly
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search doctors by name, specialty, or condition…"
                className="pl-11 h-12 text-base rounded-full bg-white/85 backdrop-blur ring-1 ring-black/5 shadow-sm border-0"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
              />
              {searchDraft.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearchDraft("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Button
              variant="outline"
              className="h-12 px-4 rounded-full bg-white/80 hover:bg-white ring-1 ring-black/5 border-0 shadow-sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-4 mb-3">
              <h3 className="text-sm font-medium text-gray-700">Browse by Category</h3>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-gray-600 hover:text-gray-900"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
              <Button
                variant={!filters.category ? "default" : "outline"}
                className="flex-shrink-0 rounded-full border-0 ring-1 ring-black/5 bg-white/80 hover:bg-white"
                onClick={() => handleFilterChange("category", "")}
              >
                All
              </Button>

              {categoryChips.map((cat) => (
                <Button
                  key={cat.id}
                  variant={filters.category === cat.title ? "default" : "outline"}
                  className="flex-shrink-0 rounded-full whitespace-nowrap border-0 ring-1 ring-black/5 bg-white/80 hover:bg-white gap-2"
                  onClick={() => handleFilterChange("category", cat.title)}
                >
                  <div className={`w-7 h-7 ${cat.color} rounded-full flex items-center justify-center`}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d={cat.icon} />
                    </svg>
                  </div>
                  {cat.title}
                </Button>
              ))}
            </div>
          </div>

          {showFilters && (
            <Card className="mt-4 rounded-3xl bg-white/80 backdrop-blur ring-1 ring-black/5 shadow-sm border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-700">
                      Specialization
                    </label>
                    <Select
                      value={filters.specialization ? filters.specialization : "all"}
                      onValueChange={(value) => handleFilterChange("specialization", value)}
                    >
                      <SelectTrigger className="rounded-2xl bg-white">
                        <SelectValue placeholder="All specializations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All specializations</SelectItem>
                        {specializationOptions.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-700">
                      Location
                    </label>
                    <Select
                      value={filters.city ? filters.city : "all"}
                      onValueChange={(value) => handleFilterChange("city", value)}
                    >
                      <SelectTrigger className="rounded-2xl bg-white">
                        <SelectValue placeholder="All locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All locations</SelectItem>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-700">
                      Sort by
                    </label>
                    <Select value={filters.sortBy || "experience"} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                      <SelectTrigger className="rounded-2xl bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="experience">Experience</SelectItem>
                        <SelectItem value="fees">Consultation Fee</SelectItem>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                        <SelectItem value="createdAt">Newest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button variant="outline" onClick={clearFilters} className="w-full rounded-2xl">
                      Clear all
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-4 text-sm text-gray-600">
          {loading ? "Searching…" : `${totalCount} doctor${totalCount === 1 ? "" : "s"} found`}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse rounded-3xl bg-white/70 ring-1 ring-black/5 border-0 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-8 bg-gray-200 rounded-2xl" />
                      <div className="h-8 bg-gray-200 rounded-2xl" />
                    </div>
                    <div className="h-10 bg-gray-200 rounded-2xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : doctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {doctors.map((doctor) => (
              <Card
                key={doctor._id}
                className="h-full rounded-3xl bg-white/75 ring-1 ring-black/5 shadow-sm hover:shadow-md transition-shadow overflow-hidden border-0"
              >
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3">
                    <Avatar className="w-14 h-14 rounded-2xl ring-1 ring-black/5">
                      <AvatarImage
                        src={doctor.profileImage}
                        alt={doctor.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-blue-600 text-white text-lg font-bold rounded-2xl">
                        {doctor.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 px-2.5 h-7 text-xs font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {(doctor.averageRating || 0).toFixed(1)}
                      </div>
                      {doctor.isVerified && (
                        <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-2.5 h-7 text-xs font-semibold">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          Verified
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {doctor.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {doctor.specialization}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 rounded-2xl bg-gray-50 ring-1 ring-black/5 px-3 py-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-gray-500 leading-4">Location</div>
                        <div className="text-sm font-semibold text-gray-800 truncate">
                          {doctor.hospitalInfo.city || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-gray-50 ring-1 ring-black/5 px-3 py-2">
                      <BriefcaseBusiness className="w-4 h-4 text-gray-500" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-gray-500 leading-4">Experience</div>
                        <div className="text-sm font-semibold text-gray-800 truncate">
                          {typeof doctor.experience === "number" ? `${doctor.experience} yrs` : "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-blue-700 truncate">
                      ₦{doctor.fees}
                      <span className="ml-1 text-xs font-medium text-gray-500">/ session</span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {doctor.totalReviews || 0} review{(doctor.totalReviews || 0) === 1 ? "" : "s"}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {doctor.category?.slice(0, 2).map((category, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] rounded-full"
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-auto pt-3">
                    <Link href={`/patient/booking/${doctor._id}`} className="block">
                      <Button className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 h-11">
                        Book consultation
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center rounded-3xl bg-white/80 ring-1 ring-black/5 border-0 shadow-sm">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No doctors found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search criteria.</p>
            <Button onClick={clearFilters} className="rounded-full px-6">
              Clear filters
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DoctorListPage;
