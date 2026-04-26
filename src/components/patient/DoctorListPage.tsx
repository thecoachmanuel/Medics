"use client";
import { DoctorFilters } from "@/lib/types";
import { useDoctorStore } from "@/store/doctorStore";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Header from "../landing/Header";
import { ChevronRight, FilterIcon, MapPin, Search, Star, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

const DoctorListPage = () => {
  const isApp = useAppDetection();
  const searchParams = useSearchParams();
  const categoryParams = searchParams.get("category");

  const { doctors, loading, fetchDoctors } = useDoctorStore();

  const [filters, setFilters] = useState<DoctorFilters>({
    search: "",
    specialization: "",
    category: categoryParams || "",
    city: "",
    sortBy: "experience",
    sortOrder: "desc",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [taxonomySpecializations, setTaxonomySpecializations] = useState<string[] | null>(null);
  const [taxonomyCategoryNames, setTaxonomyCategoryNames] = useState<string[] | null>(null);

  useEffect(() => {
    fetchDoctors(filters);
  }, [fetchDoctors, filters]);

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
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
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
  return (
    <div className={cn(
      "min-h-screen bg-[#F8FAFC]",
      isApp ? "pt-6" : "pt-24",
      "pb-24"
    )}>
      <Header />

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-1.5 w-6 bg-blue-600 rounded-full" />
                <span className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Our Specialists</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
                Choose your doctor
              </h1>
              <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl">
                Find the perfect healthcare provider for your needs and book an appointment in seconds.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-5 mb-12">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 h-6 w-6 transition-all duration-300" />
              <Input
                placeholder="Search by name, specialization, or condition..."
                className="pl-14 h-16 text-lg rounded-[2rem] border-none focus:ring-4 focus:ring-blue-100 transition-all bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] placeholder:text-gray-400"
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            <Button
              variant="outline"
              className="h-16 px-8 rounded-[2rem] border-none hover:bg-white font-black text-gray-700 transition-all active:scale-95 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] flex items-center gap-3 group"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="w-5 h-5 text-blue-600 transition-transform group-hover:rotate-12" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge
                  className="bg-blue-600 text-white rounded-full h-6 min-w-6 p-0 flex items-center justify-center border-none font-black text-[10px]"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Browse by Category
              </h3>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              <Button
                variant={!filters.category ? "default" : "outline"}
                className={cn(
                  "flex-shrink-0 rounded-2xl h-14 px-8 font-black transition-all active:scale-95 text-sm uppercase tracking-wider",
                  !filters.category 
                    ? "bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700" 
                    : "bg-white text-gray-600 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:bg-white"
                )}
                onClick={() => handleFilterChange("category", "")}
              >
                All Doctors
              </Button>

              {categoryChips.map((cat) => (
                <Button
                  key={cat.id}
                  variant={filters.category === cat.title ? "default" : "outline"}
                  className={cn(
                    "flex-shrink-0 rounded-2xl h-14 px-8 font-black transition-all active:scale-95 flex items-center gap-3 text-sm uppercase tracking-wider",
                    filters.category === cat.title 
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700" 
                      : "bg-white text-gray-600 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:bg-white"
                  )}
                  onClick={() => handleFilterChange("category", cat.title)}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-xl flex items-center justify-center transition-all shadow-sm",
                      filters.category === cat.title ? "bg-white/20" : cat.color
                    )}
                  >
                    <svg
                      className={cn("w-4 h-4", filters.category === cat.title ? "text-white" : "text-white")}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d={cat.icon} />
                    </svg>
                  </div>
                  {cat.title}
                </Button>
              ))}
            </div>
          </div>

          {showFilters && (
            <Card className="p-8 mb-10 bg-white border-none rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] animate-in fade-in zoom-in-95 duration-500 ring-1 ring-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Advanced Search</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">Fine-tune your results</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl hover:bg-gray-100 h-12 w-12"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                    Specialization
                  </label>
                  <Select
                    value={filters.specialization || ""}
                    onValueChange={(value) =>
                      handleFilterChange("specialization", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-none bg-gray-50/80 focus:ring-2 focus:ring-blue-100 font-bold transition-all hover:bg-gray-100/80">
                      <SelectValue placeholder="All specializations" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl ring-1 ring-gray-100">
                      <SelectItem value="all" className="rounded-xl font-bold">All Specializations</SelectItem>
                      {specializationOptions.map((spec) => (
                        <SelectItem key={spec} value={spec} className="rounded-xl font-bold">
                          {spec}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                    Location
                  </label>
                  <Select
                    value={filters.city || ""}
                    onValueChange={(value) => handleFilterChange("city", value === "all" ? "" : value)}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-none bg-gray-50/80 focus:ring-2 focus:ring-blue-100 font-bold transition-all hover:bg-gray-100/80">
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl ring-1 ring-gray-100">
                      <SelectItem value="all" className="rounded-xl font-bold">All locations</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city} className="rounded-xl font-bold">
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                    Sort by
                  </label>
                  <Select
                    value={filters.sortBy || "experience"}
                    onValueChange={(value) =>
                      handleFilterChange("sortBy", value)
                    }
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-none bg-gray-50/80 focus:ring-2 focus:ring-blue-100 font-bold transition-all hover:bg-gray-100/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl ring-1 ring-gray-100">
                      <SelectItem value="experience" className="rounded-xl font-bold">Experience</SelectItem>
                      <SelectItem value="fees" className="rounded-xl font-bold">Consultation Fee</SelectItem>
                      <SelectItem value="name" className="rounded-xl font-bold">Name (A-Z)</SelectItem>
                      <SelectItem value="createdAt" className="rounded-xl font-bold">Newest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="w-full h-14 rounded-2xl text-red-600 hover:text-red-700 hover:bg-red-50 font-black uppercase tracking-widest text-xs"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="mb-8 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
              {loading ? "Searching Database..." : (
                <>
                  Found <span className="text-gray-900">{doctors.length}</span> verified {doctors.length === 1 ? 'specialist' : 'specialists'}
                </>
              )}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse rounded-[3rem] border-none shadow-sm bg-white overflow-hidden">
                <div className="h-40 bg-gray-100" />
                <CardContent className="p-10 space-y-6 -mt-12 text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-[2rem] mx-auto border-4 border-white shadow-lg" />
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-100 rounded-full w-2/3 mx-auto" />
                    <div className="h-4 bg-gray-100 rounded-full w-1/2 mx-auto" />
                    <div className="pt-4 space-y-3">
                      <div className="h-14 bg-gray-100 rounded-2xl w-full" />
                      <div className="h-10 bg-gray-50 rounded-2xl w-2/3 mx-auto" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : doctors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {doctors.map((doctor) => (
              <Card
                key={doctor._id}
                className="group hover:shadow-[0_40px_80px_-16px_rgba(0,0,0,0.12)] transition-all duration-700 bg-white border-none rounded-[3.5rem] overflow-hidden flex flex-col h-full ring-1 ring-gray-100/50 hover:ring-blue-100"
              >
                <div className="relative h-32 bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-400/20 rounded-full -ml-8 -mb-8 blur-xl" />
                </div>

                <CardContent className="p-10 flex flex-col h-full relative -mt-16">
                  <div className="text-center relative z-10 mb-8">
                    <div className="relative inline-block mb-6">
                      <Avatar className="w-32 h-32 mx-auto border-[6px] border-white shadow-2xl group-hover:scale-105 transition-transform duration-700 rounded-[2.5rem]">
                        <AvatarImage
                          src={doctor.profileImage}
                          alt={doctor.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl font-black">
                          {doctor.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-2xl shadow-xl flex items-center justify-center">
                         <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight group-hover:text-blue-600 transition-colors duration-300">
                      {doctor.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className="h-1 w-3 bg-blue-600/30 rounded-full" />
                      <p className="text-blue-600 font-black text-xs uppercase tracking-widest">
                        {doctor.specialization}
                      </p>
                      <span className="h-1 w-3 bg-blue-600/30 rounded-full" />
                    </div>
                    
                    <div className="flex items-center justify-center text-orange-400 text-xs font-black uppercase tracking-widest gap-1 bg-orange-50/50 w-fit mx-auto px-3 py-1.5 rounded-xl border border-orange-100/50">
                      <Star className="w-4 h-4 fill-orange-400" />
                      <span className="text-gray-900">{(doctor.averageRating || 0).toFixed(1)}</span>
                      <span className="text-gray-400">({doctor.totalReviews || 0})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-gray-100/50 flex flex-col items-center justify-center text-center group-hover:bg-white group-hover:shadow-lg group-hover:shadow-blue-100/20 transition-all duration-300">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Experience</span>
                      <span className="text-sm font-black text-gray-900">{doctor.experience} Years</span>
                    </div>
                    <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-gray-100/50 flex flex-col items-center justify-center text-center group-hover:bg-white group-hover:shadow-lg group-hover:shadow-blue-100/20 transition-all duration-300">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Location</span>
                      <span className="text-sm font-black text-gray-900 truncate w-full">{doctor.hospitalInfo.city}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-2 mb-10">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] block mb-0.5">Consultation Fee</span>
                      <span className="text-2xl font-black text-gray-900">₦{doctor.fees?.toLocaleString()}</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <MapPin className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="mt-auto space-y-4">
                    <Link href={`/patient/booking/${doctor._id}`} className="block">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] py-8 h-16 font-black text-lg shadow-2xl shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group/btn">
                        <span>Book Now</span>
                        <ChevronRight className="w-6 h-6 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>
                    <Link href={`/patient/booking/${doctor._id}`} className="block">
                      <Button variant="ghost" className="w-full text-gray-400 font-black uppercase tracking-widest text-xs hover:text-blue-600 hover:bg-blue-50 rounded-2xl h-12 transition-colors">
                        View Detailed Profile
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-20 text-center bg-white border-none rounded-[4rem] shadow-xl shadow-blue-100/10 ring-1 ring-gray-100">
            <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Search className="w-16 h-16 text-gray-300"/>
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">No specialists found</h3>
            <p className="text-gray-500 font-medium mb-10 max-w-sm mx-auto text-lg">We couldn't find any doctors matching your current filters. Try broadening your search criteria.</p>
            <Button onClick={clearFilters} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-12 h-16 font-black uppercase tracking-widest shadow-2xl shadow-blue-200 transition-all active:scale-95">
              Reset All Filters
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DoctorListPage;
