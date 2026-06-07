"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, Calendar, Users, ChevronDown, X } from "lucide-react";
import { useFilterStore } from "@/store/filterStore";
import { trpc } from "@/lib/trpc/client";
import { cn, formatDate } from "@/lib/utils";
import { format } from "date-fns";

export function GlobalFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { dateRange, teamIds, setDateRange, setTeamIds, reset } = useFilterStore();

  const { data: teams } = trpc.dashboard.getTeams.useQuery();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeFiltersCount =
    (teamIds.length > 0 ? 1 : 0) +
    (dateRange.start !== format(new Date(), "yyyy-MM-dd") ||
    dateRange.end !== format(new Date(), "yyyy-MM-dd")
      ? 1
      : 0);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
          isOpen || activeFiltersCount > 0
            ? "border-primary-300 bg-primary-50 text-primary-700"
            : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
        )}
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">筛选</span>
        {activeFiltersCount > 0 && (
          <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-primary-500 text-white text-xs font-medium">
            {activeFiltersCount}
          </span>
        )}
        <ChevronDown
          className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-card-hover border border-neutral-100 overflow-hidden animate-fade-in z-50">
          <div className="p-4 border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-neutral-800">筛选条件</h4>
              <button
                onClick={reset}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                重置
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-80 overflow-y-auto scrollbar-thin">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                <Calendar className="w-4 h-4 text-neutral-400" />
                时间范围
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange(e.target.value, dateRange.end)
                    }
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange(dateRange.start, e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                <Users className="w-4 h-4 text-neutral-400" />
                班组
              </label>
              <div className="space-y-1">
                {teams?.map((team) => (
                  <label
                    key={team.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={teamIds.includes(team.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTeamIds([...teamIds, team.id]);
                        } else {
                          setTeamIds(teamIds.filter((id) => id !== team.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700">{team.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-neutral-100 bg-neutral-50">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full btn-primary"
            >
              应用筛选
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
